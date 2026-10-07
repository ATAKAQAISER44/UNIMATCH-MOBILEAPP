
// src/utils/profileSetupUtils.js

export function sortOptionsAlphabetically(options = []) {
  return [...options].sort((a, b) =>
    String(a).localeCompare(String(b), undefined, {
      sensitivity: 'base',
    })
  );
}

// Keeps a typed number usable: a comma becomes a dot ("3,5" -> "3.5"), only
// the first dot is kept and any other stray character is dropped (the rest
// of the field stays). A minus sign is dropped too, so it is never negative.
export function sanitizeNonNegative(value) {
  if (value === '' || value === null || value === undefined) return '';

  const cleaned = String(value).replace(/,/g, '.').replace(/[^0-9.]/g, '');
  const firstDot = cleaned.indexOf('.');

  if (firstDot === -1) return cleaned;

  return (
    cleaned.slice(0, firstDot + 1) +
    cleaned.slice(firstDot + 1).replace(/\./g, '')
  );
}

// "Germany, France" (how the web saves several countries) -> ['Germany', 'France'].
export function parseCountryList(value) {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  return String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export function normalizeEducationLevel(level) {
  if (!level) return '';

  const value = String(level).toLowerCase();

  if (
    value.includes('high school') ||
    value.includes('intermediate') ||
    value.includes('a-level')
  ) {
    return 'school';
  }

  if (value.includes('bachelor') || value.includes('bs')) {
    return 'bachelor';
  }

  if (value.includes('master') || value === 'ms') {
    return 'master';
  }

  if (value.includes('phd') || value.includes('doctor')) {
    return 'phd';
  }

  return value;
}

export function getSupabaseError(results = []) {
  return results.find((result) => result?.error)?.error || null;
}
// Intended degree in the values the web app and the backend use ("Bachelor",
// "Master", "MS leading to PhD", "PhD"). Older mobile profiles saved "BS" /
// "MS"; those are converted when read, so every endpoint gets the same value
// (the student plan uses it for the number of years).
export function normalizeIntendedLevel(value) {
  const text = String(value || '').trim();
  if (!text) return '';
  const lower = text.toLowerCase().replace(/[’]/g, "'");
  const compact = lower.replace(/[^a-z0-9]+/g, '');
  if (lower.includes('leading') && lower.includes('phd')) return 'MS leading to PhD';
  if (lower.includes('phd') || lower.includes('doctor')) return 'PhD';
  if (lower.includes('bachelor') || lower.includes('undergraduate') || ['b', 'ba', 'bs', 'bsc', 'beng'].includes(compact)) return 'Bachelor';
  if (lower.includes('master') || lower.includes('postgraduate') || ['m', 'ma', 'ms', 'msc', 'mphil', 'mba'].includes(compact)) return 'Master';
  return text;
}
