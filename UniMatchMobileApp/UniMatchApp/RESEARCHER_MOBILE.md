# Researcher features (mobile)

The Researcher stakeholder requirements from the UniMatch web app
(`frontend-updated/src/researcher`) are available in the mobile app.

## Setup
1. `npm install` (adds `expo-print`, used for the Research Report PDF).
2. Start the backend from `python-backend` as usual:
   `uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload`

## Screens (all reachable from the researcher menu ☰ / ▦)
| Screen | Route | Backend |
|---|---|---|
| Researcher Dashboard | `Dashboard` (role = Researcher) | – |
| Dataset Explorer | `ResearcherDataset` | `GET /researcher/datasets/{dataset}` |
| Statistics + Relationships (heatmap) | `ResearcherStatistics` | `GET /researcher/statistics/{dataset}` |
| Weight Analysis, Saved Experiments, Rank Stability | `ResearcherWeightAnalysis` | `POST /researcher/weight-analysis/{dataset}` (+ `/stability`) |
| Compare Universities | `ResearcherCompare` | datasets + weight-analysis + `GET /researcher/attributes` |
| University Journey | `ResearcherJourney` | `GET /researcher/university-journey[/search]` |
| Dataset Comparison | `ResearcherDatasetComparison` | `GET /researcher/datasets/{dataset}` |
| Attributes Explorer | `ResearcherAttributes` | `GET /researcher/attributes/explore` |
| Research Report (PDF / CSV) | `ResearcherReport` | statistics + weight-analysis + stability |

Saved experiments are stored on the phone (AsyncStorage key
`unimatch_researcher_experiments`, same shape as the web's localStorage).
CSV/PDF exports open the system share sheet.

## Code
- `src/screens/researcher/` – screens
- `src/components/researcher/` – layout + menu, shared UI, heatmap, stability, saved experiments
- `src/services/researcherApi.js` – API calls (uses `src/services/api.js`)
- `src/utils/researchInsights.js`, `researchReport.js` – ported from the web
- `src/constants/researcherConstants.js` – datasets, official weights, methodology
- `python-backend/app/researcher/`, `app/matching/`, `data/researcher/`, `data/matching/` – backend
