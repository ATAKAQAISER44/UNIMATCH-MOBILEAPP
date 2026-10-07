// src/utils/smartMatchSort.js
//
// Sort keys accepted by the backend for Profile Match and Custom Explore
// (python-backend custom_explore_service.sort_result_cards), plus the same
// local sort the web app applies after results arrive
// (web CustomExplorePanel.jsx sortUniversitiesLocally).

export const SMART_SORT_OPTIONS = [
  { value: 'official_rank', label: 'Official Rank' },
  { value: 'tuition', label: 'Tuition' },
  { value: 'living_cost', label: 'Living Cost' },
  { value: 'cgpa', label: 'CGPA' },
  { value: 'acceptance_rate', label: 'Acceptance Rate' },
  { value: 'employability', label: 'Employability' },
];

export const SMART_SORT_ORDER_OPTIONS = [
  { value: 'asc', label: 'Ascending' },
  { value: 'desc', label: 'Descending' },
];

const SUPPORTED_SORT_KEYS = new Set(SMART_SORT_OPTIONS.map((item) => item.value));

// Old saved searches may still hold keys the backend ignores.
const LEGACY_SORT_KEYS = {
  tuition_fee: 'tuition',
  graduate_employability_rate: 'employability',
  smart_rank: 'official_rank',
  personalized_score: 'official_rank',
};

export function normalizeSortKey(value) {
  if (SUPPORTED_SORT_KEYS.has(value)) return value;
  return LEGACY_SORT_KEYS[value] || 'official_rank';
}

function toNumber(value) {
  if (value === null || value === undefined || value === '') return null;

  const cleaned = String(value)
    .replace(/,/g, '')
    .replace(/%/g, '')
    .replace(/USD/gi, '')
    .replace(/\$/g, '')
    .trim();

  const match = cleaned.match(/-?\d+(?:\.\d+)?/);
  if (!match) return null;

  const parsed = Number(match[0]);
  return Number.isFinite(parsed) ? parsed : null;
}

function getEvidence(item, key) {
  return item?.evidence?.[key]?.university ?? null;
}

function getRawValue(item, keys = []) {
  const raw = item?.raw || {};

  for (const key of keys) {
    if (raw[key] !== undefined && raw[key] !== null && raw[key] !== '') {
      return raw[key];
    }
  }

  return null;
}

const RAW_KEYS = {
  official_rank: ['Rank', 'rank', 'Overall Rank', 'overall_rank'],
  tuition: [
    'Tuition (International)',
    'Tuition_International',
    'Tuition_Fee_international',
    'tuition_fee_international',
    'tuition_international',
  ],
  living_cost: [
    'Living Cost (Annual)',
    'Living_Cost_Annual',
    'Living_Cost',
    'living_cost',
    'cost_of_living',
  ],
  cgpa: [
    'Minimum CGPA Requirement',
    'Minimum_CGPA_Requirement',
    'minimum_cgpa_requirement',
    'cgpa_requirement',
    'minimum_cgpa',
  ],
  acceptance_rate: [
    'Acceptance Rate',
    'Acceptance_Rate',
    'acceptance_rate',
    'Admission Rate',
    'Admission_Rate',
    'admission_rate',
  ],
  employability: [
    'Graduate Employability Rate',
    'Graduate_Employability_Rate',
    'graduate_employability_rate',
    'Employability Rate',
    'Employability_Rate',
    'employability',
  ],
};

function getSortNumber(item, sortBy) {
  if (sortBy === 'official_rank') {
    return (
      toNumber(item?.official_rank_number) ??
      toNumber(item?.official_rank) ??
      toNumber(getRawValue(item, RAW_KEYS.official_rank))
    );
  }

  if (RAW_KEYS[sortBy]) {
    return toNumber(getEvidence(item, sortBy)) ?? toNumber(getRawValue(item, RAW_KEYS[sortBy]));
  }

  return toNumber(item?.official_rank_number);
}

// Missing values always go last, whatever the order.
export function sortUniversitiesLocally(items = [], sortBy = 'official_rank', sortOrder = 'asc') {
  const safeItems = Array.isArray(items) ? items : [];
  const key = normalizeSortKey(sortBy);
  const direction = sortOrder === 'desc' ? -1 : 1;

  return safeItems
    .map((item) => ({ item, value: getSortNumber(item, key) }))
    .sort((a, b) => {
      const aMissing = a.value === null || Number.isNaN(a.value);
      const bMissing = b.value === null || Number.isNaN(b.value);

      if (aMissing && bMissing) return 0;
      if (aMissing) return 1;
      if (bMissing) return -1;
      if (a.value === b.value) return 0;
      return a.value > b.value ? direction : -direction;
    })
    .map((entry) => entry.item);
}
