import pandas as pd
from .base_preprocessor import BasePreprocessor


class ARWUPreprocessor(BasePreprocessor):
    """
    ARWU Dataset Preprocessor

    Original dataset columns:
    World Rank, Institute, Country, National/Regional Rank,
    Total Score, Alumni, Award, Hi Ci, N&S, PUB, PCP
    """

    # =============================
    # REQUIRED COLUMNS
    # =============================

    def get_name_column(self) -> str:
        return "Institute"

    def get_country_column(self) -> str | None:
        return "Country"

    def get_city_column(self) -> str | None:
        return None

    def get_duplicate_subset(self) -> list[str]:
        return ["Institute", "Country", "World_Rank"]

    # =============================
    # METRICS (FOR SCORING)
    # =============================

    def get_metric_columns(self, df: pd.DataFrame) -> list[str]:
        return [
            "Total_Score",
            "Alumni",
            "Award",
            "Hi_Ci",
            "NS",
            "PUB",
            "PCP",
        ]

    # =============================
    # NON-METRICS (DO NOT NORMALIZE)
    # =============================

    def get_non_metric_columns(self, df: pd.DataFrame) -> list[str]:
        return [
            "Institute",
            "Country",
            "World_Rank",
            "NationalRegional_Rank",
        ]

    # =============================
    # CUSTOM CLEANING (IMPORTANT)
    # =============================

    def clean_dataset(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Clean column names and fix ARWU-specific issues
        """

        # Fix column names (VERY IMPORTANT)
        df.columns = (
            df.columns.str.strip()
            .str.replace(" ", "_")
            .str.replace("/", "")
            .str.replace("&", "")
        )

        # Rename problematic columns properly
        rename_map = {
            "World_Rank": "World_Rank",
            "Institute": "Institute",
            "Country": "Country",
            "NationalRegional_Rank": "NationalRegional_Rank",
            "Total_Score": "Total_Score",
            "Hi_Ci": "Hi_Ci",
            "NS": "NS",
        }

        df = df.rename(columns=rename_map)

        return df