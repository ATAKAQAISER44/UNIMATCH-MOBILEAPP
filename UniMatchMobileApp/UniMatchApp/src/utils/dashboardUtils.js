
// src/utils/dashboardUtils.js

export function normalizeDataset(value) {
  return String(value || '').trim().toUpperCase();
}

export function isRecommendedDataset(recommended, datasetKey) {
  return normalizeDataset(recommended) === normalizeDataset(datasetKey);
}

export function getUserPriorities(priority) {
  return [
    priority?.priority_1,
    priority?.priority_2,
    priority?.priority_3,
    priority?.priority_4,
    priority?.priority_5,
    priority?.priority_type,
  ].filter(Boolean);
}