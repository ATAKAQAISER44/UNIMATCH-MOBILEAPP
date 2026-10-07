// src/components/app/menuConfig.js
//
// Side-menu items for every role, in the same order as the web app's sidebar
// (components/Navbar.jsx, administrator/adminConfig.js, policymaker/policyConfig.js).
// Each item: { key, label, hint, icon (Ionicons), route, params?, action? }.

import { RESEARCHER_ROUTES } from '../../constants/researcherConstants';

export const STUDENT_ROUTES = {
  saved: 'SavedUniversities',
  compare: 'CompareUniversities',
  shortlist: 'Shortlist',
};

export const ADMIN_ROUTES = {
  performance: 'AdminPerformance',
  profile: 'AdminProfile',
  benchmark: 'AdminBenchmark',
  whatIf: 'AdminWhatIf',
  demand: 'AdminDemand',
  report: 'AdminReport',
};

export const POLICY_ROUTES = {
  country: 'PolicyCountry',
  compare: 'PolicyCompare',
  report: 'PolicyReport',
};

// Also used for the tool cards on the administrator dashboard.
export const ADMIN_TOOLS = [
  { key: 'performance', label: 'Performance', hint: 'Ranks, indicators and trends', icon: 'trending-up-outline', route: ADMIN_ROUTES.performance,
    text: 'Rank in each ranking, every indicator against peers, and the trend over the years.' },
  { key: 'profile', label: 'Profile', hint: 'Fees, admission, support', icon: 'document-text-outline', route: ADMIN_ROUTES.profile,
    text: 'Every practical attribute with its source, compared with your country and similar universities.' },
  { key: 'benchmark', label: 'Benchmarking', hint: 'Compare with peers', icon: 'git-compare-outline', route: ADMIN_ROUTES.benchmark,
    text: 'Side by side with similar, national or aspirational universities, and the gap to a target rank.' },
  { key: 'whatIf', label: 'What-if', hint: 'Weights, priorities, improvements', icon: 'options-outline', route: ADMIN_ROUTES.whatIf,
    text: 'Your rank under different weights and student priorities, and what one improvement would change.' },
  { key: 'demand', label: 'Student demand', hint: 'What students want, advice', icon: 'people-outline', route: ADMIN_ROUTES.demand,
    text: 'What UniMatch students look for, how many you fit, and what to improve first.' },
  { key: 'report', label: 'Report', hint: 'PDF or CSV for leadership', icon: 'document-attach-outline', route: ADMIN_ROUTES.report,
    text: 'One institutional report with every analysis above, ready to share as PDF or CSV.' },
];

// Also used for the tool cards on the policymaker dashboard.
export const POLICY_TOOLS = [
  { key: 'country', label: 'Country analysis', hint: 'Rankings and access', icon: 'earth-outline', route: POLICY_ROUTES.country,
    text: 'Indicator strengths and gaps against the region and the world, the trend, and fees and admission.' },
  { key: 'compare', label: 'Compare countries', hint: 'Up to 4 side by side', icon: 'git-compare-outline', route: POLICY_ROUTES.compare,
    text: 'Ranking presence and student access of up to four countries side by side.' },
  { key: 'report', label: 'Policy report', hint: 'Recommendations, PDF or CSV', icon: 'document-text-outline', route: POLICY_ROUTES.report,
    text: 'Gaps and recommendations for your country, ready to share as PDF or CSV.' },
  { key: 'attributes', label: 'Explore universities', hint: 'Filter by country, type', icon: 'library-outline', route: RESEARCHER_ROUTES.attributes,
    text: "Browse every university's fees, admission and support, filtered by country and type." },
];

const dashboardItem = { key: 'dashboard', label: 'Dashboard', hint: 'Your overview', icon: 'home-outline', route: 'Dashboard' };
// Opens the search modal (AppMenu); tapping a result opens the University page.
const searchItem = { key: 'search', label: 'Search Universities', hint: 'Find any university', icon: 'search-outline', action: 'search' };

export function researcherGroups(dataset = 'qs', year) {
  const withYear = (params) => (year ? { ...params, year } : params);
  return [
    {
      title: 'Explore data',
      items: [
        { key: 'dataset', label: 'Dataset Explorer', hint: 'Browse QS, THE and ARWU data', icon: 'folder-open-outline', route: RESEARCHER_ROUTES.dataset, params: withYear({ dataset }) },
        { key: 'statistics', label: 'Statistics', hint: 'Average, middle value, missing', icon: 'stats-chart-outline', route: RESEARCHER_ROUTES.statistics, params: withYear({ dataset, view: 'summary' }) },
        { key: 'relationships', label: 'Relationships', hint: 'Which scores go together', icon: 'grid-outline', route: RESEARCHER_ROUTES.statistics, params: withYear({ dataset, view: 'relationships' }) },
        { key: 'datasetComparison', label: 'Dataset Comparison', hint: 'QS, THE and ARWU side by side', icon: 'albums-outline', route: RESEARCHER_ROUTES.datasetComparison },
        { key: 'attributes', label: 'Attributes Explorer', hint: 'Fees, scholarships, acceptance', icon: 'library-outline', route: RESEARCHER_ROUTES.attributes },
      ],
    },
    {
      title: 'Analyse & compare',
      items: [
        { key: 'compare', label: 'Compare Universities', hint: 'Up to 3, every indicator', icon: 'git-compare-outline', route: RESEARCHER_ROUTES.compare, params: withYear({ dataset }) },
        { key: 'journey', label: 'University Journey', hint: 'Rank over the years', icon: 'trending-up-outline', route: RESEARCHER_ROUTES.journey },
        { key: 'weights', label: 'Weight Analysis', hint: 'Change weights, see new ranks', icon: 'options-outline', route: RESEARCHER_ROUTES.weights, params: withYear({ dataset, section: 'weights' }) },
        { key: 'stability', label: 'Rank Stability', hint: 'How much ranks move', icon: 'pulse-outline', route: RESEARCHER_ROUTES.weights, params: withYear({ dataset, section: 'rank-stability' }) },
      ],
    },
    {
      title: 'My work',
      items: [
        { key: 'experiments', label: 'Saved Experiments', hint: 'Your saved weight settings', icon: 'save-outline', route: RESEARCHER_ROUTES.weights, params: withYear({ dataset, section: 'saved-experiments' }) },
        { key: 'report', label: 'Research Report', hint: 'Full write-up, PDF or CSV', icon: 'document-text-outline', route: RESEARCHER_ROUTES.report },
      ],
    },
  ];
}

// Groups shown in the side menu for a role key (see services/userRole.js).
export function menuGroupsFor(roleKey, context = {}) {
  if (roleKey === 'researcher') {
    return [{ title: '', items: [dashboardItem, { key: 'search', label: 'Search Universities', hint: 'Open in Dataset Explorer', icon: 'search-outline', action: 'search' }] },
      ...researcherGroups(context.dataset, context.year)];
  }
  if (roleKey === 'administrator') {
    return [{ title: '', items: [dashboardItem, searchItem] }, { title: 'My university', items: ADMIN_TOOLS }];
  }
  if (roleKey === 'policymaker') {
    return [{ title: '', items: [dashboardItem, searchItem] }, { title: 'My country', items: POLICY_TOOLS }];
  }
  return [
    {
      title: '',
      items: [
        dashboardItem,
        searchItem,
        { key: 'compareUniversities', label: 'Compare Universities', hint: 'Up to 3 side by side', icon: 'git-compare-outline', route: STUDENT_ROUTES.compare },
        { key: 'saved', label: 'Saved Universities', hint: 'Your saved list', icon: 'bookmark-outline', route: STUDENT_ROUTES.saved },
        { key: 'shortlist', label: 'My Shortlist', hint: 'Chances and total cost', icon: 'ribbon-outline', route: STUDENT_ROUTES.shortlist },
      ],
    },
  ];
}

export const ROLE_LABELS = {
  student: 'STUDENT',
  researcher: 'RESEARCHER',
  administrator: 'ADMINISTRATOR',
  policymaker: 'POLICYMAKER',
};
