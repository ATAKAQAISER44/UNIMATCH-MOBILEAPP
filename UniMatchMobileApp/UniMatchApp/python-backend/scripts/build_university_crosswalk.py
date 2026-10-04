"""
Builds data/matching/universities.csv, university_aliases.csv and review_needed.csv.

Run from the python-backend folder:
    python scripts/build_university_crosswalk.py

After running, open data/matching/review_needed.csv, write "yes" or "no" in the
"decision" column for each doubtful pair, save, and run this script again.
Your decisions are kept on every re-run.
"""

import sys
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parents[1]))

import pandas as pd

from app.matching.university_matcher import DATA_DIR, MATCHING_DIR, build_crosswalk


def read_csv(path: Path) -> pd.DataFrame:
    try:
        return pd.read_csv(path, encoding="utf-8-sig")
    except UnicodeDecodeError:
        return pd.read_csv(path, encoding="latin1")


SOURCES = [
    ("qs", DATA_DIR / "processed" / "qs_normalized.csv", "Institution_Name", "Location"),
    ("the", DATA_DIR / "processed" / "the_normalized.csv", "name", "location"),
    ("arwu", DATA_DIR / "processed" / "arwu_normalized.csv", "Institute", "Country"),
    ("attr", DATA_DIR / "processed" / "university_attributes_processed.csv", "Institution_Name", "Country"),
    ("qs_2024", DATA_DIR / "researcher" / "qs" / "qs_2024.csv", "Institution_Name", "Country"),
    ("qs_2025", DATA_DIR / "researcher" / "qs" / "qs_2025.csv", "Institution_Name", "Country"),
    ("qs_2027", DATA_DIR / "researcher" / "qs" / "qs_2027.csv", "Institution_Name", "Country"),
]


if __name__ == "__main__":
    sources = []
    for dataset, path, name_col, country_col in SOURCES:
        if not path.exists():
            print(f"Skipping {dataset}: {path} not found")
            continue
        sources.append({
            "dataset": dataset,
            "df": read_csv(path),
            "name_col": name_col,
            "country_col": country_col,
        })

    summary = build_crosswalk(sources)

    print(f"Names read:                 {summary['names']}")
    print(f"Unique universities:        {summary['universities']}")
    print(f"Auto fuzzy matches:         {summary['auto_fuzzy']}")
    print(f"Matched by your decisions:  {summary['manual']}")
    print(f"Pairs waiting for review:   {summary['review_pending']}")
    print(f"Files written to:           {MATCHING_DIR}")
