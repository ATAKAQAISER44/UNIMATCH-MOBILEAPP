
// src/constants/myRankingConstants.js

export const MY_RANKING_STORAGE_KEY =
  'unimatch_mobile_my_ranking_saved_items';

export const SAVED_UNIVERSITIES_KEY = 'unimatch_mobile_saved_universities';

// 0 = no limit: every university is returned and paged in the app.
export const TOP_N = 0;
export const MY_PAGE_SIZE = 4;
export const DEFAULT_VISIBLE_RANKING_COUNT = 3;

export const DATASET_METRICS = {
  qs: [
    {
      key: 'Academic_Reputation_Score',
      label: 'Academic Reputation',
      weight: '30%',
    },
    {
      key: 'Employer_Reputation_Score',
      label: 'Employer Reputation',
      weight: '15%',
    },
    {
      key: 'Faculty_Student_Score',
      label: 'Faculty Student Ratio',
      weight: '10%',
    },
    {
      key: 'Citations_per_Faculty_Score',
      label: 'Citations per Faculty',
      weight: '20%',
    },
    {
      key: 'International_Faculty_Score',
      label: 'International Faculty Ratio',
      weight: '5%',
    },
    {
      key: 'International_Students_Score',
      label: 'International Student Ratio',
      weight: '5%',
    },
    {
      key: 'International_Research_Network_Score',
      label: 'International Research Network',
      weight: '5%',
    },
    {
      key: 'Employment_Outcomes_Score',
      label: 'Employment Outcomes',
      weight: '5%',
    },
    {
      key: 'Sustainability_Score',
      label: 'Sustainability',
      weight: '5%',
    },
  ],

  the: [
    { key: 'scores_teaching', label: 'Teaching', weight: '29.5%' },
    {
      key: 'scores_research',
      label: 'Research Environment',
      weight: '29%',
    },
    {
      key: 'scores_citations',
      label: 'Research Quality / Citations',
      weight: '30%',
    },
    {
      key: 'scores_industry_income',
      label: 'Industry Income',
      weight: '4%',
    },
    {
      key: 'scores_international_outlook',
      label: 'International Outlook',
      weight: '7.5%',
    },
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

export const ATTRIBUTE_CONFIG = [
  {
    key: 'tuition_fee_score',
    label: 'Tuition Fee',
    helper: 'Local fee if the university is in your home country, else international fee',
  },
  {
    key: 'tuition_fee_local_score',
    label: 'Local Tuition',
    helper: 'Lower local (domestic) fee scores higher',
  },
  {
    key: 'tuition_fee_international_score',
    label: 'International Tuition',
    helper: 'Lower fee scores higher',
  },
  {
    key: 'living_cost_score',
    label: 'Living Cost',
    helper: 'Lower living cost scores higher',
  },
  {
    key: 'scholarship_score',
    label: 'Scholarship',
    helper: 'Universities offering scholarships score higher',
  },
  {
    key: 'cgpa_requirement_score',
    label: 'CGPA Eligibility',
    helper: "Compares your CGPA with the university's minimum requirement",
  },
  {
    key: 'tests_score',
    label: 'Tests',
    helper: 'Matches the tests you have taken (or no test required)',
  },
  {
    key: 'programs_score',
    label: 'Program Match',
    helper: 'Offers your intended field of study',
  },
  {
    key: 'degree_level_score',
    label: 'Degree Level',
    helper: 'Offers your intended degree level (BS, MS or PhD)',
  },
  {
    key: 'acceptance_rate_score',
    label: 'Acceptance Rate',
    helper: 'Higher acceptance rate (easier admission) scores higher',
  },
  {
    key: 'internship_score',
    label: 'Internship',
    helper: 'Universities offering internships score higher',
  },
  {
    key: 'part_time_job_score',
    label: 'Part-time Job',
    helper: 'Universities allowing part-time work score higher',
  },
  {
    key: 'employability_rate_score',
    label: 'Employability',
    helper: 'Higher graduate employment rate scores higher',
  },
  {
    key: 'language_score',
    label: 'Language',
    helper: 'Matches preferred language',
  },
  {
    key: 'public_private_score',
    label: 'Public / Private',
    helper: 'Matches preferred university type',
  },
  {
    key: 'gender_equality_score',
    label: 'Gender Equality',
    helper: 'More balanced gender ratio scores higher',
  },
  {
    key: 'country_score',
    label: 'Country',
    helper: 'Matches preferred country',
  },
  {
    key: 'region_score',
    label: 'Region',
    helper: 'Matches preferred region',
  },
];

export const DEFAULT_VISIBLE_ATTRIBUTE_KEYS = [
  'tuition_fee_score',
  'living_cost_score',
  'scholarship_score',
];

export const INFO_CONTENT = {
  ranking: {
    title: 'What are Ranking Metrics?',
    icon: 'podium-outline',
    body:
      'The official scores QS, THE or ARWU use, such as reputation, research and citations.',
    points: ['Higher weight = more influence.', 'Only the metrics you add are used.'],
  },

  attributes: {
    title: 'What are University Attributes?',
    icon: 'school-outline',
    body:
      'Practical factors such as fees, living cost, scholarships and CGPA requirement.',
    points: ['Higher weight = more influence.', 'Only the attributes you add are used.'],
  },
};