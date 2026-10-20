'use client';

import { useEffect, useRef, useState } from 'react';
import { apiFetch } from '../../lib/auth/api';
import type { AuthResponse } from '../../lib/auth/types';

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

type CredentialResponse = { credential?: string };

type GoogleIdApi = {
  initialize: (config: { client_id: string; callback: (response: CredentialResponse) => void }) => void;
  renderButton: (element: HTMLElement, options: Record<string, unknown>) => void;
};

declare global {
  interface Window {
    google?: { accounts: { id: GoogleIdApi } };
  }
}

let scriptPromise: Promise<void> | null = null;

function loadGoogleScript(): Promise<void> {
  if (typeof window !== 'undefined' && window.google?.accounts?.id) return Promise.resolve();
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => {
        scriptPromise = null;
        reject(new Error('load failed'));
      };
      document.head.appendChild(script);
    });
  }
  return scriptPromise;
}

/**
 * "Continue with Google" — renders Google's own button, then exchanges the ID
 * token it returns with the API, which issues the usual OneStop session tokens.
 * Renders nothing when NEXT_PUBLIC_GOOGLE_CLIENT_ID is not configured.
 */
export default function GoogleSignInButton({
  onSuccess,
  onError,
}: {
  onSuccess: (result: AuthResponse) => void;
  onError: (message: string) => void;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const callbacksRef = useRef({ onSuccess, onError });
  callbacksRef.current = { onSuccess, onError };
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!CLIENT_ID || !hostRef.current) return;
    let cancelled = false;

    const handleCredential = (response: CredentialResponse) => {
      const idToken = response.credential;
      if (!idToken) {
        callbacksRef.current.onError('Google sign-in did not return a token. Please try again.');
        return;
      }
      setBusy(true);
      apiFetch<AuthResponse>('/auth/oauth/google', {
        method: 'POST',
        body: JSON.stringify({ idToken }),
      })
        .then((result) => callbacksRef.current.onSuccess(result))
        .catch((e: unknown) => {
          callbacksRef.current.onError(e instanceof Error ? e.message : 'Google sign-in failed.');
        })
        .finally(() => setBusy(false));
    };

    loadGoogleScript()
      .then(() => {
        if (cancelled || !hostRef.current || !window.google) return;
        window.google.accounts.id.initialize({ client_id: CLIENT_ID, callback: handleCredential });
        window.google.accounts.id.renderButton(hostRef.current, {
          theme: 'outline',
          size: 'large',
          text: 'continue_with',
          shape: 'rectangular',
          width: Math.min(hostRef.current.clientWidth || 320, 400),
        });
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (!CLIENT_ID || failed) return null;

  return (
    <div
      ref={hostRef}
      aria-busy={busy}
      style={{ display: 'grid', justifyItems: 'center', minHeight: 44, opacity: busy ? 0.6 : 1, pointerEvents: busy ? 'none' : 'auto' }}
    />
  );
}
