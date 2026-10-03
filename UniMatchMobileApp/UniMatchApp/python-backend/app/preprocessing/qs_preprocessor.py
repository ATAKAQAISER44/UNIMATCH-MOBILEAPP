import pandas as pd
from .base_preprocessor import BasePreprocessor


class QSPreprocessor(BasePreprocessor):
    def get_name_column(self) -> str:
        return "Institution_Name"

    def get_country_column(self) -> str | None:
        return "Location"

    def get_city_column(self) -> str | None:
        return None

    def get_duplicate_subset(self) -> list[str]:
        return ["Institution_Name", "Location", "RANK_2025"]

    def get_metric_columns(self, df: pd.DataFrame) -> list[str]:
        return [
            "Academic_Reputation_Score",
            "Employer_Reputation_Score",
            "Faculty_Student_Score",
            "Citations_per_Faculty_Score",
            "International_Faculty_Score",
            "International_Students_Score",
            "International_Research_Network_Score",
            "Employment_Outcomes_Score",
            "Sustainability_Score",
            "Overall_Score",
        ]

    def get_non_metric_columns(self, df: pd.DataFrame) -> list[str]:
        return [
            "Institution_Name",
            "Location",
            "Region",
            "RANK_2025",
            "RANK_2024",
            "SIZE",
            "FOCUS",
            "RES",
            "STATUS",
        ]