'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Fragment, useCallback, useEffect, useRef, useState } from 'react';
import styles from './dashboard.module.css';
import { apiFetch } from '../../lib/auth/api';
import { clearAccessToken, hasRole, isBusinessUser, readAccessToken, readLoginIntent, type LoginIntent } from '../../lib/auth/session';
import type { PublicUser } from '../../lib/auth/types';
import { doctorInitials, money, type Appointment } from '../../lib/doctors/types';
import { SectionIcon, type SectionIconName } from '../../components/home/SectionIcons';
import OrderTracking from '../../components/orders/OrderTracking';
import WalletPanel from '../../components/wallet/WalletPanel';
import PrescriptionComposer from '../../components/dashboard/PrescriptionComposer';

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

type AdminOverview = {
  users: { total: number; newToday: number; newThisWeek: number; byRole: Record<string, number>; recent: Array<{ id: string; name: string | null; phone: string | null; email: string | null; roles: string[]; createdAt: string }> };
  verification: { byStatus: Record<string, number> };
  orders: { total: number; today: number; revenueMinor: number; byStatus: Record<string, number>; rxPending: number };
  catalogue: { total: number; inStock: number; outOfStock: number; outOfStockItems: Array<{ id: string; nameEn: string; category: string | null }>; medicines: number; rxMedicines: number; byCategory: Array<{ category: string; total: number; inStock: number }> };
  platform: { doctors: number; facilities: number; appointmentsToday: number };
  monthly: Array<{ month: string; registrations: number; orders: number; revenueMinor: number }>;
};

type MyOrder = {
  id: string;
  status: string;
  totalMinor: number;
  createdAt: string;
  requiresRx?: boolean;
  prescriptionStatus?: string | null;
  prescriptionNotes?: string | null;
  returnRequested?: boolean;
  items: Array<{ id: string; productName: string; quantity: number }>;
};

type RxQueueOrder = {
  id: string;
  status: string;
  totalMinor: number;
  createdAt: string;
  prescriptionKey: string | null;
  prescriptionId?: string | null;
  prescription?: {
    id: string;
    diagnosis: string | null;
    createdAt: string;
    doctorProfile: { user: { name: string | null } };
  } | null;
  shippingName: string;
  shippingPhone: string;
  shippingAddress: string;
  items: Array<{ id: string; productName: string; quantity: number }>;
  user: { id: string; name: string | null; phone: string };
};

const PRESCRIPTION_PILL: Record<string, { label: string; className: 'rxPillPending' | 'rxPillApproved' | 'rxPillRejected' }> = {
  PENDING: { label: 'Prescription under review', className: 'rxPillPending' },
  APPROVED: { label: 'Prescription approved', className: 'rxPillApproved' },
  REJECTED: { label: 'Prescription rejected', className: 'rxPillRejected' },
};

type PrescriptionProduct = {
  id: string;
  nameEn: string;
  priceMinor: number;
  imageUrl: string | null;
  unit: string;
  requiresRx: boolean;
  inStock: boolean;
  packSize: string | null;
};

type PrescriptionItemView = {
  id: string;
  productId: string | null;
  name: string;
  dosage: string | null;
  frequency: string | null;
  durationDays: number | null;
  qty: number;
  notes: string | null;
  product: PrescriptionProduct | null;
};

type PrescriptionView = {
  id: string;
  appointmentId: string;
  diagnosis: string | null;
  notes: string | null;
  createdAt: string;
  items: PrescriptionItemView[];
  doctorProfile: { speciality: string; user: { name: string | null } };
  appointment: { startsAt: string };
  patient?: { name: string | null };
};

type RefillItem = {
  prescriptionId: string;
  doctorName: string | null;
  product: { id: string; nameEn: string; priceMinor: number; imageUrl: string | null; unit: string; requiresRx: boolean; inStock: boolean };
  prescribedQty: number;
  dosage: string | null;
  frequency: string | null;
  status: 'DUE' | 'DUE_SOON' | 'ON_TRACK' | 'NOT_ORDERED';
  daysLeft: number | null;
  runOutDate: string | null;
  lastOrderedAt: string | null;
};

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
  const [doctorSlots, setDoctorSlots] = useState<Array<{ id: string; doctorProfileId: string; weekday: number; startTime: string; endTime: string; isActive: boolean }>>([]);
  const [doctorReviews, setDoctorReviews] = useState<{ avgRating: number; reviewCount: number; items: Array<{ id: string; rating: number; comment?: string | null; createdAt: string; user?: { name: string | null } | null }> } | null>(null);
  const reviewsForRef = useRef<string | null>(null);
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
  const [adminOverview, setAdminOverview] = useState<AdminOverview | null>(null);
  const [rejectNotes, setRejectNotes] = useState<Record<string, string>>({});
  const [myOrders, setMyOrders] = useState<MyOrder[]>([]);
  const [rxQueue, setRxQueue] = useState<RxQueueOrder[]>([]);
  const [rxNotes, setRxNotes] = useState<Record<string, string>>({});
  const [myPrescriptions, setMyPrescriptions] = useState<PrescriptionView[]>([]);
  const [myRefills, setMyRefills] = useState<RefillItem[]>([]);
  const [issuedPrescriptions, setIssuedPrescriptions] = useState<PrescriptionView[]>([]);
  const [composingFor, setComposingFor] = useState<string | null>(null);
  const router = useRouter();

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

  const loadDoctorReviews = async (profileId: string) => {
    if (reviewsForRef.current === profileId) return;
    reviewsForRef.current = profileId;
    const accessToken = readAccessToken();
    if (!accessToken) return;
    try {
      const [doctor, reviews] = await Promise.all([
        apiFetch<{ avgRating: number; reviewCount: number }>(`/doctors/${profileId}`, {}, accessToken),
        apiFetch<{ items: Array<{ id: string; rating: number; comment?: string | null; createdAt: string; user?: { name: string | null } | null }> }>(`/doctors/${profileId}/reviews?page=1&pageSize=3`, {}, accessToken),
      ]);
      setDoctorReviews({ avgRating: doctor.avgRating ?? 0, reviewCount: doctor.reviewCount ?? 0, items: reviews.items ?? [] });
    } catch { /* reviews stay hidden if unavailable */ }
  };

  useEffect(() => { setIntent(readLoginIntent()); void loadUser(); }, [loadUser]);

  useEffect(() => {
    if (!user) return;
    const accessToken = readAccessToken();
    if (!accessToken) return;

    if (hasRole(user, 'DOCTOR')) {
      void apiFetch<Appointment[]>('/appointments/doctor/mine', {}, accessToken).then(setDoctorAppointments).catch(() => setDoctorAppointments([]));
      void apiFetch<Array<{ id: string; doctorProfileId: string; weekday: number; startTime: string; endTime: string; isActive: boolean }>>('/availability/my', {}, accessToken)
        .then((slots) => { setDoctorSlots(slots); if (slots[0]?.doctorProfileId) void loadDoctorReviews(slots[0].doctorProfileId); })
        .catch(() => setDoctorSlots([]));
      void apiFetch<PrescriptionView[]>('/prescriptions/doctor/mine', { method: 'GET' }, accessToken).then(setIssuedPrescriptions).catch(() => setIssuedPrescriptions([]));
    }
    void apiFetch<PrescriptionView[]>('/prescriptions/mine', { method: 'GET' }, accessToken).then(setMyPrescriptions).catch(() => setMyPrescriptions([]));
    void apiFetch<{ items: RefillItem[] }>('/prescriptions/refills/mine', { method: 'GET' }, accessToken).then((r) => setMyRefills(r.items)).catch(() => setMyRefills([]));
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
      void apiFetch<AdminOverview>('/admin/overview', { method: 'GET' }, accessToken).then(setAdminOverview).catch(() => setAdminOverview(null));
    }
    void apiFetch<MyOrder[]>('/orders/mine', { method: 'GET' }, accessToken).then(setMyOrders).catch(() => setMyOrders([]));
    if (hasRole(user, 'PHARMACY', 'ADMIN')) {
      void apiFetch<RxQueueOrder[]>('/orders/rx-queue', { method: 'GET' }, accessToken)
        .then(setRxQueue)
        .catch((e) => setError(e instanceof Error ? e.message : 'Unable to load prescription queue.'));
    }
  }, [user]);

  useEffect(() => {
    const profileId = doctorAppointments[0]?.doctorProfile?.id;
    if (profileId) void loadDoctorReviews(profileId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doctorAppointments]);

  const refreshIssuedPrescriptions = async () => {
    const accessToken = readAccessToken();
    if (!accessToken) return;
    void apiFetch<PrescriptionView[]>('/prescriptions/doctor/mine', { method: 'GET' }, accessToken).then(setIssuedPrescriptions).catch(() => {});
  };

  const refreshDoctorAppointments = async () => {
    const accessToken = readAccessToken();
    if (!accessToken) return;
    void apiFetch<Appointment[]>('/appointments/doctor/mine', {}, accessToken).then(setDoctorAppointments).catch(() => {});
  };

  const updateDoctorAppointmentStatus = async (appt: Appointment, status: 'CONFIRMED' | 'COMPLETED' | 'CANCELLED') => {
    const accessToken = readAccessToken();
    if (!accessToken) return;
    setBusy(true);
    try {
      await apiFetch(`/appointments/${appt.id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }, accessToken);
      setStatus(`Appointment with ${appt.patientName} is now ${status.toLowerCase()}.`);
      await refreshDoctorAppointments();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to update that appointment.');
    } finally { setBusy(false); }
  };

  const orderAllPrescription = (prescription: PrescriptionView) => {
    const orderable = prescription.items.filter((item) => item.product && item.product.inStock);
    const skipped = prescription.items.length - orderable.length;
    if (!orderable.length) {
      setError('None of the medicines on this prescription are currently orderable from our pharmacy.');
      return;
    }
    type CartLine = { id: string; nameEn: string; priceMinor: number; quantity: number; unit?: string; imageUrl?: string; category?: string; requiresRx?: boolean };
    let cart: CartLine[] = [];
    try { cart = JSON.parse(window.localStorage.getItem('onestop-cart') ?? '[]') as CartLine[]; } catch { cart = []; }
    for (const item of orderable) {
      const product = item.product!;
      const existing = cart.find((line) => line.id === product.id);
      if (existing) existing.quantity += item.qty;
      else cart.push({ id: product.id, nameEn: product.nameEn, priceMinor: product.priceMinor, quantity: item.qty, unit: product.unit, imageUrl: product.imageUrl ?? undefined, requiresRx: product.requiresRx });
    }
    window.localStorage.setItem('onestop-cart', JSON.stringify(cart));
    if (orderable.some((item) => item.product?.requiresRx)) {
      // The digital prescription covers these Rx medicines at checkout — no upload needed.
      window.localStorage.setItem('onestop-rx-prescription', prescription.id);
    }
    setStatus(skipped > 0
      ? `${orderable.length} medicine${orderable.length === 1 ? '' : 's'} added to your cart. ${skipped} item${skipped === 1 ? '' : 's'} on the prescription ${skipped === 1 ? 'is' : 'are'} not available for one-tap ordering.`
      : 'All prescription medicines were added to your cart.');
    router.push('/cart');
  };

  const reorderRefill = (refill: RefillItem) => {
    const product = refill.product;
    if (!product.inStock) {
      setError(`${product.nameEn} is out of stock right now — the pharmacy can suggest an alternative.`);
      return;
    }
    type CartLine = { id: string; nameEn: string; priceMinor: number; quantity: number; unit?: string; imageUrl?: string; category?: string; requiresRx?: boolean };
    let cart: CartLine[] = [];
    try { cart = JSON.parse(window.localStorage.getItem('onestop-cart') ?? '[]') as CartLine[]; } catch { cart = []; }
    const existing = cart.find((line) => line.id === product.id);
    if (existing) existing.quantity += refill.prescribedQty;
    else cart.push({ id: product.id, nameEn: product.nameEn, priceMinor: product.priceMinor, quantity: refill.prescribedQty, unit: product.unit, imageUrl: product.imageUrl ?? undefined, requiresRx: product.requiresRx });
    window.localStorage.setItem('onestop-cart', JSON.stringify(cart));
    if (product.requiresRx) {
      // The issuing prescription covers this refill at checkout — no upload needed.
      window.localStorage.setItem('onestop-rx-prescription', refill.prescriptionId);
    }
    setStatus(`${product.nameEn} added to your cart for a refill.`);
    router.push('/cart');
  };

  const reviewPrescription = async (order: RxQueueOrder, decision: 'APPROVED' | 'REJECTED') => {
    const accessToken = readAccessToken();
    if (!accessToken) return;
    setBusy(true); setError(''); setStatus('');
    try {
      await apiFetch(`/orders/${order.id}/prescription`, {
        method: 'PATCH',
        body: JSON.stringify({ decision, notes: rxNotes[order.id]?.trim() || undefined }),
      }, accessToken);
      setRxQueue((current) => current.filter((item) => item.id !== order.id));
      setStatus(decision === 'APPROVED' ? 'Prescription approved — order cleared for dispatch.' : 'Prescription rejected — order cancelled and patient notified in their orders.');
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to review prescription.'); }
    finally { setBusy(false); }
  };

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

  const requestReturn = async (orderId: string, reason: string) => {
    const token = readAccessToken();
    if (!token) throw new Error('Sign in to request a return.');
    await apiFetch(`/orders/${orderId}/return`, { method: 'POST', body: JSON.stringify({ reason }) }, token);
    const fresh = readAccessToken();
    if (fresh) void apiFetch<MyOrder[]>('/orders/mine', { method: 'GET' }, fresh).then(setMyOrders).catch(() => {});
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
  const accessToken = readAccessToken();
  const issuedByAppointment = new Map(issuedPrescriptions.map((prescription) => [prescription.appointmentId, prescription]));

  const patientSection = showPatient ? (
          <section className={styles.card} aria-labelledby="patient-heading">
            <PanelTitle id="patient-heading" icon="heart" title="Patient & customer" sub="Your everyday care shortcuts." />
            <div className={styles.linkGrid}>
              <Link className={styles.linkCard} href="/appointments"><strong>My Appointments</strong><span>See, manage or cancel doctor visits.</span></Link>
              <Link className={styles.linkCard} href="/cart"><strong>My cart &amp; orders</strong><span>Review your cart and check out with COD.</span></Link>
              <Link className={styles.linkCard} href="/doctors"><strong>Book a doctor</strong><span>Verified doctors with upfront fees.</span></Link>
              <Link className={styles.linkCard} href="/labs"><strong>Lab tests at home</strong><span>Book home sample collection and track reports.</span></Link>
              <Link className={styles.linkCard} href="/blood"><strong>Blood banks &amp; requests</strong><span>Find a blood bank or post a donor request.</span></Link>
              <Link className={styles.linkCard} href="/products"><strong>Shop essentials</strong><span>Medicines, wellness, baby &amp; pet care.</span></Link>
              <Link className={styles.linkCard} href="/pharmacy"><strong>Pharmacy</strong><span>200+ genuine medicines by condition, delivered to your door.</span></Link>
            </div>
            <div className={styles.listBlock}>
              <h3>My orders</h3>
              {myOrders.length ? myOrders.slice(0, 6).map((order) => {
                const pill = order.requiresRx && order.prescriptionStatus ? PRESCRIPTION_PILL[order.prescriptionStatus] : null;
                return (
                  <div className={styles.listItem} key={order.id}>
                    <strong>Order {order.id.slice(0, 8)}</strong>
                    <span>{order.items.map((item) => `${item.productName} ×${item.quantity}`).join(', ')} · {money(order.totalMinor)} · {order.status.replaceAll('_', ' ')}</span>
                    {pill ? <span className={styles[pill.className]}>{pill.label}</span> : <span>{new Date(order.createdAt).toLocaleDateString('en-PK')}</span>}
                    {order.requiresRx && order.prescriptionStatus === 'REJECTED' && order.prescriptionNotes ? <span>Pharmacist note: {order.prescriptionNotes}</span> : null}
                    {order.returnRequested ? <span>Return requested</span> : null}
                    <OrderTracking orderId={order.id} status={order.status} requiresRx={order.requiresRx} prescriptionStatus={order.prescriptionStatus} onReturn={requestReturn} />
                  </div>
                );
              }) : <p className={styles.emptyStateInline}>No orders yet. Your shop and pharmacy orders will appear here.</p>}
            </div>
            {(() => {
              const actionable = myRefills.filter((r) => r.status !== 'ON_TRACK');
              const onTrack = myRefills.filter((r) => r.status === 'ON_TRACK');
              if (!myRefills.length) return null;
              const refillText = (r: RefillItem): string => {
                if (r.status === 'NOT_ORDERED') return 'Prescribed for you — not ordered yet';
                if (r.status === 'DUE') return r.daysLeft === 0 ? 'Supply finished today' : `Supply finished ${Math.abs(r.daysLeft ?? 0)} day${Math.abs(r.daysLeft ?? 0) === 1 ? '' : 's'} ago`;
                if (r.status === 'DUE_SOON') return `About ${r.daysLeft} day${r.daysLeft === 1 ? '' : 's'} of supply left`;
                return `${r.daysLeft} days of supply left`;
              };
              return (
                <div className={styles.listBlock}>
                  <h3>Medicine refills</h3>
                  {actionable.length ? actionable.slice(0, 5).map((refill) => (
                    <div className={styles.listItem} key={`${refill.prescriptionId}-${refill.product.id}`}>
                      <strong>{refill.product.nameEn}</strong>
                      <span>{[refill.dosage, refill.frequency, refill.doctorName ? `Dr. ${refill.doctorName}` : null].filter(Boolean).join(' · ')}</span>
                      <span className={refill.status === 'DUE' ? styles.rxPillRejected : styles.rxPillPending}>{refillText(refill)}</span>
                      <button type="button" className={styles.primaryButton} onClick={() => reorderRefill(refill)} disabled={!refill.product.inStock}>
                        {refill.product.inStock ? `${refill.status === 'NOT_ORDERED' ? 'Order' : 'Reorder'} ×${refill.prescribedQty}` : 'Out of stock'}
                      </button>
                    </div>
                  )) : (
                    <p className={styles.emptyStateInline}>
                      All medicines on track{onTrack.length ? ` — next refill: ${onTrack[0].product.nameEn}, ${refillText(onTrack[0]).toLowerCase()}.` : '.'}
                    </p>
                  )}
                </div>
              );
            })()}
            <div className={styles.listBlock}>
              <h3>My prescriptions</h3>
              {myPrescriptions.length ? myPrescriptions.slice(0, 4).map((prescription) => {
                const orderableCount = prescription.items.filter((item) => item.product && item.product.inStock).length;
                return (
                  <div className={styles.listItem} key={prescription.id}>
                    <strong>Dr. {prescription.doctorProfile.user.name ?? 'Your doctor'} · {prescription.doctorProfile.speciality}</strong>
                    <span>Visit: {new Date(prescription.appointment.startsAt).toLocaleDateString('en-PK', { dateStyle: 'medium' })} · Issued {new Date(prescription.createdAt).toLocaleDateString('en-PK', { dateStyle: 'medium' })}</span>
                    {prescription.diagnosis ? <span>Diagnosis: {prescription.diagnosis}</span> : null}
                    <span>{prescription.items.map((item) => `${item.name}${item.dosage ? ` ${item.dosage}` : ''}${item.frequency ? ` — ${item.frequency}` : ''}${item.durationDays ? ` for ${item.durationDays} days` : ''} ×${item.qty}`).join(' · ')}</span>
                    {prescription.notes ? <span>Doctor's note: {prescription.notes}</span> : null}
                    {orderableCount > 0 ? (
                      <button type="button" className={styles.primaryButton} onClick={() => orderAllPrescription(prescription)}>Order all medicines ({orderableCount})</button>
                    ) : (
                      <span>Ask the pharmacy about availability for these medicines.</span>
                    )}
                  </div>
                );
              }) : <p className={styles.emptyStateInline}>No prescriptions yet. After a completed visit, your doctor can issue a digital prescription here.</p>}
            </div>
            <WalletPanel token={readAccessToken()} />
          </section>
  ) : null;

  // Doctor workspace detail: profile strip, stats and grouped appointments.
  const myDoctorProfile = doctorAppointments[0]?.doctorProfile ?? null;
  const dayKeyPK = (d: Date) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Karachi', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
  const todayKeyPK = dayKeyPK(new Date());
  const apptStart = (a: Appointment) => new Date(a.startsAt).getTime();
  const sortedDoctorAppts = [...doctorAppointments].sort((a, b) => apptStart(a) - apptStart(b));
  const docToday = sortedDoctorAppts.filter((a) => dayKeyPK(new Date(a.startsAt)) === todayKeyPK && a.status !== 'CANCELLED' && a.status !== 'NO_SHOW');
  const docUpcoming = sortedDoctorAppts.filter((a) => apptStart(a) > Date.now() && dayKeyPK(new Date(a.startsAt)) !== todayKeyPK && (a.status === 'PENDING' || a.status === 'CONFIRMED'));
  const docTodayIds = new Set(docToday.map((a) => a.id));
  const docUpcomingIds = new Set(docUpcoming.map((a) => a.id));
  const docPast = sortedDoctorAppts.filter((a) => !docTodayIds.has(a.id) && !docUpcomingIds.has(a.id)).reverse().slice(0, 6);
  const nextApptId = docToday.find((a) => (a.status === 'PENDING' || a.status === 'CONFIRMED') && new Date(a.endsAt).getTime() > Date.now())?.id;
  const docUniquePatients = new Set(doctorAppointments.map((a) => a.patientPhone)).size;
  const weekAhead = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(Date.now() + i * 86400000);
    const key = dayKeyPK(d);
    const jsDay = new Date(d.toLocaleString('en-US', { timeZone: 'Asia/Karachi' })).getDay();
    const daySlots = doctorSlots.filter((s) => s.weekday === jsDay && s.isActive);
    const hours = daySlots.length ? daySlots.map((s) => `${s.startTime}–${s.endTime}`).join(', ') : 'Off';
    const count = doctorAppointments.filter((a) => dayKeyPK(new Date(a.startsAt)) === key && a.status !== 'CANCELLED' && a.status !== 'NO_SHOW').length;
    return { key, isToday: i === 0, label: new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Karachi', weekday: 'short' }).format(d), dateNum: new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Karachi', day: 'numeric' }).format(d), hours, count };
  });
  const docCompletedCount = doctorAppointments.filter((a) => a.status === 'COMPLETED').length;
  const docEarningsMinor = doctorAppointments.filter((a) => a.status === 'COMPLETED').reduce((t, a) => t + a.feeMinor, 0);
  const STATUS_PILL: Record<string, string> = { PENDING: styles.pillPending, CONFIRMED: styles.pillConfirmed, COMPLETED: styles.pillCompleted, CANCELLED: styles.pillCancelled, NO_SHOW: styles.pillCancelled };

  const renderDoctorAppt = (appt: Appointment, index: number) => {
    const issued = issuedByAppointment.get(appt.id);
    const facilityName = appt.facility?.name ?? appt.doctorProfile?.facilities?.[0]?.facility?.name;
    const start = new Date(appt.startsAt);
    const end = new Date(appt.endsAt);
    return (
      <div className={styles.apptItem} key={appt.id}>
        <div className={styles.apptIndex} aria-label={`Appointment ${index + 1}`}>{index + 1}</div>
        <div className={styles.apptBody}>
        <div className={styles.apptHead}>
          <span className={styles.apptName}><strong>{appt.patientName}</strong>{appt.id === nextApptId ? <span className={styles.upNext}><i />Up next</span> : null}</span>
          <span className={styles.apptRail}><b>{money(appt.feeMinor)}</b><span className={`${styles.pill} ${STATUS_PILL[appt.status] ?? ''}`}>{appt.status.replace('_', ' ')}</span></span>
        </div>
        <span className={styles.metaLine}><span className={styles.metaSeg}><SectionIcon name="clock" size={14} />{start.toLocaleDateString('en-PK', { weekday: 'short', day: 'numeric', month: 'short' })} · {start.toLocaleTimeString('en-PK', { hour: 'numeric', minute: '2-digit' })} – {end.toLocaleTimeString('en-PK', { hour: 'numeric', minute: '2-digit' })}</span><span className={styles.metaSeg}><SectionIcon name={appt.type === 'VIDEO' ? 'video' : 'clinic'} size={14} />{appt.type === 'VIDEO' ? 'Video' : 'In-person'}</span>{facilityName ? <span className={styles.metaSeg}><SectionIcon name="pin" size={14} />{facilityName}</span> : null}</span>
        {appt.reason ? <span><b>Reason:</b> {appt.reason}</span> : null}
        <span className={styles.metaSeg}><SectionIcon name="phone" size={14} />{appt.patientPhone}</span>
        {appt.status === 'PENDING' ? (
          <div className={styles.apptActions}>
            <button type="button" className={styles.primaryButton} onClick={() => void updateDoctorAppointmentStatus(appt, 'CONFIRMED')} disabled={busy}><SectionIcon name="check" size={15} /> Confirm appointment</button>
            <button type="button" className={styles.dangerButton} onClick={() => void updateDoctorAppointmentStatus(appt, 'CANCELLED')} disabled={busy}><SectionIcon name="x" size={15} /> Decline</button>
          </div>
        ) : null}
        {appt.status === 'CONFIRMED' ? (
          <div className={styles.apptActions}>
            {apptStart(appt) <= Date.now() ? <button type="button" className={styles.primaryButton} onClick={() => void updateDoctorAppointmentStatus(appt, 'COMPLETED')} disabled={busy}><SectionIcon name="check" size={15} /> Mark complete</button> : null}
            <button type="button" className={styles.dangerButton} onClick={() => void updateDoctorAppointmentStatus(appt, 'CANCELLED')} disabled={busy}><SectionIcon name="x" size={15} /> Cancel</button>
          </div>
        ) : null}
        {appt.status === 'COMPLETED' ? (
          issued ? (
            <>
              <span className={styles.issuedTag}>Prescription issued</span>
              <span>{issued.items.map((item) => `${item.name}${item.dosage ? ` ${item.dosage}` : ''} ×${item.qty}`).join(' · ')}</span>
            </>
          ) : composingFor === appt.id ? (
            <PrescriptionComposer
              appointmentId={appt.id}
              token={accessToken ?? ''}
              onIssued={() => { setComposingFor(null); void refreshIssuedPrescriptions(); setStatus('Prescription issued — the patient can now see it and order the medicines in one tap.'); }}
              onCancel={() => setComposingFor(null)}
            />
          ) : (
            <div className={styles.apptActions}>
              <button type="button" className={styles.primaryButton} onClick={() => setComposingFor(appt.id)}><SectionIcon name="pen" size={15} /> Write prescription</button>
            </div>
          )
        ) : null}
        </div>
      </div>
    );
  };

  const doctorSection = showDoctor ? (
          <section className={styles.card} aria-labelledby="doctor-heading">
            <PanelTitle id="doctor-heading" icon="stethoscope" title="Doctor workspace" sub={isDoctor ? 'Your consultations and public profile.' : 'Doctor tools unlock after your DOCTOR verification is approved.'} />
            {isDoctor ? (
              <>
                {myDoctorProfile ? (
                  <div className={styles.docProfile}>
                    <div className={styles.docAvatar} aria-hidden="true">{doctorInitials(myDoctorProfile.user?.name)}</div>
                    <div className={styles.docProfileMeta}>
                      <span className={styles.docNameRow}><strong>Dr. {(myDoctorProfile.user?.name ?? 'Doctor').replace(/^Dr\.\s*/i, '')}</strong>{myDoctorProfile.pmdcNumber ? <span className={styles.verifiedTag}><SectionIcon name="shield" size={13} /> PMDC verified</span> : null}</span>
                      <span>{myDoctorProfile.speciality}{myDoctorProfile.qualifications ? ` · ${myDoctorProfile.qualifications}` : ''}</span>
                      <span>{myDoctorProfile.pmdcNumber ? `PMDC ${myDoctorProfile.pmdcNumber} · ` : ''}{myDoctorProfile.experienceYears} yrs experience · {money(myDoctorProfile.feeMinor)} per visit</span>
                      {myDoctorProfile.facilities?.length ? <span className={styles.metaSeg}><SectionIcon name="clinic" size={14} /> {myDoctorProfile.facilities.map((f) => f.facility.name).join(' · ')}</span> : null}
                    </div>
                  </div>
                ) : null}
                <div className={styles.adminStats}>
                  <div><span className={styles.statIco}><SectionIcon name="calendar" size={16} /></span><strong>{docToday.length}</strong><span>Appointments today</span></div>
                  <div><span className={`${styles.statIco} ${styles.statIcoAmber}`}><SectionIcon name="clock" size={16} /></span><strong>{docUpcoming.length}</strong><span>Upcoming</span></div>
                  <div><span className={styles.statIco}><SectionIcon name="users" size={16} /></span><strong>{docUniquePatients}</strong><span>Patients seen</span></div>
                  <div><span className={`${styles.statIco} ${styles.statIcoGreen}`}><SectionIcon name="check" size={16} /></span><strong>{docCompletedCount}</strong><span>Consultations completed</span></div>
                  <div><span className={`${styles.statIco} ${styles.statIcoGold}`}><SectionIcon name="wallet" size={16} /></span><strong>{money(docEarningsMinor)}</strong><span>Earned from consultations</span></div>
                </div>
                <div className={styles.linkGrid}>
                  <Link className={styles.linkCard} href="/doctors"><strong>View public doctors page</strong><span>See how patients find and book you.</span></Link>
                  <a className={styles.linkCard} href="#doctor-appointments"><strong>My doctor appointments</strong><span>{doctorAppointments.length} appointment{doctorAppointments.length === 1 ? '' : 's'} on your schedule.</span></a>
                </div>
                <div id="doctor-appointments">
                  <div className={styles.listBlock}>
                    <h3 className={styles.groupHead}><span className={styles.groupIco}><SectionIcon name="calendar" size={15} /></span>Today <span className={styles.groupCount}>{docToday.length}</span></h3>
                    {docToday.length ? docToday.map((a, i) => renderDoctorAppt(a, i)) : <p className={styles.emptyStateInline}>No appointments today.</p>}
                  </div>
                  <div className={styles.listBlock}>
                    <h3 className={styles.groupHead}><span className={styles.groupIco}><SectionIcon name="clock" size={15} /></span>Upcoming <span className={styles.groupCount}>{docUpcoming.length}</span></h3>
                    {docUpcoming.length ? docUpcoming.map((a, i) => renderDoctorAppt(a, i)) : <p className={styles.emptyStateInline}>No upcoming appointments. New patient bookings will appear here.</p>}
                  </div>
                  {docPast.length ? (
                    <div className={styles.listBlock}>
                      <h3 className={styles.groupHead}><span className={styles.groupIco}><SectionIcon name="history" size={15} /></span>Past appointments <span className={styles.groupCount}>{docPast.length}</span></h3>
                      {docPast.map((a, i) => renderDoctorAppt(a, i))}
                    </div>
                  ) : null}
                </div>
                {doctorSlots.length ? (
                  <div className={styles.listBlock}>
                    <h3 className={styles.groupHead}><span className={styles.groupIco}><SectionIcon name="calendar" size={15} /></span>My week ahead</h3>
                    <div className={styles.weekStrip}>
                      {weekAhead.map((d) => (
                        <div key={d.key} className={d.isToday ? styles.weekDayToday : styles.weekDay}>
                          <span>{d.label}</span><b>{d.dateNum}</b><small>{d.hours}</small><em>{d.count ? `${d.count} appt${d.count === 1 ? '' : 's'}` : 'No appts'}</em>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
                {doctorReviews && doctorReviews.reviewCount > 0 ? (
                  <div className={styles.listBlock}>
                    <h3 className={styles.groupHead}><span className={styles.groupIco}><SectionIcon name="star" size={15} /></span>Patient reviews <span className={styles.groupCount}>{doctorReviews.reviewCount}</span></h3>
                    <p className={styles.ratingLine}><span className={styles.stars}>{'★'.repeat(Math.round(doctorReviews.avgRating))}{'☆'.repeat(5 - Math.round(doctorReviews.avgRating))}</span>{doctorReviews.avgRating.toFixed(1)} average from {doctorReviews.reviewCount} review{doctorReviews.reviewCount === 1 ? '' : 's'}</p>
                    {doctorReviews.items.map((r) => (
                      <div className={styles.reviewItem} key={r.id}>
                        <div className={styles.apptHead}><strong>{r.user?.name ?? 'Patient'}</strong><span className={styles.stars}>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span></div>
                        {r.comment ? <p>{r.comment}</p> : null}
                        <small>{new Date(r.createdAt).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}</small>
                      </div>
                    ))}
                  </div>
                ) : null}
                <p className={styles.note}>Profile editing is available through your verified doctor profile (speciality, fee, timings and facilities are managed via <code>POST/PATCH /doctors/me/profile</code>). If you need a field changed before the full editor ships, contact support and we will update it with you.</p>
              </>
            ) : (
              <p className={styles.note}>You chose Doctor at sign-in, but your account does not have the DOCTOR role yet. Submit a Doctor verification request in the Business &amp; verification section below — once approved, this workspace unlocks automatically.</p>
            )}
          </section>
  ) : null;

  const businessSection = showBusiness ? (
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
  ) : null;

  const adminSection = showAdmin ? (
          <section className={styles.card} aria-labelledby="admin-heading">
            <PanelTitle id="admin-heading" icon="shield" title="Admin control centre" sub="Review trust applications and keep the marketplace safe." />
            {isAdmin ? (
              <>
                {adminOverview ? (
                  <>
                    <div className={styles.adminTiles}>
                      <div className={styles.adminTile}><strong>{adminOverview.users.total}</strong><span>Registered accounts</span><small>+{adminOverview.users.newToday} today · +{adminOverview.users.newThisWeek} this week</small></div>
                      <div className={styles.adminTile}><strong>{queue.length + adminOverview.orders.rxPending}</strong><span>Approvals waiting</span><small>{queue.length} professional · {adminOverview.orders.rxPending} prescription</small></div>
                      <div className={styles.adminTile}><strong>{adminOverview.orders.total}</strong><span>Orders placed</span><small>{money(adminOverview.orders.revenueMinor)} revenue · {adminOverview.orders.today} today</small></div>
                      <div className={styles.adminTile}><strong>{adminOverview.catalogue.inStock}/{adminOverview.catalogue.total}</strong><span>Products in stock</span><small>{adminOverview.catalogue.medicines} medicines · {adminOverview.catalogue.rxMedicines} need a prescription</small></div>
                      <div className={styles.adminTile}><strong>{adminOverview.platform.doctors}</strong><span>Verified doctors</span><small>{adminOverview.platform.facilities} facilities listed</small></div>
                      <div className={styles.adminTile}><strong>{adminOverview.platform.appointmentsToday}</strong><span>Appointments today</span><small>Across all clinics</small></div>
                    </div>

                    <div className={styles.adminBlock}>
                      <h3 className={styles.adminBlockTitle}>Monthly progress</h3>
                      {(() => {
                        const points = adminOverview.monthly;
                        const maxValue = Math.max(1, ...points.flatMap((p) => [p.registrations, p.orders]));
                        const monthName = (key: string) => new Date(`${key}-02T00:00:00`).toLocaleDateString('en-PK', { month: 'short' });
                        const compactRs = (minor: number) => { const rs = minor / 100; return rs >= 1000 ? `Rs. ${(rs / 1000).toFixed(1)}k` : `Rs. ${Math.round(rs)}`; };
                        return (
                          <>
                            <svg className={styles.adminChart} viewBox="0 0 560 158" role="img" aria-label="Registrations and orders per month for the last six months">
                              {[21, 42, 63, 84].map((h) => (
                                <line key={h} x1={4} x2={556} y1={108 - h} y2={108 - h} stroke="#edf1f6" strokeWidth={1} />
                              ))}
                              {points.map((p, i) => {
                                const gx = i * 93 + 8;
                                const regH = Math.round((p.registrations / maxValue) * 84);
                                const ordH = Math.round((p.orders / maxValue) * 84);
                                return (
                                  <g key={p.month}>
                                    <rect x={gx + 12} y={108 - Math.max(regH, 3)} width={26} height={Math.max(regH, 3)} rx={3} fill={p.registrations ? '#166a91' : '#d7e0e8'} />
                                    <rect x={gx + 44} y={108 - Math.max(ordH, 3)} width={26} height={Math.max(ordH, 3)} rx={3} fill={p.orders ? '#f7b928' : '#e8e2d2'} />
                                    <text x={gx + 25} y={100 - regH} textAnchor="middle" fontSize={10.5} fontWeight={700} fill="#166a91">{p.registrations}</text>
                                    <text x={gx + 57} y={100 - ordH} textAnchor="middle" fontSize={10.5} fontWeight={700} fill="#a8740a">{p.orders}</text>
                                    <text x={gx + 41} y={126} textAnchor="middle" fontSize={11} fill="#5b6b7f">{monthName(p.month)}</text>
                                    <text x={gx + 41} y={144} textAnchor="middle" fontSize={10.5} fill="#166a91" fontWeight={700}>{p.revenueMinor > 0 ? compactRs(p.revenueMinor) : '—'}</text>
                                  </g>
                                );
                              })}
                              <line x1={4} x2={556} y1={108} y2={108} stroke="#dfe6ee" strokeWidth={1.5} />
                            </svg>
                            <p className={styles.adminLegend}><span><i style={{ background: '#166a91' }} /> New accounts</span><span><i style={{ background: '#f7b928' }} /> Orders</span><span>Label under each month: revenue</span></p>
                          </>
                        );
                      })()}
                    </div>

                    <div className={styles.adminColumns}>
                      <div className={`${styles.adminBlock} ${styles.adminPanel}`}>
                        <h3 className={styles.adminBlockTitle}>Newest registrations</h3>
                        <div className={styles.adminRegList}>
                        {adminOverview.users.recent.length ? adminOverview.users.recent.map((person) => (
                          <div className={styles.adminRow} key={person.id}>
                            <strong>{person.name || 'Unnamed'}</strong>
                            <span>{person.phone || person.email || ''}</span>
                            <span className={styles.adminRoleChips}>{person.roles.map((role) => <em key={role}>{role.replaceAll('_', ' ')}</em>)}</span>
                            <time>{new Date(person.createdAt).toLocaleDateString('en-PK', { day: 'numeric', month: 'short' })}</time>
                          </div>
                        )) : <p className={styles.emptyStateInline}>No accounts yet.</p>}
                        </div>
                        {Object.keys(adminOverview.users.byRole).length ? (
                          <p className={styles.roleMix}>
                            {Object.entries(adminOverview.users.byRole).sort((a, b) => b[1] - a[1]).map(([role, count]) => (
                              <span key={role}><em>{role.replaceAll('_', ' ')}</em> {count}</span>
                            ))}
                          </p>
                        ) : null}
                      </div>
                      <div className={`${styles.adminBlock} ${styles.adminPanel}`}>
                        <h3 className={styles.adminBlockTitle}>Inventory snapshot</h3>
                        <div className={styles.stockBar} role="img" aria-label={`${adminOverview.catalogue.inStock} of ${adminOverview.catalogue.total} products in stock`}>
                          <i style={{ width: `${adminOverview.catalogue.total ? Math.round((adminOverview.catalogue.inStock / adminOverview.catalogue.total) * 100) : 0}%` }} />
                        </div>
                        <p className={styles.adminStockLine}><strong>{adminOverview.catalogue.inStock}</strong> in stock · <strong>{adminOverview.catalogue.outOfStock}</strong> out of stock</p>
                        {adminOverview.catalogue.byCategory.map((cat) => (
                          <div className={styles.catRow} key={cat.category}>
                            <span className={styles.catName}>{cat.category}</span>
                            <span className={styles.catBar}><i style={{ width: `${cat.total ? Math.round((cat.inStock / cat.total) * 100) : 0}%` }} /></span>
                            <span className={styles.catCount}>{cat.inStock}/{cat.total}</span>
                          </div>
                        ))}
                        {adminOverview.catalogue.outOfStockItems.length ? (
                          <>
                            <p className={styles.adminStockLabel}>Out of stock right now:</p>
                            {adminOverview.catalogue.outOfStockItems.map((item) => (
                              <div className={styles.adminRow} key={item.id}><strong>{item.nameEn}</strong><span>{item.category ?? ''}</span></div>
                            ))}
                          </>
                        ) : <p className={styles.emptyStateInline}>Everything in the catalogue is in stock.</p>}
                      </div>
                    </div>
                    <h3 className={styles.adminBlockTitle}>Professional approvals — who is asking</h3>
                  </>
                ) : (
                  <div className={styles.adminStats}><div><strong>{queue.length}</strong><span>pending reviews</span></div><Link href="/products">Open catalogue →</Link></div>
                )}
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
  ) : null;

  // The workspace matching how the user continued (or their strongest role)
  // comes first — a doctor who signs in as a doctor lands on their
  // appointments, not on the customer dashboard.
  const primarySection = intent ?? (isDoctor ? 'doctor' : isAdmin ? 'admin' : isBusinessUser(user) ? 'business' : 'patient');
  const sectionOrder = [primarySection, 'patient', 'doctor', 'business', 'admin'].filter((v, i, a) => a.indexOf(v) === i);
  const sectionByKey = { patient: patientSection, doctor: doctorSection, business: businessSection, admin: adminSection };

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

        {sectionOrder.map((key) => (
          <Fragment key={key}>{sectionByKey[key as keyof typeof sectionByKey]}</Fragment>
        ))}

        {hasRole(user, 'PHARMACY', 'ADMIN') ? (
          <section className={styles.card} aria-labelledby="rx-queue-heading">
            <PanelTitle id="rx-queue-heading" icon="pharmacy" title="Prescription queue" sub="Verify prescriptions before dispatch — Rx medicines only leave the pharmacy after approval." />
            <div className={styles.adminStats}><div><strong>{rxQueue.length}</strong><span>awaiting review</span></div></div>
            {rxQueue.length ? (
              <div className={styles.queueList}>
                {rxQueue.map((order) => (
                  <article className={styles.queueItem} key={order.id}>
                    <div className={styles.queueHeader}>
                      <div><span className={styles.rxPillPending}>Prescription under review</span><h3>{order.user.name || order.shippingName || 'Patient'}</h3><p>{order.user.phone || order.shippingPhone}</p></div>
                      <span>{new Date(order.createdAt).toLocaleDateString('en-PK')}</span>
                    </div>
                    <p className={styles.queueMeta}>Medicines: <strong>{order.items.map((item) => `${item.productName} ×${item.quantity}`).join(', ')}</strong></p>
                    {order.prescription ? (
                      <p className={styles.queueMeta}>Prescription: <strong>Digital prescription from Dr. {order.prescription.doctorProfile.user.name ?? 'doctor'}</strong>{order.prescription.diagnosis ? <> · Diagnosis: {order.prescription.diagnosis}</> : null} · issued {new Date(order.prescription.createdAt).toLocaleDateString('en-PK')} · Total: <strong>{money(order.totalMinor)}</strong></p>
                    ) : (
                      <p className={styles.queueMeta}>Prescription: <strong>{order.prescriptionKey ?? 'Not provided'}</strong> · Total: <strong>{money(order.totalMinor)}</strong></p>
                    )}
                    <label className={styles.field}><span>Pharmacist note (optional, required to explain a rejection)</span><input value={rxNotes[order.id] ?? ''} onChange={(e) => setRxNotes((current) => ({ ...current, [order.id]: e.target.value }))} placeholder="e.g. Verified with Dr. Ahmed Khan" /></label>
                    <div className={styles.reviewActions}>
                      <button className={styles.primaryButton} onClick={() => reviewPrescription(order, 'APPROVED')} disabled={busy}>Approve &amp; dispatch</button>
                      <button className={styles.dangerButton} onClick={() => reviewPrescription(order, 'REJECTED')} disabled={busy}>Reject &amp; cancel order</button>
                    </div>
                  </article>
                ))}
              </div>
            ) : <p className={styles.emptyStateInline}>No prescriptions waiting. New Rx orders will appear here for verification.</p>}
          </section>
        ) : null}
      </div>
    </main>
  );
}
