from pathlib import Path
import re
import pandas as pd

from app.services.data_cache import file_version, get_cached


import os

DEBUG_LOGS = os.getenv("UNIMATCH_DEBUG") == "1"

ATTRIBUTE_FILE = Path("data/processed/university_attributes_processed.csv")


REGION_COUNTRIES = {
    "asia": [
        "pakistan", "india", "china", "japan", "south korea", "malaysia",
        "singapore", "thailand", "indonesia", "philippines", "vietnam",
        "bangladesh", "sri lanka", "united arab emirates", "saudi arabia", "qatar",
        "hong kong", "taiwan",
    ],
    "europe": [
        "germany", "france", "united kingdom", "uk", "england", "scotland",
        "wales", "netherlands", "sweden", "norway", "denmark", "finland",
        "italy", "spain", "austria", "belgium", "switzerland", "ireland",
        "poland", "portugal", "greece", "czech republic", "hungary",
    ],
    "north america": [
        "united states", "usa", "us", "u.s.", "u.s.a.", "canada", "mexico",
    ],
    "south america": [
        "brazil", "argentina", "chile", "colombia", "peru", "uruguay",
    ],
    "australia": ["australia", "new zealand"],
    "africa": ["south africa", "egypt", "nigeria", "kenya", "morocco"],
}


def safe_value(value):
    if value is None:
        return None
    try:
        if pd.isna(value):
            return None
    except Exception:
        pass
    return value


def norm(value):
    if value is None:
        return ""
    try:
        if pd.isna(value):
            return ""
    except Exception:
        pass
    return str(value).strip().lower()


def normalize_column_name(value):
    value = str(value or "").strip().lower()
    value = re.sub(r"[^a-z0-9]+", "_", value)
    value = re.sub(r"_+", "_", value)
    return value.strip("_")


def find_col(df, possible_names):
    normalized_cols = {
        normalize_column_name(col): col
        for col in df.columns
    }

    for name in possible_names:
        key = normalize_column_name(name)
        if key in normalized_cols:
            return normalized_cols[key]

    return None


def parse_number(value):
    if value is None:
        return None

    try:
        if pd.isna(value):
            return None
    except Exception:
        pass

    text = str(value).strip()

    if text == "":
        return None

    text = (
        text.replace("$", "")
        .replace(",", "")
        .replace("USD", "")
        .replace("usd", "")
        .replace("%", "")
        .strip()
    )

    match = re.search(r"-?\d+(\.\d+)?", text)
    if not match:
        return None

    try:
        return float(match.group())
    except ValueError:
        return None


def safe_raw_dict(row):
    return {
        key: safe_value(value)
        for key, value in row.to_dict().items()
    }


def tokenize(value):
    text = norm(value)
    text = re.sub(r"[^a-z0-9]+", " ", text)
    return re.sub(r"\s+", " ", text).strip()


def get_first_available(row, possible_cols):
    for col in possible_cols:
        if col and col in row.index:
            value = row.get(col)
            if norm(value):
                return value
    return ""


def load_attribute_dataset():
    if not ATTRIBUTE_FILE.exists():
        raise FileNotFoundError("university_attributes_processed.csv not found")

    # PERF: read once, re-read only when the CSV file changes.
    cached = get_cached(
        ("smart_match_attributes",),
        file_version(ATTRIBUTE_FILE),
        lambda: pd.read_csv(ATTRIBUTE_FILE),
    )
    return cached.copy()


def attributes_file_version():
    return file_version(ATTRIBUTE_FILE)


def clean_join_name(value):
    value = norm(value)
    value = value.replace("&", "and")
    value = re.sub(r"\bthe\b", "", value)
    value = re.sub(r"[^a-z0-9]+", " ", value)
    value = re.sub(r"\s+", " ", value)
    return value.strip()


def merge_with_attributes(ranking_df, ranking_name_col=None):
    attr_df = load_attribute_dataset()

    attr_name_col = find_col(
        attr_df,
        [
            "Institution_Name",
            "Institution Name",
            "university_name",
            "university",
            "institution_name",
            "institution",
            "name",
            "University Name",
        ],
    )

    merged = ranking_df.copy()

    if "university_id" in ranking_df.columns and "university_id" in attr_df.columns:
        duplicate_cols = [
            col for col in attr_df.columns
            if col in ranking_df.columns and col != "university_id"
        ]

        attr_for_id = attr_df.drop(columns=duplicate_cols, errors="ignore")

        merged = ranking_df.merge(
            attr_for_id,
            on="university_id",
            how="left",
            suffixes=("", "_attr"),
        )

    if ranking_name_col and attr_name_col:
        ranking_temp = ranking_df.copy()
        attr_temp = attr_df.copy()

        ranking_temp["_join_name"] = ranking_temp[ranking_name_col].apply(clean_join_name)
        attr_temp["_join_name"] = attr_temp[attr_name_col].apply(clean_join_name)

        attr_temp = attr_temp.drop_duplicates(subset=["_join_name"])

        name_merged = ranking_temp.merge(
            attr_temp,
            on="_join_name",
            how="left",
            suffixes=("", "_attr_name"),
        )

        for col in attr_df.columns:
            if col in ["university_id", attr_name_col, "_join_name"]:
                continue

            direct_col = col
            suffix_col = f"{col}_attr_name"

            source_col = None

            if suffix_col in name_merged.columns:
                source_col = suffix_col
            elif direct_col in name_merged.columns:
                source_col = direct_col

            if not source_col:
                continue

            if col not in merged.columns:
                merged[col] = name_merged[source_col].values
            else:
                merged[col] = merged[col].combine_first(name_merged[source_col])

    return merged


def normalize_degree(value):
    value = norm(value)

    if value in ["bs", "bachelor", "bachelors", "bachelor's", "undergraduate"]:
        return ["bs", "bachelor", "bachelors", "undergraduate"]

    if value in ["ms", "master", "masters", "master's", "postgraduate"]:
        return ["ms", "msc", "master", "masters", "postgraduate"]

    if value in ["phd", "doctorate", "doctoral", "ms leading to phd"]:
        return ["phd", "doctorate", "doctoral", "ms leading to phd"]

    return [value]


def normalize_field(value):
    value = norm(value)

    mapping = {
        "computer science": [
            "computer science",
            "computer science and engineering",
            "computer sciences",
        ],
        "software engineering": [
            "software engineering",
        ],
        "data science": [
            "data science",
            "data analytics",
        ],
        "artificial intelligence": [
            "artificial intelligence",
            "machine learning",
        ],
        "cyber security": [
            "cyber security",
            "cybersecurity",
            "information security",
        ],
        "business administration": [
            "business administration",
            "bba",
        ],
        "engineering": ["engineering"],
        "biology": ["biology", "biological sciences"],
        "economics": ["economics"],
        "psychology": ["psychology"],
        "political science": ["political science"],
    }

    return mapping.get(value, [value])

def score_to_cgpa(score_type, score_value):
    value = parse_number(score_value)

    if value is None:
        return None

    if norm(score_type) in ["percentage", "percent"]:
        return round((value / 100) * 4, 2)

    return value


def contains_any(cell, values):
    cell_text = tokenize(cell)

    if not cell_text:
        return False

    items = re.split(r"[,;|/]+", str(cell or ""))
    normalized_items = [tokenize(item) for item in items if tokenize(item)]

    for value in values:
        token = tokenize(value)

        if not token:
            continue

        # ✅ FIX: allow partial but meaningful match
        for item in normalized_items:
            # exact match
            if token == item:
                return True

            # partial match (important fix)
            if token in item:
                return True

    return False

def degree_matches(row, degree_col, intended_degree):
    if not intended_degree:
        return True

    if not degree_col:
        return False

    return contains_any(row.get(degree_col), normalize_degree(intended_degree))


def program_matches(row, program_col, field_of_study):
    if not field_of_study:
        return True

    if not program_col:
        return False

    return contains_any(row.get(program_col), normalize_field(field_of_study))


def cgpa_matches(row, cgpa_col, user_cgpa):
    if user_cgpa is None:
        return True

    if not cgpa_col:
        return False

    required = parse_number(row.get(cgpa_col))

    if required is None:
        return False

    return float(user_cgpa) >= float(required)


def test_matches(row, tests_col, user_tests):
    if not user_tests:
        return True, ["You have not added a test score, so tests were not checked"]

    if not tests_col:
        return True, ["Test requirements are not available for this university"]

    required_tests = norm(row.get(tests_col))

    if not required_tests or required_tests in ["none", "not required", "optional", "no"]:
        return True, ["No specific test is required"]

    user_test_names = [norm(test.get("test_name")) for test in user_tests]

    for test_name in user_test_names:
        if test_name and test_name in required_tests:
            return True, [f"Your {test_name.upper()} score is accepted here"]

    return False, ["Your tests do not match this university's requirement"]


def get_country_value(row, country_col):
    possible_cols = [
        country_col,
        "country",
        "Country",
        "location",
        "Location",
        "country_name",
        "Country_Name",
    ]

    return get_first_available(row, possible_cols)


def region_matches(row, region_col, country_col, preferred_region):
    if not preferred_region:
        return True

    preferred = norm(preferred_region)

    if region_col:
        row_region = norm(row.get(region_col))

        if row_region == preferred:
            return True

        if preferred == "north america" and row_region in ["americas", "america"]:
            return True

        if preferred == "south america" and row_region in ["americas", "america"]:
            return True

    row_country = norm(get_country_value(row, country_col))
    allowed_countries = REGION_COUNTRIES.get(preferred, [])

    return row_country in allowed_countries


def country_matches(row, country_col, preferred_country):
    if not preferred_country or preferred_country == "All":
        return True

    row_country = norm(get_country_value(row, country_col))
    return row_country == norm(preferred_country)


def tuition_matches(row, tuition_col, max_tuition):
    if max_tuition in ["", None]:
        return True

    if not tuition_col:
        return False

    tuition = parse_number(row.get(tuition_col))
    max_tuition = parse_number(max_tuition)

    if tuition is None or max_tuition is None:
        return False

    return float(tuition) <= float(max_tuition)


def living_cost_matches(row, living_col, tolerance):
    if tolerance in ["", None]:
        return True

    if not living_col:
        return False

    living = parse_number(row.get(living_col))
    tolerance = parse_number(tolerance)

    if living is None or tolerance is None:
        return False

    return float(living) <= float(tolerance)


def scholarship_matches(row, scholarship_col, requirement):
    if not requirement:
        return True

    req = norm(requirement)

    if req in ["self-funded", "self funded", "none", "no"]:
        return True

    if not scholarship_col:
        return False

    value = norm(row.get(scholarship_col))

    return value in [
        "yes",
        "true",
        "1",
        "available",
        "scholarship available",
        "fully funded",
        "partial",
        "partial scholarship",
    ]


def apply_filter(df, check_func):
    # PERF: the same per-row check as before, but the passing rows are
    # selected with a boolean mask instead of rebuilding a new DataFrame
    # from a Python list of row Series (which was the slow part).
    mask = [bool(check_func(row)) for _, row in df.iterrows()]
    failed_count = mask.count(False)

    if failed_count == len(mask):
        return df.iloc[0:0].copy(), failed_count

    return df[mask], failed_count


def count_failures(df, filters):
    stats = {}

    for filter_name, filter_func in filters:
        failed = 0

        for _, row in df.iterrows():
            if not filter_func(row):
                failed += 1

        stats[filter_name] = failed

    return stats


# Readable filter names for messages shown in the app (display text only).
FILTER_LABELS = {
    "cgpa": "CGPA",
    "tests": "test score",
    "country": "preferred country",
    "max_tuition": "maximum tuition fee",
    "living_cost": "living cost",
    "scholarship": "scholarship",
    "degree": "degree level",
    "program": "field of study",
}


def readable_filter_name(name):
    return FILTER_LABELS.get(str(name or ""), str(name or "").replace("_", " "))


def build_empty_analysis(original_count, filter_stats, failed_filter, ignored_filters=None):
    ignored_filters = ignored_filters or []
    readable_filter = readable_filter_name(failed_filter)

    return {
        "original_count": int(original_count),
        "filter_stats": filter_stats,
        "main_blocker": failed_filter,
        "can_ignore": True,
        "removed_filters": ignored_filters,
        "message": (
            f"Universities offering your degree level and field of study were found, "
            f"but none of them meet your {readable_filter} requirement. You can show "
            f"results without the {readable_filter} filter, or update it in your profile."
        ),
    }


def build_smart_matches(
    ranking_df,
    name_col,
    country_col,
    rank_col,
    profile,
    top_n=50,
    merged_df=None,
):
    # PERF: main.py passes an already-merged (cached) DataFrame when available.
    if merged_df is not None:
        df = merged_df
    else:
        df = merge_with_attributes(ranking_df, name_col)

    original_count = len(df)

    academic = profile.get("academic", {}) or {}
    geographic = profile.get("geographic", {}) or {}
    financial = profile.get("financial", {}) or {}
    tests = profile.get("tests", []) or []

    ignored_filters = set(profile.get("_ignored_filters", []) or [])

    intended_degree = academic.get("intended_education_level")
    field_of_study = academic.get("field_of_study")
    user_cgpa = score_to_cgpa(
        academic.get("score_type"),
        academic.get("score_value"),
    )

    preferred_region = geographic.get("preferred_region")
    preferred_country = geographic.get("preferred_country")

    max_tuition = financial.get("max_tuition_fee")
    living_tolerance = financial.get("living_cost_tolerance")
    scholarship_requirement = financial.get("scholarship_requirement")

    degree_col = find_col(df, [
        "Degree Level offered",
        "Degree_Level_offered",
        "degree_level_offered",
        "accepted_degree_levels",
        "accepted_degree_level",
        "degree_levels",
        "degree_level",
        "degree",
        "program_level",
        "level",
    ])

    program_col = find_col(df, [
        "Programmes Offered",
        "Programmes_Offered",
        "programmes_offered",
        "programs_offered",
        "program_offered",
        "programmes",
        "programs",
        "program",
        "field_of_study",
        "field",
        "courses_offered",
        "course",
        "major",
    ])

    cgpa_col = find_col(df, [
        "Minimum CGPA Requirement",
        "Minimum_CGPA_Requirement",
        "minimum_cgpa_requirement",
        "cgpa_requirement",
        "minimum_cgpa",
        "min_cgpa",
        "required_cgpa",
        "eligibility_cgpa",
    ])

    tuition_col = find_col(df, [
        "Tuition (International)",
        "Tuition_International",
        "Tuition_Fee_international",
        "tuition_international",
        "tuition_fee_international",
        "international_tuition_fee",
        "international_fee",
        "fee_international",
        "tuition_fee",
    ])

    living_col = find_col(df, [
        "Living Cost (Annual)",
        "Living_Cost_Annual",
        "Living_Cost",
        "living_cost_annual",
        "living_cost",
        "cost_of_living",
        "living_cost_tolerance",
        "estimated_living_cost",
    ])

    scholarship_col = find_col(df, [
        "Scholarship (Yes/No)",
        "Scholarship_YesNo",
        "scholarship_yes_no",
        "scholarship_available",
        "scholarship",
        "scholarships",
        "scholarship_offered",
        "funding_available",
    ])

    region_col = find_col(df, [
        "Region",
        "region",
        "continent",
    ])

    tests_col = find_col(df, [
        "Standardized Test",
        "Standardized_Test",
        "standardized_test",
        "standardized_tests",
        "tests_required",
        "required_tests",
    ])

    acceptance_rate_col = find_col(df, [
        "Acceptance Rate",
        "Acceptance_Rate",
        "acceptance_rate",
        "AcceptanceRate",
        "Acceptance rate",
        "acceptance rate",
        "Admission Rate",
        "Admission_Rate",
        "admission_rate",
    ])

    employability_col = find_col(df, [
        "Graduate Employability Rate",
        "Graduate_Employability_Rate",
        "graduate_employability_rate",
        "Employability Rate",
        "Employability_Rate",
        "employability_rate",
        "Graduate Employability",
        "Graduate_Employability",
        "graduate_employability",
        "Graduate Employment Rate",
        "Graduate_Employment_Rate",
        "graduate_employment_rate",
        "employment_rate",
    ])

    if DEBUG_LOGS:
        print("SMART MATCH DETECTED COLUMNS:")
        print({
            "degree_col": degree_col,
            "program_col": program_col,
            "cgpa_col": cgpa_col,
            "tuition_col": tuition_col,
            "living_col": living_col,
            "scholarship_col": scholarship_col,
            "region_col": region_col,
            "tests_col": tests_col,
            "acceptance_rate_col": acceptance_rate_col,
            "employability_col": employability_col,
            "ignored_filters": list(ignored_filters),
        })

    ignored_filters = set(profile.get("_ignored_filters", []) or [])

    region_df, region_failed = apply_filter(
        df,
        lambda row: region_matches(row, region_col, country_col, preferred_region),
    )

    if region_df.empty:
        return [], {
            "original_count": int(original_count),
            "filter_stats": {"region": int(region_failed)},
            "main_blocker": None,
            "can_ignore": False,
            "removed_filters": [],
            "message": (
                "No universities were found in your selected region. "
                "Please change your preferred region."
            ),
        }

    def hard_filter(row):
        return (
            degree_matches(row, degree_col, intended_degree)
            and program_matches(row, program_col, field_of_study)
        )

    hard_df, hard_failed = apply_filter(region_df, hard_filter)

    if hard_df.empty:
        return [], {
            "original_count": int(original_count),
            "filter_stats": {"degree_program": int(hard_failed)},
            "main_blocker": None,
            "can_ignore": False,
            "removed_filters": [],
            "message": (
                f"No universities in {preferred_region} match your selected degree "
                f"({intended_degree}) and field of study ({field_of_study}). "
                "Please change your region, intended degree, or field of study."
            ),
        }

    soft_filters = [
        ("cgpa", lambda row: cgpa_matches(row, cgpa_col, user_cgpa)),
        ("tests", lambda row: test_matches(row, tests_col, tests)[0]),
        ("country", lambda row: country_matches(row, country_col, preferred_country)),
        ("max_tuition", lambda row: tuition_matches(row, tuition_col, max_tuition)),
        ("living_cost", lambda row: living_cost_matches(row, living_col, living_tolerance)),
        ("scholarship", lambda row: scholarship_matches(row, scholarship_col, scholarship_requirement)),
    ]

    soft_filters = [
        item for item in soft_filters
        if item[0] not in ignored_filters
    ]

    final_df = hard_df.copy()
    filter_stats = {}

    for filter_name, filter_func in soft_filters:
        final_df, failed_count = apply_filter(final_df, filter_func)
        filter_stats[filter_name] = int(failed_count)

        if final_df.empty:
            return [], build_empty_analysis(
                original_count=len(hard_df),
                filter_stats=filter_stats,
                failed_filter=filter_name,
                ignored_filters=list(ignored_filters),
            )

    empty_analysis = None

    if ignored_filters:
        empty_analysis = {
            "original_count": int(original_count),
            "filter_stats": filter_stats,
            "main_blocker": None,
            "can_ignore": False,
            "removed_filters": list(ignored_filters),
            "message": (
                "Showing results without these filters: "
                + ", ".join(readable_filter_name(item) for item in ignored_filters)
                + ". Your degree level and field of study are still applied."
            ),
        }

    # ✅ IMPORTANT: this must be BEFORE the for-loop
    rows = []

    for _, row in final_df.iterrows():
        _, test_reasons = test_matches(row, tests_col, tests)

        reasons = []

        if region_matches(row, region_col, country_col, preferred_region):
            reasons.append(f"Located in your preferred region: {preferred_region}")

        if preferred_country and country_matches(row, country_col, preferred_country):
            reasons.append(f"Located in your preferred country: {preferred_country}")

        if "degree" in ignored_filters:
            reasons.append("You chose to skip the degree level filter")
        elif degree_matches(row, degree_col, intended_degree):
            reasons.append(f"Offers your intended degree: {intended_degree}")

        if "program" in ignored_filters:
            reasons.append("You chose to skip the field of study filter")
        elif program_matches(row, program_col, field_of_study):
            reasons.append(f"Offers your field of study: {field_of_study}")

        if "cgpa" in ignored_filters:
            reasons.append("You chose to skip the CGPA filter")
        elif cgpa_matches(row, cgpa_col, user_cgpa):
            reasons.append(f"Your CGPA ({user_cgpa}) meets the minimum requirement")

        if "max_tuition" in ignored_filters:
            reasons.append("You chose to skip the maximum tuition fee filter")
        elif tuition_matches(row, tuition_col, max_tuition):
            reasons.append(f"Tuition fee is within your budget (up to {max_tuition} USD/year)")

        if "living_cost" in ignored_filters:
            reasons.append("You chose to skip the living cost filter")
        elif living_cost_matches(row, living_col, living_tolerance):
            reasons.append(f"Living cost is within your limit (up to {living_tolerance} USD/year)")

        if "scholarship" in ignored_filters:
            reasons.append("You chose to skip the scholarship filter")
        elif scholarship_matches(row, scholarship_col, scholarship_requirement):
            reasons.append("Matches your funding preference")

        if "tests" in ignored_filters:
            reasons.append("You chose to skip the test score filter")
        else:
            reasons.extend(test_reasons)

        rank_raw = row.get("_rank_numeric", 999999)
        official_rank_number = 999999 if pd.isna(rank_raw) else int(rank_raw)
        ranking_bonus = max(0, 1 - (official_rank_number / 1000))

        match_score = len(reasons) * 10 + ranking_bonus * 10

        rows.append({
            "row": row,
            "match_score": round(float(match_score), 4),
            "reasons": reasons,
        })

    rows = sorted(
        rows,
        key=lambda item: item["match_score"],
        reverse=True,
    )[:top_n]

    results = []

    for index, item in enumerate(rows, start=1):
        row = item["row"]

        rank_raw = row.get("_rank_numeric", 999999)
        official_rank_number = 999999 if pd.isna(rank_raw) else int(rank_raw)

        score_col = None

        for col in row.index:
            col_lower = col.lower()
            if "overall_score" in col_lower or "scores_overall" in col_lower:
                score_col = col
                break

        official_score = None

        if score_col:
            val = row.get(score_col)
            if not pd.isna(val):
                official_score = float(val)

        if official_score is None:
            if not pd.isna(rank_raw):
                official_score = max(0, 1 - (int(rank_raw) / 1000)) * 100

        university_name = get_first_available(
            row,
            [
                name_col,
                "Institution_Name",
                "Institution Name",
                "university",
                "University",
                "name",
                "Name",
                "institution",
                "Institution",
            ],
        )

        university_country = get_country_value(row, country_col)

        match_type = (
            f"Match without: {', '.join(readable_filter_name(item) for item in ignored_filters)}"
            if ignored_filters
            else "Full Match"
        )

        results.append({
            "university_id": safe_value(row.get("university_id", "")),
            "name": safe_value(university_name),
            "country": safe_value(university_country),

            "official_rank": safe_value(row.get(rank_col, "")),
            "official_rank_number": official_rank_number,
            "current_rank": index,

            "official_score": official_score,
            "match_type": match_type,
            "reasons": item["reasons"],

            "evidence": {
                "region": {
                    "user": safe_value(preferred_region),
                    "university": safe_value(
                        row.get(region_col) or get_country_value(row, country_col)
                    ),
                },
                "degree": {
                    "user": safe_value(intended_degree),
                    "university": safe_value(row.get(degree_col)),
                },
                "program": {
                    "user": safe_value(field_of_study),
                    "university": safe_value(row.get(program_col)),
                },
                "cgpa": {
                    "user": safe_value(user_cgpa),
                    "university": safe_value(row.get(cgpa_col)),
                },
                "tuition": {
                    "user": safe_value(max_tuition),
                    "university": safe_value(row.get(tuition_col)),
                },
                "living_cost": {
                    "user": safe_value(living_tolerance),
                    "university": safe_value(row.get(living_col)),
                },
                "scholarship": {
                    "user": safe_value(scholarship_requirement),
                    "university": safe_value(row.get(scholarship_col)),
                },
                "acceptance_rate": {
                    "user": None,
                    "university": safe_value(row.get(acceptance_rate_col)),
                },
                "employability": {
                    "user": None,
                    "university": safe_value(row.get(employability_col)),
                },
            },

            "raw": safe_raw_dict(row),
        })

    return results, empty_analysis