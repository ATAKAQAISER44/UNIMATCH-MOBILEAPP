import sys
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parents[1]))

from app.services.preprocessing_service import run_all_preprocessing

if __name__ == "__main__":
    run_all_preprocessing()
    print("Preprocessing completed successfully.")