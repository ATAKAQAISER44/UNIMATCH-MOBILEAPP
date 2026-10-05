"""
Student - admission chances and total cost for chosen universities.

Chance (Safe / Match / Reach) compares the student's CGPA (4.0 scale) with the
university's minimum CGPA and looks at its acceptance rate. Cost = yearly
tuition (local fee in the student's own country, otherwise international)
plus yearly living cost, times the years of the intended degree. Values come
from the attributes dataset with their data status, so estimates show as such.
"""

import re

from app.administrator.profile_service import _load as load_attributes
from app.administrator.profile_service import find_attribute_row
from app.matching.university_matcher import country_key

YEARS = {"Bachelor": 4, "Master": 2, "MS leading to PhD": 5, "PhD": 4}
PKR_PER_USD = round(1 / 0.0036)  # same fixed rate as the data cleaning (scripts/fee_format.py)
SAFE_MARGIN, SAFE_ACCEPTANCE, REACH_ACCEPTANCE = 0.3, 50, 15


def _numbers(value) -> list[float]:
    return [float(n.replace(",", "")) for n in re.findall(r"\d[\d,]*(?:\.\d+)?", str(value or ""))]


def _range(value):
    numbers = _numbers(value)
    return (min(numbers), max(numbers)) if numbers else None


def student_gpa(academic: dict) -> float | None:
    """CGPA on a 4.0 scale: CGPA / its scale x 4, or percentage / 25."""
    score = (_numbers(academic.get("score_value")) or [None])[0]
    if score is None:
        return None
    if str(academic.get("score_type", "")).lower().startswith("percent"):
        return round(score / 25, 2)
    scale = (_numbers(academic.get("cgpa_scale")) or [4.0])[0]
    return round(score / scale * 4, 2) if scale else None


def admission_chance(gpa, min_cgpa, acceptance) -> tuple[str, str]:
    if gpa is None or (min_cgpa is None and acceptance is None):
        return "Unknown", "Not enough data to judge."
    margin = None if min_cgpa is None else round(gpa - min_cgpa, 2)
    if margin is not None and margin < 0:
        return "Reach", f"Your CGPA {gpa} is below the minimum {min_cgpa}."
    if acceptance is not None and acceptance < REACH_ACCEPTANCE:
        return "Reach", f"Only about {acceptance:g}% of applicants are admitted."
    safe_margin = margin is None or margin >= SAFE_MARGIN
    if safe_margin and (acceptance is None or acceptance >= SAFE_ACCEPTANCE):
        return "Safe", "Your CGPA is well above the minimum and admission is open." if margin is not None else f"About {acceptance:g}% of applicants are admitted."
    return "Match", "You meet the requirements, but admission is competitive."


def _plan_one(university: dict, profile: dict, gpa, years, status) -> dict:
    row = find_attribute_row(university.get("name", ""), university.get("country"))
    if row is None:
        return {**university, "available": False}

    home = country_key((profile.get("user") or {}).get("country"))
    fee_column = "Tuition Fee (local)" if home and home == country_key(row["Country"]) else "Tuition Fee (international)"
    fee, living = _range(row[fee_column]), _range(row["Living Cost"])
    min_cgpa = (_numbers(row["Minimum CGPA Requirement"]) or [None])[0]
    acceptance = (_numbers(row["Acceptance Rate"]) or [None])[0]
    chance, reason = admission_chance(gpa, min_cgpa, acceptance)

    financial = profile.get("financial") or {}
    budget = (_numbers(financial.get("max_tuition_fee")) or [None])[0]
    living_limit = (_numbers(financial.get("living_cost_tolerance")) or [None])[0]
    yearly = (fee[0] + living[0], fee[1] + living[1]) if fee and living else None

    # The listed tests are alternatives ("IELTS, TOEFL" = either), so one match is enough.
    required = {t.strip().lower() for t in re.split(r"[,/]", row["Standardized Test"]) if t.strip()} - {"none"}
    have = {str(t.get("test_name", "")).strip().lower() for t in profile.get("tests") or []}
    tests_ok = None if not required else bool(required & have)

    state = lambda column: status.get((row["Institution_Name"], column), ("",))[0]
    return {
        **university,
        "available": True,
        "name": row["Institution_Name"],
        "country": row["Country"],
        "chance": chance,
        "chance_reason": reason,
        "your_gpa": gpa,
        "min_cgpa": min_cgpa,
        "acceptance_rate": acceptance,
        "fee_type": "local" if fee_column.endswith("(local)") else "international",
        "yearly_fee": fee,
        "yearly_living": living,
        "yearly_total": yearly,
        "years": years,
        "total_cost": (yearly[0] * years, yearly[1] * years) if yearly else None,
        "fee_within_budget": None if not (fee and budget) else fee[0] <= budget,
        "living_within_limit": None if not (living and living_limit) else living[0] <= living_limit,
        "tests_required": row["Standardized Test"] or None,
        "tests_ok": tests_ok,
        "scholarship": row["Scholarship (Yes/No)"] or None,
        "scholarship_link": row["University ScholarShip webpage link"] or None,
        "website": row["University Official Website link "] or None,
        "data_status": {c: state(c) for c in [fee_column, "Living Cost", "Minimum CGPA Requirement", "Acceptance Rate"]},
    }


def build_student_plan(universities: list[dict], profile: dict) -> dict:
    academic = profile.get("academic") or {}
    degree = academic.get("intended_education_level") or "Bachelor"
    years = YEARS.get(degree, 4)
    gpa = student_gpa(academic)
    status = load_attributes()[1]
    return {
        "gpa": gpa,
        "degree": degree,
        "years": years,
        "pkr_per_usd": PKR_PER_USD,
        "rules": {"safe_margin": SAFE_MARGIN, "safe_acceptance": SAFE_ACCEPTANCE, "reach_acceptance": REACH_ACCEPTANCE},
        "universities": [_plan_one(u, profile, gpa, years, status) for u in universities[:50]],
    }
