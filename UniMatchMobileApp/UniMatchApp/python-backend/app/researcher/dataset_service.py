from pathlib import Path
import re

import pandas as pd
from fastapi import HTTPException

from app.config.ranking_config import COLUMN_MAP, DATASET_METRICS
from app.matching.university_matcher import apply_display_names
from app.preprocessing.arwu_preprocessor import ARWUPreprocessor
from app.preprocessing.the_preprocessor import THEPreprocessor
from app.preprocessing.utils import (
    clean_text_columns,
    convert_numeric_series,
    create_university_id,
    min_max_normalize,
    standardize_column_names,
)
from app.services.ranking_service import (
    apply_country_and_search,
    clean_rank_value,
    find_column,
    paginate_df,
    prepare_dataset,
)

RESEARCHER_DATA_DIR = Path("data/researcher")

# Editions already used by the original Student/current ranking pipeline.
# They stay available even when that year is not duplicated inside data/researcher.
CURRENT_YEARS = {
    "the": 2024,
    "arwu": 2025,
}

PREPROCESSORS = {
    "the": (THEPreprocessor, "data/raw/the.csv"),
    "arwu": (ARWUPreprocessor, "data/raw/arwu.csv"),
}

# Published composite score is display-only; it is never offered as a
# researcher weight because the component indicators already form that score.
OVERALL_SCORE_COLUMN = {
    "qs": "Overall_Score",
    "the": "scores_overall",
    "arwu": "Total_Score",
}


def available_years(dataset: str) -> list[int]:
    dataset = dataset.lower()
    if dataset not in DATASET_METRICS:
        raise HTTPException(status_code=400, detail="Invalid dataset")

    years = set(_historical_files(dataset).keys())
    current_year = CURRENT_YEARS.get(dataset)
    if current_year:
        years.add(current_year)

    if not years:
        raise HTTPException(
            status_code=404,
            detail=f"No researcher datasets are available for {dataset.upper()}",
        )

    return sorted(years, reverse=True)


def load_researcher_dataset(dataset: str, year: int | None):
    dataset = dataset.lower()
    years = available_years(dataset)
    selected_year = year or years[0]

    if selected_year not in years:
        raise HTTPException(
            status_code=400,
            detail=f"{dataset.upper()} {selected_year} dataset is not available",
        )

    # A year-specific researcher file always wins. This keeps adding another
    # edition as simple as dropping e.g. the_2028.csv into its dataset folder.
    if selected_year in _historical_files(dataset):
        return _load_historical_dataset(dataset, selected_year), selected_year, years

    if CURRENT_YEARS.get(dataset) == selected_year:
        return _load_current_dataset(dataset), selected_year, years

    raise HTTPException(
        status_code=404,
        detail=f"{dataset.upper()} {selected_year} researcher dataset not found",
    )


def build_dataset_response(
    dataset: str,
    year: int | None,
    country: str | None,
    search: str | None,
    page: int,
    page_size: int,
):
    dataset = dataset.lower()
    view, selected_year, years = load_researcher_dataset(dataset, year)

    df = apply_country_and_search(
        view["df"],
        view["country_col"],
        view["name_col"],
        country,
        search,
    )

    paged_df, total_count, total_pages, current_page = paginate_df(
        df, page, page_size
    )

    countries = []
    country_col = view["country_col"]
    if country_col:
        countries = sorted(
            view["df"][country_col]
            .dropna()
            .astype(str)
            .str.strip()
            .loc[lambda values: values != ""]
            .unique()
            .tolist()
        )

    return {
        "dataset": dataset.upper(),
        "year": selected_year,
        "available_years": years,
        "page": int(current_page),
        "page_size": int(page_size),
        "total_count": int(total_count),
        "total_pages": int(total_pages),
        "summary": {
            "total_universities": int(len(view["df"])),
            "total_countries": int(len(countries)),
            "total_parameters": int(len(view["metrics"])),
            "edition": selected_year,
        },
        "countries": countries,
        "metrics": view["metrics"],
        "results": _format_rows(dataset, paged_df, view),
    }


def _historical_files(dataset: str) -> dict[int, Path]:
    folder = RESEARCHER_DATA_DIR / dataset
    if not folder.exists():
        return {}

    files = {}
    pattern = re.compile(re.escape(dataset) + r"_(\d{4})\.csv$", re.IGNORECASE)

    for path in folder.glob("*.csv"):
        match = pattern.fullmatch(path.name)
        if match:
            files[int(match.group(1))] = path

    return files


def _read_csv(path: Path) -> pd.DataFrame:
    try:
        return pd.read_csv(path, encoding="utf-8")
    except UnicodeDecodeError:
        return pd.read_csv(path, encoding="latin1")


def _load_historical_dataset(dataset: str, year: int):
    path = _historical_files(dataset).get(year)
    if path is None:
        raise HTTPException(
            status_code=404,
            detail=f"{dataset.upper()} {year} researcher dataset not found",
        )

    df = clean_text_columns(standardize_column_names(_read_csv(path))).drop_duplicates()
    name_col = find_column(df, COLUMN_MAP[dataset]["name"])
    country_col = find_column(df, COLUMN_MAP[dataset]["country"])
    rank_col = find_column(df, COLUMN_MAP[dataset]["rank"])

    if not name_col or not rank_col:
        raise HTTPException(
            status_code=500,
            detail=f"{dataset.upper()} {year} is missing its university name or rank column",
        )

    df["_rank_numeric"] = df[rank_col].apply(clean_rank_value)
    df = df.dropna(subset=["_rank_numeric"]).copy()
    df["_rank_numeric"] = df["_rank_numeric"].astype(int)
    df = df.sort_values("_rank_numeric", ascending=True)

    df["university_id"] = df.apply(
        lambda row: create_university_id(
            dataset_name=f"{dataset}_{year}",
            row=row,
            name_col=name_col,
            country_col=country_col,
        ),
        axis=1,
    )
    df = apply_display_names(df, name_col, country_col)

    # Keep each ranking's methodology separate. Only indicators defined for
    # that ranking and actually present in this edition are exposed.
    metrics = [metric for metric in DATASET_METRICS[dataset] if metric in df.columns]
    if not metrics:
        raise HTTPException(
            status_code=500,
            detail=f"No supported {dataset.upper()} indicators found in {year}",
        )

    normalized = {}
    for metric in metrics:
        original = convert_numeric_series(df[metric])
        original = original.where(original.between(0, 100))
        df[metric] = original

        valid = original.dropna()
        if valid.empty:
            normalized[metric] = pd.Series(index=df.index, dtype="float64")
            continue

        normalized_series = min_max_normalize(original)
        normalized[metric] = normalized_series.where(original.notna())

    overall_col = OVERALL_SCORE_COLUMN.get(dataset)
    if overall_col and overall_col in df.columns:
        # THE publishes score bands for many tied ranks. Those bands are not
        # invented into a single number; they remain unavailable numerically.
        df[overall_col] = convert_numeric_series(df[overall_col])
    else:
        overall_col = None

    return {
        "df": df,
        "name_col": name_col,
        "country_col": country_col,
        "rank_col": rank_col,
        "normalized": normalized,
        "metrics": metrics,
        "overall_col": overall_col,
        "historical": True,
    }


def _load_current_dataset(dataset: str):
    df, name_col, country_col, rank_col = prepare_dataset(dataset)
    overall_col = OVERALL_SCORE_COLUMN.get(dataset)
    range_columns = list(DATASET_METRICS[dataset])
    if overall_col and overall_col in df.columns:
        range_columns.append(overall_col)
    else:
        overall_col = None

    ranges = _metric_ranges(dataset, range_columns)

    return {
        "df": df,
        "name_col": name_col,
        "country_col": country_col,
        "rank_col": rank_col,
        "ranges": ranges,
        "metrics": DATASET_METRICS[dataset],
        "overall_col": overall_col,
        "historical": False,
    }


def raw_metric_values(dataset: str, columns: list[str]) -> pd.DataFrame:
    """
    Indicator values exactly as published, before preprocessing fills empty
    cells with the median. Rows go through the same cleaning/de-duplication
    steps as the preprocessor, so row i here is row i of the processed CSV.
    """
    preprocessor_class, input_path = PREPROCESSORS[dataset]
    preprocessor = preprocessor_class(input_path, "", dataset)

    raw_df = clean_text_columns(standardize_column_names(preprocessor.load_csv()))
    raw_df = raw_df.drop_duplicates()

    duplicate_subset = [
        column
        for column in preprocessor.get_duplicate_subset()
        if column in raw_df.columns
    ]
    if duplicate_subset:
        raw_df = raw_df.drop_duplicates(subset=duplicate_subset, keep="first")

    raw_df = raw_df.reset_index(drop=True)
    return pd.DataFrame(
        {
            metric: convert_numeric_series(raw_df[metric])
            for metric in columns
            if metric in raw_df.columns
        },
        index=raw_df.index,
    )


def _metric_ranges(dataset: str, columns: list[str]):
    ranges = {}
    for metric, values in raw_metric_values(dataset, columns).items():
        values = values.dropna()
        if not values.empty:
            ranges[metric] = (float(values.min()), float(values.max()))

    return ranges


def _format_rows(dataset: str, df: pd.DataFrame, view: dict):
    results = []
    overall_col = view.get("overall_col")

    for index, row in df.iterrows():
        indicators = {}

        overall_score = None
        if overall_col:
            if view["historical"]:
                overall_score = _number(row.get(overall_col))
            else:
                normalized_overall = _number(row.get(overall_col))
                if normalized_overall is not None and overall_col in view["ranges"]:
                    minimum, maximum = view["ranges"][overall_col]
                    overall_score = minimum + normalized_overall * (maximum - minimum)

        for metric in view["metrics"]:
            if view["historical"]:
                original = _number(row.get(metric))
                normalized_series = view["normalized"].get(metric)
                normalized = (
                    _number(normalized_series.get(index))
                    if normalized_series is not None
                    else None
                )
            else:
                normalized = _number(row.get(metric))
                original = None

                if normalized is not None and metric in view["ranges"]:
                    minimum, maximum = view["ranges"][metric]
                    original = minimum + normalized * (maximum - minimum)

            indicators[metric] = {
                "original": round(original, 2) if original is not None else None,
                "normalized": round(normalized, 4) if normalized is not None else None,
            }

        results.append(
            {
                "university_id": _safe_raw(row.get("university_id")) or "",
                "name": _safe_raw(row.get(view["name_col"])) or "",
                "country": (_safe_raw(row.get(view["country_col"])) or "")
                if view["country_col"]
                else "",
                "official_rank": _safe_raw(row.get(view["rank_col"])) or "",
                "previous_rank": _safe_raw(row.get("Previous_Rank"))
                if dataset == "qs" and view["historical"]
                else None,
                "overall_score": round(overall_score, 2)
                if overall_score is not None
                else None,
                "indicators": indicators,
            }
        )

    return results


def _number(value):
    try:
        if pd.isna(value):
            return None
        return float(value)
    except (TypeError, ValueError):
        return None


def _safe_raw(value):
    """Pass a value through unchanged, but turn NaN into None."""
    try:
        if pd.isna(value):
            return None
    except (TypeError, ValueError):
        pass
    return value
