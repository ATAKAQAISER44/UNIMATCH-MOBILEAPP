import pandas as pd
import numpy as np


def min_max_normalize(series: pd.Series) -> pd.Series:
    min_val = series.min()
    max_val = series.max()

    if pd.isna(min_val) or pd.isna(max_val) or min_val == max_val:
        return pd.Series([0.0] * len(series), index=series.index)

    return (series - min_val) / (max_val - min_val)


def normalize_positive(series: pd.Series) -> pd.Series:
    return min_max_normalize(series)


def normalize_negative(series: pd.Series) -> pd.Series:
    return 1 - min_max_normalize(series)


def yes_no_to_score(value):
    if pd.isna(value):
        return 0
    value = str(value).strip().lower()
    if value in {"yes", "y", "true", "1"}:
        return 1
    if value in {"no", "n", "false", "0"}:
        return 0
    return 0


def categorical_match_score(user_value, university_value):
    if pd.isna(user_value) or pd.isna(university_value):
        return 0

    user_value = str(user_value).strip().lower()
    university_value = str(university_value).strip().lower()

    if user_value == university_value:
        return 1
    if user_value in university_value or university_value in user_value:
        return 0.5
    return 0