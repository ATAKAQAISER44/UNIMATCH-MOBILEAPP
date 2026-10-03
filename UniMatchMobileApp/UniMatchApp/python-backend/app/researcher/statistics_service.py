import pandas as pd

from app.researcher.dataset_service import load_researcher_dataset, raw_metric_values
from app.services.ranking_service import apply_country_and_search


def _published_values(dataset: str, view: dict, columns: list[str]) -> pd.DataFrame:
    """
    Indicator values on the ranking's own scale (e.g. 0-100), with empty
    cells left empty. Historical QS files are used as they are. For the
    current THE/ARWU files the processed data has empty cells filled with the
    median, which would hide missing values and shift the mean, so the
    published values are read from the raw file instead.
    """
    df = view["df"]
    if view["historical"]:
        return pd.DataFrame(
            {c: pd.to_numeric(df[c], errors="coerce") for c in columns if c in df.columns},
            index=df.index,
        )

    # view["df"] keeps the row index of the processed CSV, which matches raw rows.
    return raw_metric_values(dataset, columns).reindex(df.index)


def _round(value):
    if value is None or pd.isna(value):
        return None
    return round(float(value), 2)


def _name(value):
    if value is None or pd.isna(value) or not str(value).strip():
        return None
    return str(value).strip()


def _indicator_summary(key: str, values: pd.Series, names: pd.Series) -> dict:
    total = int(len(values))
    available = values.dropna()
    missing = total - int(len(available))

    summary = {
        "key": key,
        "total": total,
        "available": int(len(available)),
        "missing": missing,
        "missing_pct": _round(missing / total * 100) if total else None,
        "mean": None,
        "median": None,
        "min": None,
        "max": None,
        "std": None,
        "min_university": None,
        "max_university": None,
    }

    if available.empty:
        return summary

    summary.update(
        {
            "mean": _round(available.mean()),
            "median": _round(available.median()),
            "min": _round(available.min()),
            "max": _round(available.max()),
            "std": _round(available.std()) if len(available) > 1 else None,
            "min_university": _name(names.loc[available.idxmin()]),
            "max_university": _name(names.loc[available.idxmax()]),
        }
    )
    return summary


# A correlation from fewer universities than this is too unreliable to show.
MIN_CORRELATION_PAIRS = 10


def _correlation_matrix(values: pd.DataFrame, columns: list[str]) -> dict:
    """
    Spearman correlation between every pair of indicators: +1 = they rise
    together, 0 = no relation, -1 = one rises while the other falls.
    Spearman compares the ORDER of universities, so a few extreme scores
    (common in rankings) cannot dominate the result the way they do in Pearson.
    Each pair uses only universities that have both scores; `pairs` holds that count.
    """
    keys = [c for c in columns if c in values.columns and values[c].notna().sum() >= MIN_CORRELATION_PAIRS]
    if len(keys) < 2:
        return {"method": "spearman", "keys": keys, "matrix": [], "pairs": [], "min_pairs": MIN_CORRELATION_PAIRS}

    data = values[keys]
    corr = data.corr(method="spearman", min_periods=MIN_CORRELATION_PAIRS)
    present = data.notna().astype(int)
    pair_counts = present.T.dot(present)

    return {
        "method": "spearman",
        "keys": keys,
        "matrix": [[_round_corr(corr.loc[a, b]) for b in keys] for a in keys],
        "pairs": [[int(pair_counts.loc[a, b]) for b in keys] for a in keys],
        "min_pairs": MIN_CORRELATION_PAIRS,
    }


def _round_corr(value):
    if value is None or pd.isna(value):
        return None
    return round(float(value), 2)


def build_statistics_response(dataset: str, year: int | None, country: str | None):
    dataset = dataset.lower()
    view, selected_year, years = load_researcher_dataset(dataset, year)

    df = apply_country_and_search(view["df"], view["country_col"], view["name_col"], country, None)
    names = df[view["name_col"]]

    overall_col = view.get("overall_col")
    columns = list(view["metrics"]) + ([overall_col] if overall_col else [])
    values = _published_values(dataset, view, columns).reindex(df.index)

    def summary(column):
        series = values[column] if column in values.columns else pd.Series(index=df.index, dtype="float64")
        return _indicator_summary(column, series, names)

    indicators = [summary(metric) for metric in view["metrics"]]
    overall = summary(overall_col) if overall_col else None

    countries = []
    if view["country_col"]:
        countries = sorted(
            view["df"][view["country_col"]]
            .dropna()
            .astype(str)
            .str.strip()
            .loc[lambda values: values != ""]
            .unique()
            .tolist()
        )

    return {
        "dataset": dataset.upper(),
        "year": selected_year,
        "available_years": years,
        "country": country or "All",
        "countries": countries,
        "total_universities": int(len(df)),
        "overall": overall,
        "indicators": indicators,
        "correlation": _correlation_matrix(values, columns),
    }
