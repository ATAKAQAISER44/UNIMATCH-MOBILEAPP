"""
Policymaker - a country's higher-education system compared with its region
and the world. Rankings (counts in top tiers, best university, indicator
medians, trend) and attributes (fees, living cost, admission, support) are
reported separately and never combined.
"""

from functools import lru_cache

import pandas as pd
from fastapi import HTTPException

from app.administrator.performance_service import _round, latest_edition
from app.administrator.profile_service import NUMERIC
from app.administrator.profile_service import _load as load_attributes
from app.matching.university_matcher import country_key
from app.researcher.dataset_service import available_years, load_researcher_dataset
from app.researcher.university_journey_service import JOURNEY_DATASETS

TIERS = [100, 200, 500, 1000]


@lru_cache(maxsize=1)
def _regions() -> dict:
    """country_key -> region, from the attributes dataset."""
    df = load_attributes()[0]
    keys = df["Country"].map(country_key)
    return {k: g.mode().iloc[0] for k, g in df["Region"].groupby(keys) if k and not g.mode().empty}


def _ranking_stats(df, values, metrics, mask) -> dict:
    rows = df[mask]
    ranks = rows["_rank_numeric"]
    best = rows.iloc[ranks.to_numpy().argmin()] if len(rows) else None  # by position: indexes may repeat
    return {
        "count": int(len(rows)),
        "tiers": {str(t): int((ranks <= t).sum()) for t in TIERS},
        "best_rank": int(ranks.min()) if len(rows) else None,
        "median_rank": _round(ranks.median()) if len(rows) else None,
        "best_university": best is not None and str(best.get("_name", "")) or None,
        "indicators": {m: _round(values[m].reindex(rows.index).median()) for m in metrics if m in values},
    }


def _ranking_view(dataset: str):
    view, year, values = latest_edition(dataset)
    df = view["df"]
    df = df[df[view["name_col"]].notna() & (df[view["name_col"]].astype(str).str.strip() != "")].copy()  # rows without a university
    df["_name"] = df[view["name_col"]]
    df["_country"] = df[view["country_col"]].map(country_key)
    df["_region"] = df["_country"].map(_regions())
    return view, year, values, df


def _attribute_stats(df) -> dict:
    yes = lambda column: _round((df[column].str.lower().str.startswith("yes")).mean() * 100) if len(df) else None
    return {
        "count": int(len(df)),
        "medians": {c: _round(df[f"_{c}"].median()) for c in NUMERIC},
        "scholarship_share": yes("Scholarship (Yes/No)"),
        "public_share": _round((df["Public / Private"] == "Public").mean() * 100) if len(df) else None,
    }


def country_summary(country: str) -> dict:
    """Ranking and attribute summary of one country (used by overview and compare)."""
    key = country_key(country)
    rankings = {}
    for dataset in JOURNEY_DATASETS:
        view, year, values, df = _ranking_view(dataset)
        rankings[dataset] = {"year": year, **_ranking_stats(df, values, view["metrics"], df["_country"] == key)}
    attributes = load_attributes()[0]
    return {"country": country, "region": _regions().get(key),
            "rankings": rankings, "attributes": _attribute_stats(attributes[attributes["Country"].map(country_key) == key])}


def build_country_overview(country: str) -> dict:
    key = country_key(country)
    region = _regions().get(key)
    if not key:
        raise HTTPException(status_code=400, detail="A country is required")

    rankings = {}
    for dataset in JOURNEY_DATASETS:
        view, year, values, df = _ranking_view(dataset)
        scopes = {"country": df["_country"] == key, "region": df["_region"] == region, "world": pd.Series(True, index=df.index)}
        stats = {scope: _ranking_stats(df, values, view["metrics"], mask) for scope, mask in scopes.items()}
        neighbours = [
            {"country": g["_country"].iloc[0], "name": str(g[view["country_col"]].iloc[0]), "count": int(len(g)),
             "top_500": int((g["_rank_numeric"] <= 500).sum()), "best_rank": int(g["_rank_numeric"].min())}
            for _, g in df[scopes["region"]].groupby("_country")
        ]
        rankings[dataset] = {"year": year, "metrics": view["metrics"], **stats,
                             "region_countries": sorted(neighbours, key=lambda n: (-n["top_500"], n["best_rank"]))}

    trend = {}
    for dataset in JOURNEY_DATASETS:
        points = []
        for year in sorted(available_years(dataset)):
            view, _year, _years = load_researcher_dataset(dataset, year)
            ranks = view["df"].loc[view["df"][view["country_col"]].map(country_key) == key, "_rank_numeric"]
            points.append({"year": year, "count": int(len(ranks)), "top_500": int((ranks <= 500).sum()),
                           "rank": int(ranks.min()) if len(ranks) else None})
        trend[dataset] = points

    attributes = load_attributes()[0]
    keys = attributes["Country"].map(country_key)
    access = {scope: _attribute_stats(attributes[mask]) for scope, mask in
              {"country": keys == key, "region": attributes["Region"] == region, "world": keys != ""}.items()}

    if not any(rankings[d]["country"]["count"] for d in rankings) and not access["country"]["count"]:
        raise HTTPException(status_code=404, detail="No universities found for this country")

    return {"country": country, "region": region, "rankings": rankings, "trend": trend, "access": access}
