from pathlib import Path
import re
import pandas as pd

from app.matching.university_matcher import resolve_uni_id


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

    return pd.read_csv(ATTRIBUTE_FILE)


def clean_join_name(value):
    """
    Stronger university-name key used only for joining ranking rows with the
    attributes dataset. This keeps the original display name unchanged, but
    makes common variants match, for example:
    - University of Engineering & Technology Lahore
    - University of Engineering & Technology (UET) Lahore
    """
    value = norm(value)
    value = value.replace("&", "and")
    value = re.sub(r"\([^)]*\)", " ", value)  # remove abbreviations like (UET), (NUML)
    value = re.sub(r"\bthe\b", "", value)
    value = re.sub(r"\bof\b", " of ", value)
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
        # Pass 1: shared university id from app/matching (handles different
        # spellings across rankings). Pass 2: cleaned name, as before, fills
        # whatever pass 1 could not match.
        ranking_ids = (
            ranking_df["uni_id"].tolist()
            if "uni_id" in ranking_df.columns
            else [resolve_uni_id(name) for name in ranking_df[ranking_name_col]]
        )
        attr_countries = attr_df["Country"] if "Country" in attr_df.columns else [None] * len(attr_df)
        attr_ids = [
            resolve_uni_id(name, country)
            for name, country in zip(attr_df[attr_name_col], attr_countries)
        ]

        merged = _fill_attributes_by_key(
            merged, ranking_df, attr_df, attr_name_col, ranking_ids, attr_ids
        )
        merged = _fill_attributes_by_key(
            merged,
            ranking_df,
            attr_df,
            attr_name_col,
            ranking_df[ranking_name_col].apply(clean_join_name).tolist(),
            attr_df[attr_name_col].apply(clean_join_name).tolist(),
        )
        if "source_name" in ranking_df.columns:
            # Pass 3: the name this ranking originally used.
            merged = _fill_attributes_by_key(
                merged,
                ranking_df,
                attr_df,
                attr_name_col,
                ranking_df["source_name"].apply(clean_join_name).tolist(),
                attr_df[attr_name_col].apply(clean_join_name).tolist(),
            )

    return merged


def _fill_attributes_by_key(merged, ranking_df, attr_df, attr_name_col, ranking_keys, attr_keys):
    ranking_temp = ranking_df.copy()
    attr_temp = attr_df.copy()

    ranking_temp["_join_name"] = [key if key else None for key in ranking_keys]
    attr_temp["_join_name"] = [key if key else None for key in attr_keys]

    attr_temp = attr_temp.dropna(subset=["_join_name"]).drop_duplicates(subset=["_join_name"])

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
    value = tokenize(value)
    compact = re.sub(r"[^a-z0-9]+", "", value)

    if not value:
        return []

    if ("leading" in value and "phd" in value) or compact == "integratedmsphd":
        return [
            "ms leading to phd",
            "integrated ms phd",
            "integrated ms",
            "phd track",
            "ms",
            "msc",
            "master",
            "masters",
            "postgraduate",
            "phd",
            "doctoral",
            "doctorate",
        ]

    if (
        value in {"ba", "bs", "bsc", "bed", "beng", "bcom", "honours", "honors"}
        or "bachelor" in value
        or "undergraduate" in value
    ):
        return [
            "ba",
            "bs",
            "bsc",
            "bed",
            "beng",
            "bcom",
            "bachelor",
            "bachelors",
            "undergraduate",
            "honours",
            "honors",
        ]

    if (
        value in {"ma", "ms", "msc", "mba", "mphil"}
        or "master" in value
        or "postgraduate" in value
        or value == "graduate"
    ):
        return [
            "ma",
            "ms",
            "msc",
            "mba",
            "mphil",
            "master",
            "masters",
            "postgraduate",
            "graduate",
            "taught postgraduate",
            "postgraduate coursework",
            "postgraduate research",
        ]

    if (
        "phd" in value
        or "doctor" in value
        or value in {"dphil", "dba"}
    ):
        return [
            "phd",
            "phd track",
            "doctoral",
            "doctorate",
            "dphil",
            "dba",
            "research postgraduate",
        ]

    return [value]


def normalize_field(value):
    value = norm(value)

    # Broad but controlled aliases. This is only used to decide whether a
    # university should be considered a relevant match for the selected field.
    # It does not change the stored dataset values.
    mapping = {
        "computer science": [
            "computer science",
            "computer sciences",
            "computer science and engineering",
            "computing",
            "school of computing",
            "informatics",
            "information technology",
            "software engineering",
            "computer engineering",
            "data science",
            "artificial intelligence",
            "machine learning",
            "cyber security",
            "cybersecurity",
            "information security",
        ],
        "software engineering": [
            "software engineering",
            "computer science",
            "computer science and engineering",
            "computing",
            "information technology",
        ],
        "data science": [
            "data science",
            "data analytics",
            "analytics",
            "business analytics",
            "computer science",
            "computing",
            "artificial intelligence",
            "machine learning",
        ],
        "artificial intelligence": [
            "artificial intelligence",
            "machine learning",
            "ai",
            "data science",
            "computer science",
            "computing",
            "robotics",
        ],
        "cyber security": [
            "cyber security",
            "cybersecurity",
            "information security",
            "computer security",
            "network security",
            "it security",
            "digital forensics",
            "information assurance",
            "computer science",
            "computing",
            "information technology",
        ],
        "business administration": [
            "business administration",
            "business",
            "management",
            "bba",
            "mba",
        ],
        "engineering": [
            "engineering",
            "computer engineering",
            "electrical engineering",
            "mechanical engineering",
            "civil engineering",
            "chemical engineering",
        ],
        "biology": ["biology", "biological sciences", "life sciences"],
        "economics": ["economics", "economy"],
        "psychology": ["psychology"],
        "political science": ["political science", "politics", "international relations"],
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

    # Do not remove a university only because the merged dataset has missing
    # degree information. If degree data exists, it must match.
    if not degree_col:
        return True

    university_degree = row.get(degree_col)
    if not norm(university_degree):
        return True

    return contains_any(university_degree, normalize_degree(intended_degree))


def program_matches(row, program_col, field_of_study):
    if not field_of_study:
        return True

    # Same rule as degree: missing program data should not kill the result.
    # Existing program data still has to match the selected field/aliases.
    if not program_col:
        return True

    university_program = row.get(program_col)
    if not norm(university_program):
        return True

    return contains_any(university_program, normalize_field(field_of_study))


def cgpa_matches(row, cgpa_col, user_cgpa):
    if user_cgpa is None:
        return True

    # Practical profile attributes are soft filters. Missing dataset values
    # should not hide otherwise relevant universities.
    if not cgpa_col:
        return True

    required = parse_number(row.get(cgpa_col))

    if required is None:
        return True

    return float(user_cgpa) >= float(required)


def test_matches(row, tests_col, user_tests):
    if not user_tests:
        return True, ["No standardized test provided, so this optional field was ignored"]

    if not tests_col:
        return True, ["Test requirement data is not available, so it was not used as a blocker"]

    required_tests = norm(row.get(tests_col))

    if not required_tests or required_tests in ["none", "not required", "optional", "no"]:
        return True, ["No strict standardized test requirement found"]

    user_test_names = [norm(test.get("test_name")) for test in user_tests]

    for test_name in user_test_names:
        if test_name and test_name in required_tests:
            return True, [f"Your {test_name.upper()} test matches the requirement"]

    return False, ["Your provided test does not match this university requirement"]


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
    """
    Preferred country can be a single country or multiple countries.
    For multiple selected countries, this is an OR filter:
    a university passes if its country matches ANY selected country.
    The country soft-filter should only become a blocker when none of the
    selected countries has a matching university after mandatory filters.
    """
    selected_countries = split_profile_countries(preferred_country)

    if not selected_countries or "all" in selected_countries:
        return True

    row_country = norm(get_country_value(row, country_col))

    # Missing country data should not become a false blocker. If country data
    # exists and does not match, then the university is filtered out.
    if not row_country:
        return True

    return row_country in selected_countries


def split_profile_countries(value):
    if value is None:
        return []

    if isinstance(value, (list, tuple, set)):
        raw_items = value
    else:
        raw_items = re.split(r"[,;/|]+", str(value))

    return [norm(item) for item in raw_items if norm(item)]


def get_user_home_country(profile):
    candidates = [
        profile.get("country"),
        (profile.get("user") or {}).get("country"),
        (profile.get("user_profile") or {}).get("country"),
        (profile.get("profile") or {}).get("country"),
        (profile.get("personal") or {}).get("country"),
        (profile.get("basic") or {}).get("country"),
    ]

    for candidate in candidates:
        if norm(candidate):
            return norm(candidate)

    return ""


def choose_tuition_column(row, tuition_local_col, tuition_international_col, country_col, profile):
    home_country = get_user_home_country(profile or {})
    university_country = norm(get_country_value(row, country_col))

    if home_country and university_country and home_country == university_country and tuition_local_col:
        return tuition_local_col, "local"

    geographic = (profile or {}).get("geographic", {}) or {}
    preferred_countries = split_profile_countries(geographic.get("preferred_country"))

    if (
        home_country
        and home_country in preferred_countries
        and university_country in ["", home_country]
        and tuition_local_col
    ):
        return tuition_local_col, "local"

    if tuition_international_col:
        return tuition_international_col, "international"

    if tuition_local_col:
        return tuition_local_col, "local"

    return None, "not_available"


def tuition_matches(row, tuition_col, max_tuition):
    if max_tuition in ["", None]:
        return True

    if not tuition_col:
        return True

    tuition = parse_number(row.get(tuition_col))
    max_tuition = parse_number(max_tuition)

    if max_tuition is None:
        return True

    if tuition is None:
        return True

    return float(tuition) <= float(max_tuition)


def living_cost_matches(row, living_col, tolerance):
    if tolerance in ["", None]:
        return True

    if not living_col:
        return True

    living = parse_number(row.get(living_col))
    tolerance = parse_number(tolerance)

    if tolerance is None:
        return True

    if living is None:
        return True

    return float(living) <= float(tolerance)


def scholarship_matches(row, scholarship_col, requirement):
    if not requirement:
        return True

    req = norm(requirement)

    if req in ["self-funded", "self funded", "none", "no"]:
        return True

    if not scholarship_col:
        return True

    value = norm(row.get(scholarship_col))

    # Unknown scholarship data should not hide the university. Explicitly
    # negative values still fail when the user requires scholarship.
    if not value or value in ["n/a", "na", "not available", "unknown"]:
        return True

    if value in ["no", "false", "0", "not offered", "not available"]:
        return False

    return value in [
        "yes",
        "true",
        "1",
        "available",
        "scholarship available",
        "fully funded",
        "partial",
        "partial scholarship",
        "merit based",
        "need based",
    ] or "scholarship" in value or "fund" in value


def apply_filter(df, check_func):
    passed_rows = []
    failed_count = 0

    for _, row in df.iterrows():
        if check_func(row):
            passed_rows.append(row)
        else:
            failed_count += 1

    if not passed_rows:
        return df.iloc[0:0].copy(), failed_count

    return pd.DataFrame(passed_rows), failed_count


def count_failures(df, filters):
    stats = {}

    for filter_name, filter_func in filters:
        failed = 0

        for _, row in df.iterrows():
            if not filter_func(row):
                failed += 1

        stats[filter_name] = failed

    return stats


def build_empty_analysis(original_count, filter_stats, failed_filter, ignored_filters=None):
    ignored_filters = ignored_filters or []
    readable_filter = str(failed_filter or "").replace("_", " ")

    return {
        "original_count": int(original_count),
        "filter_stats": filter_stats,
        "main_blocker": failed_filter,
        "can_ignore": True,
        "removed_filters": ignored_filters,
        "message": (
            f"Your selected degree and program are available, but the {readable_filter} "
            f"filter is too restrictive. You can show results without the {readable_filter} "
            "filter, or update this value in your profile."
        ),
    }


def build_smart_matches(ranking_df, name_col, country_col, rank_col, profile, top_n=None):
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

    tuition_local_col = find_col(df, [
        "Tuition (Local/Domestic)",
        "Tuition_LocalDomestic",
        "Tuition_Fee_local",
        "tuition_fee_local",
        "tuition_local_domestic",
        "tuition_local",
        "local_tuition_fee",
        "domestic_tuition_fee",
        "local_fee",
        "domestic_fee",
    ])

    tuition_international_col = find_col(df, [
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

    def selected_tuition(row):
        return choose_tuition_column(
            row,
            tuition_local_col,
            tuition_international_col,
            country_col,
            profile,
        )

    def selected_tuition_value(row):
        selected_col, _ = selected_tuition(row)
        return row.get(selected_col) if selected_col else None

    print("SMART MATCH DETECTED COLUMNS:")
    print({
        "degree_col": degree_col,
        "program_col": program_col,
        "cgpa_col": cgpa_col,
        "tuition_local_col": tuition_local_col,
        "tuition_international_col": tuition_international_col,
        "user_home_country": get_user_home_country(profile),
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
        ("max_tuition", lambda row: tuition_matches(row, selected_tuition(row)[0], max_tuition)),
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
                "Showing results after ignoring: "
                + ", ".join(str(item).replace("_", " ") for item in ignored_filters)
                + ". Degree and program are still mandatory."
            ),
        }

    # ✅ IMPORTANT: this must be BEFORE the for-loop
    rows = []

    for _, row in final_df.iterrows():
        _, test_reasons = test_matches(row, tests_col, tests)

        reasons = []

        if region_matches(row, region_col, country_col, preferred_region):
            reasons.append(f"Region check passed: {preferred_region}")

        if preferred_country and country_matches(row, country_col, preferred_country):
            matched_country = get_country_value(row, country_col)
            reasons.append(f"Country check passed: {matched_country}")

        if "degree" in ignored_filters:
            reasons.append("Degree filter was ignored by your choice")
        elif degree_matches(row, degree_col, intended_degree):
            reasons.append(f"Degree check passed: {intended_degree}")

        if "program" in ignored_filters:
            reasons.append("Program filter was ignored by your choice")
        elif program_matches(row, program_col, field_of_study):
            reasons.append(f"Program check passed: {field_of_study}")

        if "cgpa" in ignored_filters:
            reasons.append("CGPA filter was ignored by your choice")
        elif cgpa_matches(row, cgpa_col, user_cgpa):
            reasons.append(f"CGPA check passed: your CGPA is {user_cgpa}")

        if "max_tuition" in ignored_filters:
            reasons.append("Tuition filter was ignored by your choice")
        elif tuition_matches(row, selected_tuition(row)[0], max_tuition):
            _, tuition_type = selected_tuition(row)
            reasons.append(
                f"Tuition check passed using {tuition_type} tuition: within your max budget {max_tuition}"
            )

        if "living_cost" in ignored_filters:
            reasons.append("Living cost filter was ignored by your choice")
        elif living_cost_matches(row, living_col, living_tolerance):
            reasons.append(f"Living cost check passed: within your tolerance {living_tolerance}")

        if "scholarship" in ignored_filters:
            reasons.append("Scholarship filter was ignored by your choice")
        elif scholarship_matches(row, scholarship_col, scholarship_requirement):
            reasons.append("Scholarship check passed")

        if "tests" in ignored_filters:
            reasons.append("Standardized test filter was ignored by your choice")
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
    )

    if isinstance(top_n, int) and top_n > 0:
        rows = rows[:top_n]

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
            f"Strict Match except {', '.join(str(item).replace('_', ' ') for item in ignored_filters)}"
            if ignored_filters
            else "Strict Match"
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
                    "university": safe_value(selected_tuition_value(row)),
                    "type": safe_value(selected_tuition(row)[1]),
                    "home_country": safe_value(get_user_home_country(profile)),
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