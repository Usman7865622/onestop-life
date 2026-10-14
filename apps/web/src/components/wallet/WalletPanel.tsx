'use client';

import { useEffect, useState } from 'react';
import styles from './wallet.module.css';

function money(minor: number) {
  return `Rs. ${(minor / 100).toFixed(2)}`;
}

type Tx = { id: string; amountMinor: number; type: string; reference?: string | null; createdAt: string };

export default function WalletPanel({ token }: { token: string | null }) {
  const [balance, setBalance] = useState<number | null>(null);
  const [txs, setTxs] = useState<Tx[]>([]);
  const [amount, setAmount] = useState('1000');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const load = () => {
    if (!token) return;
    fetch('/api/wallet', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (d && typeof d.balanceMinor === 'number') setBalance(d.balanceMinor); })
      .catch(() => {});
    fetch('/api/wallet/transactions', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.ok ? r.json() : [])
      .then((d) => { if (Array.isArray(d)) setTxs(d); })
      .catch(() => {});
  };

  useEffect(load, [token]);

  const topup = async () => {
    if (!token) { setError('Sign in to top up your wallet.'); return; }
    const minor = Math.round(Number(amount) * 100);
    if (!minor || minor <= 0) { setError('Enter a valid amount.'); return; }
    setBusy(true); setError(''); setMessage('');
    try {
      const res = await fetch('/api/wallet/topup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ amountMinor: minor }),
      });
      const payload = await res.json() as { balanceMinor?: number; message?: string | string[] };
      if (!res.ok) throw new Error(Array.isArray(payload.message) ? payload.message.join(', ') : payload.message ?? 'Top-up failed');
      setBalance(payload.balanceMinor ?? null);
      setMessage(`Wallet topped up — new balance ${money(payload.balanceMinor ?? 0)}.`);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Top-up failed');
    } finally { setBusy(false); }
  };

  if (!token) return null;

  return (
    <section className={styles.wallet} aria-labelledby="wallet-heading">
      <h3 id="wallet-heading">OneStop Wallet</h3>
      <div className={styles.walletRow}>
        <div className={styles.balance}>
          <span>Balance</span>
          <strong>{balance === null ? '…' : money(balance)}</strong>
        </div>
        <div className={styles.topup}>
          <label><span>Top up (Rs.)</span>
            <input value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))} inputMode="numeric" placeholder="1000" />
          </label>
          <button type="button" onClick={topup} disabled={busy}>{busy ? 'Adding…' : 'Top up'}</button>
        </div>
      </div>
      <p className={styles.note}>Test mode — top-ups are simulated. Use your wallet at checkout; refunds land here as store credit.</p>
      {message ? <p className={styles.ok} role="status">{message}</p> : null}
      {error ? <p className={styles.err} role="alert">{error}</p> : null}
      {txs.length ? (
        <ul className={styles.txList}>
          {txs.slice(0, 8).map((tx) => (
            <li key={tx.id}>
              <span>{tx.type === 'TOPUP' ? 'Top-up' : tx.type === 'PURCHASE' ? 'Order payment' : 'Refund'}</span>
              <b className={tx.amountMinor < 0 ? styles.out : styles.in}>{tx.amountMinor < 0 ? '−' : '+'}{money(Math.abs(tx.amountMinor))}</b>
              <small>{new Date(tx.createdAt).toLocaleDateString('en-PK')}</small>
            </li>
          ))}
        </ul>
      ) : <p className={styles.empty}>No wallet activity yet.</p>}
    </section>
  );
}
