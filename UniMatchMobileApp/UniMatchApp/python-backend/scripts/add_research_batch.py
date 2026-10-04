"""
Appends one research batch (a JSON file) to data/audit/attribute_research.csv.

    python scripts/add_research_batch.py path/to/batch.json [--merge]

The JSON is a list of objects whose keys are the attribute column names, plus
"Institution_Name", "Sources" and optionally "Notes". A university that is
already in the research file is replaced by the new entry; with --merge the
new values are added to its existing entry instead.
"""

import json
import sys
from pathlib import Path

import pandas as pd

RESEARCH = Path(__file__).resolve().parents[1] / "data" / "audit" / "attribute_research.csv"
COLUMNS = [
    "Institution_Name", "Country", "Region",
    "Tuition Fee (local)", "Tuition Fee (international)", "Living Cost", "Scholarship (Yes/No)",
    "University ScholarShip webpage link", "Minimum CGPA Requirement", "Standardized Test",
    "University Acceptance Test (Yes/No)", "Degree Level offered", "Acceptance Rate", "Internship Available",
    "Part-Time Job Allowed", "Graduate Employability Rate", "Language", "Public / Private",
    "University Official Website link ", "Sources", "Notes", "Batch",
]


def main():
    batch_file = Path(sys.argv[1])
    entries = json.loads(batch_file.read_text(encoding="utf-8"))
    new = pd.DataFrame(entries).reindex(columns=COLUMNS).fillna("")
    unknown = set().union(*(e.keys() for e in entries)) - set(COLUMNS)
    if unknown:
        raise SystemExit(f"Unknown column names in batch: {sorted(unknown)}")

    if RESEARCH.exists() and "--merge" in sys.argv:
        # Add values to universities already researched (e.g. acceptance rates on
        # top of earlier fee research) instead of replacing their entries.
        combined = pd.read_csv(RESEARCH, dtype=str, keep_default_na=False)
        index = {n: i for i, n in combined.Institution_Name.items()}
        for _, row in new.iterrows():
            i = index.get(row.Institution_Name)
            if i is None:
                combined = pd.concat([combined, row.to_frame().T], ignore_index=True)
                continue
            for col in COLUMNS[1:]:
                if not row[col]:
                    continue
                if col in ("Sources", "Notes", "Batch") and combined.at[i, col]:
                    combined.at[i, col] = f"{combined.at[i, col]} ; {row[col]}"
                else:
                    combined.at[i, col] = row[col]
    elif RESEARCH.exists():
        old = pd.read_csv(RESEARCH, dtype=str, keep_default_na=False)
        old = old[~old.Institution_Name.isin(new.Institution_Name)]
        combined = pd.concat([old, new], ignore_index=True)
    else:
        combined = new
    combined.to_csv(RESEARCH, index=False, encoding="utf-8-sig")
    print(f"added {len(new)} universities; research file now has {len(combined)}")


if __name__ == "__main__":
    main()
