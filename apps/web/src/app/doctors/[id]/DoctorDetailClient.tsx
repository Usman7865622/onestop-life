'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import styles from './detail.module.css';
import listStyles from '../page.module.css';
import { apiFetch } from '../../../lib/auth/api';
import { readAccessToken } from '../../../lib/auth/session';
import { money, type Appointment, type Doctor } from '../../../lib/doctors/types';

function toIso(date: string, time: string) {
  return new Date(`${date}T${time}:00`).toISOString();
}

export default function DoctorDetailClient({ doctor }: { doctor: Doctor }) {
  const [date, setDate] = useState('');
  const [time, setTime] = useState('10:00');
  const [type, setType] = useState<'IN_PERSON' | 'VIDEO'>('IN_PERSON');
  const [reason, setReason] = useState('');
  const [patientName, setPatientName] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [facilityId, setFacilityId] = useState(doctor.facilities[0]?.facility.id ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState<Appointment | null>(null);

  const minDate = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const facility = doctor.facilities.find((f) => f.facility.id === facilityId)?.facility ?? doctor.facilities[0]?.facility;

  const book = async () => {
    setError('');
    const token = readAccessToken();
    if (!token) { setError('Please sign in on the home page first, then come back to book.'); return; }
    if (!date || !time) { setError('Choose a date and time for your appointment.'); return; }
    if (!patientName.trim() || !patientPhone.trim()) { setError('Add the patient name and phone number.'); return; }
    const startsAt = toIso(date, time);
    const endsAt = new Date(new Date(startsAt).getTime() + 30 * 60 * 1000).toISOString();
    if (new Date(startsAt) <= new Date()) { setError('Choose a future date and time.'); return; }
    setBusy(true);
    try {
      const appt = await apiFetch<Appointment>('/appointments', {
        method: 'POST',
        body: JSON.stringify({
          doctorProfileId: doctor.id,
          facilityId: type === 'IN_PERSON' && facilityId ? facilityId : undefined,
          startsAt, endsAt, type, reason: reason.trim() || undefined,
          patientName: patientName.trim(), patientPhone: patientPhone.trim(),
        }),
      }, token);
      setSuccess(appt);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not book this appointment. Try another time.');
    } finally { setBusy(false); }
  };

  if (success) {
    return (
      <section className={styles.successCard}>
        <span className={styles.successIcon}>✓</span>
        <h2>Appointment requested</h2>
        <p>Your appointment with <strong>{doctor.user.name}</strong> is <strong>{success.status}</strong> for {new Date(success.startsAt).toLocaleString('en-PK')}.</p>
        <p>Fee: {money(success.feeMinor)} · {success.type === 'VIDEO' ? 'Video consultation' : 'In-person visit'} · Patient: {success.patientName}</p>
        <p className={styles.successNote}>The clinic will confirm shortly. You can view or cancel it any time.</p>
        <div className={styles.successActions}><Link className={styles.primaryButton} href="/appointments">View my appointments</Link><Link href="/doctors">Book another doctor</Link></div>
      </section>
    );
  }

  return (
    <div className={styles.layout}>
      <section className={styles.profileCard}>
        <div className={listStyles.cardTop}>
          <div className={listStyles.avatar} aria-hidden="true">{(doctor.user.name ?? 'D').replace('Dr. ', '').slice(0, 1)}</div>
          <div><h1 className={styles.doctorName}>{doctor.user.name ?? 'Doctor'}</h1><p className={listStyles.speciality}>{doctor.speciality}</p>{doctor.qualifications ? <p className={listStyles.qual}>{doctor.qualifications}</p> : null}</div>
          <span className={listStyles.verified}>✓ Verified</span>
        </div>
        <div className={listStyles.meta}><span>{doctor.experienceYears} yrs experience</span><span>{doctor.languages.join(' · ')}</span></div>
        {doctor.about ? <p className={styles.about}>{doctor.about}</p> : null}
        <div className={styles.facilityList}>
          <h3>Clinic locations</h3>
          {doctor.facilities.length ? doctor.facilities.map(({ facility: f }) => (
            <p key={f.id}><strong>{f.name}</strong><br />{f.address}, {f.city}{f.timings ? <><br />{f.timings}</> : null}</p>
          )) : <p>Video consultation only.</p>}
        </div>
        <div className={styles.feeBox}><span>Consultation fee</span><strong>{money(doctor.feeMinor)}</strong><small>Pay at clinic or as instructed after confirmation. No booking fee.</small></div>
      </section>

      <section className={styles.bookingCard} aria-labelledby="book-heading">
        <h2 id="book-heading">Book appointment</h2>
        {error ? <p className={styles.error} role="alert">{error}</p> : null}
        <label className={styles.field}><span>Visit type</span><select value={type} onChange={(e) => setType(e.target.value as 'IN_PERSON' | 'VIDEO')}><option value="IN_PERSON">In-person at clinic</option><option value="VIDEO">Video consultation</option></select></label>
        {type === 'IN_PERSON' && doctor.facilities.length ? (
          <label className={styles.field}><span>Clinic</span><select value={facilityId} onChange={(e) => setFacilityId(e.target.value)}>{doctor.facilities.map(({ facility: f }) => <option key={f.id} value={f.id}>{f.name} — {f.city}</option>)}</select></label>
        ) : null}
        {facility && type === 'IN_PERSON' ? <p className={styles.hint}>{facility.address}, {facility.city}</p> : null}
        <div className={styles.twoCol}>
          <label className={styles.field}><span>Date</span><input type="date" min={minDate} value={date} onChange={(e) => setDate(e.target.value)} /></label>
          <label className={styles.field}><span>Time</span><input type="time" value={time} onChange={(e) => setTime(e.target.value)} /></label>
        </div>
        <label className={styles.field}><span>Patient name</span><input value={patientName} onChange={(e) => setPatientName(e.target.value)} placeholder="e.g. Muhammad Usman" autoComplete="name" /></label>
        <label className={styles.field}><span>Patient phone</span><input value={patientPhone} onChange={(e) => setPatientPhone(e.target.value)} placeholder="0300 1234567" autoComplete="tel" /></label>
        <label className={styles.field}><span>Reason for visit (optional)</span><textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Briefly describe your concern" /></label>
        <button className={styles.primaryButton} onClick={book} disabled={busy}>{busy ? 'Booking…' : `Confirm booking · ${money(doctor.feeMinor)}`}</button>
        <p className={styles.hint}>By booking you agree to arrive 10 minutes early for in-person visits. Free cancellation before confirmation.</p>
      </section>
    </div>
  );
}
