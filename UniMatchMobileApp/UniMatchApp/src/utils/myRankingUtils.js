
// src/utils/myRankingUtils.js

export function createDefaultRankingWeights(metricConfig = []) {
  const values = {};

  metricConfig.forEach((metric) => {
    values[metric.key] =
      Number(String(metric.weight || '0').replace('%', '')) || 0;
  });

  return values;
}

export function clampNumber(value, min = 0, max = 100) {
  const number = Number(String(value || '').replace(/[^0-9.]/g, ''));

  if (!Number.isFinite(number)) return min;

  return Math.min(Math.max(number, min), max);
}

export function getLabelByKey(items = [], key) {
  return items.find((item) => item.key === key)?.label || 'Selected';
}

export function formatScore(value) {
  if (value === null || value === undefined || value === '' || value === 'N/A') {
    return 'N/A';
  }

  const number = Number(value);

  if (Number.isNaN(number)) return String(value);

  return number.toFixed(3);
}

export function formatSavedDate(value) {
  if (!value) return 'Saved date unavailable';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return 'Saved date unavailable';

  return date.toLocaleString();
}

export function buildResultsPreview(rows = []) {
  return rows.slice(0, 10).map((uni) => ({
    university_id: uni?.university_id || uni?.id || '',
    name: uni?.name || uni?.university_name || 'University',
    country: uni?.country || '',
    my_rank: uni?.my_rank || uni?.current_rank || '',
    official_rank: uni?.official_rank || '',
    final_score: uni?.final_score ?? '',
    ranking_score: uni?.ranking_score ?? '',
    attribute_score: uni?.attribute_score ?? '',
  }));
}