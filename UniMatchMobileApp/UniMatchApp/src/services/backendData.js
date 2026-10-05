// src/services/backendData.js
//
// Hooks shared by the Student, University Administrator and Policymaker
// screens (same behaviour as the web app's hooks/useBackendData.js):
//   useCachedApi     - call a backend endpoint once per session and cache it,
//                      so moving between screens does not reload analyses.
//   useUserSetting   - a small per-user value kept in Supabase user metadata
//                      (the administrator's university, the policymaker's
//                      country), so no new table is needed.
//   loadStudentProfile / useStudentPlan - the student's saved profile in the
//                      shape the smart-match and plan endpoints expect.

import { useCallback, useEffect, useState } from 'react';

import { apiGet, apiPost, getApiErrorMessage, HEAVY_TIMEOUT_MS } from './api';
import { supabase } from './supabase';
import { getSignedInUser } from './session';
import { normalizeIntendedLevel } from '../utils/profileSetupUtils';

const responseCache = new Map();
const inFlight = new Map();

function requestKey(path, body) {
  return path && (body ? `${path} ${JSON.stringify(body)}` : path);
}

export async function fetchCached(path, body) {
  const key = requestKey(path, body);
  if (responseCache.has(key)) return responseCache.get(key);
  if (inFlight.has(key)) return inFlight.get(key);

  const promise = (async () => {
    const url = path.startsWith('/') ? path : `/${path}`;
    let response;
    try {
      response = body
        ? await apiPost(url, body, { timeoutMs: HEAVY_TIMEOUT_MS })
        : await apiGet(url, { timeoutMs: HEAVY_TIMEOUT_MS });
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Unable to load this analysis.'));
    }
    if (!response.ok) throw new Error(getApiErrorMessage(response.data, 'Unable to load this analysis.'));
    responseCache.set(key, response.data);
    return response.data;
  })();

  inFlight.set(key, promise);
  try {
    return await promise;
  } finally {
    inFlight.delete(key);
  }
}

export function clearCachedApi(prefix = '') {
  [...responseCache.keys()].forEach((key) => key.startsWith(prefix) && responseCache.delete(key));
}

// GET when body is empty, POST otherwise. path = null skips the call.
export function useCachedApi(path, body) {
  const key = requestKey(path, body);
  const [, setVersion] = useState(0);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!key || responseCache.has(key)) return undefined;
    let cancelled = false;

    fetchCached(path, body)
      .then(() => !cancelled && setVersion((v) => v + 1))
      .catch((error) => !cancelled && setErrors((all) => ({ ...all, [key]: error.message })));

    return () => {
      cancelled = true;
    };
    // body is part of key
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const retry = useCallback(() => {
    if (!key) return;
    responseCache.delete(key);
    setErrors((all) => {
      const next = { ...all };
      delete next[key];
      return next;
    });
    fetchCached(path, body)
      .then(() => setVersion((v) => v + 1))
      .catch((error) => setErrors((all) => ({ ...all, [key]: error.message })));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const data = (key && responseCache.get(key)) || null;
  const error = (key && errors[key]) || '';
  return { data, loading: Boolean(key) && !data && !error, error, retry };
}

// [value, save]; value is undefined while loading and null when not set.
export function useUserSetting(name) {
  const [value, setValue] = useState(undefined);

  useEffect(() => {
    let active = true;
    supabase.auth
      .getUser()
      .then(({ data }) => active && setValue(data?.user?.user_metadata?.[name] || null))
      .catch(() => active && setValue(null));
    return () => {
      active = false;
    };
  }, [name]);

  const save = useCallback(
    async (next) => {
      const { error } = await supabase.auth.updateUser({ data: { [name]: next } });
      if (error) throw error;
      setValue(next);
    },
    [name]
  );

  return [value, save];
}

// { user: { country }, academic, geographic, financial, tests } - the shape
// the /rankings/*/smart-match and /student/plan endpoints read. user.country
// lets the backend use the local fee in the student's own country.
export async function loadStudentProfile(userId) {
  let id = userId;
  if (!id) {
    const {
      data: { user },
    } = await getSignedInUser();
    id = user?.id;
  }
  if (!id) return null;

  const one = (table) => supabase.from(table).select('*').eq('user_id', id).maybeSingle();
  const [{ data: profile }, { data: academic }, { data: geographic }, { data: financial }, { data: tests }, { data: priority }] =
    await Promise.all([
      supabase.from('profiles').select('country').eq('id', id).maybeSingle(),
      one('academic_preferences'),
      one('geographic_preferences'),
      one('financial_preferences'),
      supabase.from('user_test_scores').select('*').eq('user_id', id),
      one('priority_preferences'),
    ]);

  return {
    user: { country: profile?.country || '' },
    academic: academic
      ? { ...academic, intended_education_level: normalizeIntendedLevel(academic.intended_education_level) }
      : {},
    geographic: geographic || {},
    financial: financial || {},
    tests: tests || [],
    priority_preferences: priority || {},
  };
}

let studentProfilePromise = null;

export function useStudentProfile() {
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    if (!studentProfilePromise) studentProfilePromise = loadStudentProfile();
    studentProfilePromise
      .then((value) => active && setProfile(value))
      .catch((err) => {
        studentProfilePromise = null;
        if (active) setError(err?.message || 'Your profile could not be loaded.');
      });
    return () => {
      active = false;
    };
  }, []);

  return { profile, error };
}

// The profile is re-read after Profile Setup is saved.
export function resetStudentProfile() {
  studentProfilePromise = null;
  clearCachedApi('student/');
}

// Admission chance and total cost for [{ name, country }] universities.
export function useStudentPlan(universities) {
  const { profile, error: profileError } = useStudentProfile();
  const list = universities.map(({ name, country }) => ({ name, country: country || '' }));
  const { user, academic, geographic, financial, tests } = profile || {};
  const body = profile && list.length ? { universities: list, profile: { user, academic, geographic, financial, tests } } : null;
  const result = useCachedApi(body ? 'student/plan' : null, body);
  return { ...result, error: result.error || profileError, loading: result.loading || (!profile && !profileError && list.length > 0) };
}

export const usd = (value) => `$${Math.round(value).toLocaleString()}`;
export const usdRange = (range) => (!range ? '–' : range[0] === range[1] ? usd(range[0]) : `${usd(range[0])} – ${usd(range[1])}`);
export const pkrRange = (range, rate) =>
  !range
    ? '–'
    : `PKR ${Math.round(range[0] * rate).toLocaleString()}${range[0] === range[1] ? '' : ` – ${Math.round(range[1] * rate).toLocaleString()}`}`;
