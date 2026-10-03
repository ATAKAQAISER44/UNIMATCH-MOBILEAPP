# UniMatch – Performance Diagnosis & Fixes

## Top 5 bottlenecks (in order of impact)

| # | Issue | Where | Why it was slow | Severity | Fix |
|---|-------|-------|-----------------|----------|-----|
| 1 | Hard-coded, outdated backend IP + no request timeout | `src/constants/index.js`, all screens | App called `10.135.64.243` while the laptop was `192.168.131.162`. React Native `fetch` on Android has no timeout, so every call hung until the OS gave up (minutes). Dashboard waited on one of these before leaving its loader. | High | IP auto-detected from Expo (`src/services/apiConfig.js`); every request has a 8–30 s timeout and a clear error (`src/services/api.js`) |
| 2 | Rankings screen reload loop | `RankingsScreen.js` → `loadInitial` | `loadInitial` depended on search, country, rows-per-page and tab, so each keystroke / tab switch reloaded summary + countries + list behind a full-screen loader. The list was also fetched twice on open. | High | `loadInitial` now depends only on the dataset; debounced effect skips the duplicate first fetch; stale responses are ignored |
| 3 | My Ranking returned every university | `my_ranking_service.py` | App sends `top_n: 50`, backend ignored it and serialized 1,100–2,600 rows (up to 10.3 MB JSON) | High | `top_n` honoured after scoring the full table – the top 50 are identical |
| 4 | CSV re-read and re-prepared on every request | `ranking_service.py`, `profile_smart_match_service.py`, `my_ranking_service.py`, `attribute_range_service.py`, `main.py` | `pd.read_csv` + rank cleaning + attribute merge repeated per call | Medium | mtime-keyed in-memory cache (`data_cache.py`) + warm-up at startup |
| 5 | Row filters rebuilt DataFrames from Python lists | `apply_filter`, `apply_custom_filters` | `pd.DataFrame(list_of_rows)` per filter step | Medium | Same row checks, selection via boolean mask |

## Other findings

| Issue | File | Severity | Fix |
|-------|------|----------|-----|
| `supabase.auth.getUser()` (network call) on every screen open | 7 screens/components | Medium | `getSignedInUser()` reads the local session first (`src/services/session.js`) |
| 4 profile queries run one after another before My Ranking | `RankingsScreen.loadCurrentProfile` | Medium | `Promise.all` |
| Summary/countries loaded before the list instead of alongside | `RankingsScreen.loadInitial` | Low | All 5 loads in parallel |
| Profile Setup "ranges" call could block the form | `ProfileSetupScreen.fetchRanges` | Medium | 8 s timeout |
| Profile View showed full-screen loader on every focus | `ProfileViewScreen` | Low | Loader only on first load, silent refresh afterwards |
| FlatList rendered all 50–100 rows at once | `RankingsScreen` | Low | `initialNumToRender` / `windowSize` |
| Debug `print` on every Smart Match request | `profile_smart_match_service.py` | Low | Only with `UNIMATCH_DEBUG=1` |
| Moved `venv` (hard-coded old path), empty `requirements.txt`, wrong `uvicorn main:app` in docs | backend | Dev env | Recreate venv, `requirements.txt` filled, docs fixed |

Not bottlenecks (checked, left unchanged): Supabase queries already filter by
`user_id`/`id` and run in parallel on Dashboard, Profile View, Profile Setup
and Smart Match; endpoints are sync `def`, so FastAPI already runs them in a
thread pool; AppNavigator uses one `getSession()`; no duplicate auth listeners.

## Measured backend results (same 89 test requests)

| Endpoint | Before avg / max | After avg / max |
|----------|------------------|-----------------|
| `/rankings/{ds}` list | 110 / 134 ms | 42 / 122 ms (first call warms cache) |
| `/rankings/{ds}/export` | 111 / 120 ms | 16 / 29 ms |
| `/rankings/{ds}/smart-match` | 313 / 592 ms | 192 / 363 ms |
| `/rankings/{ds}/my-ranking` | 1,116 / 2,302 ms | 172 / 366 ms |
| `/rankings/{ds}/custom-explore` | 203 / 466 ms | 86 / 216 ms |
| My Ranking largest response | 10.3 MB | 0.29 MB |

Correctness check: all 89 responses compared field-by-field against the
original backend. Universities, ranks, scores, filter statistics, ordering
and evidence are identical. Only differences: My Ranking returns the
requested top 50 (identical to the first 50 before), and display sentences
(messages / reasons / labels) were reworded.

## Temporary development logs

| Log | Where | How to turn off |
|-----|-------|-----------------|
| `[API] GET /rankings/qs 200 in 143ms` | `src/services/api.js` | Automatic: only in development (`__DEV__`) |
| `[API] Backend URL: ...` | `src/services/apiConfig.js` | Automatic: only in development |
| `[PERF] GET /rankings/qs 200 in 0.04s` | `python-backend/app/main.py` | `UNIMATCH_PERF_LOGS=0` or set `PERF_LOGS = False` |
| `[STARTUP] Datasets cached in ...` | `main.py` | One line at startup; keep or delete |
