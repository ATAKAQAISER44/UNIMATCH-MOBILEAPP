// src/services/session.js
//
// PERF: supabase.auth.getUser() makes a network request to Supabase every
// time it is called, and almost every screen called it on open.
// getSession() reads the saved session from the phone (and refreshes the
// token automatically if it has expired), so it is effectively instant.
// We only fall back to getUser() when there is no saved session.
//
// Returns the same shape as supabase.auth.getUser():  { data: { user }, error }

import { supabase } from './supabase';

export async function getSignedInUser() {
  try {
    const { data, error } = await supabase.auth.getSession();
    const sessionUser = data?.session?.user;

    if (!error && sessionUser) {
      return { data: { user: sessionUser }, error: null };
    }
  } catch {
    // fall through to the network check below
  }

  return supabase.auth.getUser();
}
