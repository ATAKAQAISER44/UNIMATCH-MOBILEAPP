// src/components/smart-match/useProfileOptions.js
//
// Dataset options and numeric ranges from GET /profile-setup/ranges, the same
// source the web Profile Match panel uses. The response is cached for the
// session, so switching tabs does not refetch it. Fallback lists match the web.

import { useEffect, useMemo, useState } from 'react';

import { fetchCached } from '../../services/backendData';

export const FALLBACK_REGION_COUNTRIES = {
  Africa: ['Egypt', 'Kenya', 'Morocco', 'Nigeria', 'South Africa'],
  Asia: [
    'Bangladesh',
    'China',
    'India',
    'Indonesia',
    'Japan',
    'Malaysia',
    'Pakistan',
    'Philippines',
    'Qatar',
    'Saudi Arabia',
    'Singapore',
    'South Korea',
    'Sri Lanka',
    'Thailand',
    'United Arab Emirates',
    'Vietnam',
  ],
  Australia: ['Australia', 'New Zealand'],
  Europe: [
    'Austria',
    'Belgium',
    'Denmark',
    'Finland',
    'France',
    'Germany',
    'Ireland',
    'Italy',
    'Netherlands',
    'Norway',
    'Poland',
    'Spain',
    'Sweden',
    'Switzerland',
    'United Kingdom',
  ],
  'North America': ['Canada', 'Mexico', 'United States'],
  'South America': ['Argentina', 'Brazil', 'Chile', 'Colombia', 'Peru', 'Uruguay'],
};

export const FALLBACK_FIELDS_OF_STUDY = [
  'Accounting',
  'Artificial Intelligence',
  'Biology',
  'Biotechnology',
  'Business Administration',
  'Chemical Engineering',
  'Chemistry',
  'Civil Engineering',
  'Computer Science',
  'Cyber Security',
  'Data Science',
  'Economics',
  'Electrical Engineering',
  'Finance',
  'Information Technology',
  'Law',
  'Marketing',
  'Mathematics',
  'Mechanical Engineering',
  'Medicine',
  'Pharmacy',
  'Physics',
  'Political Science',
  'Psychology',
  'Sociology',
  'Software Engineering',
  'Statistics',
];

export const DEGREE_LEVELS = ['Bachelor', 'Master', 'MS leading to PhD', 'PhD'];

export const FALLBACK_SCHOLARSHIP_OPTIONS = ['Scholarship-supported', 'Fully funded', 'Self-funded'];

export function cleanOptionList(items = []) {
  if (!Array.isArray(items)) return [];

  const values = items
    .map((item) => {
      if (item === null || item === undefined) return '';
      if (typeof item === 'object') return String(item.value ?? item.label ?? '').trim();
      return String(item).trim();
    })
    .filter(Boolean);

  return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b));
}

function cleanRegionMap(map) {
  if (!map || typeof map !== 'object') return {};

  return Object.entries(map).reduce((result, [region, countries]) => {
    const cleanRegion = String(region || '').trim();
    const cleanCountries = cleanOptionList(countries);
    if (cleanRegion && cleanCountries.length) result[cleanRegion] = cleanCountries;
    return result;
  }, {});
}

export default function useProfileOptions() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    fetchCached('/profile-setup/ranges')
      .then((response) => {
        if (active) setData(response && !response.error ? response : {});
      })
      .catch(() => {
        if (active) setData({});
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return useMemo(() => {
    const options = data?.options || {};
    const datasetRegionMap = cleanRegionMap(options.countries_by_region);
    const regionCountries = Object.keys(datasetRegionMap).length
      ? datasetRegionMap
      : FALLBACK_REGION_COUNTRIES;

    const datasetRegions = cleanOptionList(options.regions);
    const regions = datasetRegions.length ? datasetRegions : Object.keys(regionCountries).sort();

    const fields = cleanOptionList(options.fields_of_study);
    const scholarships = cleanOptionList(options.scholarship_requirements);
    const degrees = DEGREE_LEVELS.filter(
      (level) =>
        !Array.isArray(options.intended_education_levels) ||
        options.intended_education_levels.length === 0 ||
        options.intended_education_levels.includes(level)
    );

    const allCountries = cleanOptionList(Object.values(regionCountries).flat());

    return {
      loading,
      ranges: data || {},
      regions,
      regionCountries,
      allCountries,
      fieldsOfStudy: fields.length ? fields : FALLBACK_FIELDS_OF_STUDY,
      scholarshipOptions: scholarships.length ? scholarships : FALLBACK_SCHOLARSHIP_OPTIONS,
      degreeLevels: degrees.length ? degrees : DEGREE_LEVELS,
    };
  }, [data, loading]);
}
