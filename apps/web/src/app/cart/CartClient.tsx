'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import styles from '../products/page.module.css';

type CartLine = {
  id: string;
  nameEn: string;
  priceMinor: number;
  quantity: number;
  unit?: string;
  imageUrl?: string;
  category?: string;
};

function money(minor: number) {
  return `Rs. ${(minor / 100).toFixed(2)}`;
}

export default function CartClient() {
  const [cart, setCart] = useState<CartLine[]>([]);
  const [cartLoaded, setCartLoaded] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [discountCode, setDiscountCode] = useState('');
  const [shippingName, setShippingName] = useState('');
  const [shippingPhone, setShippingPhone] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'CARD'>('COD');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const stored = window.localStorage.getItem('onestop-cart');
    if (stored) setCart(JSON.parse(stored) as CartLine[]);
    setCartLoaded(true);
  }, []);

  useEffect(() => {
    if (!cartLoaded) return;
    window.localStorage.setItem('onestop-cart', JSON.stringify(cart));
  }, [cart, cartLoaded]);

  const subtotal = useMemo(() => cart.reduce((total, item) => total + item.priceMinor * item.quantity, 0), [cart]);
  const shipping = subtotal >= 300000 || subtotal === 0 ? 0 : 15000;
  const total = subtotal + shipping;
  const checkoutProduct = cart[0];
  const checkoutCategory = checkoutProduct?.category ?? 'everyday essentials';

  const updateQuantity = (productId: string, quantity: number) => {
    setCart((current) => quantity < 1 ? current.filter((item) => item.id !== productId) : current.map((item) => item.id === productId ? { ...item, quantity } : item));
  };

  const placeOrder = async () => {
    const token = window.localStorage.getItem('onestop-access-token');
    if (!token) {
      setError('Sign in on the home page before placing an order.');
      return;
    }
    if (!shippingName.trim() || !shippingPhone.trim() || !shippingAddress.trim()) {
      setError('Complete your delivery details before placing the order.');
      return;
    }

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
          discountCode: discountCode || undefined,
          paymentMethod,
        }),
      });
      const payload = await response.json() as { message?: string | string[]; order?: { id: string; totalMinor: number } };
      if (!response.ok) throw new Error(Array.isArray(payload.message) ? payload.message.join(', ') : payload.message ?? 'Unable to place order');
      setCart([]);
      setCheckoutOpen(false);
      setMessage(`Order ${payload.order?.id.slice(0, 8)} confirmed for ${money(payload.order?.totalMinor ?? total)}.`);
    } catch (orderError) {
      setError(orderError instanceof Error ? orderError.message : 'Unable to place order');
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <Link className={styles.backLink} href="/products">Back to products</Link>
        <header className={styles.header}>
          <div><p className={styles.kicker}>Your order</p><h1>Shopping cart</h1><p className={styles.subtitle}>Review your essentials, then choose delivery and payment.</p></div>
          <span className={styles.count}><span className={styles.cartIcon} aria-hidden="true"><i /><b /><em /></span>{cart.reduce((count, item) => count + item.quantity, 0)} {cart.reduce((count, item) => count + item.quantity, 0) === 1 ? 'item' : 'items'}</span>
        </header>

        {message ? <p className={styles.storeMessage} role="status">{message}</p> : null}
        {error ? <p className={styles.storeError} role="alert">{error}</p> : null}

        {cart.length ? <section className={styles.cartPageLayout} aria-label="Shopping cart">
          <div className={styles.cartPageLines}>
            {cart.map((item) => <article className={styles.cartPageLine} key={item.id}>
              <div className={styles.cartProductVisual} role="img" aria-label={`${item.nameEn} product image`} style={item.imageUrl ? { backgroundImage: `url(${item.imageUrl})` } : undefined}>{!item.imageUrl ? item.nameEn.slice(0, 1) : null}</div><div><h2>{item.nameEn}</h2><p>{money(item.priceMinor)} · {item.unit ?? 'item'}</p></div>
              <div className={styles.quantityControls}><button onClick={() => updateQuantity(item.id, item.quantity - 1)} aria-label={`Decrease ${item.nameEn}`}>−</button><span>{item.quantity}</span><button onClick={() => updateQuantity(item.id, item.quantity + 1)} aria-label={`Increase ${item.nameEn}`}>+</button></div>
              <strong>{money(item.priceMinor * item.quantity)}</strong>
            </article>)}
          </div>
          <aside className={styles.cartPageSummary} aria-label="Order summary">
            <h2>Order summary</h2><div><span>Subtotal</span><strong>{money(subtotal)}</strong></div><div><span>Delivery</span><strong>{shipping ? money(shipping) : 'Free'}</strong></div><div className={styles.totalRow}><span>Total</span><strong>{money(total)}</strong></div>
            <button className={styles.primaryAction} onClick={() => setCheckoutOpen(true)}><span aria-hidden="true">→</span> Continue to checkout</button>
          </aside>
        </section> : <section className={styles.emptyState}><div className={styles.emptyIcon}>+</div><h2>Your cart is empty</h2><p>Browse the catalogue and add something useful.</p><Link className={styles.homeLink} href="/products">Browse products</Link></section>}

        {checkoutOpen ? <div className={styles.overlay} role="presentation"><section className={styles.checkoutPanel} aria-label="Checkout">
          <div className={styles.panelHeader}><div><p className={styles.categoryEyebrow}>Secure checkout</p><h2>Complete your order</h2></div><button className={styles.closeButton} onClick={() => setCheckoutOpen(false)} aria-label="Close checkout">×</button></div>
          <div className={styles.checkoutSteps}><span className={styles.stepActive}><b>1</b> Delivery</span><i /> <span><b>2</b> Payment</span><i /> <span><b>3</b> Confirm</span></div>
          <div className={styles.checkoutVisual} style={checkoutProduct?.imageUrl ? { backgroundImage: `linear-gradient(90deg, rgba(23, 35, 55, 0.92), rgba(23, 35, 55, 0.28)), url(${checkoutProduct.imageUrl})` } : undefined}><div><span>ONE STOP SECURE CHECKOUT</span><strong>Your {checkoutCategory.toLowerCase()} order is ready to go.</strong><small>Protected checkout · tracked delivery</small></div></div>
          <div className={styles.checkoutLayout}><div className={styles.checkoutForm}><div className={styles.formSectionHeading}><span className={styles.formStep}>01</span><div><h3>Delivery details</h3><p>Where should we send your order?</p></div></div><div className={styles.checkoutGrid}><label className={styles.field}><span>Full name</span><input value={shippingName} onChange={(event) => setShippingName(event.target.value)} autoComplete="name" /></label><label className={styles.field}><span>Phone</span><input value={shippingPhone} onChange={(event) => setShippingPhone(event.target.value)} autoComplete="tel" /></label></div><label className={styles.field}><span>Delivery address</span><textarea value={shippingAddress} onChange={(event) => setShippingAddress(event.target.value)} rows={3} autoComplete="street-address" /></label><div className={styles.deliveryNote}><span className={styles.deliveryIcon} aria-hidden="true">✦</span><div><strong>Tracked doorstep delivery</strong><p>We will keep your order moving from our store to your door.</p></div></div><div className={styles.formSectionHeading}><span className={styles.formStep}>02</span><div><h3>Payment method</h3><p>Choose how you want to pay.</p></div></div><fieldset className={styles.paymentOptions}><legend className={styles.visuallyHidden}>Choose payment</legend><label><input type="radio" checked={paymentMethod === 'COD'} onChange={() => setPaymentMethod('COD')} /> <span>Cash on delivery</span><small>Pay when your order arrives</small></label><label><input type="radio" checked={paymentMethod === 'CARD'} onChange={() => setPaymentMethod('CARD')} /> <span>Card payment</span><small>Local test mode</small></label><div className={styles.cardBrands}><b>VISA</b><b>MC</b><b>AMEX</b><b>UnionPay</b></div></fieldset><label className={styles.field}><span>Discount code</span><input value={discountCode} onChange={(event) => setDiscountCode(event.target.value.toUpperCase())} placeholder="WELCOME10" /></label><p className={styles.secureNote}>🔒 Your checkout is protected. Discounts are checked securely on the server.</p></div><aside className={styles.checkoutSummary}><p>Order summary</p><div className={styles.summaryIconRow}><span className={styles.summaryBagIcon} aria-hidden="true">▣</span><strong>{cart.reduce((count, item) => count + item.quantity, 0)} items</strong></div><div><span>Subtotal</span><b>{money(subtotal)}</b></div><div><span>Delivery</span><b>{shipping ? money(shipping) : 'Free'}</b></div><div className={styles.checkoutTotal}><span>Total</span><b>{money(total)}</b></div><div className={styles.summaryTrust}><span aria-hidden="true">✓</span><p>Price locked in<br />No surprise charges</p></div><button className={styles.primaryAction} onClick={placeOrder} disabled={busy}><span aria-hidden="true">✓</span> {busy ? 'Processing...' : `Place order · ${money(total)}`}</button><small>Free delivery over Rs. 3,000</small></aside></div>
        </section></div> : null}
      </div>
    </main>
  );
}
