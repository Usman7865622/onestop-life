import type { AuthSession } from './types';

export const ACCESS_TOKEN_STORAGE_KEY = 'onestop-access-token';

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
