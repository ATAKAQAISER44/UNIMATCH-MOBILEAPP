import pandas as pd
from app.attributes.attribute_utils import (
    normalize_positive,
    normalize_negative,
    yes_no_to_score,
    categorical_match_score,
)


class UniversityAttributeScorer:
    def __init__(self, df: pd.DataFrame, user_profile: dict, weights: dict):
        self.df = df.copy()
        self.user_profile = user_profile
        self.weights = weights

    def score_attributes(self) -> pd.DataFrame:
        df = self.df

        df["tuition_fee_local_score"] = normalize_negative(df["tuition_fee_local"])
        df["tuition_fee_international_score"] = normalize_negative(df["tuition_fee_international"])
        df["living_cost_score"] = normalize_negative(df["living_cost"])
        df["cgpa_requirement_score"] = normalize_negative(df["cgpa_requirement"])
        df["acceptance_rate_score"] = normalize_positive(df["acceptance_rate"])
        df["employability_rate_score"] = normalize_positive(df["employability_rate"])
        df["gender_equality_score"] = normalize_positive(df["gender_equality"])

        df["scholarship_score"] = df["scholarship"].apply(yes_no_to_score)
        df["internship_score"] = df["internship"].apply(yes_no_to_score)
        df["part_time_job_score"] = df["part_time_job"].apply(yes_no_to_score)

        df["tests_score"] = df["tests"].apply(
            lambda x: categorical_match_score(self.user_profile.get("tests"), x)
        )
        df["programs_score"] = df["programs"].apply(
            lambda x: categorical_match_score(self.user_profile.get("programs"), x)
        )
        df["degree_level_score"] = df["degree_level"].apply(
            lambda x: categorical_match_score(self.user_profile.get("degree_level"), x)
        )
        df["language_score"] = df["language"].apply(
            lambda x: categorical_match_score(self.user_profile.get("language"), x)
        )
        df["public_private_score"] = df["public_private"].apply(
            lambda x: categorical_match_score(self.user_profile.get("public_private"), x)
        )
        df["country_score"] = df["country"].apply(
            lambda x: categorical_match_score(self.user_profile.get("country"), x)
        )
        df["region_score"] = df["region"].apply(
            lambda x: categorical_match_score(self.user_profile.get("region"), x)
        )

        df["attribute18_score"] = df["attribute18"].apply(
            lambda x: categorical_match_score(self.user_profile.get("attribute18"), x)
        )
        df["attribute19_score"] = df["attribute19"].apply(
            lambda x: categorical_match_score(self.user_profile.get("attribute19"), x)
        )

        score_columns = [
            "tuition_fee_local_score",
            "tuition_fee_international_score",
            "living_cost_score",
            "scholarship_score",
            "cgpa_requirement_score",
            "tests_score",
            "programs_score",
            "degree_level_score",
            "acceptance_rate_score",
            "internship_score",
            "part_time_job_score",
            "employability_rate_score",
            "language_score",
            "public_private_score",
            "gender_equality_score",
            "country_score",
            "region_score",
            "attribute18_score",
            "attribute19_score",
        ]

        df["final_attribute_score"] = sum(
            self.weights[col] * df[col] for col in score_columns
        )

        return df