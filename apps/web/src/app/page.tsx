'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import styles from './page.module.css';

const STORAGE_KEY = 'onestop-access-token';
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'https://api-production-7a91a.up.railway.app';

type PublicUser = {
  id: string;
  phone: string;
  name: string | null;
  email: string | null;
  locale: string;
  roles: string[];
};

type Session = {
  accessToken: string;
  user: PublicUser;
};

type LandingProduct = {
  id: string;
  nameEn: string;
  priceMinor: number;
  unit: string;
  category: string | null;
  imageUrl: string | null;
  inStock: boolean;
};

type VerificationRequest = {
  id: string;
  type: string;
  licenseNumber: string;
  licenseAuthority: string;
  documentKey: string;
  notes: string | null;
  status: string;
  createdAt: string;
  user: {
    id: string;
    phone: string;
    name: string | null;
  };
};

type VerificationQueue = {
  items: VerificationRequest[];
  total: number;
};

type MyVerificationRequest = Omit<VerificationRequest, 'user'>;

function getErrorMessage(payload: unknown): string {
  if (!payload || typeof payload !== 'object') return 'Something went wrong.';

  const record = payload as Record<string, unknown>;
  if (typeof record.message === 'string') return record.message;
  if (Array.isArray(record.message)) {
    const joined = record.message.filter((item): item is string => typeof item === 'string');
    if (joined.length > 0) return joined.join(', ');
  }
  if (typeof record.error === 'string') return record.error;
  return 'Something went wrong.';
}

async function apiFetch<T>(endpoint: string, options: RequestInit = {}, accessToken?: string): Promise<T> {
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

export default function Home() {
  const [phone, setPhone] = useState('03001234567');
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [signupName, setSignupName] = useState('');
  const [code, setCode] = useState('');
  const [verificationSent, setVerificationSent] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [profileName, setProfileName] = useState('');
  const [profileEmail, setProfileEmail] = useState('');
  const [status, setStatus] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [busy, setBusy] = useState(false);
  const [verificationQueue, setVerificationQueue] = useState<VerificationRequest[]>([]);
  const [rejectNotes, setRejectNotes] = useState<Record<string, string>>({});
  const [verificationType, setVerificationType] = useState('DOCTOR');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [licenseAuthority, setLicenseAuthority] = useState('');
  const [documentKey, setDocumentKey] = useState('');
  const [verificationNotes, setVerificationNotes] = useState('');
  const [myVerificationRequests, setMyVerificationRequests] = useState<MyVerificationRequest[]>([]);
  const [trendingProducts, setTrendingProducts] = useState<LandingProduct[]>([]);
  const [sellerProducts, setSellerProducts] = useState<LandingProduct[]>([]);
  const [sellerProductName, setSellerProductName] = useState('');
  const [sellerProductPrice, setSellerProductPrice] = useState('');
  const [sellerProductUnit, setSellerProductUnit] = useState('item');
  const [sellerProductCategory, setSellerProductCategory] = useState('Electronics & appliances');
  const [sellerProductImage, setSellerProductImage] = useState('');

  const roleSummary = useMemo(
    () => (session?.user.roles.length ? session.user.roles.join(', ') : 'Customer'),
    [session],
  );

  const professionalCopy = verificationType === 'SELLER'
    ? { title: 'Seller workspace', license: 'Business registration or seller ID', authority: 'Issuing authority or marketplace name', document: 'Business document or catalogue proof' }
    : verificationType === 'DOCTOR'
      ? { title: 'Doctor workspace', license: 'Medical licence number', authority: 'Medical council or authority', document: 'Licence document' }
      : verificationType === 'VET'
        ? { title: 'Veterinary workspace', license: 'Veterinary licence number', authority: 'Veterinary council or authority', document: 'Licence document' }
        : { title: 'Professional workspace', license: 'Registration or licence number', authority: 'Issuing authority', document: 'Verification document' };

  const persistSession = (nextSession: Session) => {
    localStorage.setItem(STORAGE_KEY, nextSession.accessToken);
    setSession(nextSession);
    setProfileName(nextSession.user.name ?? '');
    setProfileEmail(nextSession.user.email ?? '');
  };

  const clearSession = () => {
    localStorage.removeItem(STORAGE_KEY);
    setSession(null);
    setCode('');
    setVerificationSent(false);
    setProfileName('');
    setProfileEmail('');
    setVerificationQueue([]);
  };

  useEffect(() => {
    const token = localStorage.getItem(STORAGE_KEY);
    if (!token) return;

    void (async () => {
      try {
        const user = await apiFetch<PublicUser>('/users/me', { method: 'GET' }, token);
        setSession({ accessToken: token, user });
        setProfileName(user.name ?? '');
        setProfileEmail(user.email ?? '');
      } catch {
        clearSession();
      }
    })();
  }, []);

  useEffect(() => {
    void fetch('/api/products')
      .then((response) => response.json() as Promise<{ items?: LandingProduct[] }>)
      .then((payload) => setTrendingProducts((payload.items ?? []).slice(0, 6)))
      .catch(() => setTrendingProducts([]));
  }, []);

  useEffect(() => {
    if (!session?.user.roles.includes('ADMIN')) {
      return;
    }

    const loadVerificationQueue = async () => {
      try {
        const result = await apiFetch<VerificationQueue>(
          '/admin/verification-requests?status=PENDING&page=1&pageSize=50',
          { method: 'GET' },
          session.accessToken,
        );
        setVerificationQueue(result.items);
      } catch (queueError) {
        setError(queueError instanceof Error ? queueError.message : 'Unable to load verification queue.');
      }
    };

    void loadVerificationQueue();
  }, [session]);

  useEffect(() => {
    if (!session || (!session.user.roles.includes('SELLER') && !session.user.roles.includes('ADMIN'))) return;
    void apiFetch<LandingProduct[]>('/products/mine', { method: 'GET' }, session.accessToken)
      .then(setSellerProducts)
      .catch(() => setSellerProducts([]));
  }, [session]);

  useEffect(() => {
    if (!session || session.user.roles.includes('ADMIN')) return;

    const loadMyVerificationRequests = async () => {
      try {
        const result = await apiFetch<MyVerificationRequest[]>('/verification-requests/mine', { method: 'GET' }, session.accessToken);
        setMyVerificationRequests(result);
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : 'Unable to load verification requests.');
      }
    };

    void loadMyVerificationRequests();
  }, [session]);

  const requestOtp = async () => {
    setBusy(true);
    setError('');
    setStatus('');

    try {
      await apiFetch('/auth/otp/request', {
        method: 'POST',
        body: JSON.stringify({ phone }),
      });
      setVerificationSent(true);
      setStatus('OTP sent. In development mode, you can just use 000000 as your code.');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Failed to request OTP.');
    } finally {
      setBusy(false);
    }
  };

  const verifyOtp = async () => {
    setBusy(true);
    setError('');
    setStatus('');

    try {
      const result = await apiFetch<{ accessToken: string; user: PublicUser }>('/auth/otp/verify', {
        method: 'POST',
        body: JSON.stringify({ phone, code }),
      });

      persistSession({ accessToken: result.accessToken, user: result.user });
      setVerificationSent(false);
      setCode('');
      setStatus('Signed in successfully.');
    } catch (verifyError) {
      setError(verifyError instanceof Error ? verifyError.message : 'Verification failed.');
    } finally {
      setBusy(false);
    }
  };

  const submitEmailAuth = async () => {
    setBusy(true);
    setError('');
    setStatus('');
    try {
      const result = await apiFetch<{ accessToken: string; user: PublicUser }>(`/auth/email/${authMode}`, {
        method: 'POST',
        body: JSON.stringify(authMode === 'signup' ? { email, password, name: signupName } : { email, password }),
      });
      persistSession({ accessToken: result.accessToken, user: result.user });
      setPassword('');
      setStatus(authMode === 'signup' ? 'Account created successfully.' : 'Signed in successfully.');
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : 'Unable to authenticate.');
    } finally {
      setBusy(false);
    }
  };

  const updateProfile = async () => {
    if (!session) return;

    setBusy(true);
    setError('');
    setStatus('');

    try {
      const updated = await apiFetch<PublicUser>(
        '/users/me',
        {
          method: 'PATCH',
          body: JSON.stringify({ name: profileName, email: profileEmail || null }),
        },
        session.accessToken,
      );

      setSession({ accessToken: session.accessToken, user: updated });
      setProfileName(updated.name ?? '');
      setProfileEmail(updated.email ?? '');
      setStatus('Profile updated successfully.');
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : 'Unable to update profile.');
    } finally {
      setBusy(false);
    }
  };

  const createSellerProduct = async () => {
    if (!session) return;
    setBusy(true);
    setError('');
    try {
      const created = await apiFetch<LandingProduct>('/products', {
        method: 'POST',
        body: JSON.stringify({ nameEn: sellerProductName, priceMinor: Math.round(Number(sellerProductPrice) * 100), unit: sellerProductUnit, category: sellerProductCategory, imageUrl: sellerProductImage || undefined }),
      }, session.accessToken);
      setSellerProducts((current) => [created, ...current]);
      setSellerProductName('');
      setSellerProductPrice('');
      setSellerProductImage('');
      setStatus('Product submitted to your seller catalogue.');
    } catch (productError) {
      setError(productError instanceof Error ? productError.message : 'Unable to create product.');
    } finally {
      setBusy(false);
    }
  };

  const logout = async () => {
    if (!session) return clearSession();

    setBusy(true);
    try {
      await apiFetch('/auth/logout', { method: 'POST' }, session.accessToken);
    } catch {
      // Ignore logout problems and clear local state.
    } finally {
      clearSession();
      setStatus('Logged out.');
      setBusy(false);
    }
  };

  const reviewVerification = async (request: VerificationRequest, action: 'approve' | 'reject') => {
    if (!session) return;

    const note = rejectNotes[request.id]?.trim() ?? '';
    if (action === 'reject' && note.length < 3) {
      setError('Add a rejection note with at least 3 characters.');
      return;
    }

    setBusy(true);
    setError('');
    setStatus('');

    try {
      await apiFetch(`/admin/verification-requests/${request.id}/${action}`, {
        method: 'POST',
        body: JSON.stringify(action === 'approve' ? { note: note || undefined } : { note }),
      }, session.accessToken);
      setVerificationQueue((current) => current.filter((item) => item.id !== request.id));
      setStatus(`Request ${action === 'approve' ? 'approved' : 'rejected'} successfully.`);
    } catch (reviewError) {
      setError(reviewError instanceof Error ? reviewError.message : 'Unable to review request.');
    } finally {
      setBusy(false);
    }
  };

  const submitVerification = async () => {
    if (!session) return;

    setBusy(true);
    setError('');
    setStatus('');

    try {
      const created = await apiFetch<MyVerificationRequest>('/verification-requests', {
        method: 'POST',
        body: JSON.stringify({
          type: verificationType,
          licenseNumber,
          licenseAuthority,
          documentKey,
          notes: verificationNotes || undefined,
        }),
      }, session.accessToken);
      setMyVerificationRequests((current) => [created, ...current]);
      setLicenseNumber('');
      setLicenseAuthority('');
      setDocumentKey('');
      setVerificationNotes('');
      setStatus('Verification request submitted for review.');
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to submit verification request.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={styles.page} id="account">
      <div className={styles.shell}>
        {session ? (
          <div className={styles.accountToolbar}>
            <p>Signed in as <strong>{session.user.name || session.user.phone}</strong></p>
            <button className={styles.secondaryButton} onClick={logout} disabled={busy}>
              Log out
            </button>
          </div>
        ) : null}

        {!session ? (
          <>
            <main className={styles.authLayout}>
            <section className={styles.heroPanel}>
              <div className={styles.heroCopy}>
                <span className={styles.badge}>Your everyday care companion</span>
                <p className={styles.heroEyebrow}>Health, home & pet essentials</p>
                <h1>Good care should feel this easy.</h1>
                <p className={styles.heroDescription}>Discover trusted essentials, professional services, and a smoother way to keep life moving.</p>
                <div className={styles.heroActions}><Link className={styles.primaryButton} href="/products">Explore the store</Link><a className={styles.heroTextLink} href="#trending">See what&apos;s trending <span aria-hidden="true">-&gt;</span></a></div>
              </div>
              <div className={styles.heroProductWall} aria-label="Featured care products">
                <div className={`${styles.heroProductTile} ${styles.heroTileTall}`}><span>Home health</span><strong>Ready for the everyday.</strong></div>
                <div className={styles.heroProductTile}><span>Pet care</span><strong>Thoughtful care for companions.</strong></div>
                <div className={styles.heroProductTile}><span>Wellness</span><strong>Small rituals. Better days.</strong></div>
              </div>
            </section>

            <section className={styles.authCard}>
              <div className={styles.authIntro}><span className={styles.authSpark} aria-hidden="true">✦</span><div><h3>{authMode === 'login' ? 'Welcome back' : 'Create your account'}</h3><p>{authMode === 'login' ? 'Pick up where you left off.' : 'Join OneStop for faster, simpler care shopping.'}</p></div></div>
              <div className={styles.authTabs} role="tablist" aria-label="Account access"><button className={authMode === 'login' ? styles.authTabActive : styles.authTab} onClick={() => setAuthMode('login')} role="tab" aria-selected={authMode === 'login'}>Sign in</button><button className={authMode === 'signup' ? styles.authTabActive : styles.authTab} onClick={() => setAuthMode('signup')} role="tab" aria-selected={authMode === 'signup'}>Create account</button></div>
              {authMode === 'signup' ? <label className={styles.field}><span>Your name</span><input value={signupName} onChange={(event) => setSignupName(event.target.value)} placeholder="Ayesha Khan" autoComplete="name" /></label> : null}
              <label className={styles.field}><span>Email address</span><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" autoComplete="email" /></label>
              <label className={styles.field}><span>Password</span><input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 8 characters" autoComplete={authMode === 'signup' ? 'new-password' : 'current-password'} /></label>
              <button className={styles.primaryButton} onClick={submitEmailAuth} disabled={busy || !email.trim() || password.length < 8}><span aria-hidden="true">→</span> {busy ? 'Please wait...' : authMode === 'login' ? 'Sign in with email' : 'Create account'}</button>
              <div className={styles.orDivider}><span>or continue with</span></div>
              <div className={styles.socialButtons}><button className={styles.socialButton} onClick={() => setStatus('Google sign-in will be enabled when OAuth credentials are connected.')}><b>G</b> Google</button><button className={styles.socialButton} onClick={() => setStatus('Apple sign-in will be enabled when OAuth credentials are connected.')}><b>●</b> Apple</button><button className={styles.socialButton} onClick={() => setStatus('Microsoft sign-in will be enabled when OAuth credentials are connected.')}><b>▦</b> Microsoft</button></div>
              <details className={styles.phoneFallback}><summary>Use phone OTP instead</summary><label className={styles.field}><span>Phone number</span><input type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="0300 1234567" /></label><button className={styles.secondaryButton} onClick={requestOtp} disabled={busy || !phone.trim()}>Request phone code</button>{verificationSent ? <div className={styles.verificationBox}><label className={styles.field}><span>Verification code</span><input type="text" inputMode="numeric" maxLength={6} value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="123456" /></label><button className={styles.primaryButton} onClick={verifyOtp} disabled={busy || code.length < 6}>Verify and sign in</button></div> : null}</details>

              {status ? <p className={styles.successText}>{status}</p> : null}
              {error ? <p className={styles.errorText}>{error}</p> : null}
            </section>
            </main>

            <section className={styles.landingTrust} id="benefits" aria-label="Shopping benefits">
              <div><strong>Curated essentials</strong><span>Useful products, clearly organised</span></div>
              <div><strong>Reliable delivery</strong><span>Free delivery over Rs. 3,000</span></div>
              <div><strong>Flexible checkout</strong><span>Cash on delivery and card test mode</span></div>
              <div><strong>Human support</strong><span>One account for care and commerce</span></div>
            </section>

            <section className={styles.trendingSection} id="trending" aria-labelledby="trending-heading">
              <div className={styles.trendingHeader}>
                <div><p className={styles.kicker}>What shoppers are choosing</p><h2 id="trending-heading">Trending for everyday care</h2><p>Start with the products people reach for most often.</p></div>
                <Link className={styles.textLink} href="/products">View all products</Link>
              </div>
              <div className={styles.trendingGrid}>
                {trendingProducts.map((product) => (
                  <article className={styles.trendingCard} key={product.id}>
                    <div className={styles.trendingImage} role="img" aria-label={`${product.nameEn} product image`} style={product.imageUrl ? { backgroundImage: `url(${product.imageUrl})` } : undefined}>{!product.imageUrl ? product.nameEn.slice(0, 1) : null}</div>
                    <div className={styles.trendingBody}><span>{product.category ?? 'Everyday care'}</span><h3>{product.nameEn}</h3><strong>Rs. {(product.priceMinor / 100).toFixed(2)}</strong><Link href="/products">Shop now</Link></div>
                  </article>
                ))}
              </div>
            </section>

            <section className={styles.whySection} id="why-onestop" aria-labelledby="why-heading">
              <div className={styles.sectionIntro}><p className={styles.kicker}>A calmer way to shop for care</p><h2 id="why-heading">Why people choose OneStop</h2><p>We bring useful products and trusted access together, so the important things take fewer steps.</p></div>
              <div className={styles.whyGrid}>
                <article><span className={styles.whyNumber}>01</span><h3>One considered catalogue</h3><p>Shop health, home, baby, wellness, and veterinary essentials in one clear place.</p></article>
                <article><span className={styles.whyNumber}>02</span><h3>Built around real life</h3><p>Save your details, repeat useful orders, and keep professional care pathways close by.</p></article>
                <article><span className={styles.whyNumber}>03</span><h3>Clear from shelf to door</h3><p>Simple pricing, visible availability, delivery thresholds, and checkout choices you can understand.</p></article>
              </div>
            </section>

            <section className={styles.contactSection} id="contact" aria-labelledby="contact-heading">
              <div><p className={styles.kicker}>We are here to help</p><h2 id="contact-heading">Questions before you order?</h2><p>Talk to the OneStop team about products, delivery, professional verification, or an existing order.</p></div>
              <div className={styles.contactActions}><a href="mailto:support@onestop.life">support@onestop.life</a><a href="tel:+923001234567">+92 300 1234567</a><span>Mon-Fri, 9:00-18:00 PKT</span></div>
            </section>

            <section className={styles.detailsSection} aria-labelledby="details-heading">
              <div className={styles.sectionIntro}><p className={styles.kicker}>Good to know</p><h2 id="details-heading">Essential information</h2></div>
              <div className={styles.detailsList}>
                <details><summary>Delivery and free shipping</summary><p>Standard delivery is Rs. 150. Orders over Rs. 3,000 qualify for free delivery. Delivery timing depends on your address and product availability.</p></details>
                <details><summary>Returns and refunds</summary><p>Contact support with your order number for damaged, incorrect, or eligible returned items. Approved refunds are recorded against the original payment.</p></details>
                <details><summary>Payment options</summary><p>Cash on delivery is available. Card checkout is enabled in local test mode until a live payment gateway is connected for production.</p></details>
                <details><summary>Professional verification</summary><p>Sign in, submit your credentials from the account area, and our review team will assess your professional application.</p></details>
              </div>
            </section>
          </>
        ) : (
          <main className={styles.dashboard}>
            <section className={styles.welcomeCard}>
              <div>
                <span className={styles.badge}>Signed in</span>
                <h2>Welcome, {session.user.name || 'Patient'}</h2>
              </div>
              <div className={styles.rolePill}>{roleSummary}</div>
            </section>

            <section className={styles.workspaceBar} aria-label="Workspace shortcuts">
              <div><span className={styles.workspaceIcon}>▦</span><strong>{session.user.roles.includes('ADMIN') ? 'Admin control centre' : session.user.roles.includes('SELLER') ? 'Seller workspace' : 'Customer workspace'}</strong><span>Manage the work that belongs to your account.</span></div>
              <div className={styles.workspacePills}><span>Profile</span>{session.user.roles.includes('SELLER') ? <span>Catalogue</span> : null}{session.user.roles.includes('ADMIN') ? <span>Reviews</span> : null}<span>Orders</span></div>
            </section>

            <div className={styles.grid}>
              <section className={styles.card}>
                <div className={styles.cardHeader}>
                  <h3>Profile</h3>
                  <p>Keep your account details current.</p>
                </div>

                <label className={styles.field}>
                  <span>Full name</span>
                  <input value={profileName} onChange={(event) => setProfileName(event.target.value)} />
                </label>

                <label className={styles.field}>
                  <span>Email</span>
                  <input
                    type="email"
                    value={profileEmail}
                    onChange={(event) => setProfileEmail(event.target.value)}
                    placeholder="you@example.com"
                  />
                </label>

                <button className={styles.primaryButton} onClick={updateProfile} disabled={busy}>
                  Save profile
                </button>
              </section>

              <section className={styles.card}>
                <div className={styles.cardHeader}>
                  <h3>Account overview</h3>
                  <p>Personal details and permissions.</p>
                </div>

                <div className={styles.summaryList}>
                  <div>
                    <span>Phone</span>
                    <strong>{session.user.phone}</strong>
                  </div>
                  <div>
                    <span>Email</span>
                    <strong>{session.user.email || 'Not provided yet'}</strong>
                  </div>
                  <div>
                    <span>Locale</span>
                    <strong>{session.user.locale.toUpperCase()}</strong>
                  </div>
                  <div>
                    <span>Roles</span>
                    <strong>{roleSummary}</strong>
                  </div>
                </div>
              </section>
            </div>

            {session.user.roles.includes('SELLER') || session.user.roles.includes('ADMIN') ? (
              <section className={styles.card}>
                <div className={styles.cardHeader}><h3>Seller catalogue</h3><p>List products, set prices, and build your storefront inventory.</p></div>
                <div className={styles.sellerWorkspace}><div className={styles.sellerForm}><h4>Add a product</h4><label className={styles.field}><span>Product name</span><input value={sellerProductName} onChange={(event) => setSellerProductName(event.target.value)} placeholder="e.g. Wireless Health Watch" /></label><div className={styles.formGrid}><label className={styles.field}><span>Price (PKR)</span><input type="number" min="1" value={sellerProductPrice} onChange={(event) => setSellerProductPrice(event.target.value)} /></label><label className={styles.field}><span>Unit</span><select value={sellerProductUnit} onChange={(event) => setSellerProductUnit(event.target.value)}><option>item</option><option>pack</option><option>bottle</option><option>kit</option></select></label></div><label className={styles.field}><span>Category</span><select value={sellerProductCategory} onChange={(event) => setSellerProductCategory(event.target.value)}><option>Electronics & appliances</option><option>Medical devices</option><option>Wellness</option><option>Pet care</option><option>Personal care</option><option>Home health</option></select></label><label className={styles.field}><span>Product image URL</span><input value={sellerProductImage} onChange={(event) => setSellerProductImage(event.target.value)} placeholder="https://..." /></label><button className={styles.primaryButton} onClick={createSellerProduct} disabled={busy || !sellerProductName.trim() || Number(sellerProductPrice) <= 0}><span aria-hidden="true">+</span> Add to catalogue</button></div><div className={styles.sellerInventory}><div className={styles.inventoryHeader}><h4>Your listings</h4><span>{sellerProducts.length} products</span></div>{sellerProducts.length ? sellerProducts.slice(0, 6).map((product) => <div className={styles.inventoryItem} key={product.id}><span className={styles.inventoryThumb} style={product.imageUrl ? { backgroundImage: `url(${product.imageUrl})` } : undefined}>{!product.imageUrl ? product.nameEn.slice(0, 1) : null}</span><strong>{product.nameEn}</strong><span>Rs. {(product.priceMinor / 100).toFixed(2)}</span></div>) : <p className={styles.emptyState}>Your approved catalogue listings will appear here.</p>}</div></div>
              </section>
            ) : null}

            {!session.user.roles.includes('ADMIN') ? (
              <section className={styles.card}>
                <div className={styles.cardHeader}>
                    <h3>Apply for a professional workspace</h3>
                    <p>Choose the path that matches your work. Approval unlocks the tools for that role.</p>
                </div>

                <div className={styles.formGrid}>
                  <label className={styles.field}>
                      <span>Workspace type</span>
                    <select value={verificationType} onChange={(event) => setVerificationType(event.target.value)}>
                      <option value="DOCTOR">Doctor</option>
                      <option value="VET">Veterinarian</option>
                      <option value="PHARMACY">Pharmacy</option>
                      <option value="BLOOD_BANK">Blood bank</option>
                      <option value="SELLER">Seller</option>
                    </select>
                  </label>
                  <label className={styles.field}>
                    <span>{professionalCopy.license}</span>
                    <input value={licenseNumber} onChange={(event) => setLicenseNumber(event.target.value)} />
                  </label>
                  <label className={styles.field}>
                    <span>{professionalCopy.authority}</span>
                    <input value={licenseAuthority} onChange={(event) => setLicenseAuthority(event.target.value)} />
                  </label>
                  <label className={styles.field}>
                      <span>{professionalCopy.document}</span>
                    <input
                      value={documentKey}
                      onChange={(event) => setDocumentKey(event.target.value)}
                      placeholder="storage/document-key.pdf"
                    />
                  </label>
                </div>
                <label className={styles.field}>
                  <span>Notes</span>
                  <input value={verificationNotes} onChange={(event) => setVerificationNotes(event.target.value)} />
                </label>
                <button
                  className={styles.primaryButton}
                  onClick={submitVerification}
                  disabled={busy || !licenseNumber.trim() || !licenseAuthority.trim() || !documentKey.trim()}
                >
                  Submit for review
                </button>

                <div className={styles.requestHistory}>
                  <h4>Your requests</h4>
                  {myVerificationRequests.length ? (
                    myVerificationRequests.map((request) => (
                      <div className={styles.historyItem} key={request.id}>
                        <strong>{request.type.replaceAll('_', ' ')}</strong>
                        <span>{request.licenseNumber}</span>
                        <span className={styles.statusTag}>{request.status}</span>
                      </div>
                    ))
                  ) : (
                    <p className={styles.emptyState}>No verification requests yet.</p>
                  )}
                </div>
              </section>
            ) : null}

            {session.user.roles.includes('ADMIN') ? (
              <section className={styles.card}>
                <div className={styles.adminOverview}><div><span className={styles.adminIcon}>⌘</span><div><p className={styles.kicker}>Operations</p><h3>Admin control centre</h3><p>Review trust applications and monitor the live catalogue from one workspace.</p></div></div><div className={styles.adminStats}><div><strong>{verificationQueue.length}</strong><span>pending reviews</span></div><div><strong>{trendingProducts.length}</strong><span>featured products</span></div><Link href="/products">Open catalogue →</Link></div></div>
                <div className={styles.queueHeader}>
                  <div className={styles.cardHeader}>
                    <h3>Verification review queue</h3>
                    <p>Review professional applications in the order they arrived.</p>
                  </div>
                  <span className={styles.queueCount}>{verificationQueue.length} pending</span>
                </div>

                {verificationQueue.length ? (
                  <div className={styles.queueList}>
                    {verificationQueue.map((request) => (
                      <article className={styles.queueItem} key={request.id}>
                        <div className={styles.queueItemHeader}>
                          <div>
                            <span className={styles.requestType}>{request.type.replaceAll('_', ' ')}</span>
                            <h4>{request.user.name || 'Unnamed applicant'}</h4>
                            <p>{request.user.phone}</p>
                          </div>
                          <span className={styles.requestDate}>
                            {new Date(request.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <div className={styles.requestDetails}>
                          <span>Licence: <strong>{request.licenseNumber}</strong></span>
                          <span>Authority: <strong>{request.licenseAuthority}</strong></span>
                          <span>Document: <strong>{request.documentKey}</strong></span>
                        </div>
                        {request.notes ? <p className={styles.requestNotes}>{request.notes}</p> : null}
                        <label className={styles.field}>
                          <span>Review note</span>
                          <input
                            value={rejectNotes[request.id] ?? ''}
                            onChange={(event) =>
                              setRejectNotes((current) => ({ ...current, [request.id]: event.target.value }))
                            }
                            placeholder="Required when rejecting"
                          />
                        </label>
                        <div className={styles.reviewActions}>
                          <button
                            className={styles.primaryButton}
                            onClick={() => reviewVerification(request, 'approve')}
                            disabled={busy}
                          >
                            Approve
                          </button>
                          <button
                            className={styles.dangerButton}
                            onClick={() => reviewVerification(request, 'reject')}
                            disabled={busy}
                          >
                            Reject
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <p className={styles.emptyState}>No pending verification requests.</p>
                )}
              </section>
            ) : null}

            {status ? <p className={styles.successText}>{status}</p> : null}
            {error ? <p className={styles.errorText}>{error}</p> : null}
          </main>
        )}
      </div>
    </div>
  );
}
