// src/services/googleAuth.js
//
// "Continue with Google" (same Supabase Google provider as the web app).
// Opens Google in an in-app browser session, then turns the redirect back into
// a Supabase session. Used by Login and Sign Up.
//
// Supabase setup (once): Authentication -> URL Configuration -> Redirect URLs
// must include the app's redirect, e.g. unimatch://auth/callback for builds and
// exp://** for Expo Go.

import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';

import { supabase } from './supabase';

WebBrowser.maybeCompleteAuthSession();

function parseUrlPart(part = '', params = {}) {
  part
    .replace(/^[?#]/, '')
    .split('&')
    .filter(Boolean)
    .forEach((pair) => {
      const [key, value = ''] = pair.split('=');
      if (key) params[decodeURIComponent(key)] = decodeURIComponent(value.replace(/\+/g, ' '));
    });
  return params;
}

// Query and hash parameters of the redirect URL (code, tokens or error).
function parseAuthParams(url = '') {
  const params = {};
  const query = url.includes('?') ? url.split('?')[1].split('#')[0] : '';
  const hash = url.includes('#') ? url.split('#')[1] : '';
  parseUrlPart(query, params);
  parseUrlPart(hash, params);
  return params;
}

function friendly(message = '') {
  const text = String(message);
  if (/redirect|not allowed|invalid.*url/i.test(text)) {
    return 'Google sign-in is not set up for the app yet. Please use email for now.';
  }
  if (/provider is not enabled|unsupported provider/i.test(text)) {
    return 'Google sign-in is not enabled. Please use email for now.';
  }
  if (/network|fetch/i.test(text)) {
    return 'Could not reach the server. Check your internet connection and try again.';
  }
  return 'Google sign-in could not be completed. Please try again.';
}

// Resolves to { userId } on success, { cancelled: true } when the user closed
// the Google page, or { error } with a message to show.
export async function signInWithGoogle() {
  try {
    const redirectTo = Linking.createURL('auth/callback');
    if (__DEV__) {
      // This exact address must be in Supabase -> Authentication -> URL
      // Configuration -> Redirect URLs, otherwise Supabase sends the browser
      // to the web Site URL (localhost) and the phone shows "can't be reached".
      console.log(`[Google sign-in] redirect URL: ${redirectTo}`);
    }

    // Supabase never redirects to an address whose host is an IP address
    // (other than 127.0.0.1), whatever the Redirect URLs list says. In Expo Go
    // on a LAN the address is exp://192.168.x.x:8081/..., so Supabase would
    // send the browser to the web Site URL (localhost) instead. Explain the
    // fix rather than opening a page that cannot load. Installed builds use
    // unimatch://auth/callback and are not affected.
    const host = (redirectTo.match(/^[a-z][a-z0-9+.-]*:\/\/([^/:?#]+)/i) || [])[1] || '';
    if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host) && !host.startsWith('127.')) {
      return {
        error:
          'Google sign-in cannot return to Expo Go on a local IP address. Restart the app with "npx expo start --tunnel" and try again.',
      };
    }

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        skipBrowserRedirect: true,
        queryParams: { prompt: 'select_account' },
      },
    });

    if (error) return { error: friendly(error.message) };
    if (!data?.url) return { error: 'Google sign-in could not be started. Please try again.' };

    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
    if (result.type !== 'success' || !result.url) return { cancelled: true };

    const params = parseAuthParams(result.url);
    if (params.error || params.error_description) {
      return { error: friendly(params.error_description || params.error) };
    }

    if (params.code) {
      const { data: sessionData, error: exchangeError } = await supabase.auth.exchangeCodeForSession(params.code);
      if (exchangeError) return { error: friendly(exchangeError.message) };
      return { userId: sessionData?.user?.id || sessionData?.session?.user?.id || null };
    }

    if (params.access_token && params.refresh_token) {
      const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
        access_token: params.access_token,
        refresh_token: params.refresh_token,
      });
      if (sessionError) return { error: friendly(sessionError.message) };
      return { userId: sessionData?.user?.id || sessionData?.session?.user?.id || null };
    }

    const { data: existing } = await supabase.auth.getSession();
    const userId = existing?.session?.user?.id;
    return userId ? { userId } : { error: 'Google sign-in finished, but you could not be logged in. Please try again.' };
  } catch {
    return { error: 'Google sign-in failed. Check your internet connection and try again.' };
  }
}

// Where a signed-in user goes next (same rules as Login and the web
// AuthCallback): no role -> Role Selection, student without a finished
// profile -> Profile Setup, otherwise Dashboard.
export async function routeAfterSignIn(navigation, userId) {
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, profile_completed')
    .eq('id', userId)
    .maybeSingle();

  const role = profile?.role?.trim().toLowerCase();
  if (!role) navigation.replace('RoleSelection');
  else if (role === 'student' && !profile?.profile_completed) navigation.replace('ProfileSetup');
  else navigation.replace('Dashboard');
}
