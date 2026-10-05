// src/constants/roleConstants.js
//
// Shared constants for the University Administrator and Policymaker screens
// (web: administrator/adminConfig.js, policymaker/policyConfig.js,
// config/rankingDatasets.js).

import { DATASET_ORDER, DATASET_STYLE } from '../components/RankJourneyChart';

export const RANKING_ORDER = DATASET_ORDER;
export const RANKING_STYLE = DATASET_STYLE;
export const RANKINGS = DATASET_ORDER.map((key) => ({ key, ...DATASET_STYLE[key] }));

// Short description of each ranking ("Why the three rankings differ").
export const RANKING_ABOUT = {
  qs: 'Reputation-led: academic and employer surveys, citations and international mix.',
  the: 'Balanced: teaching, research environment, research quality and outlook.',
  arwu: 'Research only: prize winners, highly cited researchers and top journal papers.',
};

// Data status of an attribute value: [badge label, colours].
export const STATUS_STYLE = {
  sourced: ['Sourced', { color: '#047857', backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' }],
  'not verified (estimate)': ['Estimate', { color: '#B45309', backgroundColor: '#FFFBEB', borderColor: '#FDE68A' }],
  'not verified (no source)': ['No source', { color: '#475569', backgroundColor: '#F1F5F9', borderColor: '#E2E8F0' }],
  missing: ['Missing', { color: '#B91C1C', backgroundColor: '#FEF2F2', borderColor: '#FECACA' }],
};

// Recommendation priority badge colours.
export const PRIORITY_STYLE = {
  High: { color: '#B91C1C', backgroundColor: '#FEF2F2', borderColor: '#FECACA' },
  Medium: { color: '#B45309', backgroundColor: '#FFFBEB', borderColor: '#FDE68A' },
  Low: { color: '#475569', backgroundColor: '#F1F5F9', borderColor: '#E2E8F0' },
};

// Indicators each student priority cares about most. In the what-if lens
// these get three times their official weight (Balanced: all equal).
export const PRIORITY_FOCUS = {
  'Career & Employability': { qs: ['Employer_Reputation_Score', 'Employment_Outcomes_Score'], the: ['scores_industry_income'], arwu: ['Alumni'] },
  'Research & Academia': {
    qs: ['Academic_Reputation_Score', 'Citations_per_Faculty_Score', 'International_Research_Network_Score'],
    the: ['scores_research', 'scores_citations'],
    arwu: ['Award', 'Hi_Ci', 'NS', 'PUB'],
  },
  'International Exposure & Diversity': {
    qs: ['International_Faculty_Score', 'International_Students_Score', 'International_Research_Network_Score'],
    the: ['scores_international_outlook'],
    arwu: [],
  },
  'Teaching Quality & Student Support': { qs: ['Faculty_Student_Score'], the: ['scores_teaching'], arwu: ['PCP'] },
  'Balanced Preference': null,
};

// Attribute medians shown for a country, its region and the world.
export const ACCESS_ROWS = [
  ['Tuition Fee (local)', '$'],
  ['Tuition Fee (international)', '$'],
  ['Living Cost', '$'],
  ['Acceptance Rate', '%'],
  ['Graduate Employability Rate', '%'],
  ['Minimum CGPA Requirement', ''],
];

export const formatValue = (value, unit) =>
  value === null || value === undefined
    ? '–'
    : unit === '$'
      ? `$${Math.round(value).toLocaleString()}`
      : `${value}${unit}`;
