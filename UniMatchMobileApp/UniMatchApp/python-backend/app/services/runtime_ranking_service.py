from pathlib import Path
import pandas as pd


DATASET_PATHS = {
    "QS": "data/processed/qs_normalized.csv",
    "THE": "data/processed/the_normalized.csv",
    "ARWU": "data/processed/arwu_normalized.csv",
}


def load_processed_dataset(selected_dataset: str) -> pd.DataFrame:
    selected_dataset = selected_dataset.upper()

    if selected_dataset not in DATASET_PATHS:
        raise ValueError("Invalid dataset. Choose QS, THE, or ARWU.")

    path = Path(DATASET_PATHS[selected_dataset])

    if not path.exists():
        raise FileNotFoundError(f"Processed file not found: {path}")

    return pd.read_csv(path)


def normalize_weights(weights: dict) -> dict:
    if not weights:
        raise ValueError("Weights cannot be empty.")

    cleaned_weights = {}

    for key, value in weights.items():
        try:
            numeric_value = float(value)
        except (TypeError, ValueError):
            numeric_value = 0

        if numeric_value < 0:
            numeric_value = 0

        cleaned_weights[key] = numeric_value

    total = sum(cleaned_weights.values())

    if total <= 0:
        raise ValueError("Weights must contain at least one positive value.")

    return {key: value / total for key, value in cleaned_weights.items()}


def validate_columns(df: pd.DataFrame, weights: dict, score_type: str):
    missing_columns = [col for col in weights.keys() if col not in df.columns]

    if missing_columns:
        raise ValueError(
            f"Missing {score_type} columns in dataset: {missing_columns}"
        )


def fill_missing_values(df: pd.DataFrame, columns: list[str]) -> pd.DataFrame:
    df = df.copy()

    for col in columns:
        df[col] = pd.to_numeric(df[col], errors="coerce")

        median_value = df[col].median()

        if pd.isna(median_value):
            median_value = 0

        df[col] = df[col].fillna(median_value)

    return df


def compute_weighted_score(df: pd.DataFrame, weights: dict, output_column: str) -> pd.DataFrame:
    df = df.copy()
    df[output_column] = 0.0

    for col, weight in weights.items():
        df[output_column] += df[col] * weight

    return df


def build_runtime_ranking(
    selected_dataset: str,
    metric_weights: dict,
    attribute_weights: dict,
    attribute_scores: pd.DataFrame,
) -> pd.DataFrame:
    ranking_df = load_processed_dataset(selected_dataset)

    if "university_id" not in ranking_df.columns:
        raise ValueError("Ranking dataset must contain university_id.")

    if "university_id" not in attribute_scores.columns:
        raise ValueError("Attribute scores must contain university_id.")

    metric_weights = normalize_weights(metric_weights)
    attribute_weights = normalize_weights(attribute_weights)

    validate_columns(ranking_df, metric_weights, "ranking metric")
    validate_columns(attribute_scores, attribute_weights, "attribute score")

    ranking_df = fill_missing_values(ranking_df, list(metric_weights.keys()))
    attribute_scores = fill_missing_values(attribute_scores, list(attribute_weights.keys()))

    ranking_df = compute_weighted_score(
        ranking_df,
        metric_weights,
        "ranking_score",
    )

    attribute_scores = compute_weighted_score(
        attribute_scores,
        attribute_weights,
        "attribute_score",
    )

    combined_df = ranking_df.merge(
        attribute_scores[["university_id", "attribute_score"]],
        on="university_id",
        how="left",
    )

    combined_df["attribute_score"] = combined_df["attribute_score"].fillna(0)

    combined_df["final_score"] = (
        combined_df["ranking_score"] + combined_df["attribute_score"]
    )

    combined_df = combined_df.sort_values(
        by="final_score",
        ascending=False,
    ).reset_index(drop=True)

    combined_df["personalized_rank"] = combined_df.index + 1

    return combined_df