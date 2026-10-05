"""
University Administrator - institutional profile (attributes only).

Every attribute of the university with its data status and source, and its
position among universities of the same country and of the same region and
type (public/private). Rankings are handled separately.
"""

import re
from functools import lru_cache
from pathlib import Path

import pandas as pd
from fastapi import HTTPException

from app.matching.university_matcher import name_key, resolve_uni_id

DATASET = Path("data/raw/university_attributes.csv")
REFERENCES = Path("data/audit/attribute_references.csv")
MERGED = Path("data/audit/duplicates_merged.csv")  # removed duplicate name -> kept row
WEBSITE = "University Official Website link "

# Numeric attributes and which direction is better for a student.
NUMERIC = {
    "Tuition Fee (local)": "lower",
    "Tuition Fee (international)": "lower",
    "Living Cost": "lower",
    "Acceptance Rate": "higher",
    "Minimum CGPA Requirement": "lower",
    "Graduate Employability Rate": "higher",
}
SUMMARIES = {
    "affordability": ["Tuition Fee (local)", "Tuition Fee (international)", "Living Cost"],
    "accessibility": ["Acceptance Rate", "Minimum CGPA Requirement"],
}
SUPPORT = ["Scholarship (Yes/No)", "Internship Available", "Part-Time Job Allowed"]


def _first_number(value) -> float | None:
    match = re.search(r"\d[\d,]*(?:\.\d+)?", str(value or ""))
    return float(match.group().replace(",", "")) if match else None


@lru_cache(maxsize=1)
def _load():
    df = pd.read_csv(DATASET, dtype=str, keep_default_na=False)
    df["uni_id"] = [resolve_uni_id(n, c) for n, c in zip(df["Institution_Name"], df["Country"])]
    for column in NUMERIC:
        df[f"_{column}"] = df[column].map(_first_number)
    refs = pd.read_csv(REFERENCES, dtype=str, keep_default_na=False) if REFERENCES.exists() else pd.DataFrame()
    status = {(r.Institution_Name, r.Column): (r.Status, r.Source_URL, r.Note) for r in refs.itertuples()}
    merged = pd.read_csv(MERGED, dtype=str, keep_default_na=False) if MERGED.exists() else pd.DataFrame(columns=["Kept", "Removed duplicate"])
    df.attrs["kept_by_name"] = {name_key(r): k for r, k in zip(merged["Removed duplicate"], merged["Kept"])}
    return df, status


def _position(df, mask, column, value) -> dict | None:
    """Share of comparable universities this value is better than (0-100)."""
    values = df.loc[mask, f"_{column}"].dropna()
    if value is None or len(values) < 3:
        return None
    better = (values > value) if NUMERIC[column] == "lower" else (values < value)
    return {"better_than": round(better.mean() * 100), "compared_with": int(len(values))}


def find_attribute_row(name: str, country: str | None):
    """The university's attribute row (matched through the name crosswalk), or None."""
    df, _status = _load()
    uid = resolve_uni_id(name, country)
    matches = df[df["uni_id"] == uid] if uid else df.iloc[0:0]
    if matches.empty:  # a name whose row was merged into another one
        kept = df.attrs.get("kept_by_name", {}).get(name_key(name))
        matches = df[df["Institution_Name"] == kept] if kept else matches
    return None if matches.empty else matches.iloc[0]


def attribute_values(name: str, country: str | None, columns: list[str]) -> dict:
    """Selected attribute values with their data status, for side-by-side comparison."""
    row = find_attribute_row(name, country)
    _df, status = _load()
    if row is None:
        return {}
    return {c: {"value": row[c] or None, "status": status.get((row["Institution_Name"], c), ("",))[0]} for c in columns}


def build_institution_profile(name: str, country: str | None) -> dict:
    df, status = _load()
    row = find_attribute_row(name, country)
    if row is None:
        raise HTTPException(status_code=404, detail="No attribute data found for this university")

    same_country = df["Country"] == row["Country"]
    same_group = (df["Region"] == row["Region"]) & (df["Public / Private"] == row["Public / Private"])
    group_label = f"{row['Public / Private'].lower() or 'all'} universities in {row['Region']}"

    attributes = []
    for column in df.columns:
        if column.startswith("_") or column in ("uni_id", "Institution_Name", "Country", "Region"):
            continue
        state, source, note = status.get((row["Institution_Name"], column), ("", "", ""))
        entry = {"key": column.strip(), "value": row[column] or None, "status": state or ("missing" if not row[column] else ""),
                 "source": source or None, "note": note or None}
        if column in NUMERIC:
            value = row[f"_{column}"]
            entry["better_is"] = NUMERIC[column]
            entry["country_position"] = _position(df, same_country, column, value)
            entry["group_position"] = _position(df, same_group, column, value)
        attributes.append(entry)

    by_key = {a["key"]: a for a in attributes}
    summaries = {}
    for name_, columns in SUMMARIES.items():
        scores = [by_key[c]["group_position"]["better_than"] for c in columns if by_key[c].get("group_position")]
        summaries[name_] = round(sum(scores) / len(scores)) if scores else None
    summaries["support"] = sum(str(row[c]).lower().startswith(("yes", "limited")) for c in SUPPORT)

    return {
        "name": row["Institution_Name"],
        "country": row["Country"],
        "region": row["Region"],
        "type": row["Public / Private"] or None,
        "group_label": group_label,
        "summaries": summaries,
        "support_total": len(SUPPORT),
        "attributes": attributes,
    }
