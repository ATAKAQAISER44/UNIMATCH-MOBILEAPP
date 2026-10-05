"""
University Administrator - institutional performance (rankings only).

For one university, per ranking (latest edition): rank, change since the
previous edition, global and national position, every indicator against all
ranked universities, the same country and similar-rank peers, and the
strongest / weakest indicators. Attributes are handled separately.
"""

import pandas as pd

from app.researcher.dataset_service import available_years, load_researcher_dataset
from app.researcher.statistics_service import _published_values
from app.researcher.university_journey_service import (
    JOURNEY_DATASETS,
    build_university_journey,
    find_university_row,
)

PEER_RANK_BAND = 50  # universities within +/- 50 places are "similar-rank peers"
TOP_INDICATORS = 3


def _round(value):
    return None if value is None or pd.isna(value) else round(float(value), 2)


def _percentile(values: pd.Series, value) -> float | None:
    """Share of universities (with data) at or below this value, 0-100."""
    values = values.dropna()
    if values.empty or value is None or pd.isna(value):
        return None
    return _round((values <= value).mean() * 100)


def latest_edition(dataset: str):
    """Latest edition of a ranking with its published indicator values."""
    view, year, _years = load_researcher_dataset(dataset, available_years(dataset)[0])
    return view, year, _published_values(dataset, view, view["metrics"])


def _ranking_performance(dataset: str, key: str, history: list[dict]) -> dict | None:
    view, year, values = latest_edition(dataset)
    row = find_university_row(view, key)
    if row is None:
        return None

    df, country_col = view["df"], view["country_col"]
    ranks = df["_rank_numeric"]
    rank = int(row["_rank_numeric"])
    same_country = df[country_col] == row[country_col] if country_col else pd.Series(True, index=df.index)
    peers = ((ranks - rank).abs() <= PEER_RANK_BAND) & (df.index != row.name)

    indicators = []
    for metric in view["metrics"]:
        column = values.get(metric, pd.Series(dtype="float64"))
        value = column.get(row.name)
        peer_median = column[peers].median() if not column.empty else None
        indicators.append({
            "key": metric,
            "value": _round(value),
            "percentile": _percentile(column, value),
            "national_percentile": _percentile(column[same_country], value),
            "peer_median": _round(peer_median),
            "gap": _round(value - peer_median) if pd.notna(value) and pd.notna(peer_median) else None,
        })

    with_gap = sorted((i for i in indicators if i["gap"] is not None), key=lambda i: i["gap"], reverse=True)
    earlier = [p for p in history if p["year"] < year and p["rank"] is not None]

    return {
        "year": year,
        "rank": rank,
        "official_rank": str(row[view["rank_col"]]),
        "previous_year": earlier[-1]["year"] if earlier else None,
        "previous_rank": earlier[-1]["rank"] if earlier else None,
        "total_ranked": int(len(df)),
        "global_percentile": _round((ranks >= rank).mean() * 100),
        "national_rank": int((ranks[same_country] < rank).sum() + 1),
        "national_total": int(same_country.sum()),
        "peer_count": int(peers.sum()),
        "indicators": indicators,
        "strengths": [i for i in with_gap if i["gap"] > 0][:TOP_INDICATORS],
        "weaknesses": [i for i in reversed(with_gap) if i["gap"] < 0][:TOP_INDICATORS],
        "history": history,
    }


def build_institution_performance(key: str) -> dict:
    journey = build_university_journey(key)  # validates the key and gives the rank history
    return {
        "key": journey["key"],
        "name": journey["name"],
        "country": journey["country"],
        "peer_rank_band": PEER_RANK_BAND,
        "rankings": {
            dataset: _ranking_performance(dataset, journey["key"], journey["datasets"].get(dataset, []))
            for dataset in JOURNEY_DATASETS
        },
    }
