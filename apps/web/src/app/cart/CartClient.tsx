'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import styles from './cart.module.css';
import { SectionIcon } from '../../components/home/SectionIcons';
import StripePaymentPanel, { validateCardFields, validateWalletFields, PaymentMethodId } from '../../components/checkout/StripePaymentPanel';

type CartLine = {
  id: string;
  nameEn: string;
  priceMinor: number;
  quantity: number;
  unit?: string;
  imageUrl?: string;
  category?: string;
  requiresRx?: boolean;
};

function money(minor: number) {
  return `Rs. ${(minor / 100).toFixed(2)}`;
}

/** Shopping-bag glyph — replaces ad-hoc unicode icons that render as tofu boxes. */
function BagIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5.5 8h13l-1 12.5h-11L5.5 8z" />
      <path d="M9 8V6.5a3 3 0 0 1 6 0V8" />
    </svg>
  );
}


const PAKISTAN_CITIES = ['Karachi', 'Lahore', 'Islamabad', 'Rawalpindi', 'Faisalabad', 'Multan', 'Peshawar', 'Quetta', 'Hyderabad', 'Sialkot', 'Gujranwala', 'Bahawalpur', 'Sargodha', 'Abbottabad', 'Other'];

function formatPhone(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 4) return digits;
  return `${digits.slice(0, 4)} ${digits.slice(4)}`;
}

/** Human delivery window, e.g. "Tomorrow, 15 Oct" or "16 – 18 Oct". */
function deliveryWindow(speed: 'STANDARD' | 'EXPRESS') {
  const fmt = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Karachi', day: 'numeric', month: 'short' });
  const day = 86400000;
  const now = Date.now();
  if (speed === 'EXPRESS') return `Tomorrow, ${fmt.format(new Date(now + day))}`;
  return `${fmt.format(new Date(now + 2 * day))} – ${fmt.format(new Date(now + 4 * day))}`;
}

const PAYMENT_LABELS: Record<string, string> = { CARD: 'Card', JAZZCASH: 'JazzCash', EASYPAISA: 'Easypaisa', WALLET: 'OneStop Wallet', COD: 'Cash on delivery' };

const SLOT_TIMES = ['Morning (9 AM – 12 PM)', 'Afternoon (12 – 5 PM)', 'Evening (5 – 9 PM)'];

/** Bookable delivery days: tomorrow only for Express, next 6 days for Standard. */
function slotDays(speed: 'STANDARD' | 'EXPRESS') {
  const fmt = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Karachi', weekday: 'short', day: 'numeric', month: 'short' });
  const day = 86400000;
  const now = Date.now();
  const start = speed === 'EXPRESS' ? 1 : 2;
  const count = speed === 'EXPRESS' ? 1 : 6;
  return Array.from({ length: count }, (_, i) => fmt.format(new Date(now + (start + i) * day)));
}

const GIFT_WRAP_MINOR = 10000;

export default function CartClient() {
  const [cart, setCart] = useState<CartLine[]>([]);
  const [cartLoaded, setCartLoaded] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [discountCode, setDiscountCode] = useState('');
  const [shippingName, setShippingName] = useState('');
  const [shippingPhone, setShippingPhone] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [shippingCity, setShippingCity] = useState('');
  const [shippingPostalCode, setShippingPostalCode] = useState('');
  const [addressLabel, setAddressLabel] = useState('Home');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [deliverySpeed, setDeliverySpeed] = useState<'STANDARD' | 'EXPRESS'>('STANDARD');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodId>('COD');
  const [cardEmail, setCardEmail] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [cardName, setCardName] = useState('');
  const [walletNumber, setWalletNumber] = useState('');
  const [walletName, setWalletName] = useState('');
  const [prescriptionFileKey, setPrescriptionFileKey] = useState('');
  const [prescriptionRef, setPrescriptionRef] = useState('');
  const [busy, setBusy] = useState(false);
  const [saveDetails, setSaveDetails] = useState(false);
  const [slotDay, setSlotDay] = useState(0);
  const [slotTime, setSlotTime] = useState(0);
  const [giftWrap, setGiftWrap] = useState(false);
  const [giftMessage, setGiftMessage] = useState('');
  const [discountApplied, setDiscountApplied] = useState<{ code: string; amountMinor: number } | null>(null);
  const [discountBusy, setDiscountBusy] = useState(false);
  const [discountError, setDiscountError] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [storeWalletBalance, setStoreWalletBalance] = useState<number | null>(null);
  const [emiPlan, setEmiPlan] = useState('');
  const [savedAddresses, setSavedAddresses] = useState<Array<{ id: string; label: string; name: string; phone: string; address: string; city: string; postalCode?: string | null }>>([]);
  const [saveToAddressBook, setSaveToAddressBook] = useState(false);

  useEffect(() => {
    const token = window.localStorage.getItem('onestop-access-token');
    if (token) {
      fetch('/api/wallet', { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => r.ok ? r.json() : null)
        .then((d) => { if (d && typeof d.balanceMinor === 'number') setStoreWalletBalance(d.balanceMinor); })
        .catch(() => {});
      fetch('/api/addresses', { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => r.ok ? r.json() : [])
        .then((d) => { if (Array.isArray(d)) setSavedAddresses(d); })
        .catch(() => {});
    }
    const stored = window.localStorage.getItem('onestop-cart');
    if (stored) setCart(JSON.parse(stored) as CartLine[]);
    setCartLoaded(true);
    try {
      const saved = JSON.parse(window.localStorage.getItem('onestop-delivery') ?? 'null') as null | { name?: string; phone?: string; address?: string; city?: string; postal?: string; label?: string; notes?: string };
      if (saved) {
        if (saved.name) setShippingName(saved.name);
        if (saved.phone) setShippingPhone(saved.phone);
        if (saved.address) setShippingAddress(saved.address);
        if (saved.city) setShippingCity(saved.city);
        if (saved.postal) setShippingPostalCode(saved.postal);
        if (saved.label) setAddressLabel(saved.label);
        if (saved.notes) setDeliveryNotes(saved.notes);
        setSaveDetails(true);
      }
    } catch { /* ignore corrupt saved details */ }
  }, []);

  useEffect(() => {
    if (!cartLoaded) return;
    window.localStorage.setItem('onestop-cart', JSON.stringify(cart));
  }, [cart, cartLoaded]);

  // Older saved carts may not carry the requiresRx flag — backfill it from
  // the catalogue so the prescription gate can't be bypassed by a stale cart.
  useEffect(() => {
    if (!cartLoaded || !cart.some((item) => item.requiresRx === undefined)) return;
    let cancelled = false;
    void (async () => {
      try {
        const response = await fetch('/api/products');
        if (!response.ok) return;
        const payload = await response.json() as { items?: Array<{ id: string; requiresRx?: boolean }> } | Array<{ id: string; requiresRx?: boolean }>;
        const list = Array.isArray(payload) ? payload : payload.items ?? [];
        const flags = new Map(list.map((product) => [product.id, Boolean(product.requiresRx)]));
        if (cancelled) return;
        setCart((current) => current.map((item) => item.requiresRx === undefined && flags.has(item.id) ? { ...item, requiresRx: flags.get(item.id) } : item));
      } catch { /* catalogue unavailable — server still enforces the Rx gate */ }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cartLoaded]);

  const rxItems = useMemo(() => cart.filter((item) => item.requiresRx), [cart]);
  const hasRx = rxItems.length > 0;
  // Prescription is stored as a document key for now (file storage comes
  // later, same pattern as verification documents): either the chosen file
  // becomes `rx-<timestamp>-<filename>`, or a typed doctor/prescription
  // reference becomes `ref-<text>`.
  const prescriptionKey = prescriptionFileKey || (prescriptionRef.trim() ? `ref-${prescriptionRef.trim()}` : '');
  const prescriptionReady = prescriptionKey.trim().length >= 3;

  const subtotal = useMemo(() => cart.reduce((total, item) => total + item.priceMinor * item.quantity, 0), [cart]);
  const shipping = deliverySpeed === 'EXPRESS' ? 25000 : subtotal >= 300000 || subtotal === 0 ? 0 : 15000;
  const discountMinor = discountApplied?.amountMinor ?? 0;
  const giftMinor = giftWrap ? GIFT_WRAP_MINOR : 0;
  const total = subtotal - discountMinor + shipping + giftMinor;

  const updateQuantity = (productId: string, quantity: number) => {
    setCart((current) => quantity < 1 ? current.filter((item) => item.id !== productId) : current.map((item) => item.id === productId ? { ...item, quantity } : item));
  };

  const precheck = () => {
    const token = window.localStorage.getItem('onestop-access-token');
    if (!token) return 'Sign in from the login page before placing an order.';
    if (!shippingName.trim() || !shippingPhone.trim() || !shippingAddress.trim() || !shippingCity.trim()) return 'Complete your delivery details (name, phone, address and city) before placing the order.';
    if (!/^03\d{9}$/.test(shippingPhone.replace(/\D/g, ''))) return 'Enter a valid mobile number (03XX XXXXXXX).';
    if (paymentMethod === 'WALLET') {
      if (storeWalletBalance === null) return 'Sign in to use your OneStop wallet.';
      if (storeWalletBalance < total) return 'Insufficient wallet balance — top up from your dashboard or choose another payment method.';
    }
    if (hasRx && !prescriptionReady) return 'This order contains prescription medicines. Please add your prescription file or your doctor / prescription reference so our pharmacist can verify it before dispatch.';
    return null;
  };

  const validateCard = () => validateCardFields({ email: cardEmail, number: cardNumber, expiry: cardExpiry, cvc: cardCvc, name: cardName });

  const submitOrder = async () => {
    const token = window.localStorage.getItem('onestop-access-token');
    setBusy(true);
    setError('');
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          items: cart.map((item) => ({ productId: item.id, quantity: item.quantity })),
          shippingName,
          shippingPhone,
          shippingAddress,
          shippingCity,
          shippingPostalCode: shippingPostalCode || undefined,
          addressLabel,
          deliveryNotes: deliveryNotes || undefined,
          deliverySpeed,
          deliverySlot,
          giftWrap: giftWrap || undefined,
          giftMessage: giftWrap && giftMessage.trim() ? giftMessage.trim() : undefined,
          discountCode: discountCode || undefined,
          paymentMethod,
          emiPlan: paymentMethod === 'CARD' && emiPlan ? emiPlan : undefined,
          prescriptionKey: hasRx ? prescriptionKey : undefined,
        }),
      });
      const payload = await response.json() as { message?: string | string[]; order?: { id: string; totalMinor: number; requiresRx?: boolean; prescriptionStatus?: string | null } };
      if (!response.ok) throw new Error(Array.isArray(payload.message) ? payload.message.join(', ') : payload.message ?? 'Unable to place order');
      const placedWithRx = Boolean(payload.order?.requiresRx);
      if (saveDetails) {
        window.localStorage.setItem('onestop-delivery', JSON.stringify({ name: shippingName, phone: shippingPhone, address: shippingAddress, city: shippingCity, postal: shippingPostalCode, label: addressLabel, notes: deliveryNotes }));
      } else {
        window.localStorage.removeItem('onestop-delivery');
      }
      if (saveToAddressBook) {
        const bookToken = window.localStorage.getItem('onestop-access-token');
        fetch('/api/addresses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${bookToken}` },
          body: JSON.stringify({ label: addressLabel, name: shippingName, phone: shippingPhone, address: shippingAddress, city: shippingCity, postalCode: shippingPostalCode || undefined }),
        }).catch(() => {});
        setSaveToAddressBook(false);
      }
      setCart([]);
      setCheckoutOpen(false);
      setPrescriptionFileKey('');
      setPrescriptionRef('');
      setMessage(placedWithRx
        ? `Order ${payload.order?.id.slice(0, 8)} placed for ${money(payload.order?.totalMinor ?? total)}. Your prescription is with our pharmacist for verification — we will dispatch as soon as it is approved, and we may contact you to share the prescription file.`
        : `Order ${payload.order?.id.slice(0, 8)} confirmed for ${money(payload.order?.totalMinor ?? total)}.`);
    } catch (orderError) {
      setError(orderError instanceof Error ? orderError.message : 'Unable to place order');
    } finally {
      setBusy(false);
    }
  };

  const placeOrder = async () => {
    const blocked = precheck();
    if (blocked) { setError(blocked); return; }
    await submitOrder();
  };

  /** Test-mode card payment: validates the card form, simulates gateway
   *  processing, then places the order through the normal flow. No real
   *  charge is ever made. */
  const isWallet = paymentMethod === 'JAZZCASH' || paymentMethod === 'EASYPAISA';
  const days = slotDays(deliverySpeed);
  const deliverySlot = `${days[Math.min(slotDay, days.length - 1)]} · ${SLOT_TIMES[slotTime]}`;

  /** Test-mode wallet payment: validates the mobile-wallet form, simulates
   *  the in-app approval, then places the order. No real money moves. */
  const applyDiscount = async () => {
    const code = discountCode.trim();
    if (!code) { setDiscountError('Enter a discount code first.'); return; }
    setDiscountBusy(true); setDiscountError('');
    try {
      const res = await fetch('/api/orders/validate-discount', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, subtotalMinor: subtotal }),
      });
      const payload = await res.json() as { code?: string; amountMinor?: number; message?: string | string[] };
      if (!res.ok) throw new Error(Array.isArray(payload.message) ? payload.message.join(', ') : payload.message ?? 'Invalid code');
      setDiscountApplied({ code: payload.code ?? code.toUpperCase(), amountMinor: payload.amountMinor ?? 0 });
      setDiscountCode(payload.code ?? code.toUpperCase());
    } catch (e) {
      setDiscountError(e instanceof Error ? e.message : 'Invalid code');
      setDiscountApplied(null);
    } finally { setDiscountBusy(false); }
  };

  const payWithWallet = async () => {
    const blocked = precheck();
    if (blocked) { setError(blocked); return; }
    const walletError = validateWalletFields({ number: walletNumber, name: walletName }, paymentMethod === 'JAZZCASH' ? 'JazzCash' : 'Easypaisa');
    if (walletError) { setError(walletError); return; }
    setBusy(true);
    setError('');
    await new Promise((resolve) => setTimeout(resolve, 1400));
    await submitOrder();
  };

  const payWithCard = async () => {
    const blocked = precheck();
    if (blocked) { setError(blocked); return; }
    const cardError = validateCard();
    if (cardError) { setError(cardError); return; }
    setBusy(true);
    setError('');
    await new Promise((resolve) => setTimeout(resolve, 1400));
    await submitOrder();
  };

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <Link className={styles.backLink} href="/products"><SectionIcon name="arrowLeft" size={14} /> Back to products</Link>
        <header className={styles.hero}>
          <div className={styles.heroCopy}>
            <p className={styles.kicker}>Your order</p>
            <h1>Shopping cart</h1>
            <p className={styles.subtitle}>Review your essentials, then choose delivery and payment.</p>
            <div className={styles.heroSteps} aria-label="Checkout progress">
              <span className={styles.stepDone}><b><SectionIcon name="check" size={14} /></b> Cart</span><i />
              <span><b>2</b> Delivery</span><i />
              <span><b>3</b> Payment</span>
            </div>
          </div>
          <div className={styles.heroCard}>
            <span className={styles.count}><BagIcon className={styles.countIcon} />{cart.reduce((count, item) => count + item.quantity, 0)} {cart.reduce((count, item) => count + item.quantity, 0) === 1 ? 'item' : 'items'}</span>
            {subtotal < 300000 && subtotal > 0 ? (
              <div className={styles.shipBar}>
                <p>Add <strong>{money(300000 - subtotal)}</strong> more for <strong>free delivery</strong></p>
                <div className={styles.shipTrack}><div className={styles.shipFill} style={{ width: `${Math.min(100, Math.round((subtotal / 300000) * 100))}%` }} /></div>
              </div>
            ) : subtotal >= 300000 ? (
              <p className={styles.shipFree}>🎉 You&apos;ve unlocked <strong>free delivery</strong></p>
            ) : null}
          </div>
        </header>

        {message ? <p className={styles.storeMessage} role="status">{message}</p> : null}
        {error ? <p className={styles.storeError} role="alert">{error}</p> : null}

        {cart.length ? <section className={styles.cartPageLayout} aria-label="Shopping cart">
          <div className={styles.cartPageLines}>
            {cart.map((item) => <article className={styles.cartPageLine} key={item.id}>
              <div className={styles.cartProductVisual} role="img" aria-label={`${item.nameEn} product image`} style={item.imageUrl ? { backgroundImage: `url(${item.imageUrl})` } : undefined}>{!item.imageUrl ? item.nameEn.slice(0, 1) : null}</div>
              <div className={styles.lineInfo}>
                <div className={styles.lineTags}>{item.category ? <span className={styles.catTag}>{item.category}</span> : null}{item.requiresRx ? <span className={styles.rxTag}>Rx required</span> : null}</div>
                <h2>{item.nameEn}</h2>
                <p>{money(item.priceMinor)} · {item.unit ?? 'item'}</p>
                <button className={styles.removeBtn} onClick={() => updateQuantity(item.id, 0)} aria-label={`Remove ${item.nameEn}`}>Remove</button>
              </div>
              <div className={styles.quantityControls}><button onClick={() => updateQuantity(item.id, item.quantity - 1)} aria-label={`Decrease ${item.nameEn}`}>−</button><span>{item.quantity}</span><button onClick={() => updateQuantity(item.id, item.quantity + 1)} aria-label={`Increase ${item.nameEn}`}>+</button></div>
              <strong>{money(item.priceMinor * item.quantity)}</strong>
            </article>)}
          </div>
          <aside className={styles.cartPageSummary} aria-label="Order summary">
            <h2>Order summary</h2>
            <div><span>Subtotal</span><strong>{money(subtotal)}</strong></div>
            <div><span>Delivery</span><strong className={shipping ? undefined : styles.freeTag}>{shipping ? money(shipping) : 'Free'}</strong></div>
            <div className={styles.totalRow}><span>Total</span><strong>{money(total)}</strong></div>
            <button className={styles.primaryAction} onClick={() => setCheckoutOpen(true)}><SectionIcon name="arrowRight" size={16} /> Continue to checkout</button>
            <div className={styles.trustList}>
              <span><SectionIcon name="shield" size={14} /> Secure checkout</span>
              <span><SectionIcon name="truck" size={14} /> {deliveryWindow('STANDARD')}</span>
              <span>💵 Cash on delivery available</span>
            </div>
          </aside>
        </section> : <section className={styles.emptyState}><div className={styles.emptyIcon}><BagIcon /></div><h2>Your cart is empty</h2><p>Browse medicines, baby care, wellness and more — delivered to your doorstep.</p><div className={styles.emptyActions}><Link className={styles.homeLink} href="/products">Browse products</Link><Link className={styles.ghostLink} href="/pharmacy">Visit pharmacy</Link></div></section>}

        {checkoutOpen ? <div className={styles.overlay} role="presentation"><section className={styles.checkoutPanel} aria-label="Checkout">
          <div className={styles.panelHeader}><div><p className={styles.categoryEyebrow}>Secure checkout</p><h2>Complete your order</h2></div><button className={styles.closeButton} onClick={() => setCheckoutOpen(false)} aria-label="Close checkout">×</button></div>
          <div className={styles.checkoutSteps}><span className={styles.stepActive}><b>1</b> Delivery</span><i /> <span><b>2</b> Payment</span><i /> <span><b>3</b> Confirm</span></div>{error ? <p className={styles.checkoutError} role="alert">{error}</p> : null}
          <div className={styles.checkoutLayout}><div className={styles.checkoutForm}><div className={styles.formSectionHeading}><span className={styles.formStep}>01</span><div><h3>Delivery details</h3><p>Where should we send your order?</p></div></div><div className={styles.checkoutGrid}><label className={styles.field}><span>Full name</span><input value={shippingName} onChange={(event) => setShippingName(event.target.value)} autoComplete="name" /></label><label className={styles.field}><span>Phone</span><input value={shippingPhone} onChange={(event) => setShippingPhone(formatPhone(event.target.value))} autoComplete="tel" inputMode="numeric" placeholder="03XX XXXXXXX" /></label></div><label className={styles.field}><span>Delivery address</span><textarea value={shippingAddress} onChange={(event) => setShippingAddress(event.target.value)} rows={3} autoComplete="street-address" placeholder="House, street, area" /></label><div className={styles.checkoutGrid}><label className={styles.field}><span>City</span><select value={shippingCity} onChange={(event) => setShippingCity(event.target.value)}><option value="">Select city</option>{PAKISTAN_CITIES.map((city) => <option key={city} value={city}>{city}</option>)}</select></label><label className={styles.field}><span>Postal code <i>(optional)</i></span><input value={shippingPostalCode} onChange={(event) => setShippingPostalCode(event.target.value.replace(/\D/g, '').slice(0, 5))} inputMode="numeric" placeholder="75000" /></label></div><div className={styles.chipRow} role="group" aria-label="Address type">{['Home', 'Office', 'Other'].map((label) => <button key={label} type="button" className={addressLabel === label ? styles.chipActive : styles.chip} onClick={() => setAddressLabel(label)}>{label}</button>)}</div><label className={styles.field}><span>Delivery notes <i>(optional)</i></span><textarea value={deliveryNotes} onChange={(event) => setDeliveryNotes(event.target.value)} rows={2} placeholder="Gate code, landmark, rider instructions…" /></label><label className={styles.rememberRow}><input type="checkbox" checked={saveDetails} onChange={(event) => setSaveDetails(event.target.checked)} /><span>Save my delivery details for next time</span></label>{savedAddresses.length ? <div className={styles.addressBook}><span className={styles.slotLabel}>Saved addresses</span><div className={styles.chipRow} role="group" aria-label="Saved addresses">{savedAddresses.map((a) => <button key={a.id} type="button" className={styles.chip} onClick={() => { setShippingName(a.name); setShippingPhone(a.phone); setShippingAddress(a.address); setShippingCity(a.city); setShippingPostalCode(a.postalCode ?? ''); setAddressLabel(a.label); }}>{a.label} · {a.city}</button>)}</div></div> : null}<label className={styles.rememberRow}><input type="checkbox" checked={saveToAddressBook} onChange={(event) => setSaveToAddressBook(event.target.checked)} /><span>Save this address to my address book</span></label><div className={styles.speedRow} role="radiogroup" aria-label="Delivery speed"><button type="button" role="radio" aria-checked={deliverySpeed === 'STANDARD'} className={deliverySpeed === 'STANDARD' ? styles.speedActive : styles.speed} onClick={() => { setDeliverySpeed('STANDARD'); setSlotDay(0); }}><span className={styles.speedIcon} aria-hidden="true"><SectionIcon name="truck" size={20} /></span><span><b>Standard</b><small>{deliveryWindow('STANDARD')}</small></span><b>{subtotal >= 300000 ? 'Free' : money(15000)}</b></button><button type="button" role="radio" aria-checked={deliverySpeed === 'EXPRESS'} className={deliverySpeed === 'EXPRESS' ? styles.speedActive : styles.speed} onClick={() => { setDeliverySpeed('EXPRESS'); setSlotDay(0); }}><span className={styles.speedIcon} aria-hidden="true"><SectionIcon name="bolt" size={20} /></span><span><b>Express</b><small>{deliveryWindow('EXPRESS')}</small></span><b>{money(25000)}</b></button></div><div className={styles.slotSection}><span className={styles.slotLabel}>Choose your delivery slot</span><div className={styles.chipRow} role="group" aria-label="Delivery day">{days.map((d, i) => <button key={d} type="button" className={Math.min(slotDay, days.length - 1) === i ? styles.chipActive : styles.chip} onClick={() => setSlotDay(i)}>{d}</button>)}</div><div className={styles.chipRow} role="group" aria-label="Delivery time">{SLOT_TIMES.map((t, i) => <button key={t} type="button" className={slotTime === i ? styles.chipActive : styles.chip} onClick={() => setSlotTime(i)}>{t}</button>)}</div></div><div className={styles.deliveryNote}><span className={styles.deliveryIcon} aria-hidden="true"><SectionIcon name="spark" size={20} /></span><div><strong>Tracked doorstep delivery</strong><p>We will keep your order moving from our store to your door.</p></div></div><div className={styles.formSectionHeading}><span className={styles.formStep}>02</span><div><h3>Payment</h3><p>Choose how you want to pay.</p></div></div><StripePaymentPanel items={cart} subtotal={subtotal} shipping={shipping} total={total} paymentMethod={paymentMethod} onPaymentMethodChange={setPaymentMethod} storeWalletBalance={storeWalletBalance} emiPlan={emiPlan} setEmiPlan={setEmiPlan} cardEmail={cardEmail} setCardEmail={setCardEmail} cardNumber={cardNumber} setCardNumber={setCardNumber} cardExpiry={cardExpiry} setCardExpiry={setCardExpiry} cardCvc={cardCvc} setCardCvc={setCardCvc} cardName={cardName} setCardName={setCardName} walletNumber={walletNumber} setWalletNumber={setWalletNumber} walletName={walletName} setWalletName={setWalletName} money={money} /><div className={styles.discountRow}><label className={styles.field}><span>Discount code</span><input value={discountCode} onChange={(event) => { setDiscountCode(event.target.value.toUpperCase()); setDiscountApplied(null); setDiscountError(''); }} placeholder="WELCOME10" /></label><button type="button" className={styles.applyBtn} onClick={applyDiscount} disabled={discountBusy}>{discountBusy ? 'Checking…' : 'Apply'}</button></div>{discountApplied ? <p className={styles.discountOk} role="status"><SectionIcon name="check" size={14} /> {discountApplied.code} applied · you save {money(discountApplied.amountMinor)}</p> : null}{discountError ? <p className={styles.discountErr} role="alert">{discountError}</p> : null}<p className={styles.secureNote}><SectionIcon name="shield" size={14} /> Your checkout is protected. Discounts are checked securely on the server.</p><label className={styles.rememberRow}><input type="checkbox" checked={giftWrap} onChange={(event) => setGiftWrap(event.target.checked)} /><span><SectionIcon name="package" size={14} /> Add gift wrap · {money(GIFT_WRAP_MINOR)}</span></label>{giftWrap ? <label className={styles.field}><span>Gift message <i>(optional)</i></span><textarea value={giftMessage} onChange={(event) => setGiftMessage(event.target.value)} rows={2} maxLength={200} placeholder="Write your message for the recipient…" /></label> : null}{hasRx ? <div className={styles.rxGate} role="note"><div className={styles.formSectionHeading}><span className={styles.formStep}>03</span><div><h3>Prescription required</h3><p>Our pharmacist will verify it before dispatch.</p></div></div><p className={styles.rxGateText}>This order includes prescription medicines ({rxItems.map((item) => item.nameEn).join(', ')}). DRAP requires medicines like antibiotics to be sold only against a registered doctor&apos;s prescription, so these items leave our pharmacy only after verification.</p><label className={styles.field}><span>Prescription file (photo or PDF)</span><input type="file" accept="image/*,.pdf" onChange={(event) => { const file = event.target.files?.[0]; setPrescriptionFileKey(file ? `rx-${Date.now()}-${file.name}` : ''); }} /></label><label className={styles.field}><span>Or doctor name / prescription reference</span><input value={prescriptionRef} onChange={(event) => setPrescriptionRef(event.target.value)} placeholder="e.g. Dr. Ahmed Khan — prescription dated 5 Oct" /></label><p className={styles.rxGateText}>Uploads are registered by file name for now — our pharmacy team will ask you to share the prescription file with them to complete verification.</p>{prescriptionReady ? <p className={styles.rxReady}><SectionIcon name="check" size={14} /> Prescription added — ready to place your order.</p> : <p className={styles.rxMissing}>Add your prescription file or reference to enable Place order.</p>}</div> : null}</div><aside className={styles.checkoutSummary}><p>Order summary</p><div className={styles.summaryIconRow}><BagIcon className={styles.summaryBagIcon} /><strong>{cart.reduce((count, item) => count + item.quantity, 0)} items</strong></div><div className={styles.summaryThumbs} aria-hidden="true">{cart.slice(0, 6).map((item) => item.imageUrl ? <span key={item.id} style={{ backgroundImage: `url(${item.imageUrl})` }} /> : null)}</div><div><span>Subtotal</span><b>{money(subtotal)}</b></div>{discountMinor > 0 ? <div className={styles.discountLine}><span>Discount ({discountApplied?.code})</span><b>−{money(discountMinor)}</b></div> : null}<div><span>Delivery</span><b>{shipping ? money(shipping) : 'Free'}</b></div>{giftWrap ? <div><span>Gift wrap</span><b>{money(giftMinor)}</b></div> : null}<div className={styles.checkoutTotal}><span>Total</span><b>{money(total)}</b></div><div className={styles.summaryTrust}><span aria-hidden="true"><SectionIcon name="check" size={14} /></span><p>Price locked in<br />No surprise charges</p></div><div className={styles.reviewBlock} aria-label="Order review"><div><span aria-hidden="true"><SectionIcon name="pin" size={16} /></span><p>{[shippingAddress.trim(), shippingCity.trim()].filter(Boolean).join(', ') || 'Add your address'}{shippingPostalCode ? ` ${shippingPostalCode}` : ''} <i>({addressLabel})</i></p></div><div><span aria-hidden="true">{deliverySpeed === 'EXPRESS' ? <SectionIcon name="bolt" size={16} /> : <SectionIcon name="truck" size={16} />}</span><p>{deliverySpeed === 'EXPRESS' ? 'Express' : 'Standard'} · {deliveryWindow(deliverySpeed)}</p></div><div><span aria-hidden="true"><SectionIcon name="card" size={16} /></span><p>{PAYMENT_LABELS[paymentMethod]}</p></div></div><button className={styles.primaryAction} onClick={paymentMethod === 'CARD' ? payWithCard : isWallet ? payWithWallet : paymentMethod === 'WALLET' ? placeOrder : placeOrder} disabled={busy || (hasRx && !prescriptionReady)}><span aria-hidden="true">{paymentMethod === 'CARD' ? '💳' : isWallet ? '📱' : '✓'}</span> {busy ? 'Processing...' : paymentMethod === 'CARD' ? `Pay ${money(total)}` : paymentMethod === 'JAZZCASH' ? `Pay with JazzCash · ${money(total)}` : paymentMethod === 'EASYPAISA' ? `Pay with Easypaisa · ${money(total)}` : paymentMethod === 'WALLET' ? `Pay from wallet · ${money(total)}` : `Place order · ${money(total)}`}</button>{hasRx && !prescriptionReady ? <small>Add your prescription above to place this order.</small> : null}<small>Free delivery over Rs. 3,000</small></aside></div>
        </section></div> : null}
      </div>
    </main>
  );
}
