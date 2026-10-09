// src/services/welcome.js
//
// Dashboard greeting: "Welcome" the first time a user reaches the dashboard,
// "Welcome back" every time after that.
//
// The first visit is remembered on the account (Supabase user metadata
// `welcomed_at`), so it is the same on every phone and after reinstalling.
// Accounts created before this existed (older than 2 days, no flag) are
// treated as returning users. During the first app session the greeting stays
// "Welcome", so going back to the dashboard does not flip it mid-visit.

import { useEffect, useState } from 'react';

import { supabase } from './supabase';

const RETURNING_AFTER_MS = 2 * 24 * 60 * 60 * 1000;
const sessionGreeting = new Map(); // userId -> 'Welcome' | 'Welcome back'

async function decideGreeting() {
  const { data } = await supabase.auth.getSession();
  const user = data?.session?.user;
  if (!user?.id) return 'Welcome';
  if (sessionGreeting.has(user.id)) return sessionGreeting.get(user.id);

  const welcomedBefore = Boolean(user.user_metadata?.welcomed_at);
  const created = Date.parse(user.created_at || '');
  const olderAccount = Number.isFinite(created) && Date.now() - created > RETURNING_AFTER_MS;
  const greeting = welcomedBefore || olderAccount ? 'Welcome back' : 'Welcome';

  sessionGreeting.set(user.id, greeting);
  if (!welcomedBefore) {
    // Remember the first visit; best effort (the greeting is only cosmetic).
    supabase.auth.updateUser({ data: { welcomed_at: new Date().toISOString() } }).catch(() => {});
  }
  return greeting;
}

// 'Welcome' or 'Welcome back' ('Welcome' while it is being worked out).
export function useWelcomeGreeting() {
  const [greeting, setGreeting] = useState('Welcome');

  useEffect(() => {
    let active = true;
    decideGreeting()
      .then((value) => active && setGreeting(value))
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  return greeting;
}
