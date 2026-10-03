from app.preprocessing.qs_preprocessor import QSPreprocessor
from app.preprocessing.the_preprocessor import THEPreprocessor
from app.preprocessing.arwu_preprocessor import ARWUPreprocessor


def run_all_preprocessing():
    qs = QSPreprocessor(
        input_path="data/raw/qs.csv",
        output_path="data/processed/qs_normalized.csv",
        dataset_name="qs",
    )

    the = THEPreprocessor(
        input_path="data/raw/the.csv",
        output_path="data/processed/the_normalized.csv",
        dataset_name="the",
    )

    arwu = ARWUPreprocessor(
        input_path="data/raw/arwu.csv",
        output_path="data/processed/arwu_normalized.csv",
        dataset_name="arwu",
    )

    qs.preprocess()
    the.preprocess()
    arwu.preprocess()