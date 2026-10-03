
// src/constants/profileSetupConstants.js

export const STEP_META = [
  {
    step: 1,
    title: 'Academic',
    icon: '🎓',
    sectionTitle: 'Academic Background',
  },
  {
    step: 2,
    title: 'Location',
    icon: '🌐',
    sectionTitle: 'Geographic Preferences',
  },
  {
    step: 3,
    title: 'Budget',
    icon: '💳',
    sectionTitle: 'Financial Constraints',
  },
  {
    step: 4,
    title: 'Priority',
    icon: '⭐',
    sectionTitle: 'Priority Selection',
  },
];

export const SCORE_TYPE_OPTIONS = ['CGPA', 'Percentage'];
export const CGPA_SCALE_OPTIONS = ['Out of 4', 'Out of 5', 'Out of 8', 'Out of 10'];

export const LANGUAGE_PROFICIENCY_TESTS = [
  'Duolingo English Test',
  'IELTS',
  'PTE',
  'TOEFL',
];

export const EDUCATIONAL_TESTS = ['ACT', 'GATE', 'GMAT', 'GRE', 'SAT'];

export const TEST_CATEGORY_HEADERS = [
  '── Language Proficiency Tests ──',
  '── Educational Tests ──',
];

export const TEST_CATEGORY_OPTIONS = [
  '── Language Proficiency Tests ──',
  ...LANGUAGE_PROFICIENCY_TESTS,
  '── Educational Tests ──',
  ...EDUCATIONAL_TESTS,
];

export const PRIORITY_KEYS = [
  'priority_1',
  'priority_2',
  'priority_3',
  'priority_4',
  'priority_5',
];

export const PRIORITY_LABELS = [
  ['priority_1', 'My 1st Priority'],
  ['priority_2', 'My 2nd Priority'],
  ['priority_3', 'My 3rd Priority'],
  ['priority_4', 'My 4th Priority'],
  ['priority_5', 'My 5th Priority'],
];

export const INITIAL_PICKER = {
  visible: false,
  title: '',
  options: [],
  key: '',
};

export const INITIAL_ACADEMIC = {
  current_education_level: '',
  intended_education_level: '',
  field_of_study: '',
  score_type: '',
  score_value: '',
  cgpa_scale: '',
};

export const INITIAL_GEO = {
  preferred_region: '',
  preferred_country: '',
};

export const INITIAL_FINANCIAL = {
  min_tuition_fee: '',
  max_tuition_fee: '',
  living_cost_tolerance: '',
  scholarship_requirement: '',
};

export const INITIAL_PRIORITIES = {
  priority_1: '',
  priority_2: '',
  priority_3: '',
  priority_4: '',
  priority_5: '',
};