// src/services/adminApi.js
//
// University Administrator data (web: administrator/adminData.js). Every
// call uses the existing /administrator/* backend routes; results are cached
// for the session so moving between the tools does not reload them.
//   useAdminInstitution  - the administrator's own university { key, name, country },
//                          kept in Supabase user metadata (no new table).
//   useInstitutionPerformance(key)            GET /administrator/performance
//   useInstitutionProfile(institution)        GET /administrator/profile
//   useBenchmark(key, dataset, peers, target) GET /administrator/benchmark/{dataset}
//   useWhatIf(key, dataset, scenarios)        POST /administrator/whatif/{dataset}
//   useStudentDemand(profile)                 Supabase rpc admin_student_demand

import { useEffect, useState } from 'react';

import { supabase } from './supabase';
import { useCachedApi, useUserSetting } from './backendData';

export const useAdminInstitution = () => useUserSetting('admin_institution');

const useAdminApi = (path, body) => useCachedApi(path ? `/administrator/${path}` : null, body);

export const useInstitutionPerformance = (key) =>
  useAdminApi(key && `performance?key=${encodeURIComponent(key)}`);

export const useInstitutionProfile = (institution) =>
  useAdminApi(
    institution &&
      `profile?name=${encodeURIComponent(institution.name)}&country=${encodeURIComponent(institution.country || '')}`
  );

export const useBenchmark = (key, dataset, peerKeys, target) =>
  useAdminApi(
    key &&
      `benchmark/${dataset}?key=${encodeURIComponent(key)}&peers=${encodeURIComponent(peerKeys.join('|'))}${
        target ? `&target=${target}` : ''
      }`
  );

export const useWhatIf = (key, dataset, scenarios) =>
  useAdminApi(key && `whatif/${dataset}`, key ? { key, scenarios } : undefined);

const firstNumber = (value) =>
  Number(String(value ?? '').replace(/,/g, '').match(/\d+(\.\d+)?/)?.[0]) || null;

// Aggregated preferences of UniMatch students (counts only) from the
// admin_student_demand Supabase function, matched against the university's
// fee, living cost, minimum CGPA and region.
export function useStudentDemand(profile) {
  const [state, setState] = useState({ data: null, error: '' });
  const value = (key) => firstNumber(profile?.attributes?.find((a) => a.key === key)?.value);
  const params = profile
    ? {
        p_region: profile.region || null,
        p_fee: value('Tuition Fee (international)'),
        p_living: value('Living Cost'),
        p_min_cgpa: value('Minimum CGPA Requirement'),
      }
    : null;
  const paramsKey = JSON.stringify(params);

  useEffect(() => {
    if (!params) return undefined;
    let active = true;
    Promise.resolve(supabase.rpc('admin_student_demand', params))
      .then(({ data, error }) => {
        if (active) setState({ data: data || null, error: error ? error.message : '' });
      })
      .catch((error) => active && setState({ data: null, error: error?.message || 'Not available.' }));
    return () => {
      active = false;
    };
    // params is captured through paramsKey
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramsKey]);

  return { ...state, loading: Boolean(profile) && !state.data && !state.error, params };
}
