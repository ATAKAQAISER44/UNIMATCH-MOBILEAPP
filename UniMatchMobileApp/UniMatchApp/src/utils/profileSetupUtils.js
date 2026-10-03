
// src/utils/profileSetupUtils.js

export function sortOptionsAlphabetically(options = []) {
  return [...options].sort((a, b) =>
    String(a).localeCompare(String(b), undefined, {
      sensitivity: 'base',
    })
  );
}

export function sanitizeNonNegative(value) {
  if (value === '') return '';

  const cleanedValue = String(value).replace(/[^0-9.]/g, '');
  const numericValue = Number(cleanedValue);

  if (Number.isNaN(numericValue)) return '';
  if (numericValue < 0) return '0';

  return cleanedValue;
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