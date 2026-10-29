'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import styles from './checkout-pages.module.css';
import StripePaymentPanel, { validateCardFields, validateWalletFields, PaymentMethodId } from './StripePaymentPanel';

/**
 * Page-based checkout: /checkout (details) → /checkout/payment → /checkout/done.
 * The cart lives in localStorage ('onestop-cart', shared with the store) and
 * the in-progress delivery/payment choices live in a sessionStorage draft,
 * so moving between the step pages never loses what the customer typed.
 */

type CartLine = {
  id: string;
  nameEn: string;
  priceMinor: number;
  unit?: string;
  category?: string;
  imageUrl?: string;
  requiresRx?: boolean;
  quantity: number;
};

type Draft = {
  name: string;
  phone: string;
  house: string;
  street: string;
  area: string;
  city: string;
  postal: string;
  label: string;
  notes: string;
  speed: 'STANDARD' | 'EXPRESS';
  slotDay: number;
  slotTime: number;
  paymentMethod: PaymentMethodId;
  emiPlan: string;
  giftWrap: boolean;
  giftMessage: string;
  discountCode: string;
  discountApplied: { code: string; amountMinor: number } | null;
  saveDetails: boolean;
  saveToAddressBook: boolean;
};

type SavedAddress = { id: string; label: string; name: string; phone: string; address: string; city: string; postalCode?: string | null };

type LastOrder = {
  id: string;
  totalMinor: number;
  paymentMethod: string;
  addressLine: string;
  city: string;
  label: string;
  slotText: string;
  speed: string;
  phone: string;
};

const DRAFT_KEY = 'onestop-checkout-draft';
const LAST_ORDER_KEY = 'onestop-last-order';
const CART_KEY = 'onestop-cart';

const defaultDraft: Draft = {
  name: '', phone: '', house: '', street: '', area: '', city: '', postal: '',
  label: 'Home', notes: '', speed: 'STANDARD', slotDay: 0, slotTime: 0,
  paymentMethod: 'COD', emiPlan: '', giftWrap: false, giftMessage: '',
  discountCode: '', discountApplied: null, saveDetails: false, saveToAddressBook: false,
};

function money(minor: number) {
  return `Rs. ${(minor / 100).toLocaleString('en-PK', { maximumFractionDigits: 2 })}`;
}

function formatPhone(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 4) return digits;
  return `${digits.slice(0, 4)} ${digits.slice(4)}`;
}

const PAKISTAN_CITIES = ['Karachi', 'Lahore', 'Islamabad', 'Rawalpindi', 'Faisalabad', 'Multan', 'Peshawar', 'Quetta', 'Hyderabad', 'Sialkot', 'Gujranwala', 'Bahawalpur', 'Sargodha', 'Abbottabad', 'Other'];

function deliveryWindow(speed: 'STANDARD' | 'EXPRESS') {
  const fmt = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Karachi', day: 'numeric', month: 'short' });
  const day = 86400000;
  const now = Date.now();
  if (speed === 'EXPRESS') return `Tomorrow, ${fmt.format(new Date(now + day))}`;
  return `${fmt.format(new Date(now + 2 * day))} – ${fmt.format(new Date(now + 4 * day))}`;
}

const PAYMENT_LABELS: Record<string, string> = { CARD: 'Card', JAZZCASH: 'JazzCash', EASYPAISA: 'Easypaisa', WALLET: 'OneStop Wallet', COD: 'Cash on delivery', PAYPAL: 'PayPal' };
const SLOT_TIMES = ['Morning (9 AM – 12 PM)', 'Afternoon (12 – 5 PM)', 'Evening (5 – 9 PM)'];

function slotDays(speed: 'STANDARD' | 'EXPRESS') {
  const fmt = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Karachi', weekday: 'short', day: 'numeric', month: 'short' });
  const day = 86400000;
  const now = Date.now();
  const start = speed === 'EXPRESS' ? 1 : 2;
  const count = speed === 'EXPRESS' ? 1 : 6;
  return Array.from({ length: count }, (_, i) => fmt.format(new Date(now + (start + i) * day)));
}

const GIFT_WRAP_MINOR = 10000;

/** Address is captured in structured parts and stored as one joined string,
 *  so the orders API contract and saved addresses stay as they were. */
function splitAddress(full: string): { house: string; street: string; area: string } {
  const parts = full.split(',').map((p) => p.trim()).filter(Boolean);
  if (parts.length >= 3) return { house: parts[0], street: parts[1], area: parts.slice(2).join(', ') };
  if (parts.length === 2) return { house: '', street: parts[0], area: parts[1] };
  return { house: '', street: parts[0] ?? '', area: '' };
}

function joinAddress(d: Pick<Draft, 'house' | 'street' | 'area'>): string {
  return [d.house, d.street, d.area].map((p) => p.trim()).filter(Boolean).join(', ');
}

function validateDetails(d: Draft): Record<string, string> {
  const errs: Record<string, string> = {};
  if (!d.name.trim()) errs.name = 'Enter the name of the person receiving this order.';
  const digits = d.phone.replace(/\D/g, '');
  if (!digits) errs.phone = 'Enter a mobile number.';
  else if (!/^03\d{9}$/.test(digits)) errs.phone = 'Enter a valid mobile number (03XX XXXXXXX — 11 digits).';
  if (!d.street.trim()) errs.street = 'Enter the street address.';
  if (!d.area.trim()) errs.area = 'Enter the area or locality.';
  if (!d.city.trim()) errs.city = 'Select your city.';
  return errs;
}

function slotText(d: Draft): string {
  const days = slotDays(d.speed);
  return `${days[Math.min(d.slotDay, days.length - 1)]} · ${SLOT_TIMES[d.slotTime]}`;
}

function totals(cart: CartLine[], d: Draft) {
  const subtotal = cart.reduce((t, i) => t + i.priceMinor * i.quantity, 0);
  const shipping = d.speed === 'EXPRESS' ? 25000 : subtotal >= 300000 || subtotal === 0 ? 0 : 15000;
  const discountMinor = d.discountApplied?.amountMinor ?? 0;
  const giftMinor = d.giftWrap ? GIFT_WRAP_MINOR : 0;
  const total = subtotal - discountMinor + shipping + giftMinor;
  const cartCount = cart.reduce((t, i) => t + i.quantity, 0);
  return { subtotal, shipping, discountMinor, giftMinor, total, cartCount };
}

function useCheckoutState() {
  const [ready, setReady] = useState(false);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [draft, setDraftState] = useState<Draft>(defaultDraft);

  useEffect(() => {
    try {
      const c = JSON.parse(window.localStorage.getItem(CART_KEY) ?? '[]') as CartLine[];
      if (Array.isArray(c)) setCart(c);
    } catch { /* ignore */ }
    try {
      const d = JSON.parse(window.sessionStorage.getItem(DRAFT_KEY) ?? 'null') as Partial<Draft> | null;
      if (d) setDraftState({ ...defaultDraft, ...d });
    } catch { /* ignore */ }
    setReady(true);
  }, []);

  const setDraft = (next: Draft) => {
    setDraftState(next);
    try { window.sessionStorage.setItem(DRAFT_KEY, JSON.stringify(next)); } catch { /* ignore */ }
  };

  return { ready, cart, draft, setDraft };
}

function Stepper({ current }: { current: 1 | 2 | 3 }) {
  return (
    <div className={styles.coSteps}>
      <span className={current === 1 ? styles.stepOn : styles.stepDone}><b>{current > 1 ? '✓' : '1'}</b> Details</span><i />
      <span className={current === 2 ? styles.stepOn : current > 2 ? styles.stepDone : undefined}><b>{current > 2 ? '✓' : '2'}</b> Payment</span><i />
      <span className={current === 3 ? styles.stepOn : undefined}><b>3</b> Done</span>
    </div>
  );
}

function PageShell({ current, children }: { current: 1 | 2 | 3; children: React.ReactNode }) {
  return (
    <main className={styles.pageWrap}>
      <div className={styles.pageCard}>
        <p className={styles.cardCat}>Secure checkout</p>
        <h1 className={styles.pageTitle}>Delivery &amp; payment</h1>
        <Stepper current={current} />
        {children}
      </div>
    </main>
  );
}

function EmptyCart() {
  return (
    <div className={styles.doneWrap}>
      <div className={styles.doneCheck} aria-hidden="true">🛒</div>
      <h3>Your cart is empty</h3>
      <p>Add something from the store first — checkout will pick it up from here.</p>
      <div className={styles.doneActions}>
        <Link className={styles.checkoutBtn} href="/products">Browse the store</Link>
      </div>
    </div>
  );
}

function TotalsBlock({ cart, draft }: { cart: CartLine[]; draft: Draft }) {
  const t = totals(cart, draft);
  return (
    <div className={styles.totals}>
      <span>Items ({t.cartCount})</span><b>{money(t.subtotal)}</b>
      {t.discountMinor > 0 ? <><span>Discount ({draft.discountApplied?.code})</span><b>−{money(t.discountMinor)}</b></> : null}
      <span>Delivery</span><b>{t.shipping ? money(t.shipping) : 'Free'}</b>
      {draft.giftWrap ? <><span>Gift wrap</span><b>{money(t.giftMinor)}</b></> : null}
      <span className={styles.grand}>Total</span><b className={styles.grand}>{money(t.total)}</b>
    </div>
  );
}

function ReviewBlock({ draft }: { draft: Draft }) {
  const address = joinAddress(draft);
  return (
    <div className={styles.reviewBlock} aria-label="Order review">
      <div><span aria-hidden="true">📍</span><p>{[address, draft.city].filter(Boolean).join(', ') || 'Add your address'} <i>({draft.label})</i></p></div>
      <div><span aria-hidden="true">{draft.speed === 'EXPRESS' ? '⚡' : '🚚'}</span><p>{draft.speed === 'EXPRESS' ? 'Express' : 'Standard'} · {deliveryWindow(draft.speed)}</p></div>
      <div><span aria-hidden="true">💳</span><p>{PAYMENT_LABELS[draft.paymentMethod]}</p></div>
    </div>
  );
}

/* ---------------- Step 1: /checkout — delivery details ---------------- */

export function CheckoutDetailsPage() {
  const router = useRouter();
  const { ready, cart, draft, setDraft } = useCheckoutState();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const prefilled = useRef(false);

  const update = (patch: Partial<Draft>) => setDraft({ ...draft, ...patch });
  const clearFieldError = (key: string) =>
    setFieldErrors((cur) => {
      if (!cur[key]) return cur;
      const next = { ...cur };
      delete next[key];
      return next;
    });

  useEffect(() => {
    if (!ready || prefilled.current) return;
    prefilled.current = true;
    const token = window.localStorage.getItem('onestop-access-token');
    if (!token) return;
    fetch('/api/addresses', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => { if (Array.isArray(d)) setSavedAddresses(d); })
      .catch(() => {});
    // Legacy saved details from the old modal flow seed an untouched draft.
    setDraftStateSafe((current) => {
      const untouched = !current.name && !current.phone && !current.street && !current.area && !current.city;
      if (!untouched) return current;
      try {
        const saved = JSON.parse(window.localStorage.getItem('onestop-delivery') ?? 'null') as null | { name?: string; phone?: string; address?: string; city?: string; postal?: string; label?: string; notes?: string };
        if (saved && (saved.name || saved.address)) {
          const p = saved.address ? splitAddress(saved.address) : { house: '', street: '', area: '' };
          return {
            ...current,
            name: saved.name ?? current.name, phone: saved.phone ?? current.phone,
            house: p.house, street: p.street, area: p.area,
            city: saved.city ?? current.city, postal: saved.postal ?? current.postal,
            label: saved.label ?? current.label, notes: saved.notes ?? current.notes, saveDetails: true,
          };
        }
      } catch { /* ignore */ }
      return current;
    });
    // Prefill contact from the account; anything already present always wins.
    fetch('/api/users/me', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d) return;
        setDraftStateSafe((current) => ({
          ...current,
          name: current.name || d.name || '',
          phone: current.phone || (d.phone ? formatPhone(d.phone) : ''),
        }));
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  // setDraft variant that works off the latest state (for async prefills).
  function setDraftStateSafe(fn: (current: Draft) => Draft) {
    setDraft(fn(draftRef.current));
  }
  const draftRef = useRef(draft);
  draftRef.current = draft;

  const applySavedAddress = (a: SavedAddress) => {
    const p = splitAddress(a.address);
    update({ name: a.name, phone: a.phone, house: p.house, street: p.street, area: p.area, city: a.city, postal: a.postalCode ?? '', label: a.label });
    setSelectedAddressId(a.id);
    setFieldErrors({});
  };

  const continueToPayment = () => {
    const errs = validateDetails(draft);
    setFieldErrors(errs);
    if (Object.keys(errs).length) return;
    router.push('/checkout/payment');
  };

  if (!ready) return <PageShell current={1}><p className={styles.loadingNote}>Loading checkout…</p></PageShell>;
  if (!cart.length) return <PageShell current={1}><EmptyCart /></PageShell>;

  const days = slotDays(draft.speed);

  return (
    <PageShell current={1}>
      <div className={styles.coGrid}>
        <div className={styles.coForm}>
          {savedAddresses.length ? (
            <div className={styles.addrBook}>
              <span className={styles.slotLabel}>Deliver to a saved address</span>
              <div className={styles.addrCards}>
                {savedAddresses.map((a) => (
                  <button key={a.id} type="button" className={selectedAddressId === a.id ? styles.addrCardActive : styles.addrCard} onClick={() => applySavedAddress(a)}>
                    <b>{a.label} · {a.name}</b>
                    <span>{a.address}, {a.city}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : null}
          <p className={styles.coSection}>Contact</p>
          <div className={styles.coRow}>
            <label><span>Full name</span><input className={fieldErrors.name ? styles.inputErr : undefined} value={draft.name} onChange={(e) => { update({ name: e.target.value }); clearFieldError('name'); }} autoComplete="name" />{fieldErrors.name ? <p className={styles.fieldErr}>{fieldErrors.name}</p> : null}</label>
            <label><span>Phone</span><input className={fieldErrors.phone ? styles.inputErr : undefined} value={draft.phone} onChange={(e) => { update({ phone: formatPhone(e.target.value) }); clearFieldError('phone'); }} autoComplete="tel" inputMode="numeric" placeholder="03XX XXXXXXX" />{fieldErrors.phone ? <p className={styles.fieldErr}>{fieldErrors.phone}</p> : null}</label>
          </div>
          <p className={styles.coSection}>Address</p>
          <label><span>House / flat <i>(optional)</i></span><input value={draft.house} onChange={(e) => { update({ house: e.target.value }); setSelectedAddressId(null); }} autoComplete="address-line1" placeholder="e.g. House 12, Flat 4B" /></label>
          <label><span>Street address</span><input className={fieldErrors.street ? styles.inputErr : undefined} value={draft.street} onChange={(e) => { update({ street: e.target.value }); clearFieldError('street'); setSelectedAddressId(null); }} autoComplete="address-line2" placeholder="e.g. Street 5, Block C" />{fieldErrors.street ? <p className={styles.fieldErr}>{fieldErrors.street}</p> : null}</label>
          <label><span>Area / locality</span><input className={fieldErrors.area ? styles.inputErr : undefined} value={draft.area} onChange={(e) => { update({ area: e.target.value }); clearFieldError('area'); setSelectedAddressId(null); }} autoComplete="address-level3" placeholder="e.g. Gulberg III" />{fieldErrors.area ? <p className={styles.fieldErr}>{fieldErrors.area}</p> : null}</label>
          <div className={styles.coRow}>
            <label><span>City</span><select className={fieldErrors.city ? styles.inputErr : undefined} value={draft.city} onChange={(e) => { update({ city: e.target.value }); clearFieldError('city'); }}><option value="">Select city</option>{PAKISTAN_CITIES.map((city) => <option key={city} value={city}>{city}</option>)}</select>{fieldErrors.city ? <p className={styles.fieldErr}>{fieldErrors.city}</p> : null}</label>
            <label><span>Postal code <i>(optional)</i></span><input value={draft.postal} onChange={(e) => update({ postal: e.target.value.replace(/\D/g, '').slice(0, 5) })} inputMode="numeric" placeholder="e.g. 75000" /></label>
          </div>
          <div className={styles.chipRow} role="group" aria-label="Address type">{['Home', 'Office', 'Other'].map((label) => <button key={label} type="button" className={draft.label === label ? styles.chipActive : styles.chip} onClick={() => update({ label })}>{label}</button>)}</div>
          <label><span>Delivery notes <i>(optional)</i></span><textarea value={draft.notes} onChange={(e) => update({ notes: e.target.value })} rows={2} placeholder="Gate code, landmark, rider instructions…" /></label>
          <label className={styles.rememberRow}><input type="checkbox" checked={draft.saveDetails} onChange={(e) => update({ saveDetails: e.target.checked })} /><span>Save my delivery details for next time</span></label>
          <label className={styles.rememberRow}><input type="checkbox" checked={draft.saveToAddressBook} onChange={(e) => update({ saveToAddressBook: e.target.checked })} /><span>Also save this address to my address book</span></label>
          <p className={styles.coSection}>Delivery</p>
          <div className={styles.speedRow} role="radiogroup" aria-label="Delivery speed">
            <button type="button" role="radio" aria-checked={draft.speed === 'STANDARD'} className={draft.speed === 'STANDARD' ? styles.speedActive : styles.speed} onClick={() => update({ speed: 'STANDARD', slotDay: 0 })}><span aria-hidden="true">🚚</span><span><b>Standard</b><small>{deliveryWindow('STANDARD')}</small></span><b>{totals(cart, draft).subtotal >= 300000 ? 'Free' : money(15000)}</b></button>
            <button type="button" role="radio" aria-checked={draft.speed === 'EXPRESS'} className={draft.speed === 'EXPRESS' ? styles.speedActive : styles.speed} onClick={() => update({ speed: 'EXPRESS', slotDay: 0 })}><span aria-hidden="true">⚡</span><span><b>Express</b><small>{deliveryWindow('EXPRESS')}</small></span><b>{money(25000)}</b></button>
          </div>
          <div className={styles.slotSection}><span className={styles.slotLabel}>Choose your delivery slot</span><div className={styles.chipRow} role="group" aria-label="Delivery day">{days.map((d, i) => <button key={d} type="button" className={Math.min(draft.slotDay, days.length - 1) === i ? styles.chipActive : styles.chip} onClick={() => update({ slotDay: i })}>{d}</button>)}</div><div className={styles.chipRow} role="group" aria-label="Delivery time">{SLOT_TIMES.map((t, i) => <button key={t} type="button" className={draft.slotTime === i ? styles.chipActive : styles.chip} onClick={() => update({ slotTime: i })}>{t}</button>)}</div></div>
        </div>
        <aside className={styles.coSummary}>
          <p>Order summary</p>
          <TotalsBlock cart={cart} draft={draft} />
          <ReviewBlock draft={draft} />
          <button className={styles.checkoutBtn} onClick={continueToPayment}>Continue to payment →</button>
          <small>🔒 Protected · tracked delivery</small>
        </aside>
      </div>
    </PageShell>
  );
}

/* ---------------- Step 2: /checkout/payment — payment & place order ---------------- */

export function CheckoutPaymentPage() {
  const [methodsLoaded, setMethodsLoaded] = useState(false);
  const [paypalAvailable, setPaypalAvailable] = useState(false);
  const [paypalRate, setPaypalRate] = useState<number | null>(null);
  useEffect(() => {
    let cancelled = false;
    fetch('/api/payments/methods')
      .then((r) => r.json())
      .then((data: { methods?: string[]; paypalUsdRate?: number | null }) => {
        if (cancelled) return;
        setPaypalAvailable(Array.isArray(data.methods) && data.methods.includes('PAYPAL'));
        setPaypalRate(typeof data.paypalUsdRate === 'number' ? data.paypalUsdRate : null);
        setMethodsLoaded(true);
      })
      .catch(() => { if (!cancelled) setMethodsLoaded(true); });
    return () => { cancelled = true; };
  }, []);
  useEffect(() => {
    if (methodsLoaded && !paypalAvailable && draft.paymentMethod === 'PAYPAL') update({ paymentMethod: 'COD' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [methodsLoaded, paypalAvailable]);

  const router = useRouter();
  const { ready, cart, draft, setDraft } = useCheckoutState();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [discountBusy, setDiscountBusy] = useState(false);
  const [discountError, setDiscountError] = useState('');
  const [storeWalletBalance, setStoreWalletBalance] = useState<number | null>(null);
  const [cardEmail, setCardEmail] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [cardName, setCardName] = useState('');
  const [walletNumber, setWalletNumber] = useState('');
  const [walletName, setWalletName] = useState('');

  const update = (patch: Partial<Draft>) => setDraft({ ...draft, ...patch });
  const t = totals(cart, draft);
  const isWallet = draft.paymentMethod === 'JAZZCASH' || draft.paymentMethod === 'EASYPAISA';
  const detailsMissing = Object.keys(validateDetails(draft)).length > 0;

  useEffect(() => {
    const token = window.localStorage.getItem('onestop-access-token');
    if (!token) return;
    fetch('/api/wallet', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d && typeof d.balanceMinor === 'number') setStoreWalletBalance(d.balanceMinor); })
      .catch(() => {});
  }, []);

  const applyDiscount = async () => {
    const code = draft.discountCode.trim();
    if (!code) { setDiscountError('Enter a discount code first.'); return; }
    setDiscountBusy(true); setDiscountError('');
    try {
      const res = await fetch('/api/orders/validate-discount', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, subtotalMinor: t.subtotal }),
      });
      const payload = (await res.json()) as { code?: string; amountMinor?: number; message?: string | string[] };
      if (!res.ok) throw new Error(Array.isArray(payload.message) ? payload.message.join(', ') : payload.message ?? 'Invalid code');
      update({ discountApplied: { code: payload.code ?? code.toUpperCase(), amountMinor: payload.amountMinor ?? 0 }, discountCode: payload.code ?? code.toUpperCase() });
    } catch (e) {
      setDiscountError(e instanceof Error ? e.message : 'Invalid code');
      update({ discountApplied: null });
    } finally { setDiscountBusy(false); }
  };

  const precheck = (): string | null => {
    const token = window.localStorage.getItem('onestop-access-token');
    if (!token) return 'Sign in from the login page before placing an order.';
    if (detailsMissing) return 'Your delivery details are incomplete — go back to step 1 to complete them.';
    if (draft.paymentMethod === 'WALLET') {
      if (storeWalletBalance === null) return 'Sign in to use your OneStop wallet.';
      if (storeWalletBalance < t.total) return 'Insufficient wallet balance — top up from your dashboard or choose another payment method.';
    }
    return null;
  };

  const submitCheckout = async (viaPaypal = false) => {
    const token = window.localStorage.getItem('onestop-access-token');
    setBusy(true); setError('');
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          items: cart.map((i) => ({ productId: i.id, quantity: i.quantity })),
          shippingName: draft.name, shippingPhone: draft.phone, shippingAddress: joinAddress(draft),
          shippingCity: draft.city, shippingPostalCode: draft.postal || undefined,
          addressLabel: draft.label, deliveryNotes: draft.notes || undefined, deliverySpeed: draft.speed,
          deliverySlot: slotText(draft),
          giftWrap: draft.giftWrap || undefined,
          giftMessage: draft.giftWrap && draft.giftMessage.trim() ? draft.giftMessage.trim() : undefined,
          discountCode: draft.discountCode || undefined, paymentMethod: draft.paymentMethod,
          paymentReturnUrl: viaPaypal ? `${window.location.origin}/checkout/paypal/return` : undefined,
          emiPlan: draft.paymentMethod === 'CARD' && draft.emiPlan ? draft.emiPlan : undefined,
        }),
      });
      const payload = (await res.json()) as { message?: string; order?: { id: string; totalMinor: number }; payment?: { redirectUrl?: string } };
      if (!res.ok) throw new Error(Array.isArray(payload.message) ? payload.message.join(', ') : payload.message ?? 'Unable to place order');
      if (draft.saveDetails) {
        window.localStorage.setItem('onestop-delivery', JSON.stringify({ name: draft.name, phone: draft.phone, address: joinAddress(draft), city: draft.city, postal: draft.postal, label: draft.label, notes: draft.notes }));
      } else {
        window.localStorage.removeItem('onestop-delivery');
      }
      if (draft.saveToAddressBook) {
        fetch('/api/addresses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ label: draft.label, name: draft.name, phone: draft.phone, address: joinAddress(draft), city: draft.city, postalCode: draft.postal || undefined }),
        }).catch(() => {});
      }
      const lastOrder: LastOrder = {
        id: payload.order?.id ?? '', totalMinor: payload.order?.totalMinor ?? t.total,
        paymentMethod: draft.paymentMethod, addressLine: joinAddress(draft), city: draft.city,
        label: draft.label, slotText: slotText(draft), speed: draft.speed, phone: draft.phone,
      };
      try {
        window.sessionStorage.setItem(LAST_ORDER_KEY, JSON.stringify(lastOrder));
      } catch { /* ignore */ }
      if (viaPaypal) {
        const redirectUrl = payload.payment?.redirectUrl;
        if (!redirectUrl) throw new Error('PayPal did not return a payment link. Please try again.');
        try { window.sessionStorage.setItem('onestop-paypal-pending', JSON.stringify({ orderId: lastOrder.id })); } catch { /* ignore */ }
        // Cart and draft stay in place until the return page confirms the
        // capture — a cancelled PayPal visit must not lose the order setup.
        window.location.href = redirectUrl;
        return;
      }
      try {
        window.sessionStorage.removeItem(DRAFT_KEY);
        window.localStorage.removeItem(CART_KEY);
      } catch { /* ignore */ }
      router.push('/checkout/done');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to place order');
    } finally { setBusy(false); }
  };

  const checkout = async () => {
    const blocked = precheck();
    if (blocked) { setError(blocked); return; }
    await submitCheckout();
  };

  const payWithWallet = async () => {
    const blocked = precheck();
    if (blocked) { setError(blocked); return; }
    const walletError = validateWalletFields({ number: walletNumber, name: walletName }, draft.paymentMethod === 'JAZZCASH' ? 'JazzCash' : 'Easypaisa');
    if (walletError) { setError(walletError); return; }
    setBusy(true); setError('');
    await new Promise((resolve) => setTimeout(resolve, 1400));
    await submitCheckout();
  };

  const payWithCard = async () => {
    const blocked = precheck();
    if (blocked) { setError(blocked); return; }
    const cardError = validateCardFields({ email: cardEmail, number: cardNumber, expiry: cardExpiry, cvc: cardCvc, name: cardName });
    if (cardError) { setError(cardError); return; }
    setBusy(true); setError('');
    await new Promise((resolve) => setTimeout(resolve, 1400));
    await submitCheckout();
  };

  const payWithPaypal = async () => {
    const blocked = precheck();
    if (blocked) { setError(blocked); return; }
    await submitCheckout(true);
  };

  if (!ready) return <PageShell current={2}><p className={styles.loadingNote}>Loading checkout…</p></PageShell>;
  if (!cart.length) return <PageShell current={2}><EmptyCart /></PageShell>;
  if (detailsMissing) {
    return (
      <PageShell current={2}>
        <div className={styles.doneWrap}>
          <div className={styles.doneCheck} aria-hidden="true">📍</div>
          <h3>Delivery details first</h3>
          <p>Your delivery details are incomplete — finish step 1 and payment will be ready here.</p>
          <div className={styles.doneActions}>
            <Link className={styles.checkoutBtn} href="/checkout">Complete delivery details</Link>
          </div>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell current={2}>
      {error ? <p className={styles.storeError} role="alert" style={{ margin: '0 0 14px' }}>{error}</p> : null}
      <div className={styles.coGrid}>
        <div className={styles.coForm}>
          <div className={styles.reviewBlock} aria-label="Delivery review">
            <div><span aria-hidden="true">📍</span><p><b>{draft.name}</b> · {draft.phone}<br />{joinAddress(draft)}, {draft.city} <i>({draft.label})</i></p></div>
            <div><span aria-hidden="true">{draft.speed === 'EXPRESS' ? '⚡' : '🚚'}</span><p>{draft.speed === 'EXPRESS' ? 'Express' : 'Standard'} · {slotText(draft)}</p></div>
            <Link className={styles.editLink} href="/checkout">Edit delivery details</Link>
          </div>
          <div className={styles.discountRow}><label><span>Discount code</span><input value={draft.discountCode} onChange={(e) => update({ discountCode: e.target.value.toUpperCase(), discountApplied: null })} placeholder="WELCOME10" /></label><button type="button" className={styles.applyBtn} onClick={applyDiscount} disabled={discountBusy}>{discountBusy ? 'Checking…' : 'Apply'}</button></div>
          {draft.discountApplied ? <p className={styles.discountOk} role="status">✓ {draft.discountApplied.code} applied · you save {money(draft.discountApplied.amountMinor)}</p> : null}
          {discountError ? <p className={styles.discountErr} role="alert">{discountError}</p> : null}
          <label className={styles.rememberRow}><input type="checkbox" checked={draft.giftWrap} onChange={(e) => update({ giftWrap: e.target.checked })} /><span>🎁 Add gift wrap · {money(GIFT_WRAP_MINOR)}</span></label>
          {draft.giftWrap ? <label><span>Gift message <i>(optional)</i></span><textarea value={draft.giftMessage} onChange={(e) => update({ giftMessage: e.target.value })} rows={2} maxLength={200} placeholder="Write your message for the recipient…" /></label> : null}
          <p className={styles.coSection}>Payment</p>
          <StripePaymentPanel items={cart} subtotal={t.subtotal} shipping={t.shipping} total={t.total} paymentMethod={draft.paymentMethod} onPaymentMethodChange={(m) => update({ paymentMethod: m })} storeWalletBalance={storeWalletBalance} emiPlan={draft.emiPlan} setEmiPlan={(v) => update({ emiPlan: v })} cardEmail={cardEmail} setCardEmail={setCardEmail} cardNumber={cardNumber} setCardNumber={setCardNumber} cardExpiry={cardExpiry} setCardExpiry={setCardExpiry} cardCvc={cardCvc} setCardCvc={setCardCvc} cardName={cardName} setCardName={setCardName} walletNumber={walletNumber} setWalletNumber={setWalletNumber} walletName={walletName} setWalletName={setWalletName} money={money} paypalAvailable={paypalAvailable} paypalUsdRate={paypalRate} />
          <Link className={styles.backBtn} href="/checkout">← Back to delivery details</Link>
        </div>
        <aside className={styles.coSummary}>
          <p>Order summary</p>
          <TotalsBlock cart={cart} draft={draft} />
          <ReviewBlock draft={draft} />
          <button className={styles.checkoutBtn} onClick={draft.paymentMethod === 'CARD' ? payWithCard : draft.paymentMethod === 'PAYPAL' ? payWithPaypal : isWallet ? payWithWallet : checkout} disabled={busy}>{busy ? (draft.paymentMethod === 'PAYPAL' ? 'Opening PayPal…' : 'Placing…') : draft.paymentMethod === 'PAYPAL' ? `Continue with PayPal · ${money(t.total)}` : draft.paymentMethod === 'CARD' ? `Pay ${money(t.total)}` : draft.paymentMethod === 'JAZZCASH' ? `Pay with JazzCash · ${money(t.total)}` : draft.paymentMethod === 'EASYPAISA' ? `Pay with Easypaisa · ${money(t.total)}` : `Place order · ${money(t.total)}`}</button>
          <small>🔒 Protected · tracked delivery</small>
        </aside>
      </div>
    </PageShell>
  );
}

/* ---------------- Step 3: /checkout/done — confirmation ---------------- */

export function CheckoutDonePage() {
  const [order, setOrder] = useState<LastOrder | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const o = JSON.parse(window.sessionStorage.getItem(LAST_ORDER_KEY) ?? 'null') as LastOrder | null;
      if (o && o.id) setOrder(o);
    } catch { /* ignore */ }
    setReady(true);
  }, []);

  if (!ready) return <PageShell current={3}><p className={styles.loadingNote}>Loading…</p></PageShell>;
  if (!order) {
    return (
      <PageShell current={3}>
        <div className={styles.doneWrap}>
          <div className={styles.doneCheck} aria-hidden="true">📦</div>
          <h3>No recent order here</h3>
          <p>When you place an order, its confirmation will appear on this page.</p>
          <div className={styles.doneActions}>
            <Link className={styles.checkoutBtn} href="/products">Browse the store</Link>
            <Link className={styles.backBtn} href="/dashboard">Go to my dashboard →</Link>
          </div>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell current={3}>
      <div className={styles.doneWrap}>
        <div className={styles.doneCheck} aria-hidden="true">✓</div>
        <h3>Order placed — thank you!</h3>
        <p>Order <b>#{order.id.slice(0, 8)}</b> · {money(order.totalMinor)} · {PAYMENT_LABELS[order.paymentMethod] ?? order.paymentMethod}</p>
        <div className={styles.doneCard}>
          <div><span aria-hidden="true">📍</span><p>{order.addressLine}{order.city ? `, ${order.city}` : ''} <i>({order.label})</i></p></div>
          <div><span aria-hidden="true">{order.speed === 'EXPRESS' ? '⚡' : '🚚'}</span><p>{order.speed === 'EXPRESS' ? 'Express' : 'Standard'} · {order.slotText}</p></div>
          <div><span aria-hidden="true">📞</span><p>We will call {order.phone} if the rider needs directions.</p></div>
        </div>
        <div className={styles.doneActions}>
          <Link className={styles.checkoutBtn} href="/products">Continue shopping</Link>
          <Link className={styles.backBtn} href="/dashboard">Track in my dashboard →</Link>
        </div>
      </div>
    </PageShell>
  );
}


/**
 * PayPal sends the customer back here after approval (with ?token=<paypal
 * order id>) or after a cancel (?cancel=1, added by our API). Approval is
 * not payment: this page asks the API to capture and verify the payment,
 * and only then clears the cart and shows the normal confirmation page.
 */
export function CheckoutPaypalReturnPage() {
  const router = useRouter();
  const [state, setState] = useState<'working' | 'error' | 'cancelled'>('working');
  const [message, setMessage] = useState('');
  const ranRef = useRef(false);

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;
    void (async () => {
      const params = new URLSearchParams(window.location.search);
      if (params.get('cancel') === '1') {
        try { window.sessionStorage.removeItem('onestop-paypal-pending'); } catch { /* ignore */ }
        setState('cancelled');
        return;
      }
      const paypalOrderId = params.get('token');
      const token = window.localStorage.getItem('onestop-access-token');
      if (!paypalOrderId) {
        setMessage('PayPal did not return a payment reference. If you completed a payment there, contact support before ordering again.');
        setState('error');
        return;
      }
      if (!token) {
        setMessage('Your sign-in session ended during PayPal checkout. Sign in again and check My orders — a completed payment will show there.');
        setState('error');
        return;
      }
      try {
        const res = await fetch('/api/payments/paypal/capture', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ paypalOrderId }),
        });
        const payload = (await res.json().catch(() => ({}))) as { message?: string };
        if (!res.ok) throw new Error(typeof payload.message === 'string' ? payload.message : 'We could not confirm your PayPal payment.');
        try {
          window.sessionStorage.removeItem('onestop-paypal-pending');
          window.sessionStorage.removeItem(DRAFT_KEY);
          window.localStorage.removeItem(CART_KEY);
        } catch { /* ignore */ }
        router.replace('/checkout/done');
      } catch (e) {
        setMessage(e instanceof Error ? e.message : 'We could not confirm your PayPal payment.');
        setState('error');
      }
    })();
  }, [router]);

  if (state === 'working') {
    return (
      <PageShell current={2}>
        <div className={styles.doneCard}>
          <div><span aria-hidden="true">⏳</span><p><b>Confirming your PayPal payment…</b><br />One moment — we are verifying the payment with PayPal. Please don’t close this page.</p></div>
        </div>
      </PageShell>
    );
  }
  if (state === 'cancelled') {
    return (
      <PageShell current={2}>
        <div className={styles.doneCard}>
          <div><span aria-hidden="true">↩️</span><p><b>PayPal payment cancelled.</b><br />No payment was taken. Your cart and delivery details are saved — you can pick another payment method whenever you’re ready.</p></div>
        </div>
        <div className={styles.doneActions}>
          <Link className={styles.checkoutBtn} href="/checkout/payment">Back to payment</Link>
          <Link href="/cart">View cart</Link>
        </div>
      </PageShell>
    );
  }
  return (
    <PageShell current={2}>
      <div className={styles.doneCard}>
        <div><span aria-hidden="true">⚠️</span><p><b>We couldn’t confirm that payment.</b><br />{message}</p></div>
      </div>
      <div className={styles.doneActions}>
        <Link className={styles.checkoutBtn} href="/checkout/payment">Back to payment</Link>
        <Link href="/dashboard">My orders</Link>
      </div>
    </PageShell>
  );
}
