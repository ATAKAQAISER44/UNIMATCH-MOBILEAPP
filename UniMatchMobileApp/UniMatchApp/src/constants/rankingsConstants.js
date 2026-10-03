

// src/constants/rankingsConstants.js

export const DATASET_CONFIG = {
  qs: {
    label: 'QS',
    title: 'QS Rankings',
    fullTitle: 'QS World University Rankings',
    subtitle: 'Explore and analyze university rankings with personalized tools.',
    color: '#0D9488',
    lightColor: '#ECFDF5',
    accentColor: '#F59E0B',
    icon: 'QS',
    indicators: 9,
    published: 'May 2025',
  },
  the: {
    label: 'THE',
    title: 'THE Rankings',
    fullTitle: 'Times Higher Education Rankings',
    subtitle: 'Explore and analyze university rankings with personalized tools.',
    color: '#0D9488',
    lightColor: '#ECFDF5',
    accentColor: '#14B8A6',
    icon: 'THE',
    indicators: 5,
    published: 'May 2025',
  },
  arwu: {
    label: 'ARWU',
    title: 'ARWU Rankings',
    fullTitle: 'Shanghai / ARWU Rankings',
    subtitle: 'Explore and analyze university rankings with personalized tools.',
    color: '#0D9488',
    lightColor: '#ECFDF5',
    accentColor: '#F43F5E',
    icon: 'ARWU',
    indicators: 6,
    published: 'May 2025',
  },
};

export const DATASET_INFO = {
  qs: {
    title: 'QS World University Rankings',
    methodology:
      'QS ranking in UniMatch uses academic reputation, employer reputation, faculty-student ratio, citations per faculty, international faculty, international students, international research network, employment outcomes, and sustainability.',
  },
  the: {
    title: 'Times Higher Education Rankings',
    methodology:
      'THE ranking in UniMatch uses teaching, research, citations, industry income, and international outlook.',
  },
  arwu: {
    title: 'Academic Ranking of World Universities',
    methodology:
      'ARWU ranking in UniMatch uses alumni, award, highly cited researchers, Nature & Science papers, publications, and per-capita performance.',
  },
};

export const TABS = [
  { key: 'official', icon: '🏅', label: 'Official' },
  { key: 'smart', icon: '⚡', label: 'Smart' },
  { key: 'my', icon: '⚙️', label: 'My Rank' },
  { key: 'saved', icon: '⭐', label: 'Saved' },
];

export const ROW_OPTIONS = [10, 20, 50, 100];
export const ALL_COUNTRIES = 'All Countries';

export const UNIVERSITY_NAME_KEYS = [
  'name',
  'Name',
  'university',
  'university_name',
  'institution',
  'Institution_Name',
  'Institution Name',
];

export const COUNTRY_KEYS = [
  'country',
  'Country',
  'location',
  'Location',
  'region',
  'Region',
];

export const RANK_KEYS = [
  'official_rank',
  'rank',
  'world_rank',
  'global_rank',
  'Rank',
  'RANK_2025',
];

export const PERSONALIZED_RANK_KEYS = [
  'personalized_rank',
  'my_rank',
  'rank_position',
  'current_rank',
];

export const PERSONALIZED_SCORE_KEYS = [
  'personalized_score',
  'final_score',
  'score',
  'match_score',
];

export const EXCLUDED_DETAIL_KEYS = new Set([
  'raw',
  'name',
  'Name',
  'university',
  'university_name',
  'institution',
  'Institution_Name',
  'country',
  'location',
  'Country',
]);