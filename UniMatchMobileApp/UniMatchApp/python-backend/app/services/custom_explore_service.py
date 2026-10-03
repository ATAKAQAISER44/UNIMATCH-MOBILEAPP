import pandas as pd

from app.services.profile_smart_match_service import (
    merge_with_attributes,
    find_col,
    parse_number,
    safe_value,
    safe_raw_dict,
    get_country_value,
    contains_any,
    normalize_degree,
    normalize_field,
    scholarship_matches,
    region_matches,
)


# Readable sort names for the explanation shown in the app (display only).
SORT_LABELS = {
    "official_rank": "official rank",
    "tuition": "tuition fee",
    "living_cost": "living cost",
    "cgpa": "CGPA requirement",
    "acceptance_rate": "acceptance rate",
    "employability": "graduate employability",
}


FIELD_COLUMNS = {
    "region": ["Region", "region", "continent"],
    "country": ["Country", "country", "Location", "location"],
    "degree": [
        "Degree Level offered",
        "Degree_Level_offered",
        "degree_level_offered",
        "degree_level",
        "degree",
    ],
    "program": [
        "Programmes Offered",
        "Programmes_Offered",
        "programmes_offered",
        "programs_offered",
        "program",
        "field",
    ],
    "cgpa": [
        "Minimum CGPA Requirement",
        "Minimum_CGPA_Requirement",
        "minimum_cgpa_requirement",
        "cgpa_requirement",
        "minimum_cgpa",
    ],
    "tuition": [
        "Tuition (International)",
        "Tuition_International",
        "Tuition_Fee_international",
        "tuition_fee_international",
        "tuition_international",
    ],
    "living_cost": [
        "Living Cost (Annual)",
        "Living_Cost_Annual",
        "Living_Cost",
        "living_cost",
        "cost_of_living",
    ],
    "scholarship": [
        "Scholarship (Yes/No)",
        "Scholarship_YesNo",
        "scholarship_yes_no",
        "scholarship",
        "scholarship_available",
    ],
    "acceptance_rate": [
        "Acceptance Rate",
        "Acceptance_Rate",
        "acceptance_rate",
        "AcceptanceRate",
        "Acceptance rate",
        "acceptance rate",
        "Admission Rate",
        "Admission_Rate",
        "admission_rate",
    ],
    "employability": [
        "Graduate Employability Rate",
        "Graduate_Employability_Rate",
        "graduate_employability_rate",
        "employability_rate",
        "Employability Rate",
        "Employability_Rate",
        "employability",
        "Graduate Employability",
        "Graduate_Employability",
        "graduate_employability",
    ],
}


SORT_OPTIONS = {
    "official_rank": "official_rank",
    "tuition": "tuition",
    "living_cost": "living_cost",
    "cgpa": "cgpa",
    "acceptance_rate": "acceptance_rate",
    "employability": "employability",
}


def get_cols(df):
    return {
        key: find_col(df, names)
        for key, names in FIELD_COLUMNS.items()
    }


def normalize_text(value):
    if value is None:
        return ""
    return str(value).strip().lower()


def compare_numeric(row_value, operator, user_value):
    left = parse_number(row_value)
    right = parse_number(user_value)

    if left is None or right is None:
        return False

    if operator == "<=":
        return left <= right
    if operator == ">=":
        return left >= right
    if operator == "=":
        return left == right

    return False


def compare_text(row_value, operator, user_value):
    left = normalize_text(row_value)
    right = normalize_text(user_value)

    if not right:
        return True

    if not left:
        return False

    if operator == "=":
        return left == right

    if operator == "contains":
        return right in left

    return False


def custom_filter_matches(row, filter_item, cols, country_col):
    field = filter_item.get("field")
    operator = filter_item.get("operator")
    value = filter_item.get("value")

    if not field or value in ["", None]:
        return True

    col = cols.get(field)

    if field == "region":
        return region_matches(row, cols.get("region"), country_col, value)

    if field == "country":
        return compare_text(get_country_value(row, country_col), "=", value)

    if field == "degree":
        if not col:
            return False
        return contains_any(row.get(col), normalize_degree(value))

    if field == "program":
        if not col:
            return False
        return contains_any(row.get(col), normalize_field(value))

    if field in ["cgpa", "tuition", "living_cost", "acceptance_rate", "employability"]:
        if not col:
            return False
        return compare_numeric(row.get(col), operator or "<=", value)

    if field == "scholarship":
        if not col:
            return False

        wanted = normalize_text(value)

        if wanted in ["yes", "available", "required", "scholarship-supported", "fully funded"]:
            return scholarship_matches(row, col, "Scholarship-supported")

        if wanted in ["no", "not required", "self-funded", "self funded"]:
            return True

        return compare_text(row.get(col), "=", value)

    return True


def apply_custom_filters(df, filters, cols, country_col):
    filtered = df.copy()
    filter_stats = {}

    for filter_item in filters:
        field = filter_item.get("field")
        if not field:
            continue

        # PERF: same per-row check, but select rows with a boolean mask
        # instead of rebuilding a DataFrame from a list of row Series.
        mask = [
            bool(custom_filter_matches(row, filter_item, cols, country_col))
            for _, row in filtered.iterrows()
        ]
        failed_count = mask.count(False)

        filter_stats[field] = int(failed_count)

        if failed_count == len(mask):
            return filtered.iloc[0:0].copy(), filter_stats

        filtered = filtered[mask]

    return filtered, filter_stats


def get_sort_value(row, sort_by, cols):
    if sort_by == "official_rank":
        value = row.get("_rank_numeric")
        if pd.isna(value):
            return 999999
        return float(value)

    col = cols.get(sort_by)
    if not col:
        return 999999

    value = parse_number(row.get(col))
    if value is None:
        return 999999

    return float(value)


def sort_dataframe(df, sort_by, sort_order, cols):
    if df.empty:
        return df

    sort_by = sort_by or "official_rank"
    sort_order = sort_order or "asc"

    ascending = sort_order != "desc"

    df = df.copy()
    df["_custom_sort_value"] = df.apply(
        lambda row: get_sort_value(row, sort_by, cols),
        axis=1,
    )

    df = df.sort_values(
        by="_custom_sort_value",
        ascending=ascending,
        na_position="last",
    )

    return df


def sort_result_cards(results, sort_by, sort_order):
    if not results:
        return results

    sort_by = sort_by or "official_rank"
    sort_order = sort_order or "asc"
    reverse = sort_order == "desc"

    def value_of(item):
        evidence = item.get("evidence", {})

        if sort_by == "official_rank":
            return item.get("official_rank_number", 999999)

        if sort_by == "tuition":
            return parse_number((evidence.get("tuition") or {}).get("university")) or 999999

        if sort_by == "living_cost":
            return parse_number((evidence.get("living_cost") or {}).get("university")) or 999999

        if sort_by == "cgpa":
            return parse_number((evidence.get("cgpa") or {}).get("university")) or 999999

        raw = item.get("raw", {})

        if sort_by == "acceptance_rate":
            for key in ["Acceptance_Rate", "Acceptance Rate", "acceptance_rate"]:
                if key in raw:
                    return parse_number(raw.get(key)) or 999999

        if sort_by == "employability":
            for key in [
                "Graduate_Employability_Rate",
                "Graduate Employability Rate",
                "graduate_employability_rate",
            ]:
                if key in raw:
                    return parse_number(raw.get(key)) or 999999

        return item.get("official_rank_number", 999999)

    sorted_results = sorted(results, key=value_of, reverse=reverse)

    for index, item in enumerate(sorted_results, start=1):
        item["current_rank"] = index

    return sorted_results


def build_custom_explore_results(
    ranking_df,
    name_col,
    country_col,
    rank_col,
    filters,
    sort_by="official_rank",
    sort_order="asc",
    top_n=50,
    merged_df=None,
):
    # PERF: main.py passes an already-merged (cached) DataFrame when available.
    if merged_df is not None:
        df = merged_df
    else:
        df = merge_with_attributes(ranking_df, name_col)
    cols = get_cols(df)

    filters = filters or []

    filtered_df, filter_stats = apply_custom_filters(
        df=df,
        filters=filters,
        cols=cols,
        country_col=country_col,
    )

    if filtered_df.empty:
        return [], {
            "original_count": int(len(df)),
            "filter_stats": filter_stats,
            "message": "No universities match all of your filters. Try removing a filter or making one less strict.",
        }

    filtered_df = sort_dataframe(filtered_df, sort_by, sort_order, cols)
    filtered_df = filtered_df.head(top_n)

    results = []

    for index, (_, row) in enumerate(filtered_df.iterrows(), start=1):
        rank_raw = row.get("_rank_numeric", 999999)
        official_rank_number = 999999 if pd.isna(rank_raw) else int(rank_raw)

        university_name = row.get(name_col)
        university_country = get_country_value(row, country_col)

        results.append({
            "university_id": safe_value(row.get("university_id", "")),
            "name": safe_value(university_name),
            "country": safe_value(university_country),
            "official_rank": safe_value(row.get(rank_col, "")),
            "official_rank_number": official_rank_number,
            "current_rank": index,
            "official_score": None,
            "match_type": "Custom Explore Match",
            "reasons": [
                "Matches all the filters you selected.",
                f"Sorted by {SORT_LABELS.get(sort_by, str(sort_by).replace('_', ' '))} "
                f"({'high to low' if sort_order == 'desc' else 'low to high'}).",
            ],
            "evidence": {
                "region": {
                    "user": get_filter_value(filters, "region"),
                    "university": safe_value(row.get(cols.get("region"))),
                },
                "degree": {
                    "user": get_filter_value(filters, "degree"),
                    "university": safe_value(row.get(cols.get("degree"))),
                },
                "program": {
                    "user": get_filter_value(filters, "program"),
                    "university": safe_value(row.get(cols.get("program"))),
                },
                "cgpa": {
                    "user": get_filter_value(filters, "cgpa"),
                    "university": safe_value(row.get(cols.get("cgpa"))),
                },
                "tuition": {
                    "user": get_filter_value(filters, "tuition"),
                    "university": safe_value(row.get(cols.get("tuition"))),
                },
                "living_cost": {
                    "user": get_filter_value(filters, "living_cost"),
                    "university": safe_value(row.get(cols.get("living_cost"))),
                },
                "scholarship": {
                    "user": get_filter_value(filters, "scholarship"),
                    "university": safe_value(row.get(cols.get("scholarship"))),
                },
                "acceptance_rate": {
                    "user": get_filter_value(filters, "acceptance_rate"),
                    "university": safe_value(row.get(cols.get("acceptance_rate"))),
                },
                "employability": {
                    "user": get_filter_value(filters, "employability"),
                    "university": safe_value(row.get(cols.get("employability"))),
                },
            },
            "raw": safe_raw_dict(row),
        })

    return results, None


def get_filter_value(filters, field):
    for item in filters or []:
        if item.get("field") == field:
            return item.get("value")
    return None