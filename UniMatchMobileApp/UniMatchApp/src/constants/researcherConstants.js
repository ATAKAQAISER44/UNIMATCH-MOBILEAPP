// src/constants/researcherConstants.js
//
// Shared configuration for every Researcher screen. Mirrors the web app's
// src/config/rankingMetrics.js and the per-page DATASETS objects so the
// mobile app shows exactly the same indicators, labels and official weights.

export const RESEARCHER_DATASETS = {
  qs: {
    key: 'qs',
    shortName: 'QS',
    title: 'QS World University Rankings',
    description: 'Explore QS universities, indicators and ranking editions.',
    dashboardDescription:
      'Explore QS universities, official ranks, countries, indicators, and ranking methodology.',
    defaultYear: 2027,
    color: '#008C8C',
    logo: require('../../assets/images/logos/qs.png'),
  },
  the: {
    key: 'the',
    shortName: 'THE',
    title: 'Times Higher Education Rankings',
    description: 'Explore universities and indicators from the THE dataset.',
    dashboardDescription:
      'Explore THE universities, official ranks, countries, indicators, and ranking methodology.',
    defaultYear: 2024,
    color: '#55B947',
    logo: require('../../assets/images/logos/the.png'),
  },
  arwu: {
    key: 'arwu',
    shortName: 'ARWU',
    title: 'Academic Ranking of World Universities',
    description: 'Explore universities and indicators from the ARWU dataset.',
    dashboardDescription:
      'Explore ARWU universities, official ranks, countries, indicators, and ranking methodology.',
    defaultYear: 2025,
    color: '#F59E0B',
    logo: require('../../assets/images/logos/arwu.jpg'),
  },
};

export const RESEARCHER_DATASET_KEYS = ['qs', 'the', 'arwu'];

export function resolveDatasetKey(value) {
  const key = String(value || '').toLowerCase();
  return RESEARCHER_DATASETS[key] ? key : 'qs';
}

export function resolveYear(value, datasetKey) {
  const year = Number(value);
  return Number.isFinite(year) && year > 0
    ? year
    : RESEARCHER_DATASETS[resolveDatasetKey(datasetKey)].defaultYear;
}

// Official per-indicator weights, as published by QS / THE / ARWU.
export const RESEARCHER_METRICS = {
  qs: [
    { key: 'Academic_Reputation_Score', label: 'Academic Reputation', weight: '30%' },
    { key: 'Employer_Reputation_Score', label: 'Employer Reputation', weight: '15%' },
    { key: 'Faculty_Student_Score', label: 'Faculty Student Ratio', weight: '10%' },
    { key: 'Citations_per_Faculty_Score', label: 'Citations per Faculty', weight: '20%' },
    { key: 'International_Faculty_Score', label: 'International Faculty Ratio', weight: '5%' },
    { key: 'International_Students_Score', label: 'International Student Ratio', weight: '5%' },
    {
      key: 'International_Research_Network_Score',
      label: 'International Research Network',
      weight: '5%',
    },
    { key: 'Employment_Outcomes_Score', label: 'Employment Outcomes', weight: '5%' },
    { key: 'Sustainability_Score', label: 'Sustainability', weight: '5%' },
  ],
  the: [
    { key: 'scores_teaching', label: 'Teaching', weight: '29.5%' },
    { key: 'scores_research', label: 'Research Environment', weight: '29%' },
    { key: 'scores_citations', label: 'Research Quality / Citations', weight: '30%' },
    { key: 'scores_industry_income', label: 'Industry Income', weight: '4%' },
    { key: 'scores_international_outlook', label: 'International Outlook', weight: '7.5%' },
  ],
  arwu: [
    { key: 'Alumni', label: 'Alumni', weight: '10%' },
    { key: 'Award', label: 'Award', weight: '20%' },
    { key: 'Hi_Ci', label: 'Highly Cited Researchers', weight: '20%' },
    { key: 'NS', label: 'Nature & Science Papers', weight: '20%' },
    { key: 'PUB', label: 'Publications', weight: '20%' },
    { key: 'PCP', label: 'Per Capita Performance', weight: '10%' },
  ],
};

export const RESEARCHER_METHODOLOGY = {
  qs: {
    title: 'QS World University Rankings',
    methodology:
      'QS ranking in UniMatch uses real QS indicators from the processed dataset: academic reputation, employer reputation, faculty-student ratio, citations per faculty, international faculty, international students, international research network, employment outcomes, and sustainability.',
  },
  the: {
    title: 'Times Higher Education Rankings',
    methodology:
      'THE ranking in UniMatch uses real THE indicators from the processed dataset: teaching, research, citations, industry income, and international outlook.',
  },
  arwu: {
    title: 'Academic Ranking of World Universities',
    methodology:
      'ARWU ranking in UniMatch uses real ARWU indicators from the processed dataset: alumni, award, highly cited researchers, Nature & Science papers, publications, and per-capita performance.',
  },
};

export function officialWeightValue(metric) {
  return Number(String(metric?.weight || '0').replace('%', '')) || 0;
}

export function officialMetricLabel(datasetKey, metricKey) {
  const entry = (RESEARCHER_METRICS[datasetKey] || []).find((item) => item.key === metricKey);

  if (entry?.label) return entry.label;

  return String(metricKey || '')
    .split('_')
    .join(' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

// Official default weight per metric key, used to seed the weight controls.
export function officialDefaultWeights(datasetKey, metricKeys) {
  const officialByKey = Object.fromEntries(
    (RESEARCHER_METRICS[datasetKey] || []).map((item) => [item.key, officialWeightValue(item)])
  );

  const values = {};
  let matchedTotal = 0;

  metricKeys.forEach((key) => {
    const weight = officialByKey[key] ?? 0;
    values[key] = weight;
    matchedTotal += weight;
  });

  if (matchedTotal > 0 || !metricKeys.length) return values;

  // Unknown dataset shape: fall back to an equal split so the controls are
  // never stuck at all-zero weights.
  const equalShare = Number((100 / metricKeys.length).toFixed(2));
  metricKeys.forEach((key) => {
    values[key] = equalShare;
  });

  return values;
}

// Curated attribute fields for research comparisons. `direction` says which
// way counts as "better" when highlighting the best value.
export const COMPARE_ATTRIBUTE_FIELDS = [
  { key: 'tuition_fee_local', label: 'Tuition Fee (Local)', direction: 'min' },
  { key: 'tuition_fee_international', label: 'Tuition Fee (International)', direction: 'min' },
  { key: 'living_cost', label: 'Living Cost', direction: 'min' },
  { key: 'scholarship', label: 'Scholarship Available', direction: null },
  { key: 'cgpa_requirement', label: 'Minimum CGPA Requirement', direction: 'min' },
  { key: 'acceptance_rate', label: 'Acceptance Rate', direction: 'max' },
  { key: 'employability_rate', label: 'Graduate Employability Rate', direction: 'max' },
  { key: 'internship', label: 'Internship Available', direction: null },
  { key: 'part_time_job', label: 'Part-Time Job Allowed', direction: null },
  { key: 'language', label: 'Language', direction: null },
  { key: 'public_private', label: 'Public / Private', direction: null },
  { key: 'gender_equality', label: 'Gender Equality (M:F)', direction: null },
  { key: 'degree_level', label: 'Degree Level Offered', direction: null },
  { key: 'region', label: 'Region', direction: null },
];

// Columns of the Attributes Explorer.
export const ATTRIBUTE_EXPLORER_COLUMNS = [
  { key: 'tuition_fee_local', label: 'Tuition (Local)' },
  { key: 'tuition_fee_international', label: 'Tuition (Intl)' },
  { key: 'living_cost', label: 'Living Cost' },
  { key: 'scholarship', label: 'Scholarship' },
  { key: 'cgpa_requirement', label: 'Min. CGPA' },
  { key: 'acceptance_rate', label: 'Acceptance Rate' },
  { key: 'employability_rate', label: 'Employability' },
  { key: 'internship', label: 'Internship' },
  { key: 'part_time_job', label: 'Part-Time Job' },
  { key: 'language', label: 'Language' },
  { key: 'public_private', label: 'Public / Private' },
  { key: 'gender_equality', label: 'Gender Equality' },
  { key: 'degree_level', label: 'Degree Level' },
];

export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

// Researcher screens, in the same groups as the web researcher menu.
export const RESEARCHER_ROUTES = {
  dataset: 'ResearcherDataset',
  statistics: 'ResearcherStatistics',
  weights: 'ResearcherWeightAnalysis',
  compare: 'ResearcherCompare',
  journey: 'ResearcherJourney',
  datasetComparison: 'ResearcherDatasetComparison',
  attributes: 'ResearcherAttributes',
  report: 'ResearcherReport',
};
