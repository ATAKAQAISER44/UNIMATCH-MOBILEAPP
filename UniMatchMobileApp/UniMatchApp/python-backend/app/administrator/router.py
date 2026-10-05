from fastapi import APIRouter, Query
from pydantic import BaseModel, Field

from app.administrator.performance_service import build_institution_performance
from app.administrator.benchmark_service import build_benchmark
from app.administrator.profile_service import build_institution_profile
from app.administrator.whatif_service import build_whatif

router = APIRouter(prefix="/administrator", tags=["University Administrator"])


@router.get("/performance")
def institution_performance(key: str = Query(...)):
    return build_institution_performance(key)


@router.get("/profile")
def institution_profile(name: str = Query(...), country: str | None = Query(default=None)):
    return build_institution_profile(name, country)


@router.get("/benchmark/{dataset}")
def institution_benchmark(
    dataset: str,
    key: str = Query(...),
    peers: str = Query(default="", description="Peer university keys separated by |"),
    target: int | None = Query(default=None),
):
    return build_benchmark(key, dataset.lower(), [p for p in peers.split("|") if p][:5], target)


class WhatIfRequest(BaseModel):
    key: str
    scenarios: list[dict] = Field(default_factory=list)


@router.post("/whatif/{dataset}")
def institution_whatif(dataset: str, request: WhatIfRequest):
    return build_whatif(request.key, dataset.lower(), request.scenarios)
