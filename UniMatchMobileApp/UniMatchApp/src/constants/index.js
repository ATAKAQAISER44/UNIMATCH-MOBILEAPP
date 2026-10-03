// src/constants/index.js

// The backend URL is now detected automatically from the IP Expo is using
// (see src/services/apiConfig.js). To force a specific address, create a
// .env file in the project root containing, for example:
//   EXPO_PUBLIC_API_BASE_URL=http://192.168.1.8:8000
export { API_BASE_URL } from '../services/apiConfig';

export const COLORS = {
  primary: '#4F6EF7',
  primaryDark: '#3451D1',
  primaryLight: '#EEF1FF',
  
  emerald: '#10B981',
  emeraldLight: '#D1FAE5',
  violet: '#8B5CF6',
  violetLight: '#EDE9FE',
  rose: '#F43F5E',
  roseLight: '#FFE4E6',
  amber: '#F59E0B',
  amberLight: '#FEF3C7',
  white: '#FFFFFF',
  background: '#F0F4FF',
  card: '#FFFFFF',
  text: '#1E293B',
  textLight: '#64748B',
  textMuted: '#94A3B8',
  border: '#E2E8F0',
  inputBg: '#F8FAFC',
  error: '#EF4444',
  errorLight: '#FEE2E2',
  success: '#10B981',
  successLight: '#D1FAE5',
};

export const REGIONS = ['Asia', 'Europe', 'North America', 'South America', 'Australia', 'Africa'];

export const REGION_COUNTRIES = {
  Asia: ['Pakistan', 'India', 'China', 'Japan', 'South Korea', 'Malaysia', 'Singapore', 'Thailand', 'Indonesia', 'Philippines', 'Vietnam', 'Bangladesh', 'Sri Lanka', 'United Arab Emirates', 'Saudi Arabia', 'Qatar'],
  Europe: ['Germany', 'France', 'United Kingdom', 'Netherlands', 'Sweden', 'Norway', 'Denmark', 'Finland', 'Italy', 'Spain', 'Austria', 'Belgium', 'Switzerland', 'Ireland', 'Poland'],
  'North America': ['United States', 'Canada', 'Mexico'],
  'South America': ['Brazil', 'Argentina', 'Chile', 'Colombia', 'Peru', 'Uruguay'],
  Australia: ['Australia', 'New Zealand'],
  Africa: ['South Africa', 'Egypt', 'Nigeria', 'Kenya', 'Morocco'],
};

export const EDUCATION_LEVELS = ['High School', 'Intermediate / A-Level', "Bachelor's", "Master's"];
export const INTENDED_LEVELS = ['BS', 'MS', 'MS leading to PhD', 'PhD'];
export const SCORE_TYPES = ['GPA/CGPA', 'Percentage'];
export const SCHOLARSHIP_OPTIONS = ['Scholarship-supported', 'Fully funded', 'Self-funded'];

export const PRIORITY_OPTIONS = [
  'Career & Employability',
  'Research & Academia',
  'International Exposure & Diversity',
  'Teaching Quality & Student Support',
  'Balanced Preference',
];

export const FIELDS_OF_STUDY = [
  'Computer Science', 'Software Engineering', 'Data Science', 'Artificial Intelligence',
  'Cyber Security', 'Information Technology', 'Electrical Engineering', 'Mechanical Engineering',
  'Civil Engineering', 'Chemical Engineering', 'Business Administration', 'Finance',
  'Accounting', 'Economics', 'Marketing', 'Medicine', 'Pharmacy', 'Biotechnology',
  'Biology', 'Physics', 'Chemistry', 'Mathematics', 'Statistics', 'Law', 'Psychology',
  'Sociology', 'Political Science',
];

export const TEST_OPTIONS = ['IELTS', 'TOEFL', 'GRE', 'GMAT', 'SAT', 'ACT', 'PTE', 'Duolingo English Test', 'GATE'];

export const TEST_CONFIG = {
  IELTS: { min: 0, max: 9, step: 0.5 },
  TOEFL: { min: 0, max: 120, step: 1 },
  GRE: { min: 260, max: 340, step: 1 },
  GMAT: { min: 200, max: 800, step: 1 },
  SAT: { min: 400, max: 1600, step: 10 },
  ACT: { min: 1, max: 36, step: 1 },
  PTE: { min: 10, max: 90, step: 1 },
  'Duolingo English Test': { min: 10, max: 160, step: 5 },
  GATE: { min: 0, max: 100, step: 1 },
};
