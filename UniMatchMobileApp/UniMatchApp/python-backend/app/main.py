from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from app.services.profile_smart_match_service import build_smart_matches, merge_with_attributes
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
from app.services.scoring_service import (
    compute_weighted_score,
    keep_allowed_weights,
)
from app.services.my_ranking_service import build_my_ranking_results
from app.researcher.router import router as researcher_router
from app.administrator.router import router as administrator_router
from app.policymaker.router import router as policymaker_router
from app.student.router import router as student_router

app = FastAPI(title="UniMatch Python Backend")
app.include_router(researcher_router)
app.include_router(administrator_router)
app.include_router(policymaker_router)
app.include_router(student_router)


def safely_merge_attributes(df, name_col):
    """
    Merge university attributes into ranking rows for UI-only display pages.
    If the attributes file is missing or one row cannot be merged, ranking APIs should still work.
    """
    try:
        return merge_with_attributes(df, name_col)
    except Exception as exc:
        print("ATTRIBUTE MERGE SKIPPED:", exc)
        return df



app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class SmartMatchRequest(BaseModel):
    profile: dict
    # 0 / None means return all profile-match results.
    # This removes the old hard 50-result cap.
    top_n: int | None = 0
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
    top_n: int | None = 0


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
    df, name_col, country_col, rank_col = prepare_dataset(dataset)
    df = safely_merge_attributes(df, name_col)

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
    df, name_col, country_col, rank_col = prepare_dataset(dataset)
    df = safely_merge_attributes(df, name_col)

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
    df, name_col, country_col, rank_col = prepare_dataset(dataset)

    # Profile Match must not be capped at 50.
    # Pagination is handled on the frontend, so backend returns all matched rows.
    results, empty_analysis = build_smart_matches(
        ranking_df=df,
        name_col=name_col,
        country_col=country_col,
        rank_col=rank_col,
        profile=request.profile,
        top_n=0,
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
