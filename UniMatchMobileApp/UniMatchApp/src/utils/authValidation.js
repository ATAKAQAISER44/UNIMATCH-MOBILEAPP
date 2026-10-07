// src/utils/authValidation.js
// Shared auth rules and error text (same rules as the web app's
// utils/authValidation.js). Every screen uses these so they all agree.

export const EMAIL_REGEX = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/;

// Special = any character that is not a letter, digit or space.
const SPECIAL_REGEX = /[^A-Za-z0-9\s]/;

export const PASSWORD_MIN_LENGTH = 8;
export const NAME_MAX_LENGTH = 60;

export const normalizeEmail = (value = '') => String(value || '').trim().toLowerCase();

export const isValidEmail = (value = '') => EMAIL_REGEX.test(normalizeEmail(value));

// Error text for an email, or '' when it is valid.
export function validateEmail(value = '') {
  const email = normalizeEmail(value);
  if (!email) return 'Please enter your email address.';
  if (!EMAIL_REGEX.test(email)) return 'Please enter a valid email address.';
  return '';
}

const joinList = (items) =>
  items.length > 1
    ? `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`
    : items[0];

// Which password rules are met.
export function getPasswordChecks(password = '') {
  const value = String(password || '');
  return {
    length: value.length >= PASSWORD_MIN_LENGTH,
    letter: /[A-Za-z]/.test(value),
    number: /\d/.test(value),
    special: SPECIAL_REGEX.test(value),
  };
}

export const isStrongPassword = (password = '') =>
  Object.values(getPasswordChecks(password)).every(Boolean);

// Error text for a new password (lists only what is missing), or ''.
export function validateNewPassword(password = '') {
  if (!password) return 'Please enter a password.';

  const checks = getPasswordChecks(password);
  const missing = [
    !checks.letter && 'a letter',
    !checks.number && 'a number',
    !checks.special && 'a special character',
  ].filter(Boolean);

  const parts = [];
  if (!checks.length) parts.push(`Use at least ${PASSWORD_MIN_LENGTH} characters.`);
  if (missing.length) parts.push(`Add ${joinList(missing)}.`);
  return parts.join(' ');
}

// Weak / Medium / Strong meter. Strong needs every rule plus 12+ characters.
export function getPasswordStrength(password = '') {
  if (!password) return { label: '', color: '#D1D5DB', width: '0%' };

  const checks = getPasswordChecks(password);
  const score =
    Object.values(checks).filter(Boolean).length + (password.length >= 12 ? 1 : 0);

  if (score <= 2) return { label: 'Weak', color: '#EF4444', width: '33%' };
  if (score <= 4) return { label: 'Medium', color: '#F59E0B', width: '66%' };
  return { label: 'Strong', color: '#10B981', width: '100%' };
}

const rawMessage = (error) =>
  String(typeof error === 'string' ? error : error?.message || '');

export const isEmailNotConfirmedError = (error) =>
  /email not confirmed|email not verified|not confirmed/i.test(rawMessage(error));

export const isDuplicateEmailError = (error) =>
  /already registered|already exists|duplicate/i.test(rawMessage(error));

export const isSessionMissingError = (error) =>
  /session.*missing|missing.*session|not authenticated|jwt/i.test(rawMessage(error));

// Raw Supabase / network errors mapped to short messages a user can act on.
const AUTH_ERROR_MAP = [
  [/invalid login credentials|invalid credentials/i, 'Wrong email or password.'],
  [/email not confirmed|email not verified/i, 'Please verify your email first.'],
  [/already registered|already exists|duplicate/i, 'An account with this email already exists.'],
  [/rate limit|too many|security purposes/i, 'Too many tries. Please wait a minute and try again.'],
  [/failed to fetch|network|load failed|timed? ?out/i, 'Could not reach the server. Check your connection.'],
  [/invalid.*email|unable to validate email/i, 'Please enter a valid email address.'],
  [/should be different|same.*password/i, 'Your new password must be different from the old one.'],
  [/password should|weak password|password.*characters/i, 'Password needs 8+ characters, a letter, a number and a special character.'],
  [/signups? not allowed|signup.*disabled/i, 'Sign up is not available right now.'],
  [/session.*missing|missing.*session/i, 'Your session has ended. Please start again.'],
  [/expired|invalid.*(token|link|otp|code)/i, 'This code is wrong or has expired. Please request a new one.'],
];

// Never returns the raw error text.
export function friendlyAuthError(error, fallback = 'Something went wrong. Please try again.') {
  const raw = rawMessage(error);
  const match = AUTH_ERROR_MAP.find(([pattern]) => pattern.test(raw));
  return match ? match[1] : fallback;
}
