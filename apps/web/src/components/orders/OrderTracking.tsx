'use client';

import { useState } from 'react';
import styles from './order-tracking.module.css';
import { SectionIcon } from '../home/SectionIcons';

const STEPS = ['Placed', 'Paid', 'Packed', 'Shipped', 'Delivered'] as const;

function stepIndex(status: string): number {
  switch (status) {
    case 'PENDING_PAYMENT': return 0;
    case 'PAID': return 1;
    case 'PROCESSING': return 2;
    case 'SHIPPED': return 3;
    case 'DELIVERED': return 4;
    default: return -1;
  }
}

const RETURN_REASONS = ['Wrong item received', 'Damaged on arrival', 'Not as described', 'Changed my mind', 'Other'];

export default function OrderTracking({ orderId, status, onReturn }: { orderId: string; status: string; onReturn: (orderId: string, reason: string) => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState(RETURN_REASONS[0]);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const idx = stepIndex(status);
  const cancelled = status === 'CANCELLED' || status === 'REFUNDED';

  const requestReturn = async () => {
    setBusy(true); setError('');
    try { await onReturn(orderId, reason); setDone(true); }
    catch (e) { setError(e instanceof Error ? e.message : 'Could not request the return'); }
    finally { setBusy(false); }
  };

  return (
    <div className={styles.track}>
      <button type="button" className={styles.trackToggle} onClick={() => setOpen(!open)} aria-expanded={open}>
        {open ? 'Hide tracking' : 'Track order'}
      </button>
      {open ? (
        <div className={styles.trackBody}>
          {cancelled ? (
            <p className={styles.trackCancelled}>This order was {status.toLowerCase().replace('_', ' ')}.</p>
          ) : (
            <ol className={styles.timeline}>
              {STEPS.map((label, i) => (
                <li key={label} className={i <= idx ? styles.stepDone : styles.stepTodo}>
                  <span className={styles.stepDot} aria-hidden="true">{i < idx ? <SectionIcon name="check" size={14} /> : i + 1}</span>
                  <span>{label}</span>
                </li>
              ))}
            </ol>
          )}
          {status === 'DELIVERED' && !done ? (
            <div className={styles.returnBox}>
              <label><span>Request a return</span>
                <select value={reason} onChange={(e) => setReason(e.target.value)}>
                  {RETURN_REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </label>
              <button type="button" disabled={busy} onClick={requestReturn}>{busy ? 'Sending…' : 'Request return'}</button>
              {error ? <p className={styles.returnErr} role="alert">{error}</p> : null}
            </div>
          ) : null}
          {done ? <p className={styles.returnOk} role="status"><SectionIcon name="check" size={14} /> Return requested — our team will contact you about the pickup.</p> : null}
        </div>
      ) : null}
    </div>
  );
}
