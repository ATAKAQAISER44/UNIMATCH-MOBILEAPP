// src/services/universitySearch.js
//
// University lookups shared by the student search, Compare Universities, the
// university page and the compare popup (web: Navbar search,
// CompareUniversitiesPage, UniversityIntroPage). All use the existing
// GET /rankings/{dataset}/export endpoint.

import { apiGet, getApiErrorMessage, HEAVY_TIMEOUT_MS } from './api';

export const RANKING_KEYS = ['qs', 'the', 'arwu'];

// Same identity rule as the web Saved page: lower case, common words shortened,
// punctuation dropped, so "The University of X" and "University of X" match.
export function normalizeIdentity(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\buniversity\b/g, 'univ')
    .replace(/\bcollege\b/g, 'coll')
    .replace(/\binstitute\b|\binstitution\b/g, 'inst')
    .replace(/\bthe\b|\band\b|&/g, ' ')
    .replace(/[^a-z0-9]/g, '');
}

export function identityKey(name, country) {
  return `${normalizeIdentity(name)}|${normalizeIdentity(country)}`;
}

async function exportRows(dataset, params = {}) {
  const query = Object.entries(params)
    .filter(([, value]) => value)
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    .join('&');
  const path = `/rankings/${dataset}/export${query ? `?${query}` : ''}`;
  const response = await apiGet(path, { timeoutMs: HEAVY_TIMEOUT_MS });
  if (!response.ok) throw new Error(getApiErrorMessage(response.data, 'Universities could not be loaded.'));
  return (response.data?.results || []).map((row) => ({ ...row, dataset, source_dataset: dataset }));
}

// Search all three rankings; one entry per university (first ranking wins),
// sorted A-Z, each with the list of rankings it appears in.
export async function searchAllRankings(text) {
  const settled = await Promise.allSettled(RANKING_KEYS.map((key) => exportRows(key, { search: text })));
  const merged = new Map();
  settled.forEach((result) => {
    if (result.status !== 'fulfilled') return;
    result.value.forEach((row) => {
      const key = normalizeIdentity(row.name);
      if (!key) return;
      const existing = merged.get(key);
      if (existing) {
        if (!existing.datasets_found.includes(row.dataset)) existing.datasets_found.push(row.dataset);
      }
      else merged.set(key, { ...row, datasets_found: [row.dataset] });
    });
  });
  if (!merged.size && settled.every((result) => result.status === 'rejected')) {
    throw settled[0].reason;
  }
  return [...merged.values()].sort((a, b) => String(a.name).localeCompare(String(b.name)));
}

// Every university of all three rankings (Compare Universities). Loaded once
// per session because the full lists are large.
let allPromise = null;
export function loadAllUniversities({ force = false } = {}) {
  if (!allPromise || force) {
    allPromise = (async () => {
      const lists = await Promise.all(RANKING_KEYS.map((key) => exportRows(key)));
      const merged = new Map();
      lists.flat().forEach((row) => {
        const key = normalizeIdentity(row.name);
        if (!key) return;
        const existing = merged.get(key);
        if (existing) {
          if (existing.datasets_found.includes(row.dataset)) return;
          existing.datasets_found.push(row.dataset);
          existing.ranks[row.dataset] = row.official_rank;
        } else {
          merged.set(key, { ...row, datasets_found: [row.dataset], ranks: { [row.dataset]: row.official_rank } });
        }
      });
      return [...merged.values()].sort((a, b) => String(a.name).localeCompare(String(b.name)));
    })().catch((error) => {
      allPromise = null;
      throw error;
    });
  }
  return allPromise;
}

// One university's row in each ranking (university page). Picks the closest
// name (and country) match from each ranking's search results.
export async function findUniversityInRankings(name, country) {
  const target = normalizeIdentity(name);
  const targetCountry = normalizeIdentity(country);
  const settled = await Promise.allSettled(RANKING_KEYS.map((key) => exportRows(key, { search: name })));

  const found = {};
  settled.forEach((result, index) => {
    if (result.status !== 'fulfilled') return;
    const rows = result.value;
    const exact = rows.filter((row) => normalizeIdentity(row.name) === target);
    const pool = exact.length ? exact : [];
    const best =
      pool.find((row) => !targetCountry || normalizeIdentity(row.country) === targetCountry) || pool[0] || null;
    if (best) found[RANKING_KEYS[index]] = best;
  });
  return found;
}
