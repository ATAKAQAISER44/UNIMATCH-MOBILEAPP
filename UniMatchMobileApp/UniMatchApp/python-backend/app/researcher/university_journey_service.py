import re

import pandas as pd
from fastapi import HTTPException

from app.researcher.dataset_service import available_years, load_researcher_dataset

JOURNEY_DATASETS = ["qs", "the", "arwu"]

_PARENTHETICAL = re.compile(r"\(.*?\)")
_NON_ALNUM = re.compile(r"[^a-z0-9 ]")
_WHITESPACE = re.compile(r"\s+")


def normalize_university_name(name: str) -> str:
    name = _PARENTHETICAL.sub(" ", str(name or ""))
    name = _NON_ALNUM.sub(" ", name.lower())
    return _WHITESPACE.sub(" ", name).strip()


def _overall_score_series(view: dict) -> pd.Series:
    """Vectorized overall-score lookup for every row in a loaded dataset view."""
    overall_col = view.get("overall_col")
    df = view["df"]

    if not overall_col or overall_col not in df.columns:
        return pd.Series(index=df.index, dtype="float64")

    if view["historical"]:
        return pd.to_numeric(df[overall_col], errors="coerce")

    normalized = pd.to_numeric(df[overall_col], errors="coerce")
    if overall_col not in view["ranges"]:
        return pd.Series(index=df.index, dtype="float64")

    minimum, maximum = view["ranges"][overall_col]
    return minimum + normalized * (maximum - minimum)


def find_university_row(view: dict, key: str):
    """The row of one university (by normalized name key) in a loaded dataset view, or None."""
    df = view["df"]
    matches = df[df[view["name_col"]].astype(str).map(normalize_university_name) == key]
    return None if matches.empty else matches.iloc[0]


def search_universities(query: str, limit: int = 15) -> list[dict]:
    query_key = normalize_university_name(query)
    if not query_key:
        return []

    seen: dict[str, dict] = {}

    for dataset in JOURNEY_DATASETS:
        years = available_years(dataset)
        view, _selected_year, _years = load_researcher_dataset(dataset, years[0])
        df = view["df"]
        name_col = view["name_col"]
        country_col = view["country_col"]

        normalized_names = df[name_col].astype(str).map(normalize_university_name)
        matches = df[normalized_names.str.contains(re.escape(query_key), na=False)]

        for _, row in matches.iterrows():
            name = str(row.get(name_col, "") or "").strip()
            key = normalize_university_name(name)

            if not key or key in seen:
                continue

            seen[key] = {
                "key": key,
                "name": name,
                "country": str(row.get(country_col, "") or "") if country_col else "",
            }

    results = sorted(seen.values(), key=lambda item: (len(item["name"]), item["name"]))
    return results[:limit]


def build_university_journey(key: str) -> dict:
    key = normalize_university_name(key)
    if not key:
        raise HTTPException(status_code=400, detail="A university key is required")

    display_name = None
    display_country = None
    datasets_out: dict[str, list[dict]] = {}

    for dataset in JOURNEY_DATASETS:
        points = []

        for year in available_years(dataset):
            view, selected_year, _years = load_researcher_dataset(dataset, year)
            name_col = view["name_col"]
            country_col = view["country_col"]

            row = find_university_row(view, key)
            if row is None:
                continue

            overall_score = _overall_score_series(view).get(row.name)
            rank_value = row.get("_rank_numeric")

            if display_name is None:
                display_name = str(row.get(name_col, "") or "").strip()
                display_country = (
                    str(row.get(country_col, "") or "") if country_col else ""
                )

            points.append(
                {
                    "year": selected_year,
                    "rank": int(rank_value) if pd.notna(rank_value) else None,
                    "overall_score": round(float(overall_score), 2)
                    if overall_score is not None and pd.notna(overall_score)
                    else None,
                }
            )

        points.sort(key=lambda point: point["year"])
        datasets_out[dataset] = points

    if display_name is None:
        raise HTTPException(
            status_code=404,
            detail="University not found in any ranking dataset",
        )

    return {
        "key": key,
        "name": display_name,
        "country": display_country,
        "datasets": datasets_out,
    }
