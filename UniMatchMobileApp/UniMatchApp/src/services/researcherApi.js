// src/services/researcherApi.js
//
// Every Researcher call to the FastAPI backend (/researcher/* routes, see
// python-backend/app/researcher/router.py). Uses the shared api.js layer, so
// requests get the same timeouts, timing logs and error messages as the
// rest of the app.

import { apiGet, apiPost, getApiErrorMessage, HEAVY_TIMEOUT_MS } from './api';

// Matches the server-side page_size cap in paginate_df.
const MAX_PAGE_SIZE = 100;

function buildQuery(params = {}) {
  const parts = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null && value !== '' && value !== 'All')
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);

  return parts.length ? `?${parts.join('&')}` : '';
}

async function unwrap(promise, fallback) {
  let response;

  try {
    response = await promise;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, fallback));
  }

  if (!response.ok) {
    throw new Error(getApiErrorMessage(response.data, fallback));
  }

  return response.data || {};
}

export function fetchResearcherDataset(dataset, params = {}) {
  return unwrap(
    apiGet(`/researcher/datasets/${dataset}${buildQuery(params)}`),
    'Dataset could not be loaded.'
  );
}

export function fetchResearcherStatistics(dataset, params = {}) {
  return unwrap(
    apiGet(`/researcher/statistics/${dataset}${buildQuery(params)}`, {
      timeoutMs: HEAVY_TIMEOUT_MS,
    }),
    'Statistics could not be loaded. Please make sure the backend is running.'
  );
}

export function runWeightAnalysis(dataset, body) {
  return unwrap(
    apiPost(`/researcher/weight-analysis/${dataset}`, body, { timeoutMs: HEAVY_TIMEOUT_MS }),
    'Unable to run weight analysis.'
  );
}

export function runRankStability(dataset, body) {
  return unwrap(
    apiPost(`/researcher/weight-analysis/${dataset}/stability`, body, {
      timeoutMs: HEAVY_TIMEOUT_MS,
    }),
    'Unable to run the stability test.'
  );
}

export function searchJourneyUniversities(query) {
  return unwrap(
    apiGet(`/researcher/university-journey/search${buildQuery({ q: query })}`),
    'University search failed.'
  );
}

export function fetchUniversityJourney(key) {
  return unwrap(
    apiGet(`/researcher/university-journey${buildQuery({ key })}`, {
      timeoutMs: HEAVY_TIMEOUT_MS,
    }),
    'Unable to load university journey.'
  );
}

export function fetchAttributesExplorer(params = {}) {
  return unwrap(
    apiGet(`/researcher/attributes/explore${buildQuery(params)}`),
    'Unable to load university attributes.'
  );
}

// Returns null when the university has no attribute data (404), like the web.
export async function fetchUniversityAttributes(name, country) {
  try {
    const response = await apiGet(`/researcher/attributes${buildQuery({ name, country })}`);
    return response.ok ? response.data : null;
  } catch {
    return null;
  }
}

// Fetches every page of a paginated /researcher/* list endpoint and joins the
// results. Used by "export complete dataset" actions, because the backend
// caps page_size at 100.
export async function fetchAllPages(fetchPage) {
  const first = await fetchPage(1, MAX_PAGE_SIZE);
  let results = first.results || [];
  const totalPages = first.total_pages || 1;

  if (totalPages > 1) {
    const pages = await Promise.all(
      Array.from({ length: totalPages - 1 }, (_, index) => fetchPage(index + 2, MAX_PAGE_SIZE))
    );

    pages.forEach((page) => {
      results = results.concat(page.results || []);
    });
  }

  return results;
}
