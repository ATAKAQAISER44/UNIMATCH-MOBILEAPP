// src/services/api.js
//
// One place for every call to the FastAPI backend.
//
// Why this exists (performance):
// - React Native's fetch() has NO timeout on Android. When the backend IP is
//   wrong or the laptop firewall blocks port 8000, a request can hang for
//   minutes before failing. Every request here is aborted after a timeout,
//   so screens fail fast and show a clear message instead of spinning forever.
// - In development, every request is timed:  [API] GET /rankings/qs 200 in 143ms
//   so you can see whether a slow screen is caused by the backend or the app.

import { API_BASE_URL } from './apiConfig';

export { API_BASE_URL };

// Normal reads (summary, list, countries) should be fast on local Wi-Fi.
export const DEFAULT_TIMEOUT_MS = 15000;
// Personalised calculations (My Ranking, Smart Match) do more work.
export const HEAVY_TIMEOUT_MS = 30000;

const SHOW_API_TIMING_LOGS = __DEV__;

export function getBackendUnreachableMessage() {
  return (
    `Cannot reach the UniMatch server (${API_BASE_URL}). ` +
    'Make sure the backend is running and your phone and laptop are on the same Wi-Fi.'
  );
}

function buildError(message, extra = {}) {
  const error = new Error(message);
  Object.assign(error, extra);
  return error;
}

async function request(path, { method = 'GET', body, timeoutMs } = {}) {
  const url = path.startsWith('http') ? path : `${API_BASE_URL}${path}`;
  const limit = timeoutMs || DEFAULT_TIMEOUT_MS;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), limit);
  const startedAt = Date.now();
  const label = `${method} ${path.split('?')[0]}`;

  try {
    const response = await fetch(url, {
      method,
      headers:
        body === undefined
          ? { Accept: 'application/json' }
          : { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    });

    let data = null;

    try {
      data = await response.json();
    } catch {
      data = null;
    }

    if (SHOW_API_TIMING_LOGS) {
      console.log(
        `[API] ${label} ${response.status} in ${Date.now() - startedAt}ms`
      );
    }

    return { ok: response.ok, status: response.status, data };
  } catch (error) {
    const timedOut = error?.name === 'AbortError';

    if (SHOW_API_TIMING_LOGS) {
      console.log(
        `[API] ${label} FAILED after ${Date.now() - startedAt}ms` +
          (timedOut ? ' (timeout)' : `: ${error?.message || error}`)
      );
    }

    throw buildError(
      timedOut
        ? `The server took too long to respond (over ${Math.round(limit / 1000)}s). Please try again.`
        : getBackendUnreachableMessage(),
      { isNetworkError: true, isTimeout: timedOut, cause: error }
    );
  } finally {
    clearTimeout(timer);
  }
}

export function apiGet(path, options = {}) {
  return request(path, { ...options, method: 'GET' });
}

export function apiPost(path, body, options = {}) {
  return request(path, { ...options, method: 'POST', body: body ?? {} });
}

// Turns any thrown error or FastAPI error body into a sentence for the UI.
export function getApiErrorMessage(errorOrData, fallback) {
  if (errorOrData?.isNetworkError) return errorOrData.message;

  const detail = errorOrData?.detail;

  if (typeof detail === 'string' && detail.trim()) return detail;

  if (Array.isArray(detail) && detail.length) {
    return detail.map((item) => item?.msg || String(item)).join(' ');
  }

  if (typeof errorOrData?.message === 'string' && errorOrData.message) {
    return errorOrData.message;
  }

  return fallback;
}
