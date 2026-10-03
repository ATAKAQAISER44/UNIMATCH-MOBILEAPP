
# app/main.py

import os
import time
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from app.services.data_cache import file_version, get_cached
from app.researcher.router import router as researcher_router
from app.services.profile_smart_match_service import (
    attributes_file_version,
    build_smart_matches,
    merge_with_attributes,
)
from app.services.custom_explore_service import (
    build_custom_explore_results,
    sort_result_cards,
)
from app.services.dataset_recommendation_service import recommend_dataset
from app.services.attribute_range_service import get_attribute_ranges
from app.config.ranking_config import (
    DATASET_FILES,
    COLUMN_MAP,
    DATASET_METRICS,
    DATASET_PUBLISHED,
)
from app.services.ranking_service import (
    load_dataset,
    prepare_dataset,
    apply_country_and_search,
    paginate_df,
    format_results,
    find_column,
)
from app.services.my_ranking_service import build_my_ranking_results

@asynccontextmanager
async def lifespan(_app):
    warm_up_dataset_cache()
    yield


app = FastAPI(title="UniMatch Python Backend", lifespan=lifespan)
app.include_router(researcher_router)

# Development timing logs: prints "[PERF] POST /rankings/qs/my-ranking 200 in 0.42s".
# Turn off with:  set UNIMATCH_PERF_LOGS=0   (Windows)  /  export UNIMATCH_PERF_LOGS=0
PERF_LOGS = os.getenv("UNIMATCH_PERF_LOGS", "1") != "0"


@app.middleware("http")
async def perf_timing_middleware(request: Request, call_next):
    start = time.perf_counter()
    response = await call_next(request)
    elapsed = time.perf_counter() - start

    if PERF_LOGS:
        print(
            f"[PERF] {request.method} {request.url.path} "
            f"{response.status_code} in {elapsed:.2f}s"
        )

    return response


def warm_up_dataset_cache():
    """
    PERF: load and prepare all ranking datasets once at startup, so the
    first request from the phone does not pay the CSV loading cost.
    Failures here are only logged; the endpoints still report errors normally.
    """
    start = time.perf_counter()

    for dataset in DATASET_FILES:
        try:
            df, name_col, _, _ = prepare_dataset(dataset)
            get_merged_dataset(dataset, df, name_col)
        except Exception as exc:
            print(f"[STARTUP] Could not preload {dataset}: {exc}")

    print(f"[STARTUP] Datasets cached in {time.perf_counter() - start:.2f}s")


def get_merged_dataset(dataset, prepared_df, name_col):
    """
    PERF: ranking rows merged with university attributes. The result only
    depends on the two CSV files, so it is cached (and rebuilt automatically
    if either file changes). Returns a copy that callers may modify.
    """
    version = (file_version(DATASET_FILES[dataset]), attributes_file_version())
    merged = get_cached(
        ("merged_dataset", dataset),
        version,
        lambda: merge_with_attributes(prepared_df, name_col),
    )
    return merged.copy()


def safely_merge_attributes(df, name_col, dataset=None):
    """
    Merge university attributes into ranking rows for UI-only display pages.
    If the attributes file is missing or one row cannot be merged,
    ranking APIs should still work.
    """
    try:
        if dataset:
            return get_merged_dataset(dataset, df, name_col)
        return merge_with_attributes(df, name_col)
    except Exception as exc:
        print("ATTRIBUTE MERGE SKIPPED:", exc)
        return df


# Mobile app / Expo Go friendly CORS.
# During development, allow all origins because Expo/mobile can use different LAN origins.
# For final production, replace ["*"] with your deployed frontend/mobile domains.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


class SmartMatchRequest(BaseModel):
    profile: dict
    top_n: int = 50
    sort_by: str = "official_rank"
    sort_order: str = "asc"

    ranking_importance: float = 50
    attribute_importance: float = 50
    ranking_weights: dict = Field(default_factory=dict)
    attribute_weights: dict = Field(default_factory=dict)


class CustomExploreRequest(BaseModel):
    filters: list[dict] = Field(default_factory=list)
    sort_by: str = "official_rank"
    sort_order: str = "asc"
    top_n: int = 50


class DatasetRecommendationRequest(BaseModel):
    degree: str
    priorities: list[str]


class MyRankingRequest(BaseModel):
    profile: dict = Field(default_factory=dict)
    ranking_importance: float = 50
    ranking_weights: dict = Field(default_factory=dict)
    attribute_weights: dict = Field(default_factory=dict)
    top_n: int = 50


@app.get("/")
def home():
    return {"message": "UniMatch Python Backend is running"}


@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "message": "UniMatch backend is reachable from mobile app",
    }


@app.get("/rankings/{dataset}/summary")
def get_dataset_summary(dataset: str):
    dataset = dataset.lower()

    if dataset not in DATASET_FILES:
        raise HTTPException(status_code=400, detail="Invalid dataset")

    df = load_dataset(dataset)
    country_col = find_column(df, COLUMN_MAP[dataset]["country"])

    total_universities = len(df)

    if country_col:
        countries = df[country_col].dropna().astype(str).str.strip()
        countries = countries[countries != ""]
        total_countries = countries.nunique()
    else:
        total_countries = 0

    return {
        "dataset": dataset.upper(),
        "total_universities": int(total_universities),
        "total_countries": int(total_countries),
        "total_parameters": len(DATASET_METRICS[dataset]),
        "published": DATASET_PUBLISHED.get(dataset, "May 2025"),
    }


@app.get("/rankings/{dataset}/export")
def export_rankings(
    dataset: str,
    country: str | None = Query(default=None),
    search: str | None = Query(default=None),
):
    dataset = dataset.lower()

    if dataset not in DATASET_FILES:
        raise HTTPException(status_code=400, detail="Invalid dataset")

    df, name_col, country_col, rank_col = prepare_dataset(dataset)
    df = safely_merge_attributes(df, name_col, dataset)

    df = apply_country_and_search(df, country_col, name_col, country, search)
    df = df.fillna("")

    return {
        "dataset": dataset.upper(),
        "count": len(df),
        "results": format_results(df, name_col, country_col, rank_col),
    }


@app.get("/rankings/{dataset}/countries")
def get_dataset_countries(dataset: str):
    dataset = dataset.lower()

    if dataset not in DATASET_FILES:
        raise HTTPException(status_code=400, detail="Invalid dataset")

    df = load_dataset(dataset)
    country_col = find_column(df, COLUMN_MAP[dataset]["country"])

    if not country_col:
        raise HTTPException(status_code=500, detail="Country column not found")

    countries = df[country_col].dropna().astype(str).str.strip()
    countries = countries[countries != ""]
    countries = sorted(countries.unique().tolist())

    return {
        "dataset": dataset.upper(),
        "countries": countries,
    }


@app.get("/rankings/{dataset}")
def get_rankings(
    dataset: str,
    country: str | None = Query(default=None),
    search: str | None = Query(default=None),
    page: int = Query(default=1),
    page_size: int = Query(default=50),
):
    dataset = dataset.lower()

    if dataset not in DATASET_FILES:
        raise HTTPException(status_code=400, detail="Invalid dataset")

    df, name_col, country_col, rank_col = prepare_dataset(dataset)
    df = safely_merge_attributes(df, name_col, dataset)

    df = apply_country_and_search(df, country_col, name_col, country, search)

    paged_df, total_count, total_pages, current_page = paginate_df(
        df,
        page,
        page_size,
    )

    paged_df = paged_df.fillna("")

    return {
        "dataset": dataset.upper(),
        "count": len(paged_df),
        "total_count": int(total_count),
        "page": int(current_page),
        "page_size": int(page_size),
        "total_pages": int(total_pages),
        "results": format_results(paged_df, name_col, country_col, rank_col),
    }


@app.post("/rankings/{dataset}/smart-match")
def smart_match(dataset: str, request: SmartMatchRequest):
    dataset = dataset.lower()

    if dataset not in DATASET_FILES:
        raise HTTPException(status_code=400, detail="Invalid dataset")

    df, name_col, country_col, rank_col = prepare_dataset(dataset)

    results, empty_analysis = build_smart_matches(
        ranking_df=df,
        name_col=name_col,
        country_col=country_col,
        rank_col=rank_col,
        profile=request.profile,
        top_n=request.top_n,
        merged_df=get_merged_dataset(dataset, df, name_col),
    )

    results = sort_result_cards(
        results=results,
        sort_by=request.sort_by,
        sort_order=request.sort_order,
    )

    return {
        "dataset": dataset.upper(),
        "count": len(results),
        "results": results,
        "empty_analysis": empty_analysis,
    }


@app.post("/rankings/{dataset}/custom-explore")
def custom_explore(dataset: str, request: CustomExploreRequest):
    dataset = dataset.lower()

    if dataset not in DATASET_FILES:
        raise HTTPException(status_code=400, detail="Invalid dataset")

    df, name_col, country_col, rank_col = prepare_dataset(dataset)

    results, empty_analysis = build_custom_explore_results(
        ranking_df=df,
        name_col=name_col,
        country_col=country_col,
        rank_col=rank_col,
        filters=request.filters,
        sort_by=request.sort_by,
        sort_order=request.sort_order,
        top_n=request.top_n,
        merged_df=get_merged_dataset(dataset, df, name_col),
    )

    return {
        "dataset": dataset.upper(),
        "count": len(results),
        "results": results,
        "empty_analysis": empty_analysis,
    }


@app.post("/rankings/{dataset}/my-ranking")
def my_ranking(dataset: str, request: MyRankingRequest):
    dataset = dataset.lower()

    if dataset not in DATASET_FILES:
        raise HTTPException(status_code=400, detail="Invalid dataset")

    df, name_col, country_col, rank_col = prepare_dataset(dataset)

    results = build_my_ranking_results(
        dataset=dataset,
        ranking_df=df,
        name_col=name_col,
        country_col=country_col,
        rank_col=rank_col,
        profile=request.profile,
        ranking_importance=request.ranking_importance,
        ranking_weights=request.ranking_weights,
        attribute_weights=request.attribute_weights,
        top_n=request.top_n,
    )

    return {
        "dataset": dataset.upper(),
        "count": len(results),
        "results": results,
    }


@app.post("/recommend-dataset")
def recommend_dataset_endpoint(request: DatasetRecommendationRequest):
    return recommend_dataset(
        degree=request.degree,
        priorities=request.priorities,
    )


@app.get("/profile-setup/ranges")
def fetch_profile_ranges():
    return get_attribute_ranges()