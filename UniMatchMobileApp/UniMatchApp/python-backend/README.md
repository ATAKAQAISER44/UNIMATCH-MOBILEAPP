# UniMatch backend

Run from this folder:

    python -m venv venv
    .\venv\Scripts\activate        (Windows)   |   source venv/bin/activate (macOS/Linux)
    pip install -r requirements.txt
    uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

Environment switches (optional):
- UNIMATCH_PERF_LOGS=0  turns off the "[PERF] ... in 0.12s" request timing lines
- UNIMATCH_DEBUG=1      prints Smart Match column-detection details

Static CSV data is cached in memory and reloaded automatically when a file
in data/processed changes (no restart needed).

Researcher endpoints (`/researcher/*`, see app/researcher/router.py) use the
historical files in data/researcher and the university name crosswalk in
data/matching. Researcher views are cached the same way as the ranking data.
