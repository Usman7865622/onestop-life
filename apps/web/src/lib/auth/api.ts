export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'https://api-production-7a91a.up.railway.app';

const VALIDATION_ERROR_SEPARATOR = ', ';

/**
 * NestJS returns either a string message, an array of validation messages, or an
 * `error` slug. Normalise all three into a single human readable sentence.
 */
export function getErrorMessage(payload: unknown): string {
  if (!payload || typeof payload !== 'object') return 'Something went wrong.';

  const record = payload as Record<string, unknown>;
  if (typeof record.message === 'string' && record.message.trim()) {
    return record.message;
  }
  if (Array.isArray(record.message)) {
    const messages = record.message.filter(
      (item): item is string => typeof item === 'string' && item.trim().length > 0,
    );
    if (messages.length > 0) return messages.join(VALIDATION_ERROR_SEPARATOR);
  }
  if (typeof record.error === 'string' && record.error.trim()) {
    return record.error;
  }
  return 'Something went wrong.';
}

/**
 * Fetch wrapper shared by every client component. Always sends credentials so the
 * httpOnly refresh cookie travels with auth calls.
 */
export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {},
  accessToken?: string,
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...(options.headers ?? {}),
    },
  });

  const text = await response.text();
  const payload = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new Error(getErrorMessage(payload));
  }

  return (payload ?? null) as T;
}
