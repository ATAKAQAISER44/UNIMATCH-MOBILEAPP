import re
from pathlib import Path
import pandas as pd

FILE_PATH = Path("data/processed/university_attributes_processed.csv")


FALLBACK_CURRENT_EDUCATION_LEVELS = [
    "High School",
    "Intermediate / A-Level",
    "Bachelor's",
    "Master's",
]

# These are the only profile-side labels that should be shown in Profile Setup.
# Raw dataset alternatives such as BS, BSc, Bachelors, Undergraduate, MS, MSc,
# Postgraduate, Doctoral, Doctorate, DPhil, etc. are mapped into these labels.
FALLBACK_INTENDED_EDUCATION_LEVELS = ["Bachelor", "Master", "MS leading to PhD", "PhD"]


def normalize_key(value):
    return re.sub(r"[^a-z0-9]+", "", str(value or "").strip().lower())


def normalize_text(value):
    return re.sub(r"\s+", " ", str(value or "").replace("â€™", "'").replace("’", "'").strip())


def find_column(df, possible_names):
    normalized_cols = {normalize_key(col): col for col in df.columns}

    for name in possible_names:
        key = normalize_key(name)
        if key in normalized_cols:
            return normalized_cols[key]

    for name in possible_names:
        key = normalize_key(name)
        for normalized_col, actual_col in normalized_cols.items():
            if key and (key in normalized_col or normalized_col in key):
                return actual_col

    return None


def split_multi_value(value):
    text = normalize_text(value)
    if not text or text.lower() in {"nan", "none", "null"}:
        return []

    # Keep names like "Politics & International Studies (incl Development Studies)"
    # intact, but split comma/semicolon/pipe separated dataset cells.
    parts = re.split(r"[,;|]+", text)
    return [normalize_text(part) for part in parts if normalize_text(part)]


def unique_sorted(values):
    cleaned = []
    seen = set()

    for value in values:
        item = normalize_text(value)
        if not item:
            continue

        lowered = item.lower()
        if lowered in {"nan", "none", "null", "yes", "no"} and len(item) > 3:
            continue

        key = normalize_key(item)
        if not key or key in seen:
            continue

        seen.add(key)
        cleaned.append(item)

    return sorted(cleaned, key=lambda item: item.lower())


def extract_unique_split_values(df, possible_names):
    col = find_column(df, possible_names)
    if not col:
        return []

    values = []
    for value in df[col].dropna().tolist():
        values.extend(split_multi_value(value))

    return unique_sorted(values)


def extract_unique_direct_values(df, possible_names):
    col = find_column(df, possible_names)
    if not col:
        return []

    return unique_sorted(df[col].dropna().astype(str).tolist())


def build_country_region_options(df):
    region_col = find_column(df, ["Region", "region"])
    country_col = find_column(df, ["Country", "country", "country_name"])

    if not country_col:
        return [], {}

    countries_by_region = {}

    if region_col:
        for _, row in df[[region_col, country_col]].dropna(subset=[country_col]).iterrows():
            country = normalize_text(row.get(country_col))
            region = normalize_text(row.get(region_col)) or "Other"
            if not country or country.lower() in {"nan", "none", "null"}:
                continue
            if region.lower() in {"nan", "none", "null"}:
                region = "Other"
            countries_by_region.setdefault(region, set()).add(country)
    else:
        countries_by_region["All"] = set(extract_unique_direct_values(df, ["Country", "country"]))

    normalized = {
        region: sorted(countries, key=lambda item: item.lower())
        for region, countries in countries_by_region.items()
        if countries
    }

    regions = sorted(normalized.keys(), key=lambda item: item.lower())
    return regions, normalized




def is_clean_profile_option(value):
    text = normalize_text(value)
    lower = text.lower()

    if not text or len(text) > 90:
        return False
    if re.search(r"\d|%|\+|https?://|www\.", lower):
        return False
    if lower in {"yes", "no", "none", "nan", "null", "full/partial scholarships"}:
        return False
    if any(word in lower for word in ["scholarship", "tuition", "fee", "acceptance"]):
        return False

    return bool(re.search(r"[a-zA-Z]", text))

def canonical_degree_level(value):
    text = normalize_text(value)
    lower = text.lower().replace("’", "'")
    compact = normalize_key(lower)

    if not text:
        return None

    # Integrated/track values should remain a separate option because they
    # intentionally represent master's study leading toward a PhD path.
    if ("leading" in lower and "phd" in lower) or "integratedmsphd" in compact:
        return "MS leading to PhD"

    # Doctoral labels and doctoral degree abbreviations.
    if (
        "phd" in compact
        or "doctoral" in lower
        or "doctorate" in lower
        or compact in {"dphil", "dba"}
    ):
        return "PhD"

    # Bachelor/undergraduate labels and common bachelor abbreviations.
    if (
        "undergraduate" in lower
        or "bachelor" in lower
        or compact in {"b", "ba", "bs", "bsc", "bed", "beng", "bcom", "honours", "honors"}
    ):
        return "Bachelor"

    # Master/postgraduate labels and common master abbreviations.
    if (
        "master" in lower
        or "postgraduate" in lower
        or "graduate" in lower
        or compact in {"m", "ma", "ms", "msc", "mba", "mphil"}
    ):
        return "Master"

    return None


def extract_degree_level_options(df):
    values = extract_unique_split_values(
        df,
        [
            "Degree Level offered",
            "Degree_Level_offered",
            "degree_level_offered",
            "degree_levels",
            "degree_level",
            "degree",
        ],
    )

    found = set()
    for value in values:
        cleaned = re.sub(r"^and\s+", "", normalize_text(value), flags=re.IGNORECASE)
        if not is_clean_profile_option(cleaned):
            continue

        canonical = canonical_degree_level(cleaned)
        if canonical:
            found.add(canonical)

    # Always return the clean profile labels in a stable order. This prevents
    # raw dataset aliases such as BS/BSc/Bachelors/MSc/DPhil from appearing as
    # separate dropdown options.
    ordered = [label for label in FALLBACK_INTENDED_EDUCATION_LEVELS if label in found]
    return ordered or FALLBACK_INTENDED_EDUCATION_LEVELS

def build_profile_options(df):
    fields_of_study = [
        value for value in extract_unique_split_values(
            df,
            [
                "Programmes Offered",
                "Programmes_Offered",
                "programmes_offered",
                "programs_offered",
                "programs",
                "program",
                "field_of_study",
            ],
        )
        if is_clean_profile_option(value)
    ]

    scholarship_values = extract_unique_direct_values(
        df,
        [
            "Scholarship (Yes/No)",
            "Scholarship_YesNo",
            "scholarship_yes_no",
            "scholarship",
            "scholarship_available",
        ],
    )

    # Dataset usually stores scholarship as Yes/No. These values are now used
    # directly in profile setup, and backend interprets Yes as scholarship required
    # and No as no scholarship blocker.
    scholarship_values = [
        value for value in scholarship_values
        if value.strip().lower() in {"yes", "no"}
    ] or ["Yes", "No"]

    regions, countries_by_region = build_country_region_options(df)

    return {
        "current_education_levels": FALLBACK_CURRENT_EDUCATION_LEVELS,
        "intended_education_levels": extract_degree_level_options(df),
        "fields_of_study": fields_of_study,
        "scholarship_requirements": scholarship_values,
        "regions": regions,
        "countries_by_region": countries_by_region,
    }


def get_attribute_ranges():
    if not FILE_PATH.exists():
        return {"error": "university_attributes_processed.csv not found"}

    df = pd.read_csv(FILE_PATH)

    column_map = {
        "tuition_fee_international": [
            "Tuition (International)",
            "Tuition_International",
            "Tuition_Fee_international",
            "tuition_international",
            "tuition_fee_international",
            "international_tuition_fee",
            "tuition international",
            "international_fee",
        ],
        "tuition_fee_local": [
            "Tuition (Local/Domestic)",
            "Tuition_LocalDomestic",
            "Tuition_Fee_local",
            "tuition_local_domestic",
            "tuition_fee_local",
            "local_tuition_fee",
            "tuition_local",
            "local_fee",
        ],
        "living_cost": [
            "Living Cost (Annual)",
            "Living_Cost_Annual",
            "Living_Cost",
            "living_cost_annual",
            "living_cost",
            "cost_of_living",
        ],
        "cgpa_requirement": [
            "Minimum CGPA Requirement",
            "Minimum_CGPA_Requirement",
            "minimum_cgpa_requirement",
            "cgpa_requirement",
            "minimum_cgpa",
            "min_cgpa",
        ],
    }

    ranges = {}

    for output_key, possible_names in column_map.items():
        actual_col = find_column(df, possible_names)
        if not actual_col:
            continue

        series = pd.to_numeric(
            df[actual_col].astype(str).str.replace(",", "", regex=False).str.strip(),
            errors="coerce",
        ).dropna()

        if not series.empty:
            ranges[output_key] = {
                "min": float(series.min()),
                "max": float(series.max()),
                "source_column": actual_col,
            }

    ranges["options"] = build_profile_options(df)
    return ranges
