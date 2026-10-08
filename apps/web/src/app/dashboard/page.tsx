'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import styles from './dashboard.module.css';
import { apiFetch } from '../../lib/auth/api';
import { clearAccessToken, hasRole, isBusinessUser, readAccessToken, readLoginIntent, type LoginIntent } from '../../lib/auth/session';
import type { PublicUser } from '../../lib/auth/types';
import { money, type Appointment } from '../../lib/doctors/types';
import { SectionIcon, type SectionIconName } from '../../components/home/SectionIcons';

function PanelTitle({ icon, title, sub, id }: { icon: SectionIconName; title: string; sub: string; id?: string }) {
  return (<div className={styles.cardHeader}><span className={styles.panelIcon}><SectionIcon name={icon} size={21} /></span><div><h2 id={id}>{title}</h2><p>{sub}</p></div></div>);
}

type VerificationRequest = {
  id: string;
  type: string;
  licenseNumber: string;
  licenseAuthority: string;
  documentKey: string;
  notes: string | null;
  status: string;
  createdAt: string;
  user: { id: string; phone: string; name: string | null };
};

type MyVerificationRequest = Omit<VerificationRequest, 'user'>;
type VerificationQueue = { items: VerificationRequest[]; total: number };

type SellerProduct = {
  id: string;
  nameEn: string;
  priceMinor: number;
  unit: string;
  category: string | null;
  imageUrl: string | null;
  inStock: boolean;
};

const VERIFICATION_TYPES = ['DOCTOR', 'VET', 'PHARMACY', 'BLOOD_BANK', 'SELLER'] as const;

const PROFESSIONAL_COPY: Record<string, { title: string; license: string; authority: string; document: string }> = {
  DOCTOR: { title: 'Doctor workspace', license: 'Medical licence number', authority: 'Medical council or authority', document: 'Licence document key' },
  VET: { title: 'Veterinary workspace', license: 'Veterinary licence number', authority: 'Veterinary council or authority', document: 'Licence document key' },
  PHARMACY: { title: 'Pharmacy workspace', license: 'Pharmacy licence number', authority: 'Drug regulatory authority', document: 'Licence document key' },
  BLOOD_BANK: { title: 'Blood bank workspace', license: 'Blood bank registration number', authority: 'Issuing authority', document: 'Registration document key' },
  SELLER: { title: 'Seller workspace', license: 'Business registration or seller ID', authority: 'Issuing authority or marketplace name', document: 'Business document key' },
};

export default function DashboardPage() {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [intent, setIntent] = useState<LoginIntent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);

  const [profileName, setProfileName] = useState('');
  const [profileEmail, setProfileEmail] = useState('');

  const [doctorAppointments, setDoctorAppointments] = useState<Appointment[]>([]);
  const [verificationType, setVerificationType] = useState<(typeof VERIFICATION_TYPES)[number]>('DOCTOR');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [licenseAuthority, setLicenseAuthority] = useState('');
  const [documentKey, setDocumentKey] = useState('');
  const [verificationNotes, setVerificationNotes] = useState('');
  const [myRequests, setMyRequests] = useState<MyVerificationRequest[]>([]);
  const [sellerProducts, setSellerProducts] = useState<SellerProduct[]>([]);
  const [sellerName, setSellerName] = useState('');
  const [sellerPrice, setSellerPrice] = useState('');
  const [sellerUnit, setSellerUnit] = useState('item');
  const [sellerCategory, setSellerCategory] = useState('Electronics & appliances');
  const [sellerImage, setSellerImage] = useState('');

  const [queue, setQueue] = useState<VerificationRequest[]>([]);
  const [rejectNotes, setRejectNotes] = useState<Record<string, string>>({});

  const loadUser = useCallback(async () => {
    const accessToken = readAccessToken();
    if (!accessToken) { setLoading(false); return; }
    try {
      const me = await apiFetch<PublicUser>('/users/me', { method: 'GET' }, accessToken);
      setUser(me);
      setProfileName(me.name ?? '');
      setProfileEmail(me.email ?? '');
      setError('');
    } catch {
      clearAccessToken();
      setUser(null);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { setIntent(readLoginIntent()); void loadUser(); }, [loadUser]);

  useEffect(() => {
    if (!user) return;
    const accessToken = readAccessToken();
    if (!accessToken) return;

    if (hasRole(user, 'DOCTOR')) {
      void apiFetch<Appointment[]>('/appointments/doctor/mine', {}, accessToken).then(setDoctorAppointments).catch(() => setDoctorAppointments([]));
    }
    if (!hasRole(user, 'ADMIN')) {
      void apiFetch<MyVerificationRequest[]>('/verification-requests/mine', { method: 'GET' }, accessToken).then(setMyRequests).catch(() => setMyRequests([]));
    }
    if (hasRole(user, 'SELLER', 'ADMIN')) {
      void apiFetch<SellerProduct[]>('/products/mine', { method: 'GET' }, accessToken).then(setSellerProducts).catch(() => setSellerProducts([]));
    }
    if (hasRole(user, 'ADMIN')) {
      void apiFetch<VerificationQueue>('/admin/verification-requests?status=PENDING&page=1&pageSize=50', { method: 'GET' }, accessToken)
        .then((result) => setQueue(result.items))
        .catch((e) => setError(e instanceof Error ? e.message : 'Unable to load verification queue.'));
    }
  }, [user]);

  const logout = async () => {
    const accessToken = readAccessToken();
    setBusy(true);
    try { if (accessToken) await apiFetch('/auth/logout', { method: 'POST' }, accessToken); } catch { /* ignore */ }
    finally { clearAccessToken(); setUser(null); setBusy(false); }
  };

  const updateProfile = async () => {
    const accessToken = readAccessToken();
    if (!accessToken || !user) return;
    setBusy(true); setError(''); setStatus('');
    try {
      const updated = await apiFetch<PublicUser>('/users/me', { method: 'PATCH', body: JSON.stringify({ name: profileName, email: profileEmail || null }) }, accessToken);
      setUser(updated); setProfileName(updated.name ?? ''); setProfileEmail(updated.email ?? '');
      setStatus('Profile updated successfully.');
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to update profile.'); }
    finally { setBusy(false); }
  };

  const submitVerification = async () => {
    const accessToken = readAccessToken();
    if (!accessToken) return;
    setBusy(true); setError(''); setStatus('');
    try {
      const created = await apiFetch<MyVerificationRequest>('/verification-requests', {
        method: 'POST',
        body: JSON.stringify({ type: verificationType, licenseNumber, licenseAuthority, documentKey, notes: verificationNotes || undefined }),
      }, accessToken);
      setMyRequests((current) => [created, ...current]);
      setLicenseNumber(''); setLicenseAuthority(''); setDocumentKey(''); setVerificationNotes('');
      setStatus('Verification request submitted for review.');
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to submit verification request.'); }
    finally { setBusy(false); }
  };

  const createSellerProduct = async () => {
    const accessToken = readAccessToken();
    if (!accessToken) return;
    setBusy(true); setError(''); setStatus('');
    try {
      const created = await apiFetch<SellerProduct>('/products', {
        method: 'POST',
        body: JSON.stringify({ nameEn: sellerName, priceMinor: Math.round(Number(sellerPrice) * 100), unit: sellerUnit, category: sellerCategory, imageUrl: sellerImage || undefined }),
      }, accessToken);
      setSellerProducts((current) => [created, ...current]);
      setSellerName(''); setSellerPrice(''); setSellerImage('');
      setStatus('Product submitted to your seller catalogue.');
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to create product.'); }
    finally { setBusy(false); }
  };

  const reviewVerification = async (request: VerificationRequest, action: 'approve' | 'reject') => {
    const accessToken = readAccessToken();
    if (!accessToken) return;
    const note = rejectNotes[request.id]?.trim() ?? '';
    if (action === 'reject' && note.length < 3) { setError('Add a rejection note with at least 3 characters.'); return; }
    setBusy(true); setError(''); setStatus('');
    try {
      await apiFetch(`/admin/verification-requests/${request.id}/${action}`, {
        method: 'POST',
        body: JSON.stringify(action === 'approve' ? { note: note || undefined } : { note }),
      }, accessToken);
      setQueue((current) => current.filter((item) => item.id !== request.id));
      setStatus(`Request ${action === 'approve' ? 'approved' : 'rejected'} successfully.`);
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to review request.'); }
    finally { setBusy(false); }
  };

  if (loading) {
    return <main className={styles.page}><div className={styles.shell}><p className={styles.loading}>Loading your dashboard…</p></div></main>;
  }

  if (!user) {
    return (
      <main className={styles.page}><div className={styles.shell}>
        <section className={styles.emptyState}>
          <span className={styles.emptyIcon}>→</span>
          <h1>Sign in to open your dashboard</h1>
          <p>Your dashboard is different for patients, doctors, businesses and admins. Choose how you want to continue and we will take you to the right place.</p>
          <Link className={styles.primaryButton} href="/login">Continue to sign in</Link>
        </section>
      </div></main>
    );
  }

  const isAdmin = hasRole(user, 'ADMIN');
  const isDoctor = hasRole(user, 'DOCTOR');
  const isSeller = hasRole(user, 'SELLER');
  const showPatient = intent === 'patient' || hasRole(user, 'CUSTOMER') || (!isAdmin && !isDoctor && !isBusinessUser(user));
  const showDoctor = intent === 'doctor' || isDoctor;
  const showBusiness = intent === 'business' || isBusinessUser(user) || isSeller;
  const showAdmin = intent === 'admin' || isAdmin;
  const professionalCopy = PROFESSIONAL_COPY[verificationType];
  const roleSummary = user.roles.length ? user.roles.join(', ') : 'Customer';

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <section className={styles.welcomeCard}>
          <div>
            <span className={styles.badge}>My OneStop dashboard</span>
            <h1>Welcome, {user.name || 'friend'}</h1>
            <p>{user.phone}{user.email ? ` · ${user.email}` : ''}</p>
          </div>
          <div className={styles.welcomeActions}>
            <span className={styles.rolePill}>{roleSummary}</span>
            <button className={styles.secondaryButton} onClick={logout} disabled={busy}>Log out</button>
          </div>
        </section>

        {intent ? <p className={styles.intentNote}>You continued as <strong>{intent}</strong>. Your actual access below follows the roles on your account{intent === 'admin' && !isAdmin ? ' — Admin tools stay locked until an ADMIN role is added.' : '.'}</p> : null}
        {status ? <p className={styles.successText} role="status">{status}</p> : null}
        {error ? <p className={styles.errorText} role="alert">{error}</p> : null}

        <div className={styles.grid}>
          <section className={styles.card}>
            <PanelTitle icon="users" title="Profile" sub="Keep your account details current." />
            <label className={styles.field}><span>Full name</span><input value={profileName} onChange={(e) => setProfileName(e.target.value)} /></label>
            <label className={styles.field}><span>Email</span><input type="email" value={profileEmail} onChange={(e) => setProfileEmail(e.target.value)} placeholder="you@example.com" /></label>
            <button className={styles.primaryButton} onClick={updateProfile} disabled={busy}>Save profile</button>
          </section>

          <section className={styles.card}>
            <PanelTitle icon="shield" title="Account overview" sub="Personal details and permissions." />
            <div className={styles.summaryList}>
              <div><span>Phone</span><strong>{user.phone || 'Email account'}</strong></div>
              <div><span>Email</span><strong>{user.email || 'Not provided yet'}</strong></div>
              <div><span>Locale</span><strong>{user.locale.toUpperCase()}</strong></div>
              <div><span>Roles</span><strong>{roleSummary}</strong></div>
            </div>
          </section>
        </div>

        {showPatient ? (
          <section className={styles.card} aria-labelledby="patient-heading">
            <PanelTitle id="patient-heading" icon="heart" title="Patient & customer" sub="Your everyday care shortcuts." />
            <div className={styles.linkGrid}>
              <Link className={styles.linkCard} href="/appointments"><strong>My Appointments</strong><span>See, manage or cancel doctor visits.</span></Link>
              <Link className={styles.linkCard} href="/cart"><strong>My cart &amp; orders</strong><span>Review your cart and check out with COD.</span></Link>
              <Link className={styles.linkCard} href="/doctors"><strong>Book a doctor</strong><span>Verified doctors with upfront fees.</span></Link>
              <Link className={styles.linkCard} href="/labs"><strong>Lab tests at home</strong><span>Book home sample collection and track reports.</span></Link>
              <Link className={styles.linkCard} href="/blood"><strong>Blood banks &amp; requests</strong><span>Find a blood bank or post a donor request.</span></Link>
              <Link className={styles.linkCard} href="/products"><strong>Shop essentials</strong><span>Medicines, wellness, baby &amp; pet care.</span></Link>
            </div>
          </section>
        ) : null}

        {showDoctor ? (
          <section className={styles.card} aria-labelledby="doctor-heading">
            <PanelTitle id="doctor-heading" icon="stethoscope" title="Doctor workspace" sub={isDoctor ? 'Your consultations and public profile.' : 'Doctor tools unlock after your DOCTOR verification is approved.'} />
            {isDoctor ? (
              <>
                <div className={styles.linkGrid}>
                  <Link className={styles.linkCard} href="/doctors"><strong>View public doctors page</strong><span>See how patients find and book you.</span></Link>
                  <a className={styles.linkCard} href="#doctor-appointments"><strong>My doctor appointments</strong><span>{doctorAppointments.length} appointment{doctorAppointments.length === 1 ? '' : 's'} on your schedule.</span></a>
                </div>
                <div id="doctor-appointments" className={styles.listBlock}>
                  <h3>Upcoming patient requests</h3>
                  {doctorAppointments.length ? doctorAppointments.slice(0, 6).map((appt) => (
                    <div className={styles.listItem} key={appt.id}>
                      <strong>{appt.patientName}</strong>
                      <span>{new Date(appt.startsAt).toLocaleString('en-PK', { dateStyle: 'medium', timeStyle: 'short' })} · {appt.type === 'VIDEO' ? 'Video' : 'In-person'} · {appt.status}</span>
                      <span>{money(appt.feeMinor)}</span>
                    </div>
                  )) : <p className={styles.emptyStateInline}>No doctor appointments yet. New patient bookings will appear here.</p>}
                </div>
                <p className={styles.note}>Profile editing is available through your verified doctor profile (speciality, fee, timings and facilities are managed via <code>POST/PATCH /doctors/me/profile</code>). If you need a field changed before the full editor ships, contact support and we will update it with you.</p>
              </>
            ) : (
              <p className={styles.note}>You chose Doctor at sign-in, but your account does not have the DOCTOR role yet. Submit a Doctor verification request in the Business &amp; verification section below — once approved, this workspace unlocks automatically.</p>
            )}
          </section>
        ) : null}

        {showBusiness ? (
          <>
            <section className={styles.card} aria-labelledby="business-heading">
              <PanelTitle id="business-heading" icon="pharmacy" title="Pharmacy / Business verification" sub="Choose the workspace that matches your work. Approval unlocks the tools for that role." />
              <div className={styles.formGrid}>
                <label className={styles.field}><span>Workspace type</span>
                  <select value={verificationType} onChange={(e) => setVerificationType(e.target.value as typeof verificationType)}>
                    {VERIFICATION_TYPES.map((type) => <option key={type} value={type}>{type.replaceAll('_', ' ')}</option>)}
                  </select>
                </label>
                <label className={styles.field}><span>{professionalCopy.license}</span><input value={licenseNumber} onChange={(e) => setLicenseNumber(e.target.value)} /></label>
                <label className={styles.field}><span>{professionalCopy.authority}</span><input value={licenseAuthority} onChange={(e) => setLicenseAuthority(e.target.value)} /></label>
                <label className={styles.field}><span>{professionalCopy.document}</span><input value={documentKey} onChange={(e) => setDocumentKey(e.target.value)} placeholder="storage/document-key.pdf" /></label>
              </div>
              <label className={styles.field}><span>Notes (optional)</span><input value={verificationNotes} onChange={(e) => setVerificationNotes(e.target.value)} /></label>
              <button className={styles.primaryButton} onClick={submitVerification} disabled={busy || !licenseNumber.trim() || !licenseAuthority.trim() || !documentKey.trim()}>Submit for review</button>

              <div className={styles.listBlock}>
                <h3>Your requests</h3>
                {myRequests.length ? myRequests.map((request) => (
                  <div className={styles.listItem} key={request.id}><strong>{request.type.replaceAll('_', ' ')}</strong><span>{request.licenseNumber}</span><span className={styles.statusTag}>{request.status}</span></div>
                )) : <p className={styles.emptyStateInline}>No verification requests yet.</p>}
              </div>
            </section>

            {(isSeller || isAdmin) ? (
              <section className={styles.card} aria-labelledby="seller-heading">
                <PanelTitle id="seller-heading" icon="cart" title="Seller catalogue" sub="List products, set prices, and build your storefront inventory." />
                <div className={styles.sellerGrid}>
                  <div>
                    <h3 className={styles.subheading}>Add a product</h3>
                    <label className={styles.field}><span>Product name</span><input value={sellerName} onChange={(e) => setSellerName(e.target.value)} placeholder="e.g. Wireless Health Watch" /></label>
                    <div className={styles.formGrid}>
                      <label className={styles.field}><span>Price (PKR)</span><input type="number" min="1" value={sellerPrice} onChange={(e) => setSellerPrice(e.target.value)} /></label>
                      <label className={styles.field}><span>Unit</span><select value={sellerUnit} onChange={(e) => setSellerUnit(e.target.value)}><option>item</option><option>pack</option><option>bottle</option><option>kit</option></select></label>
                    </div>
                    <label className={styles.field}><span>Category</span><select value={sellerCategory} onChange={(e) => setSellerCategory(e.target.value)}><option>Electronics & appliances</option><option>Medical devices</option><option>Wellness</option><option>Pet care</option><option>Personal care</option><option>Home health</option><option>Trending essentials</option></select></label>
                    <label className={styles.field}><span>Product image URL</span><input value={sellerImage} onChange={(e) => setSellerImage(e.target.value)} placeholder="https://…" /></label>
                    <button className={styles.primaryButton} onClick={createSellerProduct} disabled={busy || !sellerName.trim() || Number(sellerPrice) <= 0}>+ Add to catalogue</button>
                  </div>
                  <div>
                    <h3 className={styles.subheading}>Your listings <span className={styles.countPill}>{sellerProducts.length}</span></h3>
                    {sellerProducts.length ? sellerProducts.slice(0, 6).map((product) => (
                      <div className={styles.listItem} key={product.id}><strong>{product.nameEn}</strong><span>{product.category ?? 'Everyday care'}</span><span>{money(product.priceMinor)}</span></div>
                    )) : <p className={styles.emptyStateInline}>Your approved catalogue listings will appear here.</p>}
                  </div>
                </div>
              </section>
            ) : (
              <section className={styles.card}><p className={styles.note}>Seller catalogue tools unlock after a SELLER verification is approved. Your submitted requests above are tracked automatically.</p></section>
            )}
          </>
        ) : null}

        {showAdmin ? (
          <section className={styles.card} aria-labelledby="admin-heading">
            <PanelTitle id="admin-heading" icon="shield" title="Admin control centre" sub="Review trust applications and keep the marketplace safe." />
            {isAdmin ? (
              <>
                <div className={styles.adminStats}><div><strong>{queue.length}</strong><span>pending reviews</span></div><Link href="/products">Open catalogue →</Link></div>
                {queue.length ? (
                  <div className={styles.queueList}>
                    {queue.map((request) => (
                      <article className={styles.queueItem} key={request.id}>
                        <div className={styles.queueHeader}>
                          <div><span className={styles.statusTag}>{request.type.replaceAll('_', ' ')}</span><h3>{request.user.name || 'Unnamed applicant'}</h3><p>{request.user.phone}</p></div>
                          <span>{new Date(request.createdAt).toLocaleDateString('en-PK')}</span>
                        </div>
                        <p className={styles.queueMeta}>Licence: <strong>{request.licenseNumber}</strong> · Authority: <strong>{request.licenseAuthority}</strong> · Document: <strong>{request.documentKey}</strong></p>
                        {request.notes ? <p className={styles.queueNotes}>{request.notes}</p> : null}
                        <label className={styles.field}><span>Review note (required to reject)</span><input value={rejectNotes[request.id] ?? ''} onChange={(e) => setRejectNotes((current) => ({ ...current, [request.id]: e.target.value }))} placeholder="Reason or approval note" /></label>
                        <div className={styles.reviewActions}>
                          <button className={styles.primaryButton} onClick={() => reviewVerification(request, 'approve')} disabled={busy}>Approve</button>
                          <button className={styles.dangerButton} onClick={() => reviewVerification(request, 'reject')} disabled={busy}>Reject</button>
                        </div>
                      </article>
                    ))}
                  </div>
                ) : <p className={styles.emptyStateInline}>No pending verification requests.</p>}
              </>
            ) : (
              <div className={styles.adminLocked}>
                <strong>Admins only</strong>
                <p>You continued as Admin, but your account ({roleSummary}) does not have the ADMIN role. If you are on the platform team, ask an existing admin to add the role to your account, then sign in again. Otherwise, continue as Patient, Doctor or Business from the <Link href="/login">sign-in page</Link>.</p>
              </div>
            )}
          </section>
        ) : null}
      </div>
    </main>
  );
}
