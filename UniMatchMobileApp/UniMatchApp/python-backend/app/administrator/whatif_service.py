"""
University Administrator - what-if scenarios.

A scenario is a set of indicator weights plus optional changes to the
university's own scores (in points). For each scenario the university's rank
among all universities of the latest edition is recalculated with the same
weighted-score method as the researcher Weight Analysis. Official ranks are
never changed; these are estimates.
"""

import pandas as pd
from fastapi import HTTPException

from app.administrator.performance_service import _round, latest_edition
from app.researcher.university_journey_service import find_university_row, normalize_university_name
from app.researcher.weight_analysis_service import indicator_values
from app.services.scoring_service import keep_allowed_weights, normalize_weights


def build_whatif(key: str, dataset: str, scenarios: list[dict]) -> dict:
    view, year, published = latest_edition(dataset)
    row = find_university_row(view, normalize_university_name(key))
    if row is None:
        raise HTTPException(status_code=404, detail=f"Your university is not ranked by {dataset.upper()}")

    metrics = view["metrics"]
    values = indicator_values(view, view["df"], metrics)  # 0-1, empty cells = median
    spans = {m: (published[m].max() - published[m].min()) if m in published else None for m in metrics}

    results = []
    for scenario in scenarios:
        allowed = keep_allowed_weights(scenario.get("weights", {}), metrics)
        if sum(float(w or 0) for w in allowed.values()) <= 0:
            results.append({"name": scenario.get("name"), "rank": None, "score": None})
            continue
        weights = pd.Series(normalize_weights(allowed))

        mine = values.loc[row.name].copy()
        for metric, points in (scenario.get("changes") or {}).items():
            if metric in mine.index and spans.get(metric):
                mine[metric] = min(1.0, max(0.0, mine[metric] + float(points) / spans[metric]))

        others = (values[weights.index] * weights).sum(axis=1).drop(row.name)
        my_score = float((mine[weights.index] * weights).sum())
        results.append({
            "name": scenario.get("name"),
            "rank": int((others > my_score).sum() + 1),
            "score": _round(my_score * 100),
        })

    return {"dataset": dataset, "year": year, "official_rank": str(row[view["rank_col"]]),
            "total_ranked": int(len(view["df"])), "results": results}
