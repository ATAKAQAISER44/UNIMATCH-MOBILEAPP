"""
Rebuilds data/raw/university_attributes.csv from the untouched original.

1. Safe automatic fixes (no guessing):
   - rows whose values were copied from another university (same data block
     as a similarly named university) lose those values; Programmes Offered
     and Gender Equality come from THE and are kept
   - rows with values in the wrong columns lose those values
   - country filled / corrected from QS and THE, region from the country
   - "55:45:00" (Excel turned the ratio into a time) -> "55 : 45"
   - placeholder websites ("Official Website") removed
2. Researched values from data/audit/attribute_research.csv are applied on
   top (one row per university, each with its sources).

Run from the python-backend folder after every research batch:
    python scripts/fix_university_attributes.py
"""

import collections
import re
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parents[1]))

import pandas as pd

from app.matching.university_matcher import country_key, name_key
from fee_format import normalize_fee
import attribute_formats as fmt

DATA = Path(__file__).resolve().parents[1] / "data"
ORIGINAL = DATA / "audit" / "university_attributes_ORIGINAL.csv"
RESEARCH = DATA / "audit" / "attribute_research.csv"
OUTPUT = DATA / "raw" / "university_attributes.csv"
QUEUE = DATA / "audit" / "research_queue.csv"
FEE_REVIEW = DATA / "audit" / "fee_review.csv"
FEE_QUEUE = DATA / "audit" / "fee_research_queue.csv"
FORMAT_REVIEW = DATA / "audit" / "attribute_format_review.csv"
DUPLICATES = DATA / "audit" / "duplicates_merged.csv"
WEBSITES = DATA / "audit" / "website_research.csv"
MANUAL_DUPLICATES = DATA / "audit" / "manual_duplicates.csv"
FEE_COLUMNS = ["Tuition Fee (local)", "Tuition Fee (international)"]
ALIASES = DATA / "matching" / "university_aliases.csv"

WEBSITE = "University Official Website link "
# Columns that describe the university itself (everything except name,
# THE-sourced programmes/gender and location).
VALUE_COLUMNS = [
    "Tuition Fee (local)", "Tuition Fee (international)", "Living Cost", "Scholarship (Yes/No)",
    "University ScholarShip webpage link", "Minimum CGPA Requirement", "Standardized Test",
    "University Acceptance Test (Yes/No)", "Degree Level offered", "Acceptance Rate", "Internship Available",
    "Part-Time Job Allowed", "Graduate Employability Rate", "Language", "Public / Private", WEBSITE,
]
SIGNATURE_COLUMNS = [
    "Tuition Fee (local)", "Tuition Fee (international)", "Living Cost", "Minimum CGPA Requirement",
    "Standardized Test", "Acceptance Rate", "Graduate Employability Rate", "Language", WEBSITE, "Country",
]
CORE = ["Tuition Fee (local)", "Tuition Fee (international)", "Living Cost", "Acceptance Rate", "Language"]
STRICT_FORMATS = {
    "Scholarship (Yes/No)": r"yes|no",
    "University Acceptance Test (Yes/No)": r"yes|no",
    "Internship Available": r"yes|no",
    "Part-Time Job Allowed": r"yes|no|limited|no \(strict\)",
    "Public / Private": r"public|private|private \(pontifical\)",
}
EXTRA_REGIONS = {  # countries that never appear in the QS file
    "algeria": "Africa", "angola": "Africa", "botswana": "Africa", "cambodia": "Asia", "fiji": "Oceania",
    "jamaica": "Americas", "kosovo": "Europe", "libya": "Africa", "malawi": "Africa", "mauritius": "Africa",
    "moldova": "Europe", "montenegro": "Europe", "mozambique": "Africa", "namibia": "Africa", "nepal": "Asia",
    "north macedonia": "Europe", "rwanda": "Africa", "senegal": "Africa", "somalia": "Africa",
    "tanzania": "Africa", "turkmenistan": "Asia", "turks and caicos islands": "Americas", "yemen": "Asia",
    "zambia": "Africa", "zimbabwe": "Africa", "palestine": "Asia", "cyprus": "Europe", "northern cyprus": "Europe",
}


def load_trusted_countries():
    """uni_id -> QS spelling of the country (THE spelling if not in QS)."""
    aliases = pd.read_csv(ALIASES, dtype=str, keep_default_na=False)
    attr_ids = {}
    for _, row in aliases[aliases.dataset == "attr"].iterrows():
        attr_ids.setdefault(name_key(row.source_name), row.uni_id)
    qs, the = {}, {}
    for _, row in aliases.iterrows():
        if not row.source_country:
            continue
        if row.dataset == "qs":
            qs.setdefault(row.uni_id, row.source_country.strip())
        elif row.dataset == "the":
            the.setdefault(row.uni_id, row.source_country.strip())
    return attr_ids, qs, the


def ranking_values():
    """uni_id -> THE female:male ratio and uni_id -> QS status (public/private)."""
    aliases = pd.read_csv(ALIASES, dtype=str, keep_default_na=False)
    the = read_csv_any(DATA / "raw" / "the.csv")
    qs = read_csv_any(DATA / "raw" / "qs.csv")
    the_gender = dict(zip(the.name.map(name_key), the.stats_female_male_ratio))
    qs_status = dict(zip(qs.Institution_Name.map(name_key), qs.STATUS.str.strip()))
    gender, status = {}, {}
    for _, row in aliases.iterrows():
        key = name_key(row.source_name)
        if row.dataset == "the" and the_gender.get(key, "").strip():
            gender.setdefault(row.uni_id, the_gender[key])
        elif row.dataset == "qs" and qs_status.get(key):
            # QS status: A = public, B = private, C = private (for-profit)
            status.setdefault(row.uni_id, {"A": "Public", "B": "Private", "C": "Private"}.get(qs_status[key], ""))
    return gender, status


def country_spelling_and_region(df):
    """Map country_key -> (spelling used in this file, region) from the QS ranking file."""
    qs = read_csv_any(DATA / "raw" / "qs.csv")
    spelling, region = {}, {}
    for loc, reg in zip(qs.Location.str.strip(), qs.Region.str.strip()):
        if loc:
            spelling.setdefault(country_key(loc), loc)
            if reg:
                region.setdefault(country_key(loc), reg)
    for key, reg in EXTRA_REGIONS.items():
        region.setdefault(key, reg)
    return spelling, region


def read_csv_any(path):
    try:
        return pd.read_csv(path, dtype=str, keep_default_na=False, encoding="utf-8")
    except UnicodeDecodeError:
        return pd.read_csv(path, dtype=str, keep_default_na=False, encoding="latin1")


def is_blank(value):
    return not str(value).strip()


def main():
    df = pd.read_csv(ORIGINAL, dtype=str, keep_default_na=False)
    log = collections.Counter()
    status = {}

    # 1a. Copied data blocks: keep the row whose country/website fit its name, blank the others
    attr_ids, qs_country, the_country = load_trusted_countries()

    def true_country(name):
        uid = attr_ids.get(name_key(name))
        return qs_country.get(uid) or the_country.get(uid) or ""

    def website_fits(name, site):
        site = re.sub(r"^(https?://)?(www\.)?", "", site.lower()).split("/")[0]
        words = [w for w in re.findall(r"[a-z]+", name.lower()) if len(w) > 3 and w not in
                 {"university", "institute", "technology", "college", "national", "science", "sciences", "state"}]
        return any(w[:5] in site for w in words)

    signature = df[SIGNATURE_COLUMNS].apply(lambda r: "|".join(v.strip() for v in r), axis=1)
    has_core = df[CORE].apply(lambda r: any(v.strip() for v in r), axis=1)
    groups = collections.defaultdict(list)
    for i in df.index[has_core]:
        groups[signature[i]].append(i)
    for members in groups.values():
        if len(members) < 2:
            continue

        def fit(i):
            name = df.at[i, "Institution_Name"]
            tc = true_country(name)
            return (bool(tc) and country_key(df.at[i, "Country"]) == country_key(tc)) * 2 + website_fits(name, df.at[i, WEBSITE])

        genuine = max(members, key=fit)
        keep = genuine if fit(genuine) > 0 else None
        for i in members:
            if i != keep:
                for col in VALUE_COLUMNS:
                    df.at[i, col] = ""
                status[i] = "copied data removed"
                log["copied rows cleared"] += 1

    # 1b. Values sitting in the wrong column: if several, the row is unreliable
    for i in df.index:
        wrong = [c for c, pattern in STRICT_FORMATS.items()
                 if df.at[i, c].strip() and not re.fullmatch(pattern, df.at[i, c].strip(), re.I)]
        if len(wrong) >= 2:
            for col in VALUE_COLUMNS:
                df.at[i, col] = ""
            status[i] = "shifted columns cleared"
            log["shifted rows cleared"] += 1
        elif wrong:
            df.at[i, wrong[0]] = ""
            log["single misplaced value removed"] += 1
    for col, pattern in {"Acceptance Rate": r".*\d.*%.*|\d+(\.\d+)?", "Graduate Employability Rate": r".*\d.*"}.items():
        bad = df[col].str.strip().ne("") & ~df[col].str.strip().str.fullmatch(pattern)
        log[f"non-numeric {col} removed"] += int(bad.sum())
        df.loc[bad, col] = ""

    # 1c. Placeholder websites
    placeholder = df[WEBSITE].str.strip().str.lower().isin({"official website", "website"})
    df.loc[placeholder, WEBSITE] = ""
    log["placeholder websites removed"] += int(placeholder.sum())

    # 1d. Country and region from QS / THE
    spelling, region = country_spelling_and_region(df)
    for i in df.index:
        tc = true_country(df.at[i, "Institution_Name"])
        if not tc:
            continue
        fixed = spelling.get(country_key(tc), tc)
        current = df.at[i, "Country"].strip()
        if country_key(current) != country_key(fixed):
            log["country filled" if not current else "country corrected"] += 1
            df.at[i, "Country"] = fixed
        reg = region.get(country_key(fixed), "")
        if reg and df.at[i, "Region"].strip() != reg:
            log["region set"] += 1
            df.at[i, "Region"] = reg

    # 1f. Rows holding another university's data, found through the country-code
    #     domain of the website: "Kitasato University" (Japan) with www.aalto.fi.
    #     If the file's own country (or language) matched that domain, the whole row
    #     came from the other university; otherwise only the links are wrong.
    original = pd.read_csv(ORIGINAL, dtype=str, keep_default_na=False)
    main_language = {}
    for country, group in original[original.Language.str.strip() != ""].groupby(original.Country.str.strip()):
        top = fmt.country_majority([fmt.normalize_language(v) for v in group.Language])
        if top and top.split(",")[0] != "English":
            main_language[country] = top.split(",")[0]
    for i in df.index:
        site_country = fmt.link_country(original.at[i, WEBSITE])
        country = df.at[i, "Country"].strip()
        if (fmt.link_host(original.at[i, WEBSITE]).endswith(".edu") and original.at[i, "Country"].strip() == "United States"
                and country and country != "United States"):
            site_country = "United States"  # "Kochi University" (Japan) holding www.ohio.edu and US data
        if not site_country or not country or site_country == country or (country, site_country) == ("Northern Cyprus", "Turkey"):
            continue
        language = df.at[i, "Language"]
        foreign_language = (site_country in main_language and main_language[site_country] in language
                            and main_language.get(country, "") not in language)
        if original.at[i, "Country"].strip() == site_country or foreign_language:
            for col in VALUE_COLUMNS:
                df.at[i, col] = ""
            status[i] = "data of another university removed"
            log["rows holding another university's data cleared"] += 1
        else:
            for col in [WEBSITE, "University ScholarShip webpage link"]:
                df.at[i, col] = ""
            log["wrong university website removed"] += 1
    for i in df.index:  # scholarship links on another country's domain
        link_country = fmt.link_country(df.at[i, "University ScholarShip webpage link"])
        if link_country and df.at[i, "Country"].strip() and link_country != df.at[i, "Country"].strip():
            df.at[i, "University ScholarShip webpage link"] = ""
            log["wrong scholarship link removed"] += 1

    # 1e. Gender ratio turned into a time by Excel
    gender = df["Gender Equality"].str.strip()
    timelike = gender.str.fullmatch(r"\d{1,3}:\d{1,3}:00")
    df.loc[timelike, "Gender Equality"] = gender[timelike].str.replace(
        r"^(\d+):(\d+):00$", r"\1 : \2", regex=True
    )
    log["gender ratio fixed"] += int(timelike.sum())

    # 2. Researched values
    researched = set()
    if RESEARCH.exists():
        research = pd.read_csv(RESEARCH, dtype=str, keep_default_na=False)
        index_by_name = {n: i for i, n in df.Institution_Name.items()}
        for _, row in research.iterrows():
            i = index_by_name.get(row["Institution_Name"])
            if i is None:
                print(f"WARNING: researched university not in file: {row['Institution_Name']}")
                continue
            for col in VALUE_COLUMNS + ["Country", "Region"]:
                if col in row and row[col].strip():
                    df.at[i, col] = row[col].strip()
                    log["researched values applied"] += 1
            researched.add(i)

    # 2a. Official websites that were checked over HTTP (see website_research.csv)
    if WEBSITES.exists():
        sites = pd.read_csv(WEBSITES, dtype=str, keep_default_na=False)
        site_by_name = dict(zip(sites.Institution_Name, sites.Website))
        replaces = set(sites.Institution_Name[sites.Verification.str.startswith("replaces")])
        for i in df.index:
            site = site_by_name.get(df.at[i, "Institution_Name"])
            if site and (is_blank(df.at[i, WEBSITE]) or df.at[i, "Institution_Name"] in replaces):
                df.at[i, WEBSITE] = site
                log["websites filled (checked)"] += 1

    # 2b. Same university listed twice ("Universidade de São Paulo" and "University of
    #     São Paulo"): keep the fuller row, fill its gaps from the other (researched
    #     values first) and drop the other row.
    merged_rows, drop = [], []
    parent = {i: i for i in df.index}

    def root(i):
        while parent[i] != i:
            i = parent[i]
        return i

    def join(members):
        for i in members[1:]:
            parent[root(i)] = root(members[0])

    by_uid = collections.defaultdict(list)
    for i in df.index:
        uid = attr_ids.get(name_key(df.at[i, "Institution_Name"]))
        if uid:
            by_uid[uid].append(i)
    for members in by_uid.values():
        join(members)

    # Rows sharing one website: rows whose name fits it are the same university
    # ("EPFL" / "École Polytechnique Fédérale de Lausanne"); a row whose name does
    # not fit had borrowed the link ("University of Padua" with unipr.it) and loses it.
    verified = set(zip(sites.Institution_Name, sites.Website)) if WEBSITES.exists() else set()
    by_host = collections.defaultdict(list)
    for i in df.index:
        host = fmt.link_host(df.at[i, WEBSITE])
        if host:
            by_host[host].append(i)
    for host, members in by_host.items():
        if len(members) < 2:
            continue
        fits = [i for i in members if fmt.website_fits_name(df.at[i, "Institution_Name"], df.at[i, WEBSITE])
                or (df.at[i, "Institution_Name"], df.at[i, WEBSITE]) in verified]
        if fits and len(fits) < len(members):
            for i in members:
                if i not in fits:
                    df.at[i, WEBSITE] = ""
                    log["borrowed website removed"] += 1
        if len(fits) >= 2 and len({country_key(df.at[i, "Country"]) for i in fits}) == 1:
            join(fits)

    # Pairs checked by hand that neither the crosswalk nor the website could link
    if MANUAL_DUPLICATES.exists():
        index_by_name = {n: i for i, n in df.Institution_Name.items()}
        for _, pair in pd.read_csv(MANUAL_DUPLICATES, dtype=str, keep_default_na=False).iterrows():
            a, b = index_by_name.get(pair["Duplicate"]), index_by_name.get(pair["Same university as"])
            if a is None or b is None:
                print(f"WARNING: manual duplicate pair not in file: {pair['Duplicate']} / {pair['Same university as']}")
                continue
            join([b, a])

    groups = collections.defaultdict(list)
    for i in df.index:
        groups[root(i)].append(i)
    for members in groups.values():
        if len(members) < 2:
            continue
        filled = {i: sum(not is_blank(v) for v in df.loc[i]) for i in members}
        keep = max(members, key=lambda i: (filled[i], i in researched))
        others = sorted((i for i in members if i != keep), key=lambda i: (i not in researched, -filled[i]))
        for col in df.columns:
            if col == "Institution_Name":
                continue
            candidates = [i for i in [keep] + others if not is_blank(df.at[i, col])]
            if col in ("Country", "Region"):  # the fuller row's location wins
                researched_first = candidates
            else:
                researched_first = [i for i in candidates if i in researched] or candidates
            if researched_first and researched_first[0] != keep:
                df.at[keep, col] = df.at[researched_first[0], col]
        if any(i in researched for i in others):
            researched.add(keep)
        for i in others:
            merged_rows.append({"Kept": df.at[keep, "Institution_Name"], "Removed duplicate": df.at[i, "Institution_Name"],
                                "Removed row country": df.at[i, "Country"]})
            drop.append(i)
    df = df.drop(index=drop)
    researched -= set(drop)
    pd.DataFrame(merged_rows, columns=["Kept", "Removed duplicate", "Removed row country"]).to_csv(
        DUPLICATES, index=False, encoding="utf-8-sig")
    log["duplicate rows merged"] += len(drop)

    # 3. One fee format: "$12,180", "$1,000 – $2,500" or "$0" (USD per year)
    fee_rows = []
    for i in df.index:
        record = {"Institution_Name": df.at[i, "Institution_Name"], "Country": df.at[i, "Country"]}
        for col in FEE_COLUMNS:
            original = df.at[i, col]
            value, fee_status = normalize_fee(original, df.at[i, "Country"])
            df.at[i, col] = value
            log[f"fees {fee_status}"] += 1
            short = "local" if "local" in col else "international"
            record[f"{short}_original"] = original
            record[f"{short}_now"] = value
            record[f"{short}_status"] = fee_status
        fee_rows.append(record)
    # International fee far below the local one (local $3,500, international $600) in an
    # unresearched row: a monthly figure from another column, not a yearly fee.
    researched_intl = set()
    if RESEARCH.exists():
        researched_intl = set(research.Institution_Name[research["Tuition Fee (international)"].str.strip() != ""])

    def low_high(value):
        numbers = [float(n.replace(",", "")) for n in re.findall(r"\$([\d,]+)", value)]
        return (min(numbers), max(numbers)) if numbers else (None, None)

    for i, record in zip(df.index, fee_rows):
        local_low, _ = low_high(df.at[i, "Tuition Fee (local)"])
        _, intl_high = low_high(df.at[i, "Tuition Fee (international)"])
        if (local_low and intl_high and intl_high < 1200 and local_low > 3 * intl_high
                and df.at[i, "Institution_Name"] not in researched_intl):
            df.at[i, "Tuition Fee (international)"] = ""
            record["international_now"], record["international_status"] = "", "removed: far below local fee"
            log["implausible international fees removed"] += 1
    fee_review = pd.DataFrame(fee_rows)
    fee_review.to_csv(FEE_REVIEW, index=False, encoding="utf-8-sig")

    # 4. One format for every other column (see attribute_formats.py)
    changes = []

    def apply(col, func):
        for i in df.index:
            before = df.at[i, col]
            result = func(i, before)
            after, note = result if isinstance(result, tuple) else (result, "")
            if after != before.strip():
                changes.append({"Institution_Name": df.at[i, "Institution_Name"], "Column": col,
                                "Before": before, "After": after, "Note": note or ("removed" if not after else "reformatted")})
                log[f"{col} {'removed' if not after else 'reformatted'}"] += 1
            df.at[i, col] = after

    country_ref, region_ref = fmt.living_cost_references(zip(df.Country, df.Region, df["Living Cost"]))
    apply("Living Cost", lambda i, v: fmt.normalize_living_cost(v, df.at[i, "Country"], df.at[i, "Region"], country_ref, region_ref))
    apply("Minimum CGPA Requirement", lambda i, v: fmt.normalize_cgpa(v))
    apply("Acceptance Rate", lambda i, v: fmt.normalize_percent(v))
    apply("Graduate Employability Rate", lambda i, v: fmt.normalize_percent(v))
    apply("Degree Level offered", lambda i, v: fmt.normalize_degree_levels(v))
    apply("Standardized Test", lambda i, v: fmt.normalize_tests(v))
    apply("Language", lambda i, v: fmt.normalize_language(v))
    apply("Part-Time Job Allowed", lambda i, v: fmt.normalize_part_time(v))
    apply("Public / Private", lambda i, v: fmt.normalize_public_private(v))
    for col in ["Scholarship (Yes/No)", "University Acceptance Test (Yes/No)", "Internship Available"]:
        apply(col, lambda i, v: fmt.normalize_yes_no(v))
    apply("Gender Equality", lambda i, v: fmt.normalize_gender(v))

    # Empty gender ratio / public-private status filled from the THE and QS ranking files
    the_gender, qs_status = ranking_values()
    for col, source, label, normalize in [("Gender Equality", the_gender, "THE", fmt.normalize_gender),
                                          ("Public / Private", qs_status, "QS", str)]:
        for i in df.index:
            if df.at[i, col]:
                continue
            uid = attr_ids.get(name_key(df.at[i, "Institution_Name"]))
            value = normalize(source.get(uid, ""))
            if value:
                df.at[i, col] = value
                changes.append({"Institution_Name": df.at[i, "Institution_Name"], "Column": col,
                                "Before": "", "After": value, "Note": f"filled from {label} ranking file"})
                log[f"{col} filled from {label}"] += 1
    for col in [WEBSITE, "University ScholarShip webpage link"]:
        apply(col, lambda i, v: fmt.normalize_link(v))
    # Public / private as written in the fee research notes ("Public university: ...", "Private: ...")
    if RESEARCH.exists():
        notes = dict(zip(research.Institution_Name, research.Notes))
        for i in df.index:
            note = notes.get(df.at[i, "Institution_Name"], "")
            if df.at[i, "Public / Private"] or not note:
                continue
            if re.search(r"\bprivate\b", note, re.I) and not re.search(r"\bpublic\b|\bstate[- ]funded\b", note, re.I):
                value = "Private"
            elif re.search(r"\bpublic\b|\bstate university\b|\bnational university\b|\bfederal\b", note, re.I) and not re.search(r"\bprivate\b", note, re.I):
                value = "Public"
            else:
                continue
            df.at[i, "Public / Private"] = value
            changes.append({"Institution_Name": df.at[i, "Institution_Name"], "Column": "Public / Private",
                            "Before": "", "After": value, "Note": "from fee research note"})
            log["Public / Private filled from research notes"] += 1

    # 5. Country-level columns: empty cells get the typical value of the same country
    country_rules = {
        "Living Cost": fmt.country_living_cost,
        "Part-Time Job Allowed": fmt.country_majority,
        "Language": fmt.country_majority,
        # Set by the national admission system rather than by each university
        "Standardized Test": fmt.country_common_tests,
        "University Acceptance Test (Yes/No)": fmt.country_majority,
        "Degree Level offered": fmt.country_majority,
        "Scholarship (Yes/No)": fmt.country_majority,
        "Internship Available": fmt.country_majority,
    }
    for col, rule in country_rules.items():
        typical = {c: rule(list(g[col])) for c, g in df[df[col] != ""].groupby("Country")}
        for i in df.index:
            value = typical.get(df.at[i, "Country"], "")
            if df.at[i, col] or not value:
                continue
            df.at[i, col] = value
            changes.append({"Institution_Name": df.at[i, "Institution_Name"], "Column": col,
                            "Before": "", "After": value, "Note": f"country estimate (typical value for {df.at[i, 'Country']})"})
            log[f"{col} filled with country estimate"] += 1

    # 6. University-level numbers no source gives: median of similar universities
    #    (same country and type, then same country, then same region and type).
    #    Only real values are used for the median, never earlier estimates.
    estimated = {(c["Institution_Name"], c["Column"]) for c in changes if c["Note"].startswith("country estimate")}
    median_rules = {
        "Tuition Fee (local)": "money", "Tuition Fee (international)": "money",
        "Acceptance Rate": "percent", "Graduate Employability Rate": "percent", "Minimum CGPA Requirement": "cgpa",
    }
    for col, kind in median_rules.items():
        real = df[(df[col] != "") & ~df.Institution_Name.map(lambda n: (n, col) in estimated)]
        levels = [
            (["Country", "Public / Private"], 3, lambda r: f"{r['Country']} {r['Public / Private'].lower()} universities"),
            (["Country"], 3, lambda r: f"{r['Country']} universities"),
            (["Region", "Public / Private"], 5, lambda r: f"{r['Public / Private'].lower()} universities in {r['Region']}"),
        ]
        tables = []
        for keys, minimum, label in levels:
            groups = real[real[keys].ne("").all(axis=1)].groupby(keys)[col]
            tables.append((keys, {k if isinstance(k, tuple) else (k,): (fmt.median_value(list(v), kind), len(v))
                                  for k, v in groups if len(v) >= minimum}, label))
        for i in df.index:
            if df.at[i, col]:
                continue
            for keys, table, label in tables:
                key = tuple(df.at[i, k] for k in keys)
                if key in table and table[key][0]:
                    value, n = table[key]
                    df.at[i, col] = value
                    changes.append({"Institution_Name": df.at[i, "Institution_Name"], "Column": col, "Before": "", "After": value,
                                    "Note": f"country estimate (median of {n} {label(df.loc[i])})"})
                    log[f"{col} filled with median estimate"] += 1
                    break

    pd.DataFrame(changes, columns=["Institution_Name", "Column", "Before", "After", "Note"]).to_csv(
        FORMAT_REVIEW, index=False, encoding="utf-8-sig")

    df.to_csv(OUTPUT, index=False, encoding="utf-8")

    # Queue of universities that still need research, best-ranked first
    qs_rank, the_rank = {}, {}
    qs_file = read_csv_any(DATA / "raw" / "qs.csv")
    for name, rank in zip(qs_file.Institution_Name, qs_file.RANK_2025):
        m = re.search(r"\d+", rank)
        if m:
            qs_rank.setdefault(name_key(name), int(m.group()))
    the_file = read_csv_any(DATA / "raw" / "the.csv")
    for name, rank in zip(the_file.name, the_file["rank"]):
        m = re.search(r"\d+", rank)
        if m:
            the_rank.setdefault(name_key(name), int(m.group()))
    queue = []
    for i in df.index:
        if i in researched:
            continue
        empty = sum(is_blank(df.at[i, c]) for c in VALUE_COLUMNS)
        if empty >= 8:
            key = name_key(df.at[i, "Institution_Name"])
            best = min(qs_rank.get(key, 99999), the_rank.get(key, 99999))
            queue.append({
                "Institution_Name": df.at[i, "Institution_Name"],
                "Country": df.at[i, "Country"],
                "Best_Rank_QS_or_THE": best if best < 99999 else "",
                "Empty_value_columns": empty,
                "Reason": status.get(i, "missing data"),
            })
    queue_df = pd.DataFrame(queue, columns=["Institution_Name", "Country", "Best_Rank_QS_or_THE", "Empty_value_columns", "Reason"])
    queue_df["_sort"] = pd.to_numeric(queue_df.Best_Rank_QS_or_THE, errors="coerce").fillna(99999)
    queue_df.sort_values(["_sort", "Institution_Name"]).drop(columns="_sort").to_csv(QUEUE, index=False, encoding="utf-8-sig")

    fee_queue = fee_review[(fee_review.local_now == "") | (fee_review.international_now == "")].copy()
    fee_queue["Best_Rank_QS_or_THE"] = [
        min(qs_rank.get(name_key(n), 99999), the_rank.get(name_key(n), 99999)) for n in fee_queue.Institution_Name
    ]
    fee_queue = fee_queue.sort_values(["Best_Rank_QS_or_THE", "Institution_Name"])
    fee_queue["Best_Rank_QS_or_THE"] = fee_queue["Best_Rank_QS_or_THE"].where(fee_queue["Best_Rank_QS_or_THE"] < 99999, "")
    fee_queue.to_csv(FEE_QUEUE, index=False, encoding="utf-8-sig")
    print(f"universities with a missing or untrusted fee: {len(fee_queue)}")

    for key, value in log.items():
        print(f"{key}: {value}")
    print(f"universities researched so far: {len(researched)}")
    print(f"universities still waiting for research: {len(queue_df)}")


if __name__ == "__main__":
    main()
