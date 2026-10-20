'use client';

import { useState } from 'react';
import styles from './order-tracking.module.css';

type StepState = 'done' | 'current' | 'todo' | 'blocked';
type Step = { label: string; state: StepState };

function baseIndex(status: string): number {
  switch (status) {
    case 'PENDING_PAYMENT': return 0;
    case 'PAID': return 1;
    case 'PROCESSING': return 2;
    case 'SHIPPED': return 3;
    case 'DELIVERED': return 4;
    default: return -1;
  }
}

function buildSteps(status: string, requiresRx: boolean, prescriptionStatus: string | null | undefined): Step[] {
  const idx = baseIndex(status);
  const flow: Array<{ label: string; reachedAt: number }> = [
    { label: 'Placed', reachedAt: 0 },
    { label: 'Paid', reachedAt: 1 },
    { label: 'Packed', reachedAt: 2 },
    { label: 'Shipped', reachedAt: 3 },
    { label: 'Delivered', reachedAt: 4 },
  ];
  const steps: Step[] = flow.map(({ label, reachedAt }) => ({
    label,
    state: idx > reachedAt ? 'done' : idx === reachedAt ? 'current' : 'todo',
  }));

  if (!requiresRx) return steps;

  // Prescription orders pass a pharmacist gate before anything ships. The
  // gate's state comes from the pharmacist review, not the fulfilment status.
  const rxState: StepState =
    prescriptionStatus === 'APPROVED' ? 'done'
    : prescriptionStatus === 'REJECTED' ? 'blocked'
    : 'current';
  const gated: Step[] = [steps[0], { label: 'Pharmacist check', state: rxState }, ...steps.slice(1)];
  // While the pharmacist check is pending or rejected, later steps cannot be
  // current — the order is held at the gate.
  if (rxState !== 'done') {
    return gated.map((step, i) => (i > 1 && step.state === 'current' ? { ...step, state: 'todo' } : step));
  }
  return gated;
}

const RETURN_REASONS = ['Wrong item received', 'Damaged on arrival', 'Not as described', 'Changed my mind', 'Other'];

export default function OrderTracking({
  orderId,
  status,
  onReturn,
  requiresRx = false,
  prescriptionStatus = null,
}: {
  orderId: string;
  status: string;
  onReturn: (orderId: string, reason: string) => Promise<void>;
  requiresRx?: boolean;
  prescriptionStatus?: string | null;
}) {
  const cancelled = status === 'CANCELLED' || status === 'REFUNDED';
  const [open, setOpen] = useState(!cancelled && status !== 'DELIVERED');
  const [reason, setReason] = useState(RETURN_REASONS[0]);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const steps = buildSteps(status, requiresRx, prescriptionStatus);
  const rxHeld = requiresRx && prescriptionStatus !== 'APPROVED' && !cancelled;

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
            <>
              <ol className={styles.timeline}>
                {steps.map((step, i) => (
                  <li
                    key={step.label}
                    className={
                      step.state === 'done' ? styles.stepDone
                      : step.state === 'current' ? `${styles.stepDone} ${styles.stepCurrent}`
                      : step.state === 'blocked' ? styles.stepBlocked
                      : styles.stepTodo
                    }
                  >
                    <span className={styles.stepDot} aria-hidden="true">
                      {step.state === 'done' ? '✓' : step.state === 'blocked' ? '✕' : i + 1}
                    </span>
                    <span>{step.label}</span>
                  </li>
                ))}
              </ol>
              {rxHeld && prescriptionStatus !== 'REJECTED' ? (
                <p className={styles.rxNote}>A pharmacist is verifying your prescription — your order moves forward as soon as it is approved.</p>
              ) : null}
              {requiresRx && prescriptionStatus === 'REJECTED' ? (
                <p className={styles.rxNoteBlocked}>The pharmacist could not approve this prescription, so the order is on hold. The pharmacist&rsquo;s note is shown with your order above.</p>
              ) : null}
            </>
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
          {done ? <p className={styles.returnOk} role="status">✓ Return requested — our team will contact you about the pickup.</p> : null}
        </div>
      ) : null}
    </div>
  );
}
