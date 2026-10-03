from app.services.my_ranking_service import (
    RAW_ATTRIBUTE_COLUMNS_FOR_UI,
    _json_safe_value,
    _make_full_key,
    _make_name_key,
    load_attribute_dataset,
)
from app.services.ranking_service import apply_country_and_search, paginate_df

# Not every raw column is useful for a side-by-side research comparison
# (links, city, tuition_fee/tuition_fee_type are redundant with the local /
# international split). This is the curated subset shown to researchers.
COMPARE_ATTRIBUTE_FIELDS = [
    "tuition_fee_local",
    "tuition_fee_international",
    "living_cost",
    "scholarship",
    "cgpa_requirement",
    "acceptance_rate",
    "employability_rate",
    "internship",
    "part_time_job",
    "language",
    "public_private",
    "gender_equality",
    "degree_level",
    "region",
]


def find_university_attributes(name: str, country: str | None = None) -> dict | None:
    """Look up a university's manually collected attribute data by name
    (+ country, for disambiguation), reusing the same name/country matching
    keys the live "My Ranking" flow already uses to join ranking rows with
    this attribute table."""
    df = load_attribute_dataset()
    row = None

    if country:
        full_key = _make_full_key(name, country)
        matches = df[df["_attr_full_key"] == full_key]
        if not matches.empty:
            row = matches.iloc[0]

    if row is None:
        name_key = _make_name_key(name)
        matches = df[df["_attr_name_key"] == name_key]
        if not matches.empty:
            row = matches.iloc[0]

    if row is None:
        return None

    return {
        field: _json_safe_value(row.get(field), default=None)
        for field in COMPARE_ATTRIBUTE_FIELDS
        if field in RAW_ATTRIBUTE_COLUMNS_FOR_UI
    }


def build_attributes_explorer_response(
    search: str | None,
    country: str | None,
    region: str | None,
    public_private: str | None,
    scholarship: str | None,
    page: int,
    page_size: int,
) -> dict:
    """Paginated, filterable browse view over the full manually-collected
    university attributes table, independent of any single QS/THE/ARWU
    ranking dataset — lets a researcher explore and contrast attributes
    across the whole set of universities, not just a 2-3 way comparison."""
    full_df = load_attribute_dataset()

    df = apply_country_and_search(full_df, "country", "university_name", country, search)

    if region and region != "All":
        df = df[df["region"].astype(str).str.strip().str.lower() == region.strip().lower()]

    if public_private and public_private != "All":
        df = df[
            df["public_private"].astype(str).str.strip().str.lower()
            == public_private.strip().lower()
        ]

    if scholarship and scholarship != "All":
        df = df[
            df["scholarship"].astype(str).str.strip().str.lower() == scholarship.strip().lower()
        ]

    paged_df, total_count, total_pages, current_page = paginate_df(df, page, page_size)

    def unique_sorted(column: str) -> list[str]:
        if column not in full_df.columns:
            return []

        return sorted(
            full_df[column]
            .dropna()
            .astype(str)
            .str.strip()
            .loc[lambda values: values != ""]
            .unique()
            .tolist()
        )

    return {
        "page": int(current_page),
        "page_size": int(page_size),
        "total_count": int(total_count),
        "total_pages": int(total_pages),
        "countries": unique_sorted("country"),
        "regions": unique_sorted("region"),
        "public_private_options": _public_private_options(full_df),
        "results": _format_attribute_rows(paged_df),
    }


def _public_private_options(full_df) -> list[str]:
    # The source CSV has data-quality issues in this column (stray website
    # domains, gender-ratio values that belong elsewhere) — only offer values
    # that actually look like a public/private classification as filters.
    if "public_private" not in full_df.columns:
        return []

    values = full_df["public_private"].dropna().astype(str).str.strip()
    clean = values[
        values.str.match(r"^[A-Za-z\s()]+$") & values.str.contains("public|private", case=False)
    ]
    return sorted(clean.unique().tolist())


def _format_attribute_rows(df) -> list[dict]:
    results = []

    for _, row in df.iterrows():
        entry = {
            "university_id": row.get("university_id", ""),
            "name": _json_safe_value(row.get("university_name"), default=""),
            "country": _json_safe_value(row.get("country"), default=""),
        }

        for field in COMPARE_ATTRIBUTE_FIELDS:
            entry[field] = _json_safe_value(row.get(field), default=None)

        results.append(entry)

    return results
