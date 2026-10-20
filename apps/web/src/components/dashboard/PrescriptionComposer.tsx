'use client';

import { useEffect, useRef, useState } from 'react';
import styles from './PrescriptionComposer.module.css';
import { apiFetch } from '../../lib/auth/api';

export type MedicineSearchResult = {
  id: string;
  nameEn: string;
  brandName: string | null;
  genericName: string | null;
  strength: string | null;
  packSize: string | null;
  priceMinor: number;
  requiresRx: boolean;
  inStock: boolean;
};

type Row = {
  key: number;
  productId?: string;
  name: string;
  detail: string;
  dosage: string;
  frequency: string;
  durationDays: string;
  qty: string;
  notes: string;
};

let rowKey = 0;
const newRow = (seed: Partial<Row> = {}): Row => ({
  key: ++rowKey,
  name: '',
  detail: '',
  dosage: '',
  frequency: '',
  durationDays: '',
  qty: '1',
  notes: '',
  ...seed,
});

const FREQUENCIES = ['Once daily', 'Twice daily', 'Thrice daily', 'Every 8 hours', 'Every 12 hours', 'Once a week', 'As needed'];

/**
 * The doctor's prescription writer: search catalogue medicines (autocomplete),
 * add free-text rows for anything else, and capture dosage/frequency/duration.
 * Rows linked to a catalogue product are orderable in one tap by the patient.
 */
export default function PrescriptionComposer({
  appointmentId,
  token,
  onIssued,
  onCancel,
}: {
  appointmentId: string;
  token: string;
  onIssued: () => void;
  onCancel: () => void;
}) {
  const [diagnosis, setDiagnosis] = useState('');
  const [notes, setNotes] = useState('');
  const [rows, setRows] = useState<Row[]>([newRow()]);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<MedicineSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (searchTimer.current) clearTimeout(searchTimer.current); }, []);

  const runSearch = (term: string) => {
    setQuery(term);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (term.trim().length < 2) { setResults([]); setSearching(false); return; }
    setSearching(true);
    searchTimer.current = setTimeout(() => {
      void apiFetch<{ items: MedicineSearchResult[] }>(`/medicines?q=${encodeURIComponent(term.trim())}&pageSize=8`, { method: 'GET' }, token)
        .then((data) => setResults(data.items ?? []))
        .catch(() => setResults([]))
        .finally(() => setSearching(false));
    }, 300);
  };

  const addMatchedRow = (medicine: MedicineSearchResult) => {
    const detail = [medicine.strength, medicine.packSize].filter(Boolean).join(' · ');
    setRows((current) => [...current, newRow({ productId: medicine.id, name: medicine.nameEn, detail })]);
    setQuery('');
    setResults([]);
  };

  const addFreeTextRow = () => setRows((current) => [...current, newRow()]);

  const updateRow = (key: number, patch: Partial<Row>) =>
    setRows((current) => current.map((row) => (row.key === key ? { ...row, ...patch } : row)));

  const removeRow = (key: number) => setRows((current) => current.filter((row) => row.key !== key));

  const issue = async () => {
    setError('');
    const payloadRows = rows.filter((row) => row.name.trim().length >= 2);
    if (!payloadRows.length) { setError('Add at least one medicine with a name.'); return; }
    setBusy(true);
    try {
      await apiFetch('/prescriptions', {
        method: 'POST',
        body: JSON.stringify({
          appointmentId,
          diagnosis: diagnosis.trim() || undefined,
          notes: notes.trim() || undefined,
          items: payloadRows.map((row) => ({
            productId: row.productId || undefined,
            name: row.name.trim(),
            dosage: row.dosage.trim() || undefined,
            frequency: row.frequency || undefined,
            durationDays: row.durationDays ? Number(row.durationDays) : undefined,
            qty: Math.max(1, Number(row.qty) || 1),
            notes: row.notes.trim() || undefined,
          })),
        }),
      }, token);
      onIssued();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to issue the prescription.');
    } finally { setBusy(false); }
  };

  return (
    <div className={styles.composer} aria-label="Issue a prescription">
      <label className={styles.field}><span>Diagnosis</span><input value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} placeholder="e.g. Acute bacterial tonsillitis" maxLength={300} /></label>
      <label className={styles.field}><span>Notes for the patient (optional)</span><input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. Complete the full course. Come back in 5 days if fever persists." maxLength={500} /></label>

      <div className={styles.addRow}>
        <label className={styles.field} style={{ flex: 1 }}>
          <span>Find a medicine in our pharmacy</span>
          <input value={query} onChange={(e) => runSearch(e.target.value)} placeholder="Type a medicine name…" />
        </label>
        <button type="button" className={styles.secondaryButton} onClick={addFreeTextRow}>+ Free-text medicine</button>
      </div>
      {(searching || results.length) ? (
        <div className={styles.results} role="listbox" aria-label="Medicine search results">
          {searching ? <p className={styles.hint}>Searching…</p> : null}
          {results.map((medicine) => (
            <button type="button" key={medicine.id} className={styles.resultItem} onClick={() => addMatchedRow(medicine)}>
              <span><strong>{medicine.nameEn}</strong><small>{[medicine.brandName, medicine.strength, medicine.packSize].filter(Boolean).join(' · ') || medicine.genericName}</small></span>
              <span className={styles.resultMeta}>Rs. {(medicine.priceMinor / 100).toFixed(2)}{medicine.requiresRx ? ' · Rx' : ''}{medicine.inStock ? '' : ' · out of stock'}</span>
            </button>
          ))}
        </div>
      ) : null}

      <div className={styles.rows}>
        {rows.map((row) => (
          <div className={styles.row} key={row.key}>
            <div className={styles.rowHead}>
              <strong>{row.name || 'New medicine'}</strong>
              {row.productId ? <span className={styles.catalogueTag}>from pharmacy</span> : <span className={styles.freeTag}>free text</span>}
              <button type="button" className={styles.removeButton} onClick={() => removeRow(row.key)} aria-label="Remove medicine">×</button>
            </div>
            {!row.productId ? (
              <label className={styles.field}><span>Medicine name</span><input value={row.name} onChange={(e) => updateRow(row.key, { name: e.target.value })} placeholder="Medicine name" maxLength={160} /></label>
            ) : null}
            <div className={styles.rowGrid}>
              <label className={styles.field}><span>Dosage</span><input value={row.dosage} onChange={(e) => updateRow(row.key, { dosage: e.target.value })} placeholder="e.g. 500mg" maxLength={80} /></label>
              <label className={styles.field}><span>Frequency</span>
                <select value={row.frequency} onChange={(e) => updateRow(row.key, { frequency: e.target.value })}>
                  <option value="">Select…</option>
                  {FREQUENCIES.map((f) => <option key={f} value={f}>{f}</option>)}
                </select>
              </label>
              <label className={styles.field}><span>Duration (days)</span><input type="number" min={1} max={365} value={row.durationDays} onChange={(e) => updateRow(row.key, { durationDays: e.target.value.replace(/\D/g, '').slice(0, 3) })} placeholder="7" /></label>
              <label className={styles.field}><span>Qty</span><input type="number" min={1} max={50} value={row.qty} onChange={(e) => updateRow(row.key, { qty: e.target.value.replace(/\D/g, '').slice(0, 2) })} /></label>
            </div>
            <label className={styles.field}><span>Instructions (optional)</span><input value={row.notes} onChange={(e) => updateRow(row.key, { notes: e.target.value })} placeholder="e.g. After meals" maxLength={200} /></label>
          </div>
        ))}
      </div>

      {error ? <p className={styles.errorText} role="alert">{error}</p> : null}
      <div className={styles.actions}>
        <button type="button" className={styles.secondaryButton} onClick={onCancel} disabled={busy}>Cancel</button>
        <button type="button" className={styles.primaryButton} onClick={issue} disabled={busy}>{busy ? 'Issuing…' : 'Issue prescription'}</button>
      </div>
      <p className={styles.hint}>Only medicines linked from our pharmacy can be ordered in one tap by the patient. Free-text rows appear on the prescription but cannot be reordered automatically.</p>
    </div>
  );
}
