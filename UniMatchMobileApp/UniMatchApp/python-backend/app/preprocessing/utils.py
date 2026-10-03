import hashlib
import re
import pandas as pd
import numpy as np


def standardize_column_names(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    cleaned = []
    for col in df.columns:
        col = str(col).strip()
        col = re.sub(r"\s+", "_", col)
        col = re.sub(r"[^\w_]", "", col)
        cleaned.append(col)
    df.columns = cleaned
    return df


def clean_text_value(value):
    if pd.isna(value):
        return np.nan

    value = str(value).strip()
    if value.lower() in {"", "n/a", "na", "null", "none", "-"}:
        return np.nan

    value = re.sub(r"\s+", " ", value)
    return value


def clean_text_columns(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    object_cols = df.select_dtypes(include=["object"]).columns
    for col in object_cols:
        df[col] = df[col].apply(clean_text_value)
    return df


def convert_numeric_series(series: pd.Series) -> pd.Series:
    return pd.to_numeric(
        series.astype(str)
        .str.replace(",", "", regex=False)
        .str.replace("%", "", regex=False)
        .str.strip(),
        errors="coerce",
    )


def create_university_id(dataset_name: str, row: pd.Series, name_col: str, country_col: str = None, city_col: str = None) -> str:
    name = str(row.get(name_col, "") or "").strip().lower()
    country = str(row.get(country_col, "") or "").strip().lower() if country_col else ""
    city = str(row.get(city_col, "") or "").strip().lower() if city_col else ""

    raw_key = f"{dataset_name}|{name}|{country}|{city}"
    hash_part = hashlib.md5(raw_key.encode("utf-8")).hexdigest()[:10]
    return f"{dataset_name}_{hash_part}"


def min_max_normalize(series: pd.Series) -> pd.Series:
    min_val = series.min()
    max_val = series.max()

    if pd.isna(min_val) or pd.isna(max_val) or min_val == max_val:
        return pd.Series([0.0] * len(series), index=series.index)

    return (series - min_val) / (max_val - min_val)