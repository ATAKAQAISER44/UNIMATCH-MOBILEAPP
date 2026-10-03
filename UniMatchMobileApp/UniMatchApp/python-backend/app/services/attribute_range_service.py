import re
from pathlib import Path
import pandas as pd

from app.services.data_cache import file_version, get_cached

FILE_PATH = Path("data/processed/university_attributes_processed.csv")


def normalize_key(value):
    return re.sub(r"[^a-z0-9]+", "", str(value or "").strip().lower())


def find_column(df, possible_names):
    normalized_cols = {normalize_key(col): col for col in df.columns}

    for name in possible_names:
        key = normalize_key(name)
        if key in normalized_cols:
            return normalized_cols[key]

    for name in possible_names:
        key = normalize_key(name)
        for normalized_col, actual_col in normalized_cols.items():
            if key and (key in normalized_col or normalized_col in key):
                return actual_col

    return None


def get_attribute_ranges():
    if not FILE_PATH.exists():
        return {"error": "university_attributes_processed.csv not found"}

    # PERF: read once; re-read automatically when the CSV file changes.
    df = get_cached(
        ("attribute_ranges_source",),
        file_version(FILE_PATH),
        lambda: pd.read_csv(FILE_PATH),
    )

    column_map = {
        "tuition_fee_international": [
            "Tuition (International)",
            "Tuition_International",
            "tuition_international",
            "tuition_fee_international",
            "international_tuition_fee",
            "tuition international",
            "international_fee",
        ],
        "tuition_fee_local": [
            "Tuition (Local/Domestic)",
            "Tuition_LocalDomestic",
            "tuition_local_domestic",
            "tuition_fee_local",
            "local_tuition_fee",
            "tuition_local",
            "local_fee",
        ],
        "living_cost": [
            "Living Cost (Annual)",
            "Living_Cost_Annual",
            "living_cost_annual",
            "living_cost",
            "cost_of_living",
        ],
        "cgpa_requirement": [
            "Minimum CGPA Requirement",
            "Minimum_CGPA_Requirement",
            "minimum_cgpa_requirement",
            "cgpa_requirement",
            "minimum_cgpa",
            "min_cgpa",
        ],
    }

    ranges = {}

    for output_key, possible_names in column_map.items():
        actual_col = find_column(df, possible_names)
        if not actual_col:
            continue

        series = pd.to_numeric(
            df[actual_col].astype(str).str.replace(",", "", regex=False).str.strip(),
            errors="coerce",
        ).dropna()

        if not series.empty:
            ranges[output_key] = {
                "min": float(series.min()),
                "max": float(series.max()),
                "source_column": actual_col,
            }

    return ranges
