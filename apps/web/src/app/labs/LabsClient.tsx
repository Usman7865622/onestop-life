'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import styles from './page.module.css';
import { apiFetch } from '../../lib/auth/api';
import { readAccessToken } from '../../lib/auth/session';
import { money } from '../../lib/doctors/types';
import { formatWhen, reportTimeLabel, type LabBooking, type LabTest } from '../../lib/health/types';

const statusLabels: Record<LabBooking['status'], string> = {
  BOOKED: 'Collection booked',
  SAMPLE_COLLECTED: 'Sample collected',
  REPORT_READY: 'Report ready',
  DELIVERED: 'Report delivered',
  CANCELLED: 'Cancelled',
};

function FlaskIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
      <path d="M10 3h4M10 3v5.2L5.4 17a2.4 2.4 0 0 0 2.1 3.5h9a2.4 2.4 0 0 0 2.1-3.5L14 8.2V3M8 15h8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function LabsClient({ tests }: { tests: LabTest[] }) {
  const [search, setSearch] = useState('');
  const [facilityId, setFacilityId] = useState('all');
  const [selected, setSelected] = useState<LabTest | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [bookings, setBookings] = useState<LabBooking[]>([]);
  const [bookingsLoaded, setBookingsLoaded] = useState(false);

  const [scheduledAt, setScheduledAt] = useState('');
  const [address, setAddress] = useState('');
  const [patientName, setPatientName] = useState('');
  const [phone, setPhone] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [busyBookingId, setBusyBookingId] = useState('');

  const facilities = useMemo(() => {
    const map = new Map<string, LabTest['facility']>();
    tests.forEach((test) => map.set(test.facilityId, test.facility));
    return Array.from(map.values());
  }, [tests]);

  const visible = useMemo(() => tests.filter((test) => {
    const text = `${test.name} ${test.code} ${test.sampleType} ${test.facility.name} ${test.facility.city}`.toLowerCase();
    const matchesSearch = !search.trim() || text.includes(search.trim().toLowerCase());
    const matchesFacility = facilityId === 'all' || test.facilityId === facilityId;
    return matchesSearch && matchesFacility;
  }), [facilityId, search, tests]);

  const loadBookings = useCallback(async (accessToken: string) => {
    try {
      const data = await apiFetch<LabBooking[]>('/lab-bookings/mine', { method: 'GET' }, accessToken);
      setBookings(data);
    } catch {
      // Bookings panel simply stays empty; browsing tests still works.
    } finally {
      setBookingsLoaded(true);
    }
  }, []);

  useEffect(() => {
    const stored = readAccessToken();
    setToken(stored);
    if (stored) void loadBookings(stored);
    else setBookingsLoaded(true);
  }, [loadBookings]);

  const submitBooking = async () => {
    if (!selected || !token) return;
    setBusy(true);
    setError('');
    setSuccess('');
    try {
      const created = await apiFetch<LabBooking>('/lab-bookings', {
        method: 'POST',
        body: JSON.stringify({
          testId: selected.id,
          scheduledAt: new Date(scheduledAt).toISOString(),
          address: address.trim(),
          patientName: patientName.trim(),
          phone: phone.trim(),
        }),
      }, token);
      setBookings((current) => [created, ...current]);
      setSuccess(`Booked! ${created.test.name} — our team will collect the sample from ${created.address} on ${formatWhen(created.scheduledAt)}.`);
      setSelected(null);
      setScheduledAt('');
      setAddress('');
      setPatientName('');
      setPhone('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not book this test. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const cancelBooking = async (id: string) => {
    if (!token) return;
    setBusyBookingId(id);
    try {
      const updated = await apiFetch<LabBooking>(`/lab-bookings/${id}/cancel`, { method: 'PATCH' }, token);
      setBookings((current) => current.map((b) => (b.id === id ? updated : b)));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not cancel this booking.');
    } finally {
      setBusyBookingId('');
    }
  };

  const formReady = Boolean(scheduledAt && address.trim().length >= 5 && patientName.trim().length >= 2 && phone.trim().length >= 10);

  return (
    <>
      <section className={styles.searchPanel} aria-label="Find a lab test">
        <label className={`${styles.filterField} ${styles.searchField}`}>
          <span>Search tests</span>
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Try CBC, diabetes, vitamin D, dengue…" />
        </label>
        <label className={styles.filterField}>
          <span>Lab</span>
          <select value={facilityId} onChange={(event) => setFacilityId(event.target.value)}>
            <option value="all">All labs</option>
            {facilities.map((facility) => <option key={facility.id} value={facility.id}>{facility.name} · {facility.city}</option>)}
          </select>
        </label>
      </section>

      <div className={styles.resultsHeader}>
        <p className={styles.resultCount}>{visible.length} {visible.length === 1 ? 'test' : 'tests'} available</p>
        {(search || facilityId !== 'all') ? <button type="button" className={styles.clearButton} onClick={() => { setSearch(''); setFacilityId('all'); }}>Clear filters</button> : null}
      </div>

      {error ? <p className={styles.error} role="alert">{error}</p> : null}
      {success ? <p className={styles.success} role="status">{success}</p> : null}

      {selected ? (
        <section className={styles.bookingPanel} aria-label="Book home sample collection">
          <div className={styles.bookingHead}>
            <div>
              <p className={styles.bookingKicker}>Home sample collection</p>
              <h2>{selected.name}</h2>
              <p>{selected.facility.name} · {selected.facility.address}, {selected.facility.city} — <strong>{money(selected.priceMinor)}</strong></p>
            </div>
            <button type="button" className={styles.closeButton} onClick={() => setSelected(null)}>Close</button>
          </div>
          {token ? (
            <div className={styles.bookingForm}>
              <label className={styles.field}><span>Collection date & time</span><input type="datetime-local" value={scheduledAt} onChange={(event) => setScheduledAt(event.target.value)} /></label>
              <label className={styles.field}><span>Home address</span><input value={address} onChange={(event) => setAddress(event.target.value)} placeholder="House, street, area, city" /></label>
              <label className={styles.field}><span>Patient name</span><input value={patientName} onChange={(event) => setPatientName(event.target.value)} placeholder="Who is the test for?" /></label>
              <label className={styles.field}><span>Mobile number</span><input type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="03xx xxxxxxx" /></label>
              <button type="button" className={styles.confirmButton} onClick={submitBooking} disabled={busy || !formReady}>{busy ? 'Booking…' : `Confirm booking · ${money(selected.priceMinor)}`}</button>
            </div>
          ) : (
            <p className={styles.signInNote}>Please <Link href="/login">sign in</Link> to book home sample collection.</p>
          )}
        </section>
      ) : null}

      {visible.length ? (
        <div className={styles.grid}>
          {visible.map((test) => (
            <article className={styles.card} key={test.id}>
              <div className={styles.cardTop}>
                <div className={styles.testIcon} aria-hidden="true"><FlaskIcon /></div>
                <div className={styles.cardTitle}>
                  <h3>{test.name}</h3>
                  <p className={styles.code}>{test.code} · {test.facility.city}</p>
                </div>
                <span className={styles.sampleBadge}>{test.sampleType} sample</span>
              </div>
              <div className={styles.quickStats}>
                <span>{reportTimeLabel(test.reportHours)}</span>
                <span>Home collection</span>
                <span>{test.facility.name}</span>
              </div>
              <div className={styles.cardFooter}>
                <div className={styles.fee}><strong>{money(test.priceMinor)}</strong><span>All inclusive</span></div>
                <button type="button" className={styles.bookButton} onClick={() => { setSelected(test); setError(''); setSuccess(''); }}>Book home collection</button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <section className={styles.emptyState}>
          <div className={styles.emptyIcon}><FlaskIcon /></div>
          <h2>No tests match your search</h2>
          <p>Try a different test name, or clear the filters to see every available test.</p>
        </section>
      )}

      {token && bookingsLoaded ? (
        <section className={styles.mySection} aria-label="My lab bookings">
          <div className={styles.myHeader}>
            <h2>My lab bookings</h2>
            <Link className={styles.clearButton} href="/dashboard">Open dashboard</Link>
          </div>
          {bookings.length ? (
            <div className={styles.bookingList}>
              {bookings.map((booking) => {
                const canCancel = booking.status === 'BOOKED' || booking.status === 'SAMPLE_COLLECTED';
                return (
                  <article className={styles.bookingRow} key={booking.id}>
                    <div>
                      <strong>{booking.test.name}</strong>
                      <span>{formatWhen(booking.scheduledAt)} · {booking.address}</span>
                      <span>{booking.facility.name} · {money(booking.test.priceMinor)}</span>
                    </div>
                    <div className={styles.bookingActions}>
                      <span className={styles.statusPill}>{statusLabels[booking.status]}</span>
                      {canCancel ? <button type="button" className={styles.cancelButton} onClick={() => cancelBooking(booking.id)} disabled={busyBookingId === booking.id}>{busyBookingId === booking.id ? 'Cancelling…' : 'Cancel'}</button> : null}
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <p className={styles.emptyNote}>No lab bookings yet. Pick a test above and we will collect the sample from your home.</p>
          )}
        </section>
      ) : null}
    </>
  );
}
