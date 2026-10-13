'use client';

import styles from './stripe-payment.module.css';

/**
 * Stripe-Checkout-style payment panel shared by the cart page and the
 * products-page quick checkout. Test mode only — no real charge is made.
 */

export function formatCardNumber(value: string) {
  return value.replace(/\D/g, '').slice(0, 16).replace(/(\d{4})(?=\d)/g, '$1 ');
}

export function formatExpiry(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

export function cardBrandFor(number: string) {
  const digits = number.replace(/\D/g, '');
  if (/^4/.test(digits)) return 'VISA';
  if (/^(5[1-5]|2[2-7])/.test(digits)) return 'MASTERCARD';
  if (/^3[47]/.test(digits)) return 'AMEX';
  if (/^6/.test(digits)) return 'UNIONPAY';
  return '';
}

export function validateCardFields(fields: { email: string; number: string; expiry: string; cvc: string; name: string }) {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email.trim())) return 'Enter a valid email for the card receipt.';
  if (fields.number.replace(/\D/g, '').length !== 16) return 'Enter the 16-digit card number.';
  const match = fields.expiry.match(/^(0[1-9]|1[0-2])\/(\d{2})$/);
  if (!match) return 'Enter the card expiry as MM/YY.';
  if (new Date(2000 + Number(match[2]), Number(match[1])) <= new Date()) return 'The card expiry must be in the future.';
  if (fields.cvc.length < 3) return 'Enter the 3-digit CVC.';
  if (!fields.name.trim()) return 'Enter the name on the card.';
  return null;
}

export type StripeItem = { id: string; nameEn: string; priceMinor: number; quantity: number };

type Props = {
  items: StripeItem[];
  subtotal: number;
  shipping: number;
  total: number;
  paymentMethod: 'COD' | 'CARD';
  onPaymentMethodChange: (method: 'COD' | 'CARD') => void;
  cardEmail: string;
  setCardEmail: (value: string) => void;
  cardNumber: string;
  setCardNumber: (value: string) => void;
  cardExpiry: string;
  setCardExpiry: (value: string) => void;
  cardCvc: string;
  setCardCvc: (value: string) => void;
  cardName: string;
  setCardName: (value: string) => void;
  busy: boolean;
  onPayWithCard: () => void;
  money: (minor: number) => string;
};

export default function StripePaymentPanel(props: Props) {
  const {
    items, subtotal, shipping, total, paymentMethod, onPaymentMethodChange,
    cardEmail, setCardEmail, cardNumber, setCardNumber, cardExpiry, setCardExpiry,
    cardCvc, setCardCvc, cardName, setCardName, busy, onPayWithCard, money,
  } = props;
  return (
    <div className={styles.stripeWrap}>
      <div className={styles.stripeCard}>
        <div className={styles.stripeSummary}>
          <p className={styles.stripeBiz}>OneStop Life</p>
          <span className={styles.stripeTestBadge}>TEST MODE</span>
          <div className={styles.stripeLines}>
            {items.slice(0, 4).map((item) => (
              <div key={item.id}><span>{item.nameEn} × {item.quantity}</span><b>{money(item.priceMinor * item.quantity)}</b></div>
            ))}
            {items.length > 4 ? <div><span>+ {items.length - 4} more items</span><b> </b></div> : null}
          </div>
          <div className={styles.stripeTotals}>
            <div><span>Subtotal</span><b>{money(subtotal)}</b></div>
            <div><span>Delivery</span><b>{shipping ? money(shipping) : 'Free'}</b></div>
            <div className={styles.stripeGrand}><span>Total due</span><b>{money(total)}</b></div>
          </div>
        </div>
        <div className={styles.stripeForm}>
          <div className={styles.stripeTabs} role="tablist">
            <button type="button" role="tab" aria-selected={paymentMethod === 'CARD'} className={paymentMethod === 'CARD' ? 'stripeTabActive' : 'stripeTab'} onClick={() => onPaymentMethodChange('CARD')}>Card</button>
            <button type="button" role="tab" aria-selected={paymentMethod === 'COD'} className={paymentMethod === 'COD' ? 'stripeTabActive' : 'stripeTab'} onClick={() => onPaymentMethodChange('COD')}>Cash on delivery</button>
          </div>
          {paymentMethod === 'CARD' ? (
            <>
              <label className={styles.stripeField}><span>Email</span><input value={cardEmail} onChange={(event) => setCardEmail(event.target.value)} autoComplete="email" inputMode="email" placeholder="you@example.com" /></label>
              <div className={styles.stripeCardBox}>
                <label className={styles.stripeField}><span>Card number</span><span className={styles.stripeCardInputWrap}><input value={cardNumber} onChange={(event) => setCardNumber(formatCardNumber(event.target.value))} autoComplete="cc-number" inputMode="numeric" placeholder="1234 5678 9012 3456" maxLength={19} />{cardBrandFor(cardNumber) ? <b className={styles.stripeBrand}>{cardBrandFor(cardNumber)}</b> : null}</span></label>
                <div className={styles.stripeRow}>
                  <label className={styles.stripeField}><span>Expiry</span><input value={cardExpiry} onChange={(event) => setCardExpiry(formatExpiry(event.target.value))} autoComplete="cc-exp" inputMode="numeric" placeholder="MM/YY" maxLength={5} /></label>
                  <label className={styles.stripeField}><span>CVC</span><input value={cardCvc} onChange={(event) => setCardCvc(event.target.value.replace(/\D/g, '').slice(0, 4))} autoComplete="cc-csc" inputMode="numeric" placeholder="123" maxLength={4} /></label>
                </div>
                <label className={styles.stripeField}><span>Name on card</span><input value={cardName} onChange={(event) => setCardName(event.target.value)} autoComplete="cc-name" placeholder="Full name" /></label>
              </div>
              <button className={styles.stripePay} onClick={onPayWithCard} disabled={busy}>{busy ? 'Processing…' : `Pay ${money(total)}`}</button>
              <p className={styles.stripeTestNote}>Test mode — no real charge is made. Use card 4242 4242 4242 4242, any future expiry and any CVC.</p>
            </>
          ) : (
            <div className={styles.stripeCod}><strong>Pay in cash when your order arrives.</strong><p>Our rider collects {money(total)} at your doorstep. Please keep the amount ready.</p></div>
          )}
          <p className={styles.stripeSecure}>🔒 Secured checkout · Test mode — no real payment is processed.</p>
        </div>
      </div>
    </div>
  );
}
