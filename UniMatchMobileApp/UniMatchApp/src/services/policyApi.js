// src/services/policyApi.js
//
// Policymaker data (web: policymaker/policyData.js), from the existing
// /policymaker/* backend routes, cached for the session.
//   usePolicyCountry   - the policymaker's country, kept in Supabase user metadata.
//   useCountryList     GET /policymaker/countries
//   useCountryOverview GET /policymaker/country?name=
//   useCountryCompare  GET /policymaker/compare?countries=a|b|c

import { useCachedApi, useUserSetting } from './backendData';

export const usePolicyCountry = () => useUserSetting('policy_country');

export const useCountryList = () => useCachedApi('/policymaker/countries');

export const useCountryOverview = (country) =>
  useCachedApi(country ? `/policymaker/country?name=${encodeURIComponent(country)}` : null);

export const useCountryCompare = (countries) =>
  useCachedApi(countries.length ? `/policymaker/compare?countries=${encodeURIComponent(countries.join('|'))}` : null);
