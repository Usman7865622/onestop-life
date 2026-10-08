'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import styles from './page.module.css';
import { apiFetch } from '../../lib/auth/api';
import { readAccessToken } from '../../lib/auth/session';
import { money, type Appointment } from '../../lib/doctors/types';

const statusLabels: Record<Appointment['status'], string> = {
  PENDING: 'Pending confirmation',
  CONFIRMED: 'Confirmed',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  NO_SHOW: 'No show',
};

export default function MyAppointmentsClient() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState('');

  const load = useCallback(async () => {
    const token = readAccessToken();
    if (!token) { setError('Please sign in on the home page to see your appointments.'); setLoading(false); return; }
    try {
      const data = await apiFetch<Appointment[]>('/appointments/mine', {}, token);
      setAppointments(data);
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load appointments.');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const cancel = async (id: string) => {
    const token = readAccessToken();
    if (!token) return;
    setBusyId(id);
    try {
      const updated = await apiFetch<Appointment>(`/appointments/${id}/cancel`, { method: 'PATCH' }, token);
      setAppointments((current) => current.map((a) => (a.id === id ? updated : a)));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not cancel this appointment.');
    } finally { setBusyId(''); }
  };

  if (loading) return <p className={styles.loading}>Loading your appointments…</p>;
  if (error && !appointments.length) return <section className={styles.emptyState}><h2>{error}</h2><p><Link className={styles.link} href="/#account">Go to sign in</Link> · <Link className={styles.link} href="/doctors">Browse doctors</Link></p></section>;

  return (
    <>
      {error ? <p className={styles.error} role="alert">{error}</p> : null}
      {appointments.length ? (
        <div className={styles.list}>
          {appointments.map((appt) => {
            const canCancel = appt.status === 'PENDING' || appt.status === 'CONFIRMED';
            return (
              <article className={styles.card} key={appt.id}>
                <div className={styles.cardMain}>
                  <p className={styles.doctorName}>{appt.doctorProfile.user.name ?? 'Doctor'} · {appt.doctorProfile.speciality}</p>
                  <p className={styles.meta}>{new Date(appt.startsAt).toLocaleString('en-PK', { dateStyle: 'medium', timeStyle: 'short' })} · {appt.type === 'VIDEO' ? 'Video consultation' : appt.facility ? `${appt.facility.name}, ${appt.facility.city}` : 'In-person'}</p>
                  <p className={styles.meta}>Patient: {appt.patientName} · {appt.patientPhone}{appt.reason ? ` · ${appt.reason}` : ''}</p>
                </div>
                <div className={styles.cardSide}>
                  <span className={styles.status} data-status={appt.status}>{statusLabels[appt.status]}</span>
                  <strong>{money(appt.feeMinor)}</strong>
                  {canCancel ? <button className={styles.cancelButton} onClick={() => cancel(appt.id)} disabled={busyId === appt.id}>{busyId === appt.id ? 'Cancelling…' : 'Cancel'}</button> : null}
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <section className={styles.emptyState}><h2>No appointments yet</h2><p>When you book a doctor, your visits will show up here.</p><Link className={styles.primaryLink} href="/doctors">Find a doctor</Link></section>
      )}
    </>
  );
}
