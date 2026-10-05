from fastapi import APIRouter, Query

from app.administrator.profile_service import _load as load_attributes
from app.policymaker.country_service import build_country_overview, country_summary

router = APIRouter(prefix="/policymaker", tags=["Policymaker"])


@router.get("/countries")
def countries():
    df = load_attributes()[0]
    return {"countries": sorted(c for c in df["Country"].unique() if c)}


@router.get("/country")
def country_overview(name: str = Query(...)):
    return build_country_overview(name)


@router.get("/compare")
def compare_countries(countries: str = Query(..., description="Country names separated by |")):
    return {"countries": [country_summary(c) for c in countries.split("|") if c][:4]}
