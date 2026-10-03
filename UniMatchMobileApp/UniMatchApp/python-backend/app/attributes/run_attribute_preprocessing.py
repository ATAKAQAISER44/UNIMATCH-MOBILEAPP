import sys
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parents[2]))

from app.attributes.attribute_preprocessor import AttributePreprocessor


if __name__ == "__main__":
    preprocessor = AttributePreprocessor(
        input_path="data/raw/university_attributes.csv",
        output_path="data/processed/university_attributes_processed.csv",
    )

    preprocessor.preprocess()
    print("Attribute preprocessing completed successfully.")