from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

from app.researcher.dataset_service import build_dataset_response
from app.researcher.statistics_service import build_statistics_response
from app.researcher.university_attributes_service import (
    build_attributes_explorer_response,
    find_university_attributes,
)
from app.researcher.university_journey_service import (
    build_university_journey,
    search_universities,
)
from app.researcher.weight_analysis_service import build_weight_analysis
from app.researcher.rank_stability_service import build_rank_stability

router = APIRouter(prefix="/researcher", tags=["Researcher"])


class WeightAnalysisRequest(BaseModel):
    year: int | None = None
    weights: dict = Field(default_factory=dict)
    top_n: int = 100


@router.get("/datasets/{dataset}")
def explore_dataset(
    dataset: str,
    year: int | None = Query(default=None),
    country: str | None = Query(default=None),
    search: str | None = Query(default=None),
    page: int = Query(default=1),
    page_size: int = Query(default=25),
):
    return build_dataset_response(
        dataset=dataset,
        year=year,
        country=country,
        search=search,
        page=page,
        page_size=page_size,
    )


@router.get("/statistics/{dataset}")
def dataset_statistics(
    dataset: str,
    year: int | None = Query(default=None),
    country: str | None = Query(default=None),
):
    return build_statistics_response(dataset=dataset, year=year, country=country)


@router.post("/weight-analysis/{dataset}")
def analyze_weights(dataset: str, request: WeightAnalysisRequest):
    return build_weight_analysis(
        dataset=dataset,
        year=request.year,
        weights=request.weights,
        top_n=request.top_n,
    )


class RankStabilityRequest(BaseModel):
    year: int | None = None
    weights: dict = Field(default_factory=dict)
    variation: float = 0.2
    runs: int = 500
    top_n: int = 100


@router.post("/weight-analysis/{dataset}/stability")
def analyze_rank_stability(dataset: str, request: RankStabilityRequest):
    return build_rank_stability(
        dataset=dataset,
        year=request.year,
        weights=request.weights,
        variation=request.variation,
        runs=request.runs,
        top_n=request.top_n,
    )


@router.get("/university-journey/search")
def search_university_journey(q: str = Query(default="")):
    return {"results": search_universities(q)}


@router.get("/university-journey")
def get_university_journey(key: str = Query(...)):
    return build_university_journey(key)


@router.get("/attributes/explore")
def explore_university_attributes(
    search: str | None = Query(default=None),
    country: str | None = Query(default=None),
    region: str | None = Query(default=None),
    public_private: str | None = Query(default=None),
    scholarship: str | None = Query(default=None),
    page: int = Query(default=1),
    page_size: int = Query(default=25),
):
    return build_attributes_explorer_response(
        search=search,
        country=country,
        region=region,
        public_private=public_private,
        scholarship=scholarship,
        page=page,
        page_size=page_size,
    )


@router.get("/attributes")
def get_university_attributes(
    name: str = Query(...),
    country: str | None = Query(default=None),
):
    attributes = find_university_attributes(name, country)

    if attributes is None:
        raise HTTPException(
            status_code=404,
            detail="No attribute data found for this university",
        )

    return attributes
