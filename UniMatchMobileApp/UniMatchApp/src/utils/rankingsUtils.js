
// src/utils/rankingsUtils.js

import {
  COUNTRY_KEYS,
  PERSONALIZED_RANK_KEYS,
  PERSONALIZED_SCORE_KEYS,
  RANK_KEYS,
  UNIVERSITY_NAME_KEYS,
} from '../constants/rankingsConstants';

export function normalizeResults(results = []) {
  return results.map((row) => ({
    ...row,
    raw: row.raw || row,
  }));
}

export function getFirstAvailable(item, keys, fallback = '') {
  for (const key of keys) {
    if (
      item?.[key] !== undefined &&
      item?.[key] !== null &&
      item?.[key] !== ''
    ) {
      return item[key];
    }

    if (
      item?.raw?.[key] !== undefined &&
      item?.raw?.[key] !== null &&
      item?.raw?.[key] !== ''
    ) {
      return item.raw[key];
    }
  }

  return fallback;
}

export function formatKey(key) {
  return String(key || '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function formatValue(key, value) {
  if (value === null || value === undefined) return '';

  const numericValue = Number(value);
  const lowerKey = String(key || '').toLowerCase();

  const shouldNotPercent =
    lowerKey.includes('rank') ||
    lowerKey.includes('fee') ||
    lowerKey.includes('cost') ||
    lowerKey.includes('cgpa') ||
    lowerKey.includes('year') ||
    lowerKey.includes('id');

  if (!Number.isNaN(numericValue) && value !== '' && !shouldNotPercent) {
    if (numericValue >= 0 && numericValue <= 1) {
      return `${(numericValue * 100).toFixed(1)}%`;
    }

    return String(value);
  }

  return String(value);
}

export function getUniName(item) {
  return getFirstAvailable(item, UNIVERSITY_NAME_KEYS, 'Unknown University');
}

export function getCountry(item) {
  return getFirstAvailable(item, COUNTRY_KEYS, 'Unknown Country');
}

export function getOfficialRank(item) {
  return getFirstAvailable(item, RANK_KEYS, '—');
}

export function getPersonalizedRank(item, index) {
  return getFirstAvailable(item, PERSONALIZED_RANK_KEYS, index + 1);
}

export function getPersonalizedScore(item) {
  return getFirstAvailable(item, PERSONALIZED_SCORE_KEYS, '—');
}

// PERF: the key is looked up many times per render (compare/save checks,
// dedupe, list keys) and each lookup scans several name/country fields.
// University objects from the API are never mutated, so the key for a given
// object can be cached. WeakMap entries are freed with the objects.
const universityKeyCache = new WeakMap();

export function getUniversityKey(item) {
  const cacheable = item !== null && typeof item === 'object';

  if (cacheable) {
    const cached = universityKeyCache.get(item);
    if (cached !== undefined) return cached;
  }

  const id = item?.university_id || item?.id || item?.raw?.university_id || '';
  const name = getUniName(item);
  const country = getCountry(item);

  const key = `${String(id).toLowerCase()}|${String(name).toLowerCase()}|${String(
    country
  ).toLowerCase()}`;

  if (cacheable) universityKeyCache.set(item, key);

  return key;
}

export function dedupeUniversities(items = []) {
  const seen = new Set();

  return items.filter((item) => {
    const key = getUniversityKey(item);

    if (seen.has(key)) return false;

    seen.add(key);
    return true;
  });
}

export function formatRank(rank) {
  const cleanRank = String(rank || '—').replace(/^#/, '');
  return cleanRank === '—' ? '—' : `#${cleanRank}`;
}

export function escapeCsv(value) {
  if (value === null || value === undefined) return '';

  if (typeof value === 'object') {
    return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
  }

  return `"${String(value).replace(/"/g, '""')}"`;
}