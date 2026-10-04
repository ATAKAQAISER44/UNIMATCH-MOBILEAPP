"""
Where did every value in data/raw/university_attributes.csv come from?

    python scripts/build_attribute_references.py

Run it after scripts/fix_university_attributes.py. Writes two files:

data/audit/attribute_references.csv  (one row per university and column)
    Institution_Name, Column, Value, Source_Type, Status, Source_URL, Note
    Source_Type: official      - the university's own website
                 government    - a ministry / national agency page
                 secondary     - another website (guide, news, ranking blog)
                 ranking file  - QS / THE file in data/raw
                 country estimate - typical value of the same country
                 original dataset - value from the first dataset, no source given
                 mixed sources - old research listed official and other pages
                                 together, so the exact page is unknown
                 estimate      - worked out (mean / median / mode) from other data
    Status: "sourced"                  - any named source (official, government,
                                         secondary website or ranking file)
            "not verified (estimate)"  - country estimate / mean / mode
            "not verified (no source)" - from the first dataset, source unknown

Per-value sources in data/audit/attribute_cell_sources.csv (Institution_Name,
Column, Value, Source_URL, Source_Type, Checked_On, Evidence) win over
everything else while the value in the dataset still matches.

data/audit/university_attributes_with_references.csv
    The dataset for reading by people: every attribute column, two empty
    spacer columns, then one "Ref: <column>" column per attribute.
    The app never reads this file.
"""

import re
from pathlib import Path

import pandas as pd

import attribute_formats as fmt

DATA = Path(__file__).resolve().parents[1] / "data"
DATASET = DATA / "raw" / "university_attributes.csv"
RESEARCH = DATA / "audit" / "attribute_research.csv"
WEBSITES = DATA / "audit" / "website_research.csv"
FORMAT_REVIEW = DATA / "audit" / "attribute_format_review.csv"
REFERENCES = DATA / "audit" / "attribute_references.csv"
CELL_SOURCES = DATA / "audit" / "attribute_cell_sources.csv"
VIEW = DATA / "audit" / "university_attributes_with_references.csv"
WEBSITE = "University Official Website link "
GOVERNMENT = re.compile(r"\.gov\b|\.gov\.|gouv\.|gob\.|\.go\.|europa\.eu|gencat\.cat|mext\.go|ugc\.ac|dges\.gov|"
                        r"studyinaustria|study-in-|studyinkorea|ucas\.com|flbog\.edu|rga\.lis\.virginia", re.I)


def base_domain(host):
    parts = host.split(".")
    if len(parts) >= 3 and parts[-2] in {"ac", "edu", "co", "com", "gov", "org", "net"} and len(parts[-1]) == 2:
        return ".".join(parts[-3:])
    return ".".join(parts[-2:])


def source_type(urls, university_site):
    own = base_domain(fmt.link_host(university_site)) if university_site else None
    types = []
    for url in urls:
        host = fmt.link_host(url)
        if own and host and base_domain(host) == own:
            types.append("official")
        elif GOVERNMENT.search(url):
            types.append("government")
        elif host:
            types.append("secondary")
    if types and all(t == "official" for t in types):
        return "official"
    if types and all(t in ("official", "government") for t in types):
        return "government"
    # Old research lists sources per university, not per value: when they are
    # mixed nobody can tell which value came from which page.
    return "mixed sources" if "official" in types or "government" in types else "secondary"


def main():
    df = pd.read_csv(DATASET, dtype=str, keep_default_na=False)
    research = pd.read_csv(RESEARCH, dtype=str, keep_default_na=False).drop_duplicates("Institution_Name", keep="last").set_index("Institution_Name")
    cells = {}
    if CELL_SOURCES.exists():  # per-value sources written by later research batches
        for r in pd.read_csv(CELL_SOURCES, dtype=str, keep_default_na=False).itertuples():
            cells[(r.Institution_Name, r.Column)] = r
    sites = pd.read_csv(WEBSITES, dtype=str, keep_default_na=False).set_index("Institution_Name") if WEBSITES.exists() else None
    review = pd.read_csv(FORMAT_REVIEW, dtype=str, keep_default_na=False)
    filled_by = {(r.Institution_Name, r.Column): r.Note for r in review.itertuples()
                 if r.Note.startswith(("country estimate", "filled from", "from fee research"))}

    columns = [c for c in df.columns if c not in ("Institution_Name", "Country", "Region")]
    rows = []
    for _, uni in df.iterrows():
        name = uni.Institution_Name
        for col in columns:
            value = uni[col]
            if not value:
                continue
            note = filled_by.get((name, col), "")
            cell = cells.get((name, col))
            if cell is not None and cell.Value == value:
                kind, url, note = cell.Source_Type, cell.Source_URL, f"checked {cell.Checked_On}: {cell.Evidence}"
            elif note.startswith("country estimate"):
                kind, url = "country estimate", ""
            elif note.startswith("filled from"):
                kind, url = "ranking file", note.replace("filled from ", "data/raw/ (") + ")"
            elif col == WEBSITE and sites is not None and name in sites.index:
                kind, url, note = "official", sites.at[name, "Website"], sites.at[name, "Verification"]
            elif name in research.index and (research.at[name, col] if col in research.columns else "") or note.startswith("from fee research"):
                urls = [u.strip() for u in research.at[name, "Sources"].split(";") if u.strip()]
                kind, url = source_type(urls, uni[WEBSITE]), " ; ".join(urls)
                note = research.at[name, "Notes"]
            else:
                kind, url = "original dataset", ""
            # A value with any named source counts as sourced; only values with no
            # source at all, or worked out from other universities, are "not verified".
            if kind in ("country estimate", "estimate"):
                status = "not verified (estimate)"
            elif kind == "original dataset":
                status = "not verified (no source)"
            else:
                status = "sourced"
            rows.append({"Institution_Name": name, "Column": col, "Value": value, "Source_Type": kind,
                         "Status": status, "Source_URL": url, "Note": note})
    refs = pd.DataFrame(rows)
    refs.to_csv(REFERENCES, index=False, encoding="utf-8-sig")

    view = df.copy()
    view[" "] = ""
    view["  "] = ""
    lookup = {(r.Institution_Name, r.Column): f"{r.Status} | {r.Source_Type}" + (f" | {r.Source_URL}" if r.Source_URL else "")
              for r in refs.itertuples()}
    for col in columns:
        view[f"Ref: {col.strip()}"] = [lookup.get((n, col), "") for n in df.Institution_Name]
    view.to_csv(VIEW, index=False, encoding="utf-8-sig")

    print(f"references: {len(refs)} filled cells")
    print(refs.groupby(["Source_Type", "Status"]).size().to_string())


if __name__ == "__main__":
    main()
