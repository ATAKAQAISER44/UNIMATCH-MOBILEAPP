from abc import ABC, abstractmethod
from pathlib import Path
import pandas as pd

from .utils import (
    standardize_column_names,
    clean_text_columns,
    convert_numeric_series,
    create_university_id,
    min_max_normalize,
)


class BasePreprocessor(ABC):
    def __init__(self, input_path: str, output_path: str, dataset_name: str):
        self.input_path = Path(input_path)
        self.output_path = Path(output_path)
        self.dataset_name = dataset_name

    @abstractmethod
    def get_name_column(self) -> str:
        pass

    @abstractmethod
    def get_country_column(self) -> str | None:
        pass

    @abstractmethod
    def get_city_column(self) -> str | None:
        pass

    @abstractmethod
    def get_metric_columns(self, df: pd.DataFrame) -> list[str]:
        pass

    @abstractmethod
    def get_non_metric_columns(self, df: pd.DataFrame) -> list[str]:
        pass

    @abstractmethod
    def get_duplicate_subset(self) -> list[str]:
        pass

    def load_csv(self) -> pd.DataFrame:
        try:
            return pd.read_csv(self.input_path, encoding="utf-8")
        except UnicodeDecodeError:
            return pd.read_csv(self.input_path, encoding="latin1")

    def preprocess(self) -> pd.DataFrame:
        df = self.load_csv()
        df = standardize_column_names(df)
        df = clean_text_columns(df)

        df = df.drop_duplicates()
        subset_cols = [col for col in self.get_duplicate_subset() if col in df.columns]
        if subset_cols:
            df = df.drop_duplicates(subset=subset_cols, keep="first")

        name_col = self.get_name_column()
        country_col = self.get_country_column()
        city_col = self.get_city_column()

        df["university_id"] = df.apply(
            lambda row: create_university_id(
                dataset_name=self.dataset_name,
                row=row,
                name_col=name_col,
                country_col=country_col,
                city_col=city_col,
            ),
            axis=1,
        )

        metric_columns = [col for col in self.get_metric_columns(df) if col in df.columns]
        non_metric_columns = [col for col in self.get_non_metric_columns(df) if col in df.columns]

        for col in metric_columns:
            df[col] = convert_numeric_series(df[col])
            median_value = df[col].median()
            df[col] = df[col].fillna(median_value)
            df[col] = min_max_normalize(df[col])

        final_columns = ["university_id"] + [
            col for col in non_metric_columns + metric_columns if col != "university_id"
        ]

        df = df[final_columns]
        self.output_path.parent.mkdir(parents=True, exist_ok=True)
        df.to_csv(self.output_path, index=False)
        return df