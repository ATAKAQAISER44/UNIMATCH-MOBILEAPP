// src/services/userRole.js
//
// The signed-in user's role ("Student", "Researcher", "University
// Administrator" or "Policymaker"), read once from the Supabase profiles
// table and shared by every screen (menus, role guards, profile page).

import { useEffect, useState } from 'react';

import { supabase } from './supabase';
import { getSignedInUser } from './session';

export const ROLES = {
  student: 'Student',
  researcher: 'Researcher',
  administrator: 'University Administrator',
  policymaker: 'Policymaker',
};

// Lower-cased, trimmed role so "researcher " and "Researcher" match.
export function roleKey(role) {
  const value = String(role || '').trim().toLowerCase();
  if (value === 'student') return 'student';
  if (value === 'researcher') return 'researcher';
  if (value === 'university administrator' || value === 'administrator') return 'administrator';
  if (value === 'policymaker' || value === 'policy maker') return 'policymaker';
  return '';
}

let cached = null; // { userId, role, user }
let pending = null;
const listeners = new Set();

function publish(value) {
  cached = value;
  listeners.forEach((listener) => listener(value));
}

export async function loadUserRole({ force = false } = {}) {
  if (cached && !force) return cached;
  if (pending && !force) return pending;

  pending = (async () => {
    const {
      data: { user },
    } = await getSignedInUser();

    if (!user) {
      publish({ userId: null, role: '', user: null });
      return cached;
    }

    const { data } = await supabase.from('profiles').select('role, full_name').eq('id', user.id).maybeSingle();
    publish({ userId: user.id, role: data?.role || '', fullName: data?.full_name || '', user });
    return cached;
  })();

  try {
    return await pending;
  } finally {
    pending = null;
  }
}

// Called after login, role selection and logout so the next screen re-reads it.
export function resetUserRole(next) {
  if (next) publish(next);
  else {
    cached = null;
    listeners.forEach((listener) => listener(null));
  }
}

// Which screens each role may open (role keys from roleKey()). Screens not
// listed here (University page, Profile) are open to every signed-in role.
export const ROLE_ACCESS = {
  student: ['student'],
  researcher: ['researcher'],
  administrator: ['administrator'],
  policymaker: ['policymaker'],
  // The policymaker menu links to the researcher Attributes Explorer.
  attributes: ['researcher', 'policymaker'],
};

export function canAccess(key, allowed) {
  return !allowed || allowed.includes(key);
}

export const ROLE_NAMES = {
  student: 'Students',
  researcher: 'Researchers',
  administrator: 'University Administrators',
  policymaker: 'Policymakers',
};

// Signs out, forgets the cached role and returns to Login.
export async function logout(navigation) {
  try {
    await supabase.auth.signOut();
  } catch (error) {
    console.error('Logout failed:', error);
  } finally {
    resetUserRole();
    navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
  }
}

export function useUserRole() {
  const [state, setState] = useState(cached);

  useEffect(() => {
    let active = true;
    const listener = (value) => active && setState(value);
    listeners.add(listener);
    if (!cached) loadUserRole().then((value) => active && setState(value)).catch(() => {});
    return () => {
      active = false;
      listeners.delete(listener);
    };
  }, []);

  return {
    role: state?.role || '',
    key: roleKey(state?.role),
    user: state?.user || null,
    fullName: state?.fullName || '',
    loading: !state,
  };
}
