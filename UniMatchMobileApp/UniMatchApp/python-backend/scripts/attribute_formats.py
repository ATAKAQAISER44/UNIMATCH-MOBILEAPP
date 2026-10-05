"""
One consistent format for every attribute column except the tuition fees
(those are handled by fee_format.py).

    Living Cost                  "$12,000" or "$9,000 – $14,000"  (USD per YEAR)
    Minimum CGPA Requirement     "3.0" on a 4.0 scale, or "No minimum"
    Acceptance Rate              "45%" or "10% – 20%"
    Graduate Employability Rate  "90%" or "85% – 92%"
    Degree Level offered         any of "Bachelor, Master, PhD"
    Standardized Test            "IELTS, TOEFL, SAT" (test names only)
    Language                     "German, English"
    Part-Time Job Allowed        "Yes" / "No" / "Limited"
    Public / Private             "Public" / "Private"
    Gender Equality              "55 : 45"
    website / scholarship links  "https://..."

Every function returns the new value; "" means the old value could not be
trusted and was removed.
"""

import math
import re
import statistics

from fee_format import USD_RATE, SYMBOLS

DASH = " – "


# ---------- Living cost ----------

MONTH_WORDS = re.compile(r"month|/mo\b|per mo\b|monthly", re.I)
YEAR_WORDS = re.compile(r"year|annual|/yr|p\.a\.", re.I)


def _numbers(text):
    text = re.sub(r"\([^)]*\)|\[[^\]]*\]", " ", text)
    out = []
    for raw in re.findall(r"\d[\d,]*(?:\.\d+)?\s*[kK]?\b", text):
        thousands = raw.strip().lower().endswith("k")
        value = float(raw.lower().rstrip("k ").replace(",", ""))
        out.append(value * 1000 if thousands else value)
    return out


def _currency(text):
    for symbol, code in SYMBOLS.items():
        if symbol in text:
            return code
    for code in re.findall(r"\b([A-Z]{3})\b", text.upper()):
        if code in USD_RATE:
            return code
    return "USD"  # the column was always meant to be in US dollars


def parse_living_cost(text):
    """-> (low_usd, high_usd, period) with period 'month', 'year' or None (unknown)."""
    text = str(text or "").replace("\xa0", " ").strip()
    numbers = _numbers(text)
    if not numbers:
        return None
    rate = USD_RATE[_currency(text)]
    period = "month" if MONTH_WORDS.search(text) else "year" if YEAR_WORDS.search(text) else None
    return min(numbers) * rate, max(numbers) * rate, period


def _money(low, high):
    def fmt(x):
        return f"${int(round(x, -1 if x >= 100 else 0)):,}"
    return fmt(low) if fmt(low) == fmt(high) else f"{fmt(low)}{DASH}{fmt(high)}"


def living_cost_references(rows):
    """rows: iterable of (country, region, raw value). Typical annual cost per
    country (and per region as a fallback), from values that are clearly yearly."""
    by_country, by_region = {}, {}
    for country, region, raw in rows:
        parsed = parse_living_cost(raw)
        if not parsed:
            continue
        low, high, period = parsed
        if period == "month":
            low = low * 12
        elif period is None and low < 1500:
            continue  # could be monthly; not used as a reference
        by_country.setdefault(country, []).append(low)
        by_region.setdefault(region, []).append(low)
    country_ref = {c: statistics.median(v) for c, v in by_country.items() if len(v) >= 3}
    region_ref = {r: statistics.median(v) for r, v in by_region.items() if v}
    return country_ref, region_ref


def normalize_living_cost(raw, country, region, country_ref, region_ref):
    """-> (value, note). Monthly figures are turned into yearly ones (x12)."""
    if not str(raw).strip():
        return "", "empty"
    parsed = parse_living_cost(raw)
    if not parsed:
        return "", "removed: no number"
    low, high, period = parsed
    if low < 100:
        return "", "removed: implausible amount"
    if period == "month":
        low, high, note = low * 12, high * 12, "monthly x12"
    elif period == "year":
        note = "ok"
    else:
        note = "ok"
        reference = country_ref.get(country)
        # Without a country reference only clearly small amounts count as monthly
        if reference is None and low < 1500:
            reference = region_ref.get(region) or statistics.median(region_ref.values())
        if reference and low <= 3500:
            as_year = abs(math.log(low / reference))
            as_month = abs(math.log(low * 12 / reference))
            if as_month < as_year:
                low, high = low * 12, high * 12
                note = f"monthly x12 (typical yearly for {country or region}: ${reference:,.0f})"
    if high > 75000:  # the costliest cities (New York, Zurich) are above 45,000
        return "", "removed: implausible yearly amount (probably local currency)"
    return _money(low, high), note


def country_living_cost(values):
    """Typical yearly range for a country from its universities' values (needs 3+)."""
    lows, highs = [], []
    for value in values:
        numbers = _numbers(value)
        if numbers:
            lows.append(min(numbers))
            highs.append(max(numbers))
    if len(lows) < 3:
        return ""
    return _money(statistics.median(lows), statistics.median(highs))


def country_majority(values, min_count=3, min_share=0.6):
    """Most common value when at least min_count universities exist and min_share agree."""
    values = [v for v in values if v]
    if len(values) < min_count:
        return ""
    top = statistics.mode(values)
    return top if values.count(top) / len(values) >= min_share else ""


def country_common_tests(values, min_count=3, min_share=0.5):
    """Tests asked by at least half of a country's universities ("SAT, ACT, TOEFL, IELTS")."""
    lists = [[t.replace(" (some optional)", "") for t in v.split(", ")] for v in values if v]
    if len(lists) < min_count:
        return ""
    counts = {}
    for tests in lists:
        for t in dict.fromkeys(tests):  # keeps first-seen order so ties are stable
            counts[t] = counts.get(t, 0) + 1
    common = [t for t, n in sorted(counts.items(), key=lambda x: -x[1]) if n / len(lists) >= min_share and t != "None"]
    return ", ".join(common)


def median_value(values, kind):
    """Median of filled values, in the column's own format.
    kind: "money" ("$a – $b"), "percent" ("a% – b%") or "cgpa" ("3.0")."""
    lows, highs = [], []
    for value in values:
        numbers = [float(n.replace(",", "")) for n in re.findall(r"\d[\d,]*(?:\.\d+)?", value)]
        if numbers:
            lows.append(min(numbers))
            highs.append(max(numbers))
    if not lows:
        return ""
    low, high = statistics.median(lows), statistics.median(highs)
    if kind == "money":
        return _money(low, high)
    if kind == "percent":
        return normalize_percent(f"{round(low)}% - {round(high)}%")
    return normalize_cgpa(f"{low:.2f}")


# ---------- CGPA ----------

def normalize_cgpa(raw):
    text = str(raw or "").strip()
    if not text:
        return ""
    if re.fullmatch(r"(none|no strict minimum|not required|no minimum)", text, re.I):
        return "No minimum"
    m = re.search(r"(\d+(?:\.\d+)?)\s*/\s*(\d+(?:\.\d+)?)", text)
    if m:
        value, scale = float(m.group(1)), float(m.group(2))
    else:
        m = re.search(r"\d+(?:\.\d+)?", text)
        if not m:
            return ""
        value = float(m.group())
        if "%" in text[m.end():m.end() + 2]:
            scale = 100.0
        else:
            scale = 4.0 if value <= 4 else 10.0 if value <= 10 else 100.0
    if scale <= 0 or value > scale:
        return ""
    gpa = round(value / scale * 4, 2)
    return f"{gpa:.2f}".rstrip("0").rstrip(".") if gpa % 1 else f"{gpa:.1f}"


# ---------- Percentages ----------

def normalize_percent(raw):
    text = str(raw or "").strip()
    if not text or ":" in text:
        return ""
    text = re.split(r"\s/\s|\(", text)[0]  # "11% (UG) / 35% (PG)" -> first figure
    numbers = [float(n) for n in re.findall(r"\d+(?:\.\d+)?", text)]
    if not numbers:
        return ""
    if "%" not in text and all(n <= 1 for n in numbers):
        numbers = [n * 100 for n in numbers]  # 0.88 -> 88
    if any(n > 100 for n in numbers):
        return ""

    def fmt(n):
        return f"{n:.1f}".rstrip("0").rstrip(".") + "%"
    low, high = min(numbers), max(numbers)
    return fmt(low) if fmt(low) == fmt(high) else f"{fmt(low)}{DASH}{fmt(high)}"


# ---------- Degree levels ----------

def normalize_degree_levels(raw):
    text = str(raw or "").lower()
    if not text.strip():
        return ""
    levels = []
    if re.search(r"bachelor|undergraduate|\bb(sc|s|a|eng|ed|com)?\b", text):
        levels.append("Bachelor")
    if re.search(r"master|postgraduate|\bm(sc|s|a|phil|ba)\b|\bm\b|\bgraduate\b", text):
        levels.append("Master")
    if re.search(r"integrated ms/phd|phd track|leading to (a )?phd", text):
        levels.append("MS leading to PhD")  # its own option in the profile form
    if re.search(r"ph\.?d|doctor|dphil|\bdba\b|research postgraduate", text):
        levels.append("PhD")
    return ", ".join(levels)


# ---------- Tests ----------

TEST_NAMES = {
    "ielts": "IELTS", "toefl": "TOEFL", "toefl ibt": "TOEFL", "pte": "PTE", "pearson pte": "PTE", "duolingo": "Duolingo",
    "det": "Duolingo", "sat": "SAT", "act": "ACT", "gre": "GRE", "gmat": "GMAT", "lsat": "LSAT", "mcat": "MCAT",
    "ib": "IB", "ap": "AP", "a-levels": "A-Levels", "a-level": "A-Levels", "cae": "Cambridge English",
    "cpe": "Cambridge English", "fce": "Cambridge English", "cambridge english": "Cambridge English",
    "testdaf": "TestDaF", "dsh": "DSH", "dsh-2": "DSH", "testas": "TestAS", "delf": "DELF", "dalf": "DALF", "tcf": "TCF",
    "dele": "DELE", "hsk": "HSK", "topik": "TOPIK", "tocfl": "TOCFL", "eju": "EJU", "jlpt": "JLPT",
    "none": "None", "no": "None", "not required": "None",
}
ENTRANCE = re.compile(r"^(entrance|admission|internal|placement|aptitude)( (exam|exams|test|tests|examination|examinations))?$|^entrance examinations?$", re.I)


def normalize_tests(raw):
    text = str(raw or "").strip()
    if not text:
        return ""
    optional = bool(re.search(r"optional", text, re.I))
    out = []
    for part in re.split(r",|/|;|\bor\b|\band\b", text):
        part = re.sub(r"\([^)]*\)", " ", part)  # notes and scores in brackets
        part = re.sub(r"\s+", " ", part).strip(" .-+")
        if not part:
            continue
        key = part.lower()
        first = key.split()[0]
        if ENTRANCE.match(key):
            name = "Entrance Exam"
        elif key in TEST_NAMES:
            name = TEST_NAMES[key]
        elif first in TEST_NAMES and first not in {"no", "none"}:
            name = TEST_NAMES[first]  # "IELTS 6.5", "TOEFL iBT", "HSK 5" -> the test name
        else:
            name = part  # local exams keep their own name ("Saber 11", "JEE Advanced")
        if name not in out:
            out.append(name)
    if len(out) > 1 and "None" in out:
        out.remove("None")
    if optional and out and out != ["None"]:
        return ", ".join(out) + " (some optional)"
    return ", ".join(out)


# ---------- Language ----------

LANGUAGE_NAMES = {"mandarin": "Chinese", "eng": "English", "azeri": "Azerbaijani", "valencian": "Catalan", "cantonese": "Chinese"}


def normalize_language(raw):
    text = re.sub(r"\([^)]*\)", " ", str(raw or ""))
    out = []
    for part in re.split(r",|/|\band\b", text):
        part = part.strip().strip(".")
        if not part:
            continue
        name = LANGUAGE_NAMES.get(part.lower(), part[:1].upper() + part[1:])
        if name not in out:
            out.append(name)
    return ", ".join(out)


# ---------- Small categorical columns ----------

def normalize_part_time(raw):
    text = str(raw or "").strip().lower()
    if not text:
        return ""
    if text.startswith("no"):
        return "No"
    if text.startswith("yes"):
        return "Yes"
    if text.startswith("limited"):
        return "Limited"
    return ""


def normalize_public_private(raw):
    text = str(raw or "").strip().lower()
    return "Private" if text.startswith("private") else "Public" if text.startswith("public") else ""


def normalize_yes_no(raw):
    text = str(raw or "").strip().lower()
    return "Yes" if text.startswith("yes") else "No" if text.startswith("no") else ""


def normalize_gender(raw):
    text = re.sub(r"\([^)]*\)", "", str(raw or "")).strip()
    if re.fullmatch(r"\d*\.\d+", text):
        # Excel read "20:80" as the time 20h80min = 21:20 and stored it as a
        # fraction of a day; minutes = 60a + b with a + b = 100 gives a back.
        minutes = round(float(text) * 24 * 60)
        a, rest = divmod(minutes - 100, 59)
        return f"{a} : {100 - a}" if rest == 0 and 0 <= a <= 100 else ""
    m = re.fullmatch(r"(\d{1,3})\s*:\s*(\d{1,3})\s*(:00)?", text)
    if not m:
        return ""
    a, b = int(m.group(1)), int(m.group(2))
    if a + b == 0:
        return ""
    if not 95 <= a + b <= 105:  # a plain ratio such as "2:1" -> percentages
        a = round(a / (a + b) * 100)
        b = 100 - a
    return f"{a} : {b}"


COUNTRY_TLD = {
    "Algeria": "dz", "Argentina": "ar", "Armenia": "am", "Australia": "au", "Austria": "at", "Azerbaijan": "az", "Bahrain": "bh",
    "Bangladesh": "bd", "Belarus": "by", "Belgium": "be", "Bolivia": "bo", "Bosnia and Herzegovina": "ba", "Botswana": "bw",
    "Brazil": "br", "Brunei": "bn", "Bulgaria": "bg", "Canada": "ca", "Chile": "cl", "China (Mainland)": "cn", "Colombia": "co",
    "Costa Rica": "cr", "Croatia": "hr", "Cuba": "cu", "Cyprus": "cy", "Czech Republic": "cz", "Denmark": "dk",
    "Dominican Republic": "do", "Ecuador": "ec", "Egypt": "eg", "Estonia": "ee", "Ethiopia": "et", "Fiji": "fj", "Finland": "fi",
    "France": "fr", "Georgia": "ge", "Germany": "de", "Ghana": "gh", "Greece": "gr", "Guatemala": "gt", "Honduras": "hn",
    "Hong Kong SAR": "hk", "Hungary": "hu", "Iceland": "is", "India": "in", "Indonesia": "id", "Iran, Islamic Republic of": "ir",
    "Iraq": "iq", "Ireland": "ie", "Israel": "il", "Italy": "it", "Jamaica": "jm", "Japan": "jp", "Jordan": "jo", "Kazakhstan": "kz",
    "Kenya": "ke", "Kosovo": "xk", "Kuwait": "kw", "Kyrgyzstan": "kg", "Latvia": "lv", "Lebanon": "lb", "Lithuania": "lt",
    "Luxembourg": "lu", "Macau SAR": "mo", "Malaysia": "my", "Malta": "mt", "Mauritius": "mu", "Mexico": "mx", "Montenegro": "me",
    "Morocco": "ma", "Mozambique": "mz", "Namibia": "na", "Nepal": "np", "Netherlands": "nl", "New Zealand": "nz", "Nigeria": "ng",
    "North Macedonia": "mk", "Northern Cyprus": "tr", "Norway": "no", "Oman": "om", "Pakistan": "pk",
    "Palestinian Territory, Occupied": "ps", "Panama": "pa", "Paraguay": "py", "Peru": "pe", "Philippines": "ph", "Poland": "pl",
    "Portugal": "pt", "Puerto Rico": "pr", "Qatar": "qa", "Romania": "ro", "Russia": "ru", "Saudi Arabia": "sa", "Serbia": "rs",
    "Singapore": "sg", "Slovakia": "sk", "Slovenia": "si", "South Africa": "za", "South Korea": "kr", "Spain": "es", "Sri Lanka": "lk",
    "Sudan": "sd", "Sweden": "se", "Switzerland": "ch", "Syrian Arab Republic": "sy", "Taiwan": "tw", "Tanzania": "tz",
    "Thailand": "th", "Tunisia": "tn", "Turkey": "tr", "Uganda": "ug", "Ukraine": "ua", "United Arab Emirates": "ae",
    "United Kingdom": "uk", "United States": "us", "Uruguay": "uy", "Uzbekistan": "uz", "Venezuela": "ve", "Vietnam": "vn",
    "Zambia": "zm", "Zimbabwe": "zw",
}
TLD_COUNTRY = {tld: country for country, tld in COUNTRY_TLD.items() if country != "Northern Cyprus"}


def link_country(link):
    """Country implied by a link's country-code domain (".ac.uk" -> United Kingdom), or "" for .edu/.com etc."""
    host = re.sub(r"^https?://", "", str(link or "").strip().lower()).split("/")[0].split(":")[0]
    tld = host.rsplit(".", 1)[-1] if "." in host else ""
    return TLD_COUNTRY.get(tld, "")


def link_host(link):
    return re.sub(r"^https?://(www\d?\.)?", "", str(link or "").strip().lower()).split("/")[0].split(":")[0]


NAME_STOPWORDS = {"of", "the", "and", "de", "di", "la", "du", "des", "del", "da", "do", "at", "in", "y", "e"}
GENERIC_NAME_WORDS = {"university", "universidad", "universidade", "universita", "universitat", "universite", "institute",
                      "institut", "instituto", "technology", "college", "national", "science", "sciences", "state", "school"}


def website_fits_name(name, link):
    """Does the link plausibly belong to this university? ("Universidad de Oriente" ~ uo.edu.cu)"""
    host = link_host(link)
    if not host:
        return False
    words = re.findall(r"[a-z]+", unicodedata_fold(re.sub(r"\([^)]*\)", " ", name)))
    if any(len(w) > 3 and w not in GENERIC_NAME_WORDS and w[:5] in host for w in words):
        return True
    acronyms = [unicodedata_fold(a) for a in re.findall(r"\(([A-Za-z\-]{2,10})\)", name)]
    if any(a and a.replace("-", "") in host.replace("-", "") for a in acronyms):
        return True
    initials = "".join(w[0] for w in words if w not in NAME_STOPWORDS)
    label = host.split(".")[0]
    return label == initials or (len(initials) >= 3 and initials in host)


def unicodedata_fold(text):
    import unicodedata
    return unicodedata.normalize("NFKD", str(text)).encode("ascii", "ignore").decode().lower()


def normalize_link(raw):
    text = str(raw or "").strip()
    if not text or " " in text or "." not in text:
        return ""
    if not re.match(r"https?://", text, re.I):
        text = "https://" + text
    return text
