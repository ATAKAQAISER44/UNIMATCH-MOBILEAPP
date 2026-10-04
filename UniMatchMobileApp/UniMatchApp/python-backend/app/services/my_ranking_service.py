from pathlib import Path
import re
from typing import Any

import pandas as pd
from fastapi import HTTPException

from app.config.ranking_config import DATASET_METRICS
from app.matching.university_matcher import resolve_uni_id
from app.services.scoring_service import keep_allowed_weights

ATTRIBUTE_FILE = Path("data/processed/university_attributes_processed.csv")

# Frontend keys. Keep these names stable because React sends these exact keys.
ATTRIBUTE_LABELS = {
    "tuition_fee_score": "Tuition affordability",
    "tuition_fee_local_score": "Local tuition affordability",
    "tuition_fee_international_score": "International tuition affordability",
    "living_cost_score": "Living cost affordability",
    "scholarship_score": "Scholarship availability",
    "cgpa_requirement_score": "CGPA eligibility",
    "tests_score": "Standardized test match",
    "university_acceptance_test_score": "University acceptance test ease",
    "programs_score": "Program match",
    "degree_level_score": "Degree level match",
    "acceptance_rate_score": "Admission accessibility",
    "internship_score": "Internship availability",
    "part_time_job_score": "Part-time job option",
    "employability_rate_score": "Graduate employability",
    "language_score": "Language match",
    "public_private_score": "University type match",
    "gender_equality_score": "Gender equality",
    "country_score": "Preferred country match",
    "region_score": "Preferred region match",
}

CANONICAL_ATTRIBUTE_COLUMNS = {
    "university_name": [
        "Institution_Name",
        "institution_name",
        "institution name",
        "university_name",
        "university name",
        "university",
        "name",
        "institution",
    ],
    "country": ["Country", "country", "location_country"],
    "region": ["Region", "region", "continent"],
    "city": ["city", "City"],
    "tuition_fee_local": [
        "Tuition_Fee_local",
        "tuition_fee_local",
        "tuition fee local",
        "Tuition Fee local",
        "tuition_local",
        "local_tuition_fee",
        "tuition_local_domestic",
        "tuition domestic",
        "local_fee",
    ],
    "tuition_fee_international": [
        "Tuition_Fee_international",
        "tuition_fee_international",
        "tuition fee international",
        "Tuition Fee international",
        "tuition_international",
        "international_tuition_fee",
        "international_fee",
    ],
    "living_cost": [
        "Living_Cost",
        "living_cost",
        "living cost",
        "living_cost_annual",
        "cost_of_living",
    ],
    "scholarship": [
        "Scholarship_YesNo",
        "scholarship_yesno",
        "scholarship",
        "scholarships",
        "scholarship_available",
        "financial_aid",
    ],
    "scholarship_link": [
        "University_ScholarShip_webpage_link",
        "university_scholarship_webpage_link",
        "scholarship_link",
        "scholarship_webpage",
        "scholarship_url",
    ],
    "cgpa_requirement": [
        "Minimum_CGPA_Requirement",
        "minimum_cgpa_requirement",
        "cgpa_requirement",
        "minimum_cgpa",
        "min_cgpa",
        "gpa_requirement",
    ],
    "tests": [
        "Standardized_Test",
        "standardized_test",
        "standardized_tests",
        "tests",
        "test_required",
        "admission_tests",
        "ielts_toefl_gre",
    ],
    "university_acceptance_test": [
        "University_Acceptance_Test_YesNo",
        "university_acceptance_test_yesno",
        "acceptance_test",
        "university_acceptance_test",
        "entrance_test",
    ],
    "programs": [
        "Programmes_Offered",
        "programmes_offered",
        "programs",
        "programmes",
        "courses",
        "course_offered",
        "courses_offered",
        "subjects",
        "subjects_offered",
        "field_of_study",
    ],
    "degree_level": [
        "Degree_Level_offered",
        "degree_level_offered",
        "degree_level",
        "degree_levels",
        "degree_offered",
        "accepted_degree_level",
    ],
    "acceptance_rate": [
        "Acceptance_Rate",
        "acceptance_rate",
        "acceptance",
        "admission_rate",
    ],
    "internship": [
        "Internship_Available",
        "internship_available",
        "internship",
        "internships",
        "internship_opportunity",
    ],
    "part_time_job": [
        "PartTime_Job_Allowed",
        "parttime_job_allowed",
        "part_time_job",
        "part_time_allowed",
        "parttime_job",
        "part_time_work",
        "work_allowed",
    ],
    "employability_rate": [
        "Graduate_Employability_Rate",
        "graduate_employability_rate",
        "employability_rate",
        "employment_rate",
        "graduate_employment_rate",
    ],
    "language": [
        "Language",
        "language",
        "teaching_language",
        "instruction_language",
        "medium_of_instruction",
    ],
    "public_private": [
        "Public__Private",
        "public_private",
        "university_type",
        "institution_type",
        "type",
    ],
    "gender_equality": [
        "Gender_Equality",
        "gender_equality",
        "gender_equality_score",
        "male_to_female_ratio",
        "female_male_ratio",
        "gender_ratio",
    ],
    "official_website": [
        "University_Official_Website_link",
        "university_official_website_link",
        "official_website",
        "website",
        "university_website",
    ],
}

RAW_ATTRIBUTE_COLUMNS_FOR_UI = [
    "university_name",
    "country",
    "region",
    "city",
    "tuition_fee_local",
    "tuition_fee_international",
    "tuition_fee",
    "tuition_fee_type",
    "living_cost",
    "scholarship",
    "scholarship_link",
    "cgpa_requirement",
    "tests",
    "university_acceptance_test",
    "programs",
    "degree_level",
    "acceptance_rate",
    "internship",
    "part_time_job",
    "employability_rate",
    "language",
    "public_private",
    "gender_equality",
    "official_website",
]


def _clean_key(value: Any) -> str:
    return re.sub(r"[^a-z0-9]+", "", str(value or "").strip().lower())


def _find_existing_column(df: pd.DataFrame, possible_names: list[str]) -> str | None:
    normalized_cols = {_clean_key(col): col for col in df.columns}

    for name in possible_names:
        key = _clean_key(name)
        if key in normalized_cols:
            return normalized_cols[key]

    for name in possible_names:
        key = _clean_key(name)
        for normalized_col, actual_col in normalized_cols.items():
            if key and (key in normalized_col or normalized_col in key):
                return actual_col

    return None


def _canonicalize_attribute_columns(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    rename_map = {}

    for canonical, possible_names in CANONICAL_ATTRIBUTE_COLUMNS.items():
        actual = _find_existing_column(df, possible_names)
        if actual and actual != canonical:
            rename_map[actual] = canonical

    df = df.rename(columns=rename_map)

    for canonical in CANONICAL_ATTRIBUTE_COLUMNS.keys():
        if canonical not in df.columns:
            df[canonical] = pd.NA

    return df


def _is_missing(value: Any) -> bool:
    if value is None:
        return True

    try:
        if pd.isna(value):
            return True
    except Exception:
        pass

    text = str(value).strip().lower()

    return text in {
        "",
        "nan",
        "none",
        "null",
        "n/a",
        "na",
        "-",
        "not available",
    }


def _json_safe_value(value: Any, default=""):
    """
    FastAPI/Starlette JSONResponse cannot serialize NaN or Infinity.
    This helper converts pandas/numpy NaN, None, inf, and scalar numpy values
    into JSON-safe values before response is returned.
    """
    if value is None:
        return default

    try:
        if pd.isna(value):
            return default
    except Exception:
        pass

    if hasattr(value, "item"):
        try:
            value = value.item()
        except Exception:
            pass

    if isinstance(value, float):
        if pd.isna(value) or value == float("inf") or value == float("-inf"):
            return default

    return value


def _json_safe_float(value: Any, default=0.0) -> float:
    number = _safe_number(value, default)

    if number is None:
        return float(default)

    try:
        number = float(number)
    except (TypeError, ValueError):
        return float(default)

    if pd.isna(number) or number == float("inf") or number == float("-inf"):
        return float(default)

    return number


def _json_safe_int(value: Any, default=0) -> int:
    number = _json_safe_float(value, default)

    try:
        return int(number)
    except (TypeError, ValueError):
        return int(default)


def _safe_number(value: Any, default=None):
    if _is_missing(value):
        return default

    text = str(value).strip()
    text = (
        text.replace("$", "")
        .replace(",", "")
        .replace("%", "")
        .replace("USD", "")
        .replace("usd", "")
        .strip()
    )

    if ":" in text:
        parts = text.split(":")

        try:
            left = float(parts[0].strip())
            right = float(parts[1].strip())

            if right == 0:
                return default

            return left / right
        except Exception:
            return default

    match = re.search(r"-?\d+(?:\.\d+)?", text)

    if not match:
        return default

    try:
        return float(match.group())
    except Exception:
        return default


def _numeric_series(series: pd.Series) -> pd.Series:
    return series.apply(lambda value: _safe_number(value, None)).astype(float)


def _normalize_weights_first(
    raw_weights: dict,
    allowed_keys: set[str] | None = None,
) -> dict:
    cleaned = {}

    for key, value in (raw_weights or {}).items():
        if allowed_keys is not None and key not in allowed_keys:
            continue

        try:
            number = float(value)
        except (TypeError, ValueError):
            number = 0.0

        if number > 0:
            cleaned[key] = number

    total = sum(cleaned.values())

    if total <= 0:
        return {}

    return {key: value / total for key, value in cleaned.items()}


def _lower_is_better(series: pd.Series) -> pd.Series:
    numeric = _numeric_series(series)
    min_val = numeric.min(skipna=True)
    max_val = numeric.max(skipna=True)

    if pd.isna(min_val) or pd.isna(max_val) or min_val == max_val:
        return pd.Series([0.5] * len(series), index=series.index)

    return ((max_val - numeric) / (max_val - min_val)).clip(0, 1).fillna(0.5)


def _higher_is_better(series: pd.Series) -> pd.Series:
    numeric = _numeric_series(series)
    min_val = numeric.min(skipna=True)
    max_val = numeric.max(skipna=True)

    if pd.isna(min_val) or pd.isna(max_val) or min_val == max_val:
        return pd.Series([0.5] * len(series), index=series.index)

    return ((numeric - min_val) / (max_val - min_val)).clip(0, 1).fillna(0.5)


def _gender_equality_score(series: pd.Series) -> pd.Series:
    numeric = _numeric_series(series)

    if numeric.dropna().empty:
        return pd.Series([0.5] * len(series), index=series.index)

    distance = (numeric - 1.0).abs()
    max_distance = distance.max(skipna=True)

    if pd.isna(max_distance) or max_distance == 0:
        return pd.Series([1.0] * len(series), index=series.index)

    return (1 - distance / max_distance).clip(0, 1).fillna(0.5)


def _yes_no_score(value: Any) -> float:
    if _is_missing(value):
        return 0.5

    text = str(value).strip().lower()

    if text in {"yes", "y", "true", "1", "available", "allowed", "offered"}:
        return 1.0

    if text in {
        "no",
        "n",
        "false",
        "0",
        "not available",
        "not allowed",
        "not offered",
    }:
        return 0.0

    return 0.5


def _split_values(value: Any) -> list[str]:
    if _is_missing(value):
        return []

    parts = re.split(r"[,;/|]+", str(value).lower())

    return [
        p.strip()
        for p in parts
        if p.strip() and p.strip() not in {"nan", "none", "null", "n/a", "na", "-"}
    ]


def _profile_value(profile: dict, *paths):
    for path in paths:
        current = profile or {}
        found = True

        for key in path:
            if isinstance(current, dict) and key in current:
                current = current.get(key)
            else:
                found = False
                break

        if found and not _is_missing(current):
            return current

    return None


def _profile_home_country(profile: dict):
    return _profile_value(
        profile,
        ("user", "country"),
        ("user_profile", "country"),
        ("profile", "country"),
        ("personal", "country"),
        ("basic", "country"),
        ("country",),
    )


def _same_country(left: Any, right: Any) -> bool:
    left_key = _clean_key(left)
    right_key = _clean_key(right)
    return bool(left_key and right_key and left_key == right_key)


def _choose_tuition_fee_value(row: pd.Series, home_country: Any):
    university_country = row.get("country")

    if _same_country(home_country, university_country):
        return row.get("tuition_fee_local"), "local"

    return row.get("tuition_fee_international"), "international"


def _profile_tests(profile: dict) -> list[str]:
    tests = (
        _profile_value(profile, ("tests",), ("academic", "tests"), ("test_scores",))
        or []
    )

    if isinstance(tests, list):
        result = []

        for item in tests:
            if isinstance(item, dict):
                result.append(
                    item.get("test_name") or item.get("test") or item.get("name")
                )
            else:
                result.append(item)

        return [str(x).strip().lower() for x in result if not _is_missing(x)]

    return _split_values(tests)


def _contains_match(user_value: Any, university_value: Any) -> float:
    user_values = user_value if isinstance(user_value, list) else _split_values(user_value)
    uni_values = _split_values(university_value)

    if not user_values or not uni_values:
        return 0.5

    for user_item in user_values:
        user_item = str(user_item).strip().lower()

        for uni_item in uni_values:
            if user_item == uni_item or user_item in uni_item or uni_item in user_item:
                return 1.0

    return 0.0


def _degree_score(user_degree: Any, uni_degree_value: Any) -> float:
    uni_items = [str(item or "").strip().lower().replace("’", "'") for item in _split_values(uni_degree_value)]
    user_degree = str(user_degree or "").strip().lower().replace("’", "'")

    if not user_degree or not uni_items:
        return 0.5

    def compact(value: str) -> str:
        return "".join(ch for ch in value if ch.isalnum())

    compact_items = {compact(item) for item in uni_items}
    uni_text = " ".join(uni_items)

    has_bs = any(
        item in compact_items
        for item in {"b", "ba", "bs", "bsc", "bed", "beng", "bcom", "honours", "honors"}
    ) or any(term in uni_text for term in ["bachelor", "undergraduate"])

    has_ms = any(
        item in compact_items
        for item in {"m", "ma", "ms", "msc", "mba", "mphil"}
    ) or any(term in uni_text for term in ["master", "postgraduate", "graduate"])

    has_phd = any(
        item in compact_items
        for item in {"phd", "dphil", "dba"}
    ) or any(term in uni_text for term in ["doctoral", "doctorate"])

    compact_user_degree = compact(user_degree)

    if ("leading" in user_degree and "phd" in user_degree) or compact_user_degree == "integratedmsphd":
        return (0.7 if has_ms else 0.0) + (0.3 if has_phd else 0.0)

    if (
        compact_user_degree in {"b", "ba", "bs", "bsc", "bed", "beng", "bcom", "honours", "honors"}
        or "bachelor" in user_degree
        or "undergraduate" in user_degree
    ):
        return 1.0 if has_bs else 0.0

    if (
        compact_user_degree in {"m", "ma", "ms", "msc", "mba", "mphil"}
        or "master" in user_degree
        or "postgraduate" in user_degree
        or user_degree == "graduate"
    ):
        return 1.0 if has_ms else 0.0

    if "phd" in user_degree or "doctor" in user_degree or compact_user_degree in {"dphil", "dba"}:
        return 1.0 if has_phd else 0.0

    return 0.5


def _standardized_test_score(profile: dict, university_tests: Any) -> float:
    user_tests = _profile_tests(profile)
    uni_tests = _split_values(university_tests)

    if user_tests:
        return _contains_match(user_tests, university_tests)

    if not uni_tests:
        return 1.0

    return 0.0


def _acceptance_test_score(university_value: Any) -> float:
    base = _yes_no_score(university_value)

    if base == 0.5:
        return 0.5

    return 1.0 - base


def _make_name_key(value: Any) -> str:
    return _clean_key(value)


def _make_full_key(name: Any, country: Any) -> str:
    # Matched universities share one id across QS/THE/ARWU/attributes.
    uni_id = resolve_uni_id(name, country)
    if uni_id:
        return uni_id
    return f"{_clean_key(name)}|{_clean_key(country)}"


def _display_label(key: str) -> str:
    return ATTRIBUTE_LABELS.get(
        key,
        key.replace("_score", "").replace("_", " ").title(),
    )


def load_attribute_dataset() -> pd.DataFrame:
    if not ATTRIBUTE_FILE.exists():
        raise HTTPException(
            status_code=404,
            detail="data/processed/university_attributes_processed.csv not found",
        )

    try:
        df = pd.read_csv(ATTRIBUTE_FILE, encoding="utf-8")
    except UnicodeDecodeError:
        df = pd.read_csv(ATTRIBUTE_FILE, encoding="latin1")

    df = _canonicalize_attribute_columns(df)
    df["_attr_name_key"] = df["university_name"].apply(_make_name_key)
    df["_attr_full_key"] = df.apply(
        lambda row: _make_full_key(row.get("university_name"), row.get("country")),
        axis=1,
    )

    return df


def build_attribute_scores(attribute_df: pd.DataFrame, profile: dict) -> pd.DataFrame:
    df = _canonicalize_attribute_columns(attribute_df).copy()

    user_gpa = _safe_number(
        _profile_value(
            profile,
            ("academic", "score_value"),
            ("academic", "gpa"),
            ("academic", "cgpa"),
            ("score_value",),
            ("gpa",),
            ("cgpa",),
        ),
        None,
    )

    user_program = _profile_value(
        profile,
        ("academic", "field_of_study"),
        ("academic", "program"),
        ("field_of_study",),
        ("program",),
        ("programs",),
    )

    user_degree = _profile_value(
        profile,
        ("academic", "intended_education_level"),
        ("academic", "intended_degree"),
        ("academic", "degree_level"),
        ("intended_education_level",),
        ("degree_level",),
    )

    user_language = _profile_value(profile, ("language",), ("academic", "language"))
    user_public_private = _profile_value(
        profile,
        ("public_private",),
        ("academic", "public_private"),
    )

    user_country = _profile_value(
        profile,
        ("geographic", "preferred_country"),
        ("geographic", "preferred_countries"),
        ("preferred_country",),
    )

    home_country = _profile_home_country(profile)

    user_region = _profile_value(
        profile,
        ("geographic", "preferred_region"),
        ("geographic", "preferred_regions"),
        ("region",),
        ("preferred_region",),
    )

    df["tuition_fee_local_score"] = _lower_is_better(df["tuition_fee_local"])
    df["tuition_fee_international_score"] = _lower_is_better(
        df["tuition_fee_international"]
    )
    df["living_cost_score"] = _lower_is_better(df["living_cost"])
    df["acceptance_rate_score"] = _higher_is_better(df["acceptance_rate"])
    df["employability_rate_score"] = _higher_is_better(df["employability_rate"])
    df["gender_equality_score"] = _gender_equality_score(df["gender_equality"])

    tuition_choice = df.apply(
        lambda row: _choose_tuition_fee_value(row, home_country),
        axis=1,
        result_type="expand",
    )
    df["tuition_fee"] = tuition_choice[0]
    df["tuition_fee_type"] = tuition_choice[1]

    home_country_match = df["country"].apply(
        lambda value: 1.0 if _same_country(home_country, value) else 0.0
    )
    df["tuition_fee_score"] = df["tuition_fee_international_score"]
    df.loc[home_country_match == 1.0, "tuition_fee_score"] = df.loc[
        home_country_match == 1.0,
        "tuition_fee_local_score",
    ]

    min_cgpa = _numeric_series(df["cgpa_requirement"])

    if user_gpa is None:
        df["cgpa_requirement_score"] = 0.5
    else:
        df["cgpa_requirement_score"] = (user_gpa / min_cgpa).clip(upper=1).fillna(
            0.5
        )

    df["scholarship_score"] = df["scholarship"].apply(_yes_no_score)
    df["internship_score"] = df["internship"].apply(_yes_no_score)
    df["part_time_job_score"] = df["part_time_job"].apply(_yes_no_score)
    df["tests_score"] = df["tests"].apply(
        lambda value: _standardized_test_score(profile, value)
    )
    df["university_acceptance_test_score"] = df[
        "university_acceptance_test"
    ].apply(_acceptance_test_score)
    df["programs_score"] = df["programs"].apply(
        lambda value: _contains_match(user_program, value)
    )
    df["degree_level_score"] = df["degree_level"].apply(
        lambda value: _degree_score(user_degree, value)
    )
    df["language_score"] = df["language"].apply(
        lambda value: _contains_match(user_language, value)
    )
    df["public_private_score"] = df["public_private"].apply(
        lambda value: _contains_match(user_public_private, value)
    )
    df["country_score"] = df["country"].apply(
        lambda value: _contains_match(user_country, value)
    )
    df["region_score"] = df["region"].apply(
        lambda value: _contains_match(user_region, value)
    )

    df["_attr_name_key"] = df["university_name"].apply(_make_name_key)
    df["_attr_full_key"] = df.apply(
        lambda row: _make_full_key(row.get("university_name"), row.get("country")),
        axis=1,
    )

    return df


def _make_ranking_breakdown(row: pd.Series, ranking_weights: dict) -> list[dict]:
    rows = []

    for key, weight in ranking_weights.items():
        score = _json_safe_float(row.get(key), 0.0)

        rows.append(
            {
                "key": key,
                "label": key.replace("_", " ").title(),
                "score": round(float(score), 4),
                "weight": round(float(weight), 4),
                "contribution": round(float(score) * float(weight), 4),
            }
        )

    return sorted(rows, key=lambda item: item["contribution"], reverse=True)


def _make_attribute_breakdown(row: pd.Series, attribute_weights: dict) -> list[dict]:
    rows = []

    for key, weight in attribute_weights.items():
        score = _safe_number(row.get(key), 0.5)

        if score is None:
            score = 0.5

        score = _json_safe_float(score, 0.5)
        raw_key = key.replace("_score", "")
        source_value = _json_safe_value(row.get(raw_key, ""), "")

        if key == "tuition_fee_score":
            tuition_type = _json_safe_value(row.get("tuition_fee_type", ""), "")
            if tuition_type:
                source_value = f"{source_value} ({tuition_type})" if source_value else tuition_type

        rows.append(
            {
                "key": key,
                "label": _display_label(key),
                "score": round(float(score), 4),
                "weight": round(float(weight), 4),
                "contribution": round(float(score) * float(weight), 4),
                "source_value": source_value,
            }
        )

    return sorted(rows, key=lambda item: item["contribution"], reverse=True)


def _make_explanation(
    ranking_breakdown: list[dict],
    attribute_breakdown: list[dict],
) -> list[str]:
    combined = sorted(
        ranking_breakdown + attribute_breakdown,
        key=lambda item: item["contribution"],
        reverse=True,
    )

    explanation = []

    for item in combined[:4]:
        score = float(item.get("score", 0.0))
        label = str(item.get("label", "factor")).lower()

        if score >= 0.75:
            explanation.append(f"Strong {label}")
        elif score >= 0.45:
            explanation.append(f"Moderate {label}")
        else:
            explanation.append(f"Lower {label}")

    return explanation


def _json_safe_dict(row: pd.Series) -> dict:
    safe = {}

    for key, value in row.to_dict().items():
        if key.startswith("_"):
            continue

        safe[key] = _json_safe_value(value, "")

    return safe


def _merge_ranking_with_attributes(
    ranking_df: pd.DataFrame,
    attr_scores: pd.DataFrame,
    name_col: str,
    country_col: str | None,
    attribute_score_cols: list[str],
) -> pd.DataFrame:
    df = ranking_df.copy().reset_index(drop=True)

    df["_rank_name_key"] = df[name_col].apply(_make_name_key)
    df["_rank_full_key"] = df.apply(
        lambda row: row.get("uni_id")
        if isinstance(row.get("uni_id"), str) and row.get("uni_id")
        else _make_full_key(
            row.get(name_col),
            row.get(country_col) if country_col else "",
        ),
        axis=1,
    )

    keep_cols = ["_attr_full_key", "_attr_name_key"] + attribute_score_cols
    keep_cols += [
        col for col in RAW_ATTRIBUTE_COLUMNS_FOR_UI if col in attr_scores.columns
    ]
    keep_cols = list(dict.fromkeys(keep_cols))
    keep_cols = [col for col in keep_cols if col in attr_scores.columns]

    attrs_full = (
        attr_scores[keep_cols]
        .drop_duplicates("_attr_full_key", keep="first")
        .copy()
    )

    merged = df.merge(
        attrs_full,
        left_on="_rank_full_key",
        right_on="_attr_full_key",
        how="left",
        suffixes=("", "_attr"),
    )

    existing_attribute_score_cols = [
        col for col in attribute_score_cols if col in merged.columns
    ]

    # Name fallbacks: the shown name first, then the name this ranking
    # originally used (before app/matching gave it a shared display name).
    name_key_cols = ["_rank_name_key"]
    if "source_name" in df.columns:
        df["_rank_source_name_key"] = df["source_name"].apply(_make_name_key)
        name_key_cols.append("_rank_source_name_key")

    for name_key_col in name_key_cols:
        if existing_attribute_score_cols:
            missing_mask = merged[existing_attribute_score_cols].isna().all(axis=1)
        elif attribute_score_cols:
            missing_mask = pd.Series(True, index=merged.index)
        else:
            missing_mask = pd.Series(False, index=merged.index)

        if not missing_mask.any():
            break

        attrs_name = (
            attr_scores[keep_cols]
            .drop_duplicates("_attr_name_key", keep="first")
            .copy()
        )

        missing_positions = missing_mask.to_numpy()
        fallback_source = df.loc[missing_positions].copy()

        fallback = fallback_source.merge(
            attrs_name,
            left_on=name_key_col,
            right_on="_attr_name_key",
            how="left",
            suffixes=("", "_attr"),
        )

        missing_indices = merged.index[missing_positions].tolist()

        for col in fallback.columns:
            if col in merged.columns and len(fallback[col].to_numpy()) == len(
                missing_indices
            ):
                merged.loc[missing_indices, col] = fallback[col].to_numpy()

    return merged


def build_my_ranking_results(
    dataset: str,
    ranking_df: pd.DataFrame,
    name_col: str,
    country_col: str | None,
    rank_col: str,
    profile: dict,
    ranking_importance: float,
    ranking_weights: dict,
    attribute_weights: dict,
    top_n: int = 50,
):
    dataset = dataset.lower()

    if dataset not in DATASET_METRICS:
        raise HTTPException(status_code=400, detail="Invalid dataset")

    try:
        ranking_importance_value = float(ranking_importance)
    except (TypeError, ValueError):
        ranking_importance_value = 50.0

    ranking_importance_value = max(0.0, min(ranking_importance_value, 100.0)) / 100.0
    attribute_importance_value = 1.0 - ranking_importance_value

    allowed_ranking_keys = set(DATASET_METRICS[dataset])
    cleaned_ranking_raw = keep_allowed_weights(
        ranking_weights or {},
        DATASET_METRICS[dataset],
    )

    allowed_attribute_keys = set(ATTRIBUTE_LABELS.keys())
    cleaned_attribute_raw = {
        key: value
        for key, value in (attribute_weights or {}).items()
        if key in allowed_attribute_keys
    }

    if ranking_importance_value > 0:
        normalized_ranking_weights = _normalize_weights_first(
            cleaned_ranking_raw,
            allowed_ranking_keys,
        )
    else:
        normalized_ranking_weights = {}

    if attribute_importance_value > 0:
        normalized_attribute_weights = _normalize_weights_first(
            cleaned_attribute_raw,
            allowed_attribute_keys,
        )
    else:
        normalized_attribute_weights = {}

    if ranking_importance_value > 0 and not normalized_ranking_weights:
        raise HTTPException(
            status_code=400,
            detail="Please select at least one ranking metric weight.",
        )

    if attribute_importance_value > 0 and not normalized_attribute_weights:
        raise HTTPException(
            status_code=400,
            detail="Please select at least one university attribute weight.",
        )

    df = ranking_df.copy().reset_index(drop=True)

    if normalized_ranking_weights:
        for col in normalized_ranking_weights.keys():
            if col not in df.columns:
                df[col] = 0.0

            df[col] = pd.to_numeric(df[col], errors="coerce")
            median_value = df[col].median()
            df[col] = df[col].fillna(0 if pd.isna(median_value) else median_value)

        df["ranking_score"] = 0.0

        for col, weight in normalized_ranking_weights.items():
            df["ranking_score"] += df[col] * weight
    else:
        df["ranking_score"] = 0.0

    selected_attribute_cols = list(normalized_attribute_weights.keys())

    if normalized_attribute_weights:
        attr_scores = build_attribute_scores(load_attribute_dataset(), profile or {})

        merged = _merge_ranking_with_attributes(
            df,
            attr_scores,
            name_col,
            country_col,
            selected_attribute_cols,
        )

        for col in selected_attribute_cols:
            if col not in merged.columns:
                merged[col] = 0.5

            merged[col] = pd.to_numeric(merged[col], errors="coerce").fillna(0.5)

        merged["attribute_score"] = 0.0

        for col, weight in normalized_attribute_weights.items():
            merged["attribute_score"] += merged[col] * weight
    else:
        merged = df.copy()
        merged["attribute_score"] = 0.0

    merged["final_score"] = (
        ranking_importance_value * merged["ranking_score"]
        + attribute_importance_value * merged["attribute_score"]
    )

    merged["final_score"] = pd.to_numeric(merged["final_score"], errors="coerce").fillna(
        0.0
    )
    merged["ranking_score"] = pd.to_numeric(
        merged["ranking_score"], errors="coerce"
    ).fillna(0.0)
    merged["attribute_score"] = pd.to_numeric(
        merged["attribute_score"], errors="coerce"
    ).fillna(0.0)

    merged = merged.sort_values(by="final_score", ascending=False).reset_index(drop=True)

    results = []

    for index, row in merged.iterrows():
        ranking_breakdown = _make_ranking_breakdown(row, normalized_ranking_weights)
        attribute_breakdown = _make_attribute_breakdown(
            row,
            normalized_attribute_weights,
        )

        top_factors = sorted(
            ranking_breakdown + attribute_breakdown,
            key=lambda item: item["contribution"],
            reverse=True,
        )[:5]

        country_value = row.get(country_col, "") if country_col else ""
        official_rank_value = row.get(rank_col, "")

        results.append(
            {
                "university_id": _json_safe_value(row.get("university_id", ""), ""),
                "name": _json_safe_value(row.get(name_col, ""), "University"),
                "country": _json_safe_value(country_value, ""),
                "official_rank": _json_safe_value(official_rank_value, ""),
                "official_rank_number": _json_safe_int(row.get("_rank_numeric", 0), 0),
                "current_rank": index + 1,
                "my_rank": index + 1,
                "ranking_score": round(
                    _json_safe_float(row.get("ranking_score", 0.0), 0.0),
                    4,
                ),
                "attribute_score": round(
                    _json_safe_float(row.get("attribute_score", 0.0), 0.0),
                    4,
                ),
                "final_score": round(
                    _json_safe_float(row.get("final_score", 0.0), 0.0),
                    4,
                ),
                "personalized_score": round(
                    _json_safe_float(row.get("final_score", 0.0), 0.0),
                    4,
                ),
                "top_factors": top_factors,
                "explanation": _make_explanation(
                    ranking_breakdown,
                    attribute_breakdown,
                ),
                "breakdown": {
                    "ranking_importance": round(ranking_importance_value, 4),
                    "attribute_importance": round(attribute_importance_value, 4),
                    "ranking": ranking_breakdown[:10],
                    "attributes": attribute_breakdown[:12],
                },
                "raw": _json_safe_dict(row),
            }
        )

    return results