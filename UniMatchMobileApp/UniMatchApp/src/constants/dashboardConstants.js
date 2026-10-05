
// src/constants/dashboardConstants.js

export const DATASETS = [
  {
    key: 'qs',
    system: 'QS',
    shortTitle: 'QS Rankings',
    title: 'QS World University Rankings',
    description:
      'Reputation, employability, international mix.',
    features: ['Career Focus', 'Employability'],
    color: '#F59E0B',
    lightColor: '#FFF7ED',
  },
  {
    key: 'the',
    system: 'THE',
    shortTitle: 'THE Rankings',
    title: 'Times Higher Education',
    description:
      'Teaching, research and citations.',
    features: ['Teaching Quality', 'Research'],
    color: '#14B8A6',
    lightColor: '#ECFDF5',
  },
  {
    key: 'arwu',
    system: 'ARWU',
    shortTitle: 'ARWU Rankings',
    title: 'Shanghai / ARWU',
    description:
      'Research output, awards and publications.',
    features: ['Research Output', 'Publications'],
    color: '#F43F5E',
    lightColor: '#FFF1F2',
  },
];

export const DEFAULT_RECOMMENDED_DATASET = 'THE';
export const DEFAULT_PRIORITY = 'Balanced Preference';
export const DEFAULT_DEGREE = 'Master';