'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import styles from './page.module.css';
import { apiFetch } from '../../lib/auth/api';
import { readAccessToken } from '../../lib/auth/session';
import type { Facility } from '../../lib/doctors/types';
import { BLOOD_GROUP_LABELS, formatWhen, type BloodGroupCode, type MyBloodRequest, type PublicBloodRequest } from '../../lib/health/types';

const BLOOD_GROUPS = Object.keys(BLOOD_GROUP_LABELS) as BloodGroupCode[];
const URGENCIES = ['NORMAL', 'URGENT', 'CRITICAL'] as const;

const myStatusLabels: Record<MyBloodRequest['status'], string> = {
  OPEN: 'Open',
  FULFILLED: 'Fulfilled',
  CANCELLED: 'Cancelled',
};

function DropIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
      <path d="M12 3.5c2.8 3.4 6 7.4 6 10.6a6 6 0 1 1-12 0C6 10.9 9.2 6.9 12 3.5Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M9.2 14.2a3.1 3.1 0 0 0 2.3 3.4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

export default function BloodClient({ banks, initialRequests }: { banks: Facility[]; initialRequests: PublicBloodRequest[] }) {
  const [bankCity, setBankCity] = useState('All cities');
  const [boardGroup, setBoardGroup] = useState('all');
  const [boardCity, setBoardCity] = useState('');
  const [requests, setRequests] = useState<PublicBloodRequest[]>(initialRequests);
  const [token, setToken] = useState<string | null>(null);
  const [mine, setMine] = useState<MyBloodRequest[]>([]);

  const [bloodGroup, setBloodGroup] = useState<BloodGroupCode>('O_POS');
  const [units, setUnits] = useState('1');
  const [city, setCity] = useState('');
  const [hospitalName, setHospitalName] = useState('');
  const [urgency, setUrgency] = useState<(typeof URGENCIES)[number]>('NORMAL');
  const [contactPhone, setContactPhone] = useState('');
  const [busy, setBusy] = useState(false);
  const [busyRequestId, setBusyRequestId] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const bankCities = useMemo(() => ['All cities', ...Array.from(new Set(banks.map((bank) => bank.city))).sort()], [banks]);
  const visibleBanks = useMemo(() => (bankCity === 'All cities' ? banks : banks.filter((bank) => bank.city === bankCity)), [bankCity, banks]);
  const visibleRequests = useMemo(() => requests.filter((request) => {
    const matchesGroup = boardGroup === 'all' || request.bloodGroup === boardGroup;
    const matchesCity = !boardCity.trim() || request.city.toLowerCase().includes(boardCity.trim().toLowerCase());
    return matchesGroup && matchesCity;
  }), [boardCity, boardGroup, requests]);

  const loadBoard = useCallback(async () => {
    try {
      const data = await apiFetch<{ items: PublicBloodRequest[] }>('/blood-requests', { method: 'GET' });
      setRequests(data.items ?? []);
    } catch {
      // Keep the server-rendered board if refresh fails.
    }
  }, []);

  const loadMine = useCallback(async (accessToken: string) => {
    try {
      const data = await apiFetch<MyBloodRequest[]>('/blood-requests/mine', { method: 'GET' }, accessToken);
      setMine(data);
    } catch {
      // Personal panel stays empty; public board still works.
    }
  }, []);

  useEffect(() => {
    const stored = readAccessToken();
    setToken(stored);
    if (stored) void loadMine(stored);
  }, [loadMine]);

  const formReady = Boolean(city.trim().length >= 2 && contactPhone.trim().length >= 10 && Number(units) >= 1);

  const submitRequest = async () => {
    if (!token) return;
    setBusy(true);
    setError('');
    setSuccess('');
    try {
      const created = await apiFetch<MyBloodRequest>('/blood-requests', {
        method: 'POST',
        body: JSON.stringify({
          bloodGroup,
          units: Number(units),
          city: city.trim(),
          hospitalName: hospitalName.trim() || undefined,
          urgency,
          contactPhone: contactPhone.trim(),
        }),
      }, token);
      setMine((current) => [created, ...current]);
      setSuccess(`Request posted for ${BLOOD_GROUP_LABELS[created.bloodGroup]} (${created.units} unit${created.units === 1 ? '' : 's'}) in ${created.city}. Donors can now see it on the board below.`);
      setUnits('1');
      setHospitalName('');
      setUrgency('NORMAL');
      void loadBoard();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not post your request. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const cancelRequest = async (id: string) => {
    if (!token) return;
    setBusyRequestId(id);
    try {
      const updated = await apiFetch<MyBloodRequest>(`/blood-requests/${id}/cancel`, { method: 'PATCH' }, token);
      setMine((current) => current.map((r) => (r.id === id ? updated : r)));
      void loadBoard();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not cancel this request.');
    } finally {
      setBusyRequestId('');
    }
  };

  return (
    <>
      {error ? <p className={styles.error} role="alert">{error}</p> : null}
      {success ? <p className={styles.success} role="status">{success}</p> : null}

      <section className={styles.section} aria-label="Request blood">
        <div className={styles.sectionHead}>
          <div>
            <p className={styles.kicker}>Need blood?</p>
            <h2>Request blood</h2>
            <p>Post your requirement and it appears on the public board instantly.</p>
          </div>
        </div>
        {token ? (
          <div className={styles.requestForm}>
            <label className={styles.field}><span>Blood group</span>
              <select value={bloodGroup} onChange={(event) => setBloodGroup(event.target.value as BloodGroupCode)}>
                {BLOOD_GROUPS.map((group) => <option key={group} value={group}>{BLOOD_GROUP_LABELS[group]}</option>)}
              </select>
            </label>
            <label className={styles.field}><span>Units needed</span><input type="number" min={1} max={20} value={units} onChange={(event) => setUnits(event.target.value)} /></label>
            <label className={styles.field}><span>City</span><input value={city} onChange={(event) => setCity(event.target.value)} placeholder="e.g. Lahore" /></label>
            <label className={styles.field}><span>Hospital (optional)</span><input value={hospitalName} onChange={(event) => setHospitalName(event.target.value)} placeholder="Where is the patient admitted?" /></label>
            <label className={styles.field}><span>Urgency</span>
              <select value={urgency} onChange={(event) => setUrgency(event.target.value as (typeof URGENCIES)[number])}>
                {URGENCIES.map((level) => <option key={level} value={level}>{level.charAt(0) + level.slice(1).toLowerCase()}</option>)}
              </select>
            </label>
            <label className={styles.field}><span>Your mobile (kept private)</span><input type="tel" value={contactPhone} onChange={(event) => setContactPhone(event.target.value)} placeholder="03xx xxxxxxx" /></label>
            <button type="button" className={styles.submitButton} onClick={submitRequest} disabled={busy || !formReady}>{busy ? 'Posting…' : 'Post blood request'}</button>
          </div>
        ) : (
          <p className={styles.signInNote}>Please <Link href="/login">sign in</Link> to post a blood request. Browsing banks and the requests board is open to everyone.</p>
        )}

        {token && mine.length ? (
          <div className={styles.myList}>
            <h3>My blood requests</h3>
            {mine.map((request) => (
              <article className={styles.myRow} key={request.id}>
                <span className={styles.groupBadge} aria-hidden="true">{BLOOD_GROUP_LABELS[request.bloodGroup]}</span>
                <div className={styles.myMeta}>
                  <strong>{request.units} unit{request.units === 1 ? '' : 's'} · {request.city}{request.hospitalName ? ` · ${request.hospitalName}` : ''}</strong>
                  <span>{request.urgency.toLowerCase()} · posted {formatWhen(request.createdAt)}</span>
                </div>
                <span className={styles.statusPill}>{myStatusLabels[request.status]}</span>
                {request.status === 'OPEN' ? <button type="button" className={styles.cancelButton} onClick={() => cancelRequest(request.id)} disabled={busyRequestId === request.id}>{busyRequestId === request.id ? 'Cancelling…' : 'Cancel'}</button> : null}
              </article>
            ))}
          </div>
        ) : null}
      </section>

      <section className={styles.section} aria-label="Blood banks">
        <div className={styles.sectionHead}>
          <div>
            <p className={styles.kicker}>Verified facilities</p>
            <h2>Blood banks near you</h2>
            <p>Screened blood banks with emergency availability.</p>
          </div>
          <label className={styles.inlineField}><span>City</span>
            <select value={bankCity} onChange={(event) => setBankCity(event.target.value)}>{bankCities.map((item) => <option key={item}>{item}</option>)}</select>
          </label>
        </div>
        {visibleBanks.length ? (
          <div className={styles.bankGrid}>
            {visibleBanks.map((bank) => (
              <article className={styles.bankCard} key={bank.id}>
                <div className={styles.bankTop}>
                  <div className={styles.dropIcon} aria-hidden="true"><DropIcon /></div>
                  <div>
                    <h3>{bank.name}</h3>
                    <p>{bank.address}, {bank.city}</p>
                  </div>
                  {bank.isEmergency ? <span className={styles.emergencyBadge}>24/7 Emergency</span> : null}
                </div>
                <div className={styles.quickStats}>
                  <span>{bank.timings ?? 'Call for timings'}</span>
                  <span>{bank.city}</span>
                </div>
                {bank.phone ? <a className={styles.callButton} href={`tel:${bank.phone}`}>Call {bank.phone}</a> : null}
              </article>
            ))}
          </div>
        ) : (
          <p className={styles.emptyNote}>No blood banks listed for this city yet. More partner banks are joining soon.</p>
        )}
      </section>

      <section className={styles.section} aria-label="Open blood requests">
        <div className={styles.sectionHead}>
          <div>
            <p className={styles.kicker}>Community board</p>
            <h2>Open blood requests</h2>
            <p>Patients looking for donors right now. Contact numbers stay private for safety.</p>
          </div>
          <div className={styles.boardFilters}>
            <label className={styles.inlineField}><span>Group</span>
              <select value={boardGroup} onChange={(event) => setBoardGroup(event.target.value)}>
                <option value="all">All groups</option>
                {BLOOD_GROUPS.map((group) => <option key={group} value={group}>{BLOOD_GROUP_LABELS[group]}</option>)}
              </select>
            </label>
            <label className={styles.inlineField}><span>City</span><input value={boardCity} onChange={(event) => setBoardCity(event.target.value)} placeholder="Any city" /></label>
          </div>
        </div>
        {visibleRequests.length ? (
          <div className={styles.requestGrid}>
            {visibleRequests.map((request) => (
              <article className={styles.requestCard} key={request.id}>
                <span className={styles.groupBadgeLarge} aria-hidden="true">{BLOOD_GROUP_LABELS[request.bloodGroup]}</span>
                <div className={styles.requestMeta}>
                  <strong>{request.units} unit{request.units === 1 ? '' : 's'} needed · {request.city}</strong>
                  <span>{request.hospitalName ?? 'Hospital not specified'}</span>
                  <span>Posted {formatWhen(request.createdAt)}</span>
                </div>
                <span className={request.urgency === 'CRITICAL' ? `${styles.urgencyPill} ${styles.urgencyCritical}` : request.urgency === 'URGENT' ? `${styles.urgencyPill} ${styles.urgencyUrgent}` : styles.urgencyPill}>{request.urgency.toLowerCase()}</span>
              </article>
            ))}
          </div>
        ) : (
          <p className={styles.emptyNote}>No open requests match right now. When a patient posts a request, it will appear here immediately.</p>
        )}
      </section>
    </>
  );
}
