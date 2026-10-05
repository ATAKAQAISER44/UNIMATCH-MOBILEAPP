"""
University Administrator - benchmarking against other universities.

Suggested peer groups (similar rank, same country, aspirational), a side-by-side
comparison of ranking indicators, a separate side-by-side of attributes, and the
gap to a target rank. Rankings and attributes are never combined.
"""

import pandas as pd
from fastapi import HTTPException

from app.administrator.performance_service import _round, latest_edition
from app.administrator.profile_service import NUMERIC, attribute_values
from app.researcher.university_journey_service import find_university_row, normalize_university_name

GROUP_SIZE = 5
SIMILAR_BAND = 25            # +/- places
ASPIRATIONAL = (10, 30)      # places above
TARGET_BAND = 0.1            # universities within 10% of the target rank
COMPARE_ATTRIBUTES = list(NUMERIC) + ["Scholarship (Yes/No)", "Language", "Public / Private"]


def _university(view, values, row) -> dict:
    return {
        "key": normalize_university_name(row[view["name_col"]]),
        "name": row[view["name_col"]],
        "country": row[view["country_col"]] if view["country_col"] else "",
        "rank": str(row[view["rank_col"]]),
        "indicators": {m: _round(values[m].get(row.name)) for m in view["metrics"] if m in values},
    }


def build_benchmark(key: str, dataset: str, peer_keys: list[str], target_rank: int | None) -> dict:
    view, year, values = latest_edition(dataset)
    df = view["df"]
    row = find_university_row(view, normalize_university_name(key))
    if row is None:
        raise HTTPException(status_code=404, detail=f"Your university is not ranked by {dataset.upper()}")

    ranks, rank = df["_rank_numeric"], int(row["_rank_numeric"])
    others = df[df.index != row.name]
    nearest = lambda rows: rows.iloc[(rows["_rank_numeric"] - rank).abs().argsort()[:GROUP_SIZE]]
    groups = {
        "similar": nearest(others[(others["_rank_numeric"] - rank).abs() <= SIMILAR_BAND]),
        "country": nearest(others[others[view["country_col"]] == row[view["country_col"]]]) if view["country_col"] else others.iloc[0:0],
        "aspirational": nearest(others[others["_rank_numeric"].between(rank - ASPIRATIONAL[1], rank - ASPIRATIONAL[0])]),
    }
    suggested = {name: [_university(view, values, r) for _, r in rows.iterrows()] for name, rows in groups.items()}

    chosen = [find_university_row(view, normalize_university_name(k)) for k in peer_keys] if peer_keys else []
    peers = [_university(view, values, r) for r in chosen if r is not None] or suggested["similar"]
    you = _university(view, values, row)

    for university in [you] + peers:
        university["attributes"] = attribute_values(university["name"], university["country"], COMPARE_ATTRIBUTES)

    target = None
    if target_rank:
        band = df[ranks.between(target_rank * (1 - TARGET_BAND), target_rank * (1 + TARGET_BAND))]
        target = {
            "rank": target_rank,
            "compared_with": int(len(band)),
            "indicators": [
                {"key": m, "yours": you["indicators"].get(m), "target_median": _round(values[m][band.index].median()),
                 "gap": _round(values[m][band.index].median() - you["indicators"][m]) if you["indicators"].get(m) is not None else None}
                for m in view["metrics"] if m in values
            ],
        }

    return {"dataset": dataset, "year": year, "metrics": view["metrics"], "you": you, "peers": peers,
            "suggested": suggested, "target": target, "attribute_columns": COMPARE_ATTRIBUTES}
