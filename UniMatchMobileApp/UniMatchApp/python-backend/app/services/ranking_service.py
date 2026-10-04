import re
from pathlib import Path

import pandas as pd
from fastapi import HTTPException

from app.config.ranking_config import COLUMN_MAP, DATASET_FILES
from app.matching.university_matcher import apply_display_names


def normalize_col_name(col):
    return (
        str(col)
        .strip()
        .lower()
        .replace(" ", "_")
        .replace("-", "_")
        .replace("/", "")
        .replace("&", "")
    )


def find_column(df, possible_columns):
    normalized_df_cols = {normalize_col_name(col): col for col in df.columns}

    for possible_col in possible_columns:
        normalized_possible_col = normalize_col_name(possible_col)

        if normalized_possible_col in normalized_df_cols:
            return normalized_df_cols[normalized_possible_col]

    return None


def clean_rank_value(value):
    if pd.isna(value):
        return None

    value = str(value).strip()
    match = re.search(r"\d+", value)

    if match:
        return int(match.group())

    return None


def load_dataset(dataset: str):
    dataset = dataset.lower()

    if dataset not in DATASET_FILES:
        raise HTTPException(status_code=400, detail="Invalid dataset")

    file_path = Path(DATASET_FILES[dataset])

    if not file_path.exists():
        raise HTTPException(
            status_code=404,
            detail=f"{dataset} processed file not found",
        )

    return pd.read_csv(file_path)


def prepare_dataset(dataset: str):
    dataset = dataset.lower()
    df = load_dataset(dataset)

    name_col = find_column(df, COLUMN_MAP[dataset]["name"])
    country_col = find_column(df, COLUMN_MAP[dataset]["country"])
    rank_col = find_column(df, COLUMN_MAP[dataset]["rank"])

    if not name_col:
        raise HTTPException(
            status_code=500,
            detail=f"University name column not found. Available columns: {df.columns.tolist()}",
        )

    if not rank_col:
        raise HTTPException(
            status_code=500,
            detail=f"Official rank column not found. Available columns: {df.columns.tolist()}",
        )

    df["_rank_numeric"] = df[rank_col].apply(clean_rank_value)
    df = df.dropna(subset=["_rank_numeric"])
    df["_rank_numeric"] = df["_rank_numeric"].astype(int)
    df = df.sort_values(by="_rank_numeric", ascending=True)

    # Same university -> same name in QS, THE and ARWU (see app/matching).
    df = apply_display_names(df, name_col, country_col)

    return df, name_col, country_col, rank_col


def apply_country_and_search(df, country_col, name_col, country, search):
    if country and country != "All" and country_col:
        df = df[
            df[country_col].astype(str).str.strip().str.lower()
            == country.strip().lower()
        ]

    if search and search.strip():
        query = search.strip().lower()

        name_match = df[name_col].astype(str).str.lower().str.contains(
            query,
            na=False,
            regex=False,
        )

        # Also find a university by the name this ranking originally used.
        if "source_name" in df.columns:
            name_match = name_match | df["source_name"].astype(str).str.lower().str.contains(
                query,
                na=False,
                regex=False,
            )

        if country_col:
            country_match = df[country_col].astype(str).str.lower().str.contains(
                query,
                na=False,
                regex=False,
            )
            df = df[name_match | country_match]
        else:
            df = df[name_match]

    return df


def paginate_df(df, page: int, page_size: int):
    page = max(page, 1)
    page_size = max(min(page_size, 100), 1)

    total_count = len(df)
    total_pages = max((total_count + page_size - 1) // page_size, 1)

    if page > total_pages:
        page = total_pages

    start = (page - 1) * page_size
    end = start + page_size

    return df.iloc[start:end], total_count, total_pages, page


def format_results(df, name_col, country_col, rank_col, score_col=None):
    results = []

    for current_index, (_, row) in enumerate(df.iterrows(), start=1):
        personalized_score = None

        if score_col and score_col in row:
            personalized_score = round(float(row[score_col]), 4)

        results.append(
            {
                "university_id": row.get("university_id", ""),
                "name": row.get(name_col, ""),
                "country": row.get(country_col, "") if country_col else "",
                "official_rank": row.get(rank_col, ""),
                "official_rank_number": int(row["_rank_numeric"]),
                "current_rank": current_index,
                "personalized_score": personalized_score,
                "raw": row.to_dict(),
            }
        )

    return results
