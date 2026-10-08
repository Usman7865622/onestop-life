import type { AuthSession } from './types';

export const ACCESS_TOKEN_STORAGE_KEY = 'onestop-access-token';
export const LOGIN_INTENT_STORAGE_KEY = 'onestop-login-intent';

export type LoginIntent = 'patient' | 'doctor' | 'business' | 'admin';

/** Access tokens are only ever read in the browser; SSR must not touch storage. */
function canUseStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

export function readAccessToken(): string | null {
  if (!canUseStorage()) return null;
  return window.localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY);
}

export function saveAccessToken(accessToken: string): void {
  if (!canUseStorage()) return;
  window.localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, accessToken);
}

export function clearAccessToken(): void {
  if (!canUseStorage()) return;
  window.localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
}

export function persistAuthSession(session: AuthSession): void {
  saveAccessToken(session.accessToken);
}

export function readLoginIntent(): LoginIntent | null {
  if (!canUseStorage()) return null;
  const value = window.localStorage.getItem(LOGIN_INTENT_STORAGE_KEY);
  return value === 'patient' || value === 'doctor' || value === 'business' || value === 'admin' ? value : null;
}

export function saveLoginIntent(intent: LoginIntent): void {
  if (!canUseStorage()) return;
  window.localStorage.setItem(LOGIN_INTENT_STORAGE_KEY, intent);
}

export function hasRole(user: { roles: string[] } | null | undefined, ...roles: string[]): boolean {
  if (!user) return false;
  return roles.some((role) => user.roles.includes(role));
}

export function isBusinessUser(user: { roles: string[] } | null | undefined): boolean {
  return hasRole(user, 'SELLER', 'PHARMACY', 'VET', 'BLOOD_BANK_STAFF');
}
