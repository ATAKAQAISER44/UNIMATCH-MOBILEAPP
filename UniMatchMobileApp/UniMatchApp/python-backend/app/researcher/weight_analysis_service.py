import pandas as pd
from fastapi import HTTPException

from app.researcher.dataset_service import load_researcher_dataset
from app.services.scoring_service import keep_allowed_weights, normalize_weights


def indicator_values(view: dict, df: pd.DataFrame, metrics) -> pd.DataFrame:
    """0-1 normalized value of each weighted indicator, empty cells filled with the median."""
    columns = {}
    for metric in metrics:
        if metric not in df.columns:
            raise HTTPException(
                status_code=400,
                detail=f"Weight indicator not found in dataset: {metric}",
            )

        if view["historical"]:
            normalized_series = view["normalized"].get(metric)
            values = (
                normalized_series.reindex(df.index)
                if normalized_series is not None
                else pd.Series(index=df.index, dtype="float64")
            )
        else:
            values = pd.to_numeric(df[metric], errors="coerce")

        median_value = values.median()
        if pd.isna(median_value):
            median_value = 0
        columns[metric] = values.fillna(median_value)

    return pd.DataFrame(columns, index=df.index)


def prepare_weighting(dataset: str, year: int | None, weights: dict):
    """Loads the dataset and returns what every weight-based analysis needs."""
    dataset = dataset.lower()
    view, selected_year, years = load_researcher_dataset(dataset, year)

    df = view["df"].copy()
    allowed_weights = keep_allowed_weights(weights, view["metrics"])
    normalized_weights = normalize_weights(allowed_weights)
    values = indicator_values(view, df, normalized_weights.keys())

    return dataset, view, df, values, normalized_weights, selected_year, years


def build_weight_analysis(dataset: str, year: int | None, weights: dict, top_n: int = 100):
    dataset, view, df, values, normalized_weights, selected_year, years = prepare_weighting(
        dataset, year, weights
    )

    df["_experimental_score"] = 0.0
    for metric, weight in normalized_weights.items():
        df["_experimental_score"] += values[metric] * weight

    df = df.sort_values("_experimental_score", ascending=False).reset_index(drop=True)
    df["_experimental_rank"] = df.index + 1

    # Official ranks can be tied (e.g. two universities both published at "=2").
    # Ranks are assigned with standard competition ranking, so a tie of size k at
    # rank R always occupies positions R..R+k-1. Reshuffling within that block is
    # not a real ranking change, so treat any experimental rank inside a
    # university's own tie block as unchanged, and only measure movement past
    # the block's edges.
    official_rank_group_sizes = df["_rank_numeric"].value_counts().to_dict()

    if top_n and top_n > 0:
        df = df.head(top_n)

    results = []
    for _, row in df.iterrows():
        experimental_rank = int(row["_experimental_rank"])
        official_rank_numeric = row.get("_rank_numeric")
        official_rank = (
            int(official_rank_numeric) if pd.notna(official_rank_numeric) else None
        )

        rank_change = None
        if official_rank is not None:
            group_size = official_rank_group_sizes.get(official_rank_numeric, 1)
            lower_bound = official_rank
            upper_bound = official_rank + group_size - 1

            if experimental_rank < lower_bound:
                rank_change = lower_bound - experimental_rank
            elif experimental_rank > upper_bound:
                rank_change = upper_bound - experimental_rank
            else:
                rank_change = 0

        results.append(
            {
                "university_id": row.get("university_id", ""),
                "name": row.get(view["name_col"], ""),
                "country": row.get(view["country_col"], "")
                if view["country_col"]
                else "",
                "official_rank": official_rank,
                "experimental_rank": experimental_rank,
                "experimental_score": round(float(row["_experimental_score"]), 4),
                "rank_change": rank_change,
            }
        )

    return {
        "dataset": dataset.upper(),
        "year": selected_year,
        "available_years": years,
        "normalized_weights": normalized_weights,
        "results": results,
    }
