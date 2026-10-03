import pandas as pd
from .base_preprocessor import BasePreprocessor


class THEPreprocessor(BasePreprocessor):
    def get_name_column(self) -> str:
        return "name"

    def get_country_column(self) -> str | None:
        return "location"

    def get_city_column(self) -> str | None:
        return None

    def get_duplicate_subset(self) -> list[str]:
        return ["name", "location", "rank"]

    def get_metric_columns(self, df: pd.DataFrame) -> list[str]:
        return [
            "scores_teaching",
            "scores_research",
            "scores_citations",
            "scores_industry_income",
            "scores_international_outlook",
            "scores_overall",
        ]

    def get_non_metric_columns(self, df: pd.DataFrame) -> list[str]:
        return [
            "name",
            "location",
            "rank",
            "rank_order",
            "record_type",
            "member_level",
            "stats_number_students",
            "stats_student_staff_ratio",
            "stats_pc_intl_students",
            "stats_female_male_ratio",
        ]