'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import styles from './detail.module.css';
import { apiFetch } from '../../../lib/auth/api';
import { readAccessToken } from '../../../lib/auth/session';
import DoctorAvatar from '../../../components/doctors/DoctorAvatar';
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
  const facility = doctor.facilities.find((item) => item.facility.id === facilityId)?.facility ?? doctor.facilities[0]?.facility;

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
        <p className={styles.successKicker}>Booking request received</p>
        <h2>Appointment requested</h2>
        <p>Your appointment with <strong>{doctor.user.name}</strong> is <strong>{success.status}</strong> for {new Date(success.startsAt).toLocaleString('en-PK')}.</p>
        <div className={styles.successGrid}>
          <span><strong>{money(success.feeMinor)}</strong>Fee</span>
          <span><strong>{success.type === 'VIDEO' ? 'Video' : 'In-person'}</strong>Visit type</span>
          <span><strong>{success.patientName}</strong>Patient</span>
        </div>
        <p className={styles.successNote}>The clinic will confirm shortly. You can view, reschedule help or cancel from My Appointments.</p>
        <div className={styles.successActions}><Link className={styles.primaryButton} href="/appointments">View my appointments</Link><Link className={styles.secondaryLink} href="/doctors">Book another doctor</Link></div>
      </section>
    );
  }

  return (
    <div className={styles.layout}>
      <div className={styles.mainColumn}>
        <section className={styles.profileHero}>
          <div className={styles.profileTop}>
            <DoctorAvatar name={doctor.user.name} size={92} className={styles.avatar} />
            <div className={styles.identity}>
              <div className={styles.nameRow}>
                <h1>{doctor.user.name ?? 'Doctor'}</h1>
                <span className={styles.verified}>Verified doctor</span>
              </div>
              <p className={styles.speciality}>{doctor.speciality}</p>
              {doctor.qualifications ? <p className={styles.qual}>{doctor.qualifications}</p> : null}
              <div className={styles.badgeRow}>
                <span>{doctor.experienceYears} years experience</span>
                <span>{doctor.languages.join(' · ')}</span>
                <span>In-person & video</span>
              </div>
            </div>
          </div>
          <div className={styles.profileStats}>
            <div><strong>{money(doctor.feeMinor)}</strong><span>Consultation fee</span></div>
            <div><strong>30 min</strong><span>Standard visit</span></div>
            <div><strong>{doctor.facilities.length || 'Video'}</strong><span>Clinic option{doctor.facilities.length === 1 ? '' : 's'}</span></div>
          </div>
        </section>

        <section className={styles.sectionCard}>
          <h2>About {doctor.user.name ?? 'this doctor'}</h2>
          <p>{doctor.about || 'Experienced specialist providing careful diagnosis, clear treatment plans and follow-up guidance.'}</p>
          <div className={styles.infoGrid}>
            <div><span>Speciality</span><strong>{doctor.speciality}</strong></div>
            <div><span>Qualifications</span><strong>{doctor.qualifications || 'MBBS'}</strong></div>
            <div><span>Experience</span><strong>{doctor.experienceYears} years</strong></div>
            <div><span>Languages</span><strong>{doctor.languages.join(', ')}</strong></div>
          </div>
        </section>

        <section className={styles.sectionCard}>
          <div className={styles.sectionHeader}><h2>Clinic locations</h2><span>Choose a clinic when booking in-person</span></div>
          {doctor.facilities.length ? (
            <div className={styles.facilityGrid}>
              {doctor.facilities.map(({ facility: item }) => (
                <article className={styles.facilityCard} key={item.id}>
                  <div className={styles.facilityHeader}><strong>{item.name}</strong>{item.isEmergency ? <span>Emergency</span> : null}</div>
                  <p>{item.address}, {item.city}</p>
                  {item.timings ? <p><strong>Timings:</strong> {item.timings}</p> : null}
                  {item.phone ? <p><strong>Phone:</strong> {item.phone}</p> : null}
                </article>
              ))}
            </div>
          ) : <p className={styles.muted}>This doctor is currently available for video consultation only.</p>}
        </section>

        <section className={styles.sectionCard}>
          <h2>Good to know before your visit</h2>
          <ul className={styles.checkList}>
            <li>Arrive 10 minutes early for in-person appointments and bring previous reports if available.</li>
            <li>For video visits, keep your phone charged and sit in a quiet, well-lit place.</li>
            <li>No booking fee is charged by OneStop Life. Pay the consultation fee at the clinic or as instructed.</li>
          </ul>
        </section>
      </div>

      <aside className={styles.bookingCard} aria-labelledby="book-heading">
        <div className={styles.bookingHeader}>
          <p>Book appointment</p>
          <h2 id="book-heading">{money(doctor.feeMinor)}</h2>
          <span>Consultation fee · No booking charges</span>
        </div>

        {error ? <p className={styles.error} role="alert">{error}</p> : null}

        <div className={styles.segmented} role="group" aria-label="Visit type">
          <button type="button" className={type === 'IN_PERSON' ? styles.segmentActive : styles.segment} onClick={() => setType('IN_PERSON')}>In-person</button>
          <button type="button" className={type === 'VIDEO' ? styles.segmentActive : styles.segment} onClick={() => setType('VIDEO')}>Video</button>
        </div>

        {type === 'IN_PERSON' && doctor.facilities.length ? (
          <label className={styles.field}><span>Clinic</span><select value={facilityId} onChange={(event) => setFacilityId(event.target.value)}>{doctor.facilities.map(({ facility: item }) => <option key={item.id} value={item.id}>{item.name} — {item.city}</option>)}</select></label>
        ) : null}
        {facility && type === 'IN_PERSON' ? <p className={styles.hint}>{facility.address}, {facility.city}{facility.timings ? ` · ${facility.timings}` : ''}</p> : null}
        {type === 'VIDEO' ? <p className={styles.hint}>Video link and instructions will be shared after the clinic confirms your request.</p> : null}

        <div className={styles.twoCol}>
          <label className={styles.field}><span>Date</span><input type="date" min={minDate} value={date} onChange={(event) => setDate(event.target.value)} /></label>
          <label className={styles.field}><span>Time</span><input type="time" value={time} onChange={(event) => setTime(event.target.value)} /></label>
        </div>
        <label className={styles.field}><span>Patient name</span><input value={patientName} onChange={(event) => setPatientName(event.target.value)} placeholder="e.g. Muhammad Usman" autoComplete="name" /></label>
        <label className={styles.field}><span>Patient phone</span><input value={patientPhone} onChange={(event) => setPatientPhone(event.target.value)} placeholder="0300 1234567" autoComplete="tel" /></label>
        <label className={styles.field}><span>Reason for visit <em>optional</em></span><textarea rows={3} value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Briefly describe your concern" /></label>

        <div className={styles.summaryBox}>
          <span>Doctor</span><strong>{doctor.user.name}</strong>
          <span>Fee payable</span><strong>{money(doctor.feeMinor)}</strong>
          <span>Duration</span><strong>30 minutes</strong>
        </div>

        <button className={styles.primaryButton} onClick={book} disabled={busy}>{busy ? 'Booking…' : `Confirm booking · ${money(doctor.feeMinor)}`}</button>
        <p className={styles.hint}>Free cancellation before confirmation. Please arrive 10 minutes early for in-person visits.</p>
      </aside>
    </div>
  );
}
