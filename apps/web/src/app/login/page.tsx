'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import styles from './login.module.css';
import { apiFetch } from '../../lib/auth/api';
import { readAccessToken, readLoginIntent, saveAccessToken, saveLoginIntent, type LoginIntent } from '../../lib/auth/session';
import type { AuthResponse, PublicUser } from '../../lib/auth/types';

type Step = 'intent' | 'auth';

const INTENT_CARDS: Array<{
  id: LoginIntent;
  icon: string;
  title: string;
  description: string;
  points: string[];
}> = [
  {
    id: 'patient',
    icon: '♥',
    title: 'Patient & Customer',
    description: 'Book doctors, shop essentials and track your orders in one place.',
    points: ['Book clinic or video visits', 'Shop with COD & fast delivery', 'My Appointments & cart'],
  },
  {
    id: 'doctor',
    icon: '✚',
    title: 'Doctor',
    description: 'For verified medical professionals offering consultations.',
    points: ['Receive appointment requests', 'Manage your doctor profile', 'Clinic & video consultations'],
  },
  {
    id: 'business',
    icon: '▦',
    title: 'Pharmacy / Business',
    description: 'Sellers, pharmacies, vets and blood banks selling on OneStop.',
    points: ['List products & manage catalogue', 'Verification for trusted selling', 'Seller workspace tools'],
  },
  {
    id: 'admin',
    icon: '⌘',
    title: 'Admin',
    description: 'Platform team only. Reviews verifications and keeps the store safe.',
    points: ['Review doctor & seller requests', 'Approve or reject with notes', 'Requires ADMIN role'],
  },
];

function destinationFor(intent: LoginIntent, user: PublicUser): string {
  if (intent === 'patient') return '/';
  return '/dashboard';
}

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('intent');
  const [intent, setIntent] = useState<LoginIntent>('patient');
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [verificationSent, setVerificationSent] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [signupName, setSignupName] = useState('');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [alreadySignedIn, setAlreadySignedIn] = useState<PublicUser | null>(null);

  useEffect(() => {
    const saved = readLoginIntent();
    if (saved) setIntent(saved);
    const token = readAccessToken();
    if (!token) return;
    void apiFetch<PublicUser>('/users/me', { method: 'GET' }, token)
      .then(setAlreadySignedIn)
      .catch(() => setAlreadySignedIn(null));
  }, []);

  const chooseIntent = (next: LoginIntent) => {
    setIntent(next);
    saveLoginIntent(next);
    setError('');
    setStatus('');
    setStep('auth');
  };

  const finishSignIn = (result: AuthResponse) => {
    saveAccessToken(result.accessToken);
    saveLoginIntent(intent);
    if (intent === 'admin' && !result.user.roles.includes('ADMIN')) {
      setStatus('You are signed in, but this account does not have Admin access. Continue to your dashboard to see what is available for your account.');
      setAlreadySignedIn(result.user);
      return;
    }
    router.push(destinationFor(intent, result.user));
    router.refresh();
  };

  const requestOtp = async () => {
    setBusy(true); setError(''); setStatus('');
    try {
      await apiFetch('/auth/otp/request', { method: 'POST', body: JSON.stringify({ phone }) });
      setVerificationSent(true);
      setStatus('OTP sent. In development mode, you can just use 000000 as your code.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to request OTP.');
    } finally { setBusy(false); }
  };

  const verifyOtp = async () => {
    setBusy(true); setError(''); setStatus('');
    try {
      const result = await apiFetch<AuthResponse>('/auth/otp/verify', {
        method: 'POST',
        body: JSON.stringify({ phone, code }),
      });
      finishSignIn(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Verification failed.');
    } finally { setBusy(false); }
  };

  const submitEmailAuth = async () => {
    setBusy(true); setError(''); setStatus('');
    try {
      const result = await apiFetch<AuthResponse>(`/auth/email/${authMode}`, {
        method: 'POST',
        body: JSON.stringify(authMode === 'signup' ? { email, password, name: signupName } : { email, password }),
      });
      finishSignIn(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to authenticate.');
    } finally { setBusy(false); }
  };

  const selectedCard = INTENT_CARDS.find((card) => card.id === intent);

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <Link className={styles.backLink} href="/">← Back to home</Link>

        {alreadySignedIn && step === 'intent' ? (
          <section className={styles.signedInBanner} aria-label="Already signed in">
            <div>
              <strong>You are already signed in{alreadySignedIn.name ? ` as ${alreadySignedIn.name}` : ''}.</strong>
              <span>Roles: {alreadySignedIn.roles.join(', ') || 'Customer'}</span>
            </div>
            <Link className={styles.primaryButton} href="/dashboard">Go to my dashboard</Link>
          </section>
        ) : null}

        {step === 'intent' ? (
          <section className={styles.intentSection} aria-labelledby="intent-heading">
            <p className={styles.eyebrow}>Welcome to OneStop Life</p>
            <h1 id="intent-heading">How do you want to continue?</h1>
            <p className={styles.lede}>Choose your path first. We will take you to the right sign-in and the right workspace — no more guessing whether you are a customer, doctor or business.</p>

            <div className={styles.intentGrid}>
              {INTENT_CARDS.map((card) => (
                <button key={card.id} type="button" className={styles.intentCard} onClick={() => chooseIntent(card.id)}>
                  <span className={styles.intentIcon} aria-hidden="true">{card.icon}</span>
                  <span className={styles.intentTitle}>{card.title}</span>
                  <span className={styles.intentDescription}>{card.description}</span>
                  <ul>
                    {card.points.map((point) => <li key={point}>{point}</li>)}
                  </ul>
                  <span className={styles.intentCta}>Continue as {card.title.split(' ')[0]} →</span>
                </button>
              ))}
            </div>

            <p className={styles.reassurance}>New here? Choose Patient &amp; Customer to shop and book doctors. Doctors and businesses can apply for verification after sign-in.</p>
          </section>
        ) : (
          <section className={styles.authLayout} aria-labelledby="auth-heading">
            <div className={styles.authIntroPanel}>
              <button type="button" className={styles.changeButton} onClick={() => setStep('intent')}>← Change how I continue</button>
              <span className={styles.intentIconLarge} aria-hidden="true">{selectedCard?.icon}</span>
              <p className={styles.eyebrow}>Continuing as</p>
              <h1 id="auth-heading">{selectedCard?.title}</h1>
              <p className={styles.lede}>{selectedCard?.description}</p>
              <ul className={styles.introPoints}>
                {selectedCard?.points.map((point) => <li key={point}>{point}</li>)}
              </ul>
              {intent === 'admin' ? <p className={styles.adminNote}>Admin sign-in works only for accounts that already have the ADMIN role. If your account does not have it, we will explain after sign-in instead of sending you to the wrong place.</p> : null}
              {intent === 'doctor' || intent === 'business' ? <p className={styles.adminNote}>Do not have a verified professional account yet? Sign in first, then submit verification from your dashboard. Approval unlocks the workspace automatically.</p> : null}
            </div>

            <div className={styles.authCard}>
              <div className={styles.authTabs} role="tablist" aria-label="Account access">
                <button className={authMode === 'login' ? styles.authTabActive : styles.authTab} onClick={() => setAuthMode('login')} role="tab" aria-selected={authMode === 'login'}>Sign in</button>
                <button className={authMode === 'signup' ? styles.authTabActive : styles.authTab} onClick={() => setAuthMode('signup')} role="tab" aria-selected={authMode === 'signup'}>Create account</button>
              </div>

              {authMode === 'signup' ? (
                <label className={styles.field}><span>Your name</span><input value={signupName} onChange={(e) => setSignupName(e.target.value)} placeholder="Ayesha Khan" autoComplete="name" /></label>
              ) : null}
              <label className={styles.field}><span>Email address</span><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" /></label>
              <label className={styles.field}><span>Password</span><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" autoComplete={authMode === 'signup' ? 'new-password' : 'current-password'} /></label>
              <button className={styles.primaryButton} onClick={submitEmailAuth} disabled={busy || !email.trim() || password.length < 8}>
                {busy ? 'Please wait…' : authMode === 'login' ? 'Sign in with email' : 'Create account'}
              </button>

              <div className={styles.orDivider}><span>or continue with phone</span></div>

              <label className={styles.field}><span>Phone number</span><input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0300 1234567" autoComplete="tel" /></label>
              <button className={styles.secondaryButton} onClick={requestOtp} disabled={busy || !phone.trim()}>Request phone code</button>

              {verificationSent ? (
                <div className={styles.verificationBox}>
                  <label className={styles.field}><span>Verification code</span><input type="text" inputMode="numeric" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="123456" /></label>
                  <button className={styles.primaryButton} onClick={verifyOtp} disabled={busy || code.length < 6}>Verify and sign in</button>
                </div>
              ) : null}

              {status ? <p className={styles.successText} role="status">{status}</p> : null}
              {error ? <p className={styles.errorText} role="alert">{error}</p> : null}
              {alreadySignedIn && intent === 'admin' && !alreadySignedIn.roles.includes('ADMIN') ? (
                <Link className={styles.secondaryLinkButton} href="/dashboard">Continue to my dashboard</Link>
              ) : null}

              <p className={styles.finePrint}>By continuing you agree to OneStop Life&apos;s care-first approach: verified professionals, clear fees and COD where available.</p>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
