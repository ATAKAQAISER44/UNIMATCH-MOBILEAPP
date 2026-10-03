"""
Rank stability test (UC-R-03, sensitivity analysis).

Nobody can say a weight must be exactly 30% rather than 27% or 33%. This test
repeats the ranking many times, each time nudging every weight randomly by up
to +/- `variation` (e.g. 20% of its own size), and records where each
university lands. A university whose position barely moves has a rank that
does not depend on the exact weights; one that jumps around does.
"""

import numpy as np
from fastapi import HTTPException

from app.researcher.weight_analysis_service import prepare_weighting

ALLOWED_VARIATIONS = {0.1, 0.2, 0.3}
DEFAULT_RUNS = 500
MAX_RUNS = 2000
# Fixed seed: the same weights always give the same result, so an experiment
# can be repeated and quoted in a report.
RANDOM_SEED = 42


def _ranks(scores: np.ndarray) -> np.ndarray:
    """Rank 1 = highest score, for every column of a (universities x runs) matrix."""
    order = np.argsort(-scores, axis=0, kind="stable")
    ranks = np.empty_like(order)
    rows = np.arange(scores.shape[0])[:, None]
    ranks[order, np.arange(scores.shape[1])[None, :]] = rows + 1
    return ranks


def _verdict(base_rank: int, low: int, high: int) -> str:
    """How far a university can move, judged relative to its own rank
    (moving 5 places matters at #10 but hardly at #400)."""
    spread = high - low
    if spread <= max(2, base_rank * 0.05):
        return "very_stable"
    if spread <= max(5, base_rank * 0.20):
        return "stable"
    if spread <= max(10, base_rank * 0.40):
        return "sensitive"
    return "very_sensitive"


def build_rank_stability(
    dataset: str,
    year: int | None,
    weights: dict,
    variation: float = 0.2,
    runs: int = DEFAULT_RUNS,
    top_n: int = 100,
):
    variation = round(float(variation), 2)
    if variation not in ALLOWED_VARIATIONS:
        raise HTTPException(status_code=400, detail="Variation must be 0.1, 0.2 or 0.3")
    runs = max(50, min(int(runs or DEFAULT_RUNS), MAX_RUNS))

    dataset, view, df, values, normalized_weights, selected_year, years = prepare_weighting(
        dataset, year, weights
    )

    metrics = list(normalized_weights.keys())
    x = values[metrics].to_numpy(dtype=float)  # universities x indicators
    base_w = np.array([normalized_weights[m] for m in metrics], dtype=float)

    base_rank = _ranks((x @ base_w)[:, None])[:, 0]

    # Every run multiplies each weight by a random factor in [1 - v, 1 + v]
    # and re-normalises so the weights still add up to 100%.
    rng = np.random.default_rng(RANDOM_SEED)
    factors = rng.uniform(1 - variation, 1 + variation, size=(runs, len(metrics)))
    run_w = base_w[None, :] * factors
    run_w = run_w / run_w.sum(axis=1, keepdims=True)
    run_ranks = _ranks(x @ run_w.T)  # universities x runs

    low = np.percentile(run_ranks, 5, axis=1, method="nearest").astype(int)
    high = np.percentile(run_ranks, 95, axis=1, method="nearest").astype(int)
    best = run_ranks.min(axis=1)
    worst = run_ranks.max(axis=1)
    same_share = (run_ranks == base_rank[:, None]).mean(axis=1)

    # Which single weight moves the ranking most: change only that weight by
    # +/- variation and measure the average shift of the reported universities.
    top_mask = base_rank <= (top_n if top_n and top_n > 0 else len(base_rank))
    indicator_impact = []
    for j, metric in enumerate(metrics):
        if base_w[j] == 0:
            continue
        shifts = []
        for direction in (1 - variation, 1 + variation):
            w = base_w.copy()
            w[j] *= direction
            w /= w.sum()
            ranks = _ranks((x @ w)[:, None])[:, 0]
            shifts.append(np.abs(ranks[top_mask] - base_rank[top_mask]).mean())
        indicator_impact.append({"key": metric, "average_shift": round(float(max(shifts)), 2)})
    indicator_impact.sort(key=lambda item: item["average_shift"], reverse=True)

    names = df[view["name_col"]].tolist()
    countries = df[view["country_col"]].tolist() if view["country_col"] else [""] * len(df)
    university_ids = df["university_id"].tolist() if "university_id" in df.columns else [""] * len(df)

    order = np.argsort(base_rank, kind="stable")
    if top_n and top_n > 0:
        order = order[:top_n]

    results = []
    for i in order:
        rank = int(base_rank[i])
        results.append(
            {
                "university_id": university_ids[i] or "",
                "name": names[i] if isinstance(names[i], str) else "",
                "country": countries[i] if isinstance(countries[i], str) else "",
                "rank": rank,
                "range_low": int(low[i]),
                "range_high": int(high[i]),
                "best": int(best[i]),
                "worst": int(worst[i]),
                "same_rank_pct": round(float(same_share[i]) * 100, 1),
                "verdict": _verdict(rank, int(low[i]), int(high[i])),
            }
        )

    verdict_counts = {key: 0 for key in ("very_stable", "stable", "sensitive", "very_sensitive")}
    for row in results:
        verdict_counts[row["verdict"]] += 1

    return {
        "dataset": dataset.upper(),
        "year": selected_year,
        "available_years": years,
        "variation": variation,
        "runs": runs,
        "seed": RANDOM_SEED,
        "normalized_weights": normalized_weights,
        "total_universities": int(len(df)),
        "verdict_counts": verdict_counts,
        "indicator_impact": indicator_impact,
        "results": results,
    }
