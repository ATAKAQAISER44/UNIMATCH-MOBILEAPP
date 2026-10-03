from pathlib import Path
import re
import hashlib
import pandas as pd
import numpy as np


class AttributePreprocessor:
    def __init__(self, input_path: str, output_path: str):
        self.input_path = Path(input_path)
        self.output_path = Path(output_path)

    def load_csv(self) -> pd.DataFrame:
        try:
            return pd.read_csv(self.input_path, encoding="utf-8")
        except UnicodeDecodeError:
            return pd.read_csv(self.input_path, encoding="latin1")

    def standardize_column_names(self, df: pd.DataFrame) -> pd.DataFrame:
        df = df.copy()
        cleaned_columns = []

        for col in df.columns:
            col = str(col).strip()
            col = re.sub(r"\s+", "_", col)
            col = re.sub(r"[^\w_]", "", col)
            cleaned_columns.append(col)

        df.columns = cleaned_columns
        return df

    def clean_text_value(self, value):
        if pd.isna(value):
            return np.nan

        value = str(value).strip()

        if value.lower() in {"", "n/a", "na", "null", "none", "-"}:
            return np.nan

        value = re.sub(r"\s+", " ", value)
        return value

    def clean_text_columns(self, df: pd.DataFrame) -> pd.DataFrame:
        df = df.copy()
        object_cols = df.select_dtypes(include=["object"]).columns

        for col in object_cols:
            df[col] = df[col].apply(self.clean_text_value)

        return df

    def convert_numeric_series(self, series: pd.Series) -> pd.Series:
        return pd.to_numeric(
            series.astype(str)
            .str.replace(",", "", regex=False)
            .str.replace("%", "", regex=False)
            .str.strip(),
            errors="coerce",
        )

    def create_university_id(self, row: pd.Series) -> str:
        name = str(row.get("university_name", "") or "").strip().lower()
        country = str(row.get("country", "") or "").strip().lower()
        city = str(row.get("city", "") or "").strip().lower()

        raw_key = f"attributes|{name}|{country}|{city}"
        hash_part = hashlib.md5(raw_key.encode("utf-8")).hexdigest()[:12]
        return f"attr_{hash_part}"

    def preprocess(self) -> pd.DataFrame:
        df = self.load_csv()
        df = self.standardize_column_names(df)
        df = self.clean_text_columns(df)

        # Remove exact duplicates
        df = df.drop_duplicates()

        # Remove likely duplicate universities if these columns exist
        duplicate_subset = [col for col in ["university_name", "country", "city"] if col in df.columns]
        if duplicate_subset:
            df = df.drop_duplicates(subset=duplicate_subset, keep="first")

        # Add university_id
        df["university_id"] = df.apply(self.create_university_id, axis=1)

        # Expected numeric attributes
        numeric_columns = [
            "tuition_fee_local",
            "tuition_fee_international",
            "living_cost",
            "cgpa_requirement",
            "acceptance_rate",
            "employability_rate",
            "gender_equality",
            "scholarship_amount",
        ]

        # Convert numeric-like columns to numeric and fill missing with median
        for col in numeric_columns:
            if col in df.columns:
                df[col] = self.convert_numeric_series(df[col])
                median_value = df[col].median()
                df[col] = df[col].fillna(median_value)

        # Clean yes/no style columns
        yes_no_columns = [
            "scholarship",
            "internship",
            "part_time_job",
        ]

        for col in yes_no_columns:
            if col in df.columns:
                df[col] = df[col].astype(str).str.strip().str.lower()
                df[col] = df[col].replace(
                    {
                        "yes": "yes",
                        "y": "yes",
                        "true": "yes",
                        "1": "yes",
                        "no": "no",
                        "n": "no",
                        "false": "no",
                        "0": "no",
                    }
                )

        # Clean categorical / multi-value columns
        categorical_columns = [
            "tests",
            "programs",
            "degree_level",
            "language",
            "public_private",
            "country",
            "region",
            "attribute18",
            "attribute19",
        ]

        for col in categorical_columns:
            if col in df.columns:
                df[col] = df[col].astype(str).str.strip()

        # Put university_id in front
        final_columns = ["university_id"] + [col for col in df.columns if col != "university_id"]
        df = df[final_columns]

        # Save processed file
        self.output_path.parent.mkdir(parents=True, exist_ok=True)
        df.to_csv(self.output_path, index=False)

        return df