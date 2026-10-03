import pandas as pd
from fastapi import HTTPException


def normalize_weights(weights: dict) -> dict:
    cleaned = {}

    for key, value in (weights or {}).items():
        try:
            numeric_value = float(value)
        except (TypeError, ValueError):
            numeric_value = 0

        if numeric_value < 0:
            numeric_value = 0

        cleaned[key] = numeric_value

    total = sum(cleaned.values())

    if total <= 0:
        raise HTTPException(
            status_code=400,
            detail="Weights must contain at least one positive value",
        )

    return {key: value / total for key, value in cleaned.items()}


def compute_weighted_score(
    df: pd.DataFrame,
    weights: dict,
    output_column: str = "personalized_score",
) -> pd.DataFrame:
    df = df.copy()
    normalized_weights = normalize_weights(weights)

    for col in normalized_weights.keys():
        if col not in df.columns:
            raise HTTPException(
                status_code=400,
                detail=f"Weight column not found in dataset: {col}",
            )

        df[col] = pd.to_numeric(df[col], errors="coerce")
        median_value = df[col].median()

        if pd.isna(median_value):
            median_value = 0

        df[col] = df[col].fillna(median_value)

    df[output_column] = 0.0

    for col, weight in normalized_weights.items():
        df[output_column] += df[col] * weight

    return df


def keep_allowed_weights(weights: dict, allowed_metrics: list[str]) -> dict:
    allowed = set(allowed_metrics)

    return {
        key: value
        for key, value in (weights or {}).items()
        if key in allowed
    }