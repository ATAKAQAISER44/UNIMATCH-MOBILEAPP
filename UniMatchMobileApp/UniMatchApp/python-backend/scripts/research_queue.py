"""
Next universities to research for one task, best-ranked first.

    python scripts/research_queue.py <task> [--size 25] [--max-rank 1000]

Tasks (a university is queued when the value is empty or "not verified",
i.e. it has no source or is only an estimate):
    verify-fees      tuition fees with no source
    acceptance       Acceptance Rate
    employability    Graduate Employability Rate
    cgpa             Minimum CGPA Requirement
    tests            Standardized Test / University Acceptance Test
    language         Language
    part-time        Part-Time Job Allowed
    scholarship      Scholarship (Yes/No) and its webpage link
    public-private   Public / Private

Prints a CSV: rank, university, country, official website, current value(s).
Run scripts/build_attribute_references.py first so the statuses are current.
"""

import argparse
import re
import sys
from pathlib import Path

import pandas as pd

sys.path.append(str(Path(__file__).resolve().parents[1]))
from app.matching.university_matcher import name_key  # noqa: E402
from fix_university_attributes import read_csv_any  # noqa: E402

DATA = Path(__file__).resolve().parents[1] / "data"
TASKS = {
    "verify-fees": ["Tuition Fee (local)", "Tuition Fee (international)"],
    "acceptance": ["Acceptance Rate"],
    "employability": ["Graduate Employability Rate"],
    "cgpa": ["Minimum CGPA Requirement"],
    "tests": ["Standardized Test", "University Acceptance Test (Yes/No)"],
    "language": ["Language"],
    "part-time": ["Part-Time Job Allowed"],
    "scholarship": ["Scholarship (Yes/No)", "University ScholarShip webpage link"],
    "public-private": ["Public / Private"],
}


def ranks():
    aliases = pd.read_csv(DATA / "matching" / "university_aliases.csv", dtype=str, keep_default_na=False)
    uid = {(r.dataset, name_key(r.source_name)): r.uni_id for r in aliases.itertuples()}
    best = {}
    for dataset, path, name_col, rank_col in [("qs", "qs.csv", "Institution_Name", "RANK_2025"), ("the", "the.csv", "name", "rank")]:
        table = read_csv_any(DATA / "raw" / path)
        for name, rank in zip(table[name_col], table[rank_col]):
            m, u = re.search(r"\d+", str(rank)), uid.get((dataset, name_key(name)))
            if m and u:
                best[u] = min(best.get(u, 99999), int(m.group()))
    return lambda name: best.get(uid.get(("attr", name_key(name))), 99999)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("task", choices=TASKS)
    parser.add_argument("--size", type=int, default=25)
    parser.add_argument("--max-rank", type=int, default=99999)
    args = parser.parse_args()

    df = pd.read_csv(DATA / "raw" / "university_attributes.csv", dtype=str, keep_default_na=False)
    refs = pd.read_csv(DATA / "audit" / "attribute_references.csv", dtype=str, keep_default_na=False)
    sourced = refs.Status == "sourced"
    verified = set(zip(refs.Institution_Name[sourced], refs.Column[sourced]))
    rank_of = ranks()
    cols = TASKS[args.task]
    df["rank"] = df.Institution_Name.map(rank_of)
    todo = df[df.apply(lambda r: any((r.Institution_Name, c) not in verified for c in cols), axis=1)]
    todo = todo[todo["rank"] <= args.max_rank].sort_values(["rank", "Institution_Name"]).head(args.size)
    out = todo[["rank", "Institution_Name", "Country", "University Official Website link "] + cols]
    out = out.assign(rank=out["rank"].where(out["rank"] < 99999, ""))
    print(f"# {len(df[df.apply(lambda r: any((r.Institution_Name, c) not in verified for c in cols), axis=1)])} universities still need '{args.task}'",
          file=sys.stderr)
    out.to_csv(sys.stdout, index=False)


if __name__ == "__main__":
    main()
