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

export function formatWalletNumber(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 4) return digits;
  return `${digits.slice(0, 4)} ${digits.slice(4)}`;
}

export function validateWalletFields(fields: { number: string; name: string }, label: string) {
  if (!/^03\d{9}$/.test(fields.number.replace(/\D/g, ''))) return `Enter your ${label} mobile number as 03XX XXXXXXX.`;
  if (!fields.name.trim()) return 'Enter the mobile account holder name.';
  return null;
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

export type StripeItem = { id: string; nameEn: string; priceMinor: number; quantity: number; imageUrl?: string };

export type PaymentMethodId = 'COD' | 'CARD' | 'JAZZCASH' | 'EASYPAISA';

export const PAYMENT_TABS: Array<{ id: PaymentMethodId; label: string; dot: string }> = [
  { id: 'CARD', label: 'Card', dot: '#166a91' },
  { id: 'JAZZCASH', label: 'JazzCash', dot: '#d9261c' },
  { id: 'EASYPAISA', label: 'Easypaisa', dot: '#3d9a3d' },
  { id: 'COD', label: 'Cash on delivery', dot: '#8a6d1c' },
];

type Props = {
  items: StripeItem[];
  subtotal: number;
  shipping: number;
  total: number;
  paymentMethod: PaymentMethodId;
  onPaymentMethodChange: (method: PaymentMethodId) => void;
  walletNumber: string;
  setWalletNumber: (value: string) => void;
  walletName: string;
  setWalletName: (value: string) => void;
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
  money: (minor: number) => string;
};

export default function StripePaymentPanel(props: Props) {
  const {
    items, subtotal, shipping, total, paymentMethod, onPaymentMethodChange,
    cardEmail, setCardEmail, cardNumber, setCardNumber, cardExpiry, setCardExpiry,
    cardCvc, setCardCvc, cardName, setCardName,
    walletNumber, setWalletNumber, walletName, setWalletName, money,
  } = props;
  const walletLabel = paymentMethod === 'JAZZCASH' ? 'JazzCash' : 'Easypaisa';
  const isWallet = paymentMethod === 'JAZZCASH' || paymentMethod === 'EASYPAISA';
  return (
    <div className={styles.stripeWrap}>
      <div className={styles.stripeCard}>
        <div className={styles.stripeSummary}>
          <p className={styles.stripeBiz}>OneStop Life</p>
          <span className={styles.stripeTestBadge}>TEST MODE</span>
          <div className={styles.stripeLines}>
            {items.slice(0, 4).map((item) => (
              <div key={item.id} className={styles.stripeLine}>
                {item.imageUrl ? <span className={styles.stripeThumb} style={{ backgroundImage: `url(${item.imageUrl})` }} aria-hidden="true" /> : null}
                <span>{item.nameEn} × {item.quantity}</span><b>{money(item.priceMinor * item.quantity)}</b>
              </div>
            ))}
            {items.length > 4 ? <div><span>+ {items.length - 4} more items</span></div> : null}
          </div>
          <div className={styles.stripeTotals}>
            <div><span>Subtotal</span><b>{money(subtotal)}</b></div>
            <div><span>Delivery</span><b>{shipping ? money(shipping) : 'Free'}</b></div>
            <div className={styles.stripeGrand}><span>Total due</span><b>{money(total)}</b></div>
          </div>
        </div>
        <div className={styles.stripeForm}>
          <div className={styles.stripeTabs} role="tablist">
            {PAYMENT_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={paymentMethod === tab.id}
                className={paymentMethod === tab.id ? styles.stripeTabActive : styles.stripeTab}
                onClick={() => onPaymentMethodChange(tab.id)}
              >
                <span className={styles.stripeTabDot} style={{ background: tab.dot }} aria-hidden="true" />
                {tab.label}
              </button>
            ))}
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
              <p className={styles.stripeTestNote}>Test mode — no real charge is made. Use card 4242 4242 4242 4242, any future expiry and any CVC.</p>
            </>
          ) : isWallet ? (
            <>
              <label className={styles.stripeField}><span>{walletLabel} mobile number</span><input value={walletNumber} onChange={(event) => setWalletNumber(formatWalletNumber(event.target.value))} autoComplete="tel" inputMode="numeric" placeholder="03XX XXXXXXX" maxLength={12} /></label>
              <label className={styles.stripeField}><span>Account title</span><input value={walletName} onChange={(event) => setWalletName(event.target.value)} autoComplete="name" placeholder="Name on the mobile account" /></label>
              <div className={styles.stripeCod}><strong>Approve in your {walletLabel} app.</strong><p>We will send a {money(total)} payment request to your {walletLabel} number — approve it there to complete your order.</p></div>
              <p className={styles.stripeTestNote}>Test mode — approval is simulated, no real money moves.</p>
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
