'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import styles from './detail.module.css';
import { apiFetch } from '../../../lib/auth/api';
import { readAccessToken } from '../../../lib/auth/session';
import DoctorAvatar from '../../../components/doctors/DoctorAvatar';
import StarRating from '../../../components/doctors/StarRating';
import ReviewsSection from '../../../components/doctors/ReviewsSection';
import { money, type Appointment, type Doctor } from '../../../lib/doctors/types';

type SlotInfo = { startsAt: string; endsAt: string; status: 'free' | 'booked' };

function formatSlotTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-PK', {
    hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Karachi',
  });
}

function formatChipDate(dateKey: string) {
  return new Date(`${dateKey}T12:00:00+05:00`).toLocaleDateString('en-PK', {
    weekday: 'short', day: 'numeric', month: 'short', timeZone: 'Asia/Karachi',
  });
}

function dateKeyParts(dateKey: string) {
  const d = new Date(`${dateKey}T12:00:00+05:00`);
  return {
    dayName: d.toLocaleDateString('en-PK', { weekday: 'short', timeZone: 'Asia/Karachi' }),
    dayNumber: d.toLocaleDateString('en-PK', { day: 'numeric', timeZone: 'Asia/Karachi' }),
  };
}

export default function DoctorDetailClient({ doctor }: { doctor: Doctor }) {
  const [type, setType] = useState<'IN_PERSON' | 'VIDEO'>('IN_PERSON');
  const [reason, setReason] = useState('');
  const [patientName, setPatientName] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [facilityId, setFacilityId] = useState(doctor.facilities[0]?.facility.id ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState<Appointment | null>(null);

  // Real availability: doctor's published weekly schedule -> concrete slots.
  const [dates, setDates] = useState<string[]>([]);
  const [datesLoaded, setDatesLoaded] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [slots, setSlots] = useState<SlotInfo[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ startsAt: string; endsAt: string } | null>(null);

  useEffect(() => {
    let alive = true;
    apiFetch<Array<{ date: string }>>(`/doctors/${doctor.id}/available-dates`, { method: 'GET' })
      .then((rows) => {
        if (!alive) return;
        const keys = rows.map((row) => row.date);
        setDates(keys);
        setSelectedDate((current) => current || keys[0] || '');
        setDatesLoaded(true);
      })
      .catch(() => { if (alive) { setDates([]); setDatesLoaded(true); } });
    return () => { alive = false; };
  }, [doctor.id]);

  useEffect(() => {
    if (!selectedDate) { setSlots([]); setSelectedSlot(null); return; }
    let alive = true;
    setSlotsLoading(true);
    setSelectedSlot(null);
    apiFetch<SlotInfo[]>(`/doctors/${doctor.id}/slots?date=${selectedDate}`, { method: 'GET' })
      .then((rows) => { if (alive) { setSlots(rows); setSlotsLoading(false); } })
      .catch(() => { if (alive) { setSlots([]); setSlotsLoading(false); } });
    return () => { alive = false; };
  }, [doctor.id, selectedDate]);

  const facility = doctor.facilities.find((item) => item.facility.id === facilityId)?.facility ?? doctor.facilities[0]?.facility;

  const book = async () => {
    setError('');
    const token = readAccessToken();
    if (!token) { setError('Please sign in at /login first, then come back to book.'); return; }
    if (!selectedSlot) { setError('Choose an available time slot to book this appointment.'); return; }
    if (!patientName.trim() || !patientPhone.trim()) { setError('Add the patient name and phone number.'); return; }
    setBusy(true);
    try {
      const appt = await apiFetch<Appointment>('/appointments', {
        method: 'POST',
        body: JSON.stringify({
          doctorProfileId: doctor.id,
          facilityId: type === 'IN_PERSON' && facilityId ? facilityId : undefined,
          slotStart: selectedSlot.startsAt,
          startsAt: selectedSlot.startsAt,
          endsAt: selectedSlot.endsAt,
          type, reason: reason.trim() || undefined,
          patientName: patientName.trim(), patientPhone: patientPhone.trim(),
        }),
      }, token);
      setSuccess(appt);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not book this appointment. Try another slot.');
    } finally { setBusy(false); }
  };

  if (success) {
    return (
      <section className={styles.successCard}>
        <span className={styles.successIcon}>✓</span>
        <p className={styles.successKicker}>Booking request received</p>
        <h2>Appointment requested</h2>
        <p>Your appointment with <strong>{doctor.user.name}</strong> is <strong>{success.status}</strong> for {new Date(success.startsAt).toLocaleString('en-PK', { timeZone: 'Asia/Karachi' })} (Asia/Karachi).</p>
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
                {doctor.pmdcNumber ? <span className={styles.verified}>{doctor.pmdcNumber}</span> : <span className={styles.verified}>Verified doctor</span>}
              </div>
              <p className={styles.speciality}>{doctor.speciality}</p>
              {doctor.qualifications ? <p className={styles.qual}>{doctor.qualifications}</p> : null}
              <div className={styles.ratingLine}>
                <StarRating value={doctor.avgRating ?? 0} size={16} />
                {doctor.reviewCount > 0 ? (
                  <span>{doctor.avgRating.toFixed(1)} · {doctor.reviewCount} patient review{doctor.reviewCount === 1 ? '' : 's'}</span>
                ) : (
                  <span className={styles.ratingMuted}>No reviews yet — be the first after your visit</span>
                )}
              </div>
              <div className={styles.badgeRow}>
                <span>{doctor.experienceYears} years experience</span>
                {doctor.consultationCount ? <span>{doctor.consultationCount.toLocaleString('en-PK')}+ consultations</span> : null}
                <span>{doctor.languages.join(' · ')}</span>
                <span>In-person & video</span>
                {dates.length ? (
                  <span className={styles.nextChip}>Next available: {formatChipDate(dates[0])}</span>
                ) : datesLoaded ? (
                  <span className={styles.nextChipNone}>Schedule coming soon</span>
                ) : null}
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
            {doctor.pmdcNumber ? <div><span>PMDC registration</span><strong>{doctor.pmdcNumber}</strong></div> : null}
            {doctor.consultationCount ? <div><span>Consultations</span><strong>{doctor.consultationCount.toLocaleString('en-PK')}+</strong></div> : null}
          </div>
        </section>

        <ReviewsSection doctorId={doctor.id} doctorName={doctor.user.name} avgRating={doctor.avgRating ?? 0} reviewCount={doctor.reviewCount ?? 0} />

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

        <div className={styles.pickerHead}>
          <span>Pick a date &amp; time</span>
          <span className={styles.tzLabel}>Times in Asia/Karachi</span>
        </div>

        {!datesLoaded ? <p className={styles.hint}>Loading this doctor&apos;s availability…</p>
          : dates.length === 0 ? <p className={styles.hint}>Schedule coming soon — this doctor has not published weekly hours yet. Check back later.</p>
          : (
            <>
              <div className={styles.dateStrip} role="listbox" aria-label="Available dates">
                {dates.slice(0, 14).map((dateKey) => {
                  const parts = dateKeyParts(dateKey);
                  const active = dateKey === selectedDate;
                  return (
                    <button
                      type="button"
                      key={dateKey}
                      role="option"
                      aria-selected={active}
                      className={active ? `${styles.dateChip} ${styles.dateChipActive}` : styles.dateChip}
                      onClick={() => setSelectedDate(dateKey)}
                    >
                      <span>{parts.dayName}</span>
                      <strong>{parts.dayNumber}</strong>
                    </button>
                  );
                })}
              </div>
              {dates.length > 14 ? <p className={styles.hint}>Showing the next 14 days with availability — more dates are ahead.</p> : null}
              {slotsLoading ? <p className={styles.hint}>Loading time slots…</p>
                : slots.length === 0 ? <p className={styles.hint}>No slots left on this date — pick another day.</p>
                : (
                  <div className={styles.timeGrid}>
                    {slots.map((slot) => {
                      const isBooked = slot.status === 'booked';
                      const isSelected = selectedSlot?.startsAt === slot.startsAt;
                      return (
                        <button
                          type="button"
                          key={slot.startsAt}
                          disabled={isBooked}
                          aria-pressed={isSelected}
                          title={isBooked ? 'Already booked' : formatChipDate(selectedDate)}
                          className={isBooked ? `${styles.timeSlot} ${styles.timeSlotBooked}` : isSelected ? `${styles.timeSlot} ${styles.timeSlotSelected}` : styles.timeSlot}
                          onClick={() => setSelectedSlot({ startsAt: slot.startsAt, endsAt: slot.endsAt })}
                        >
                          {formatSlotTime(slot.startsAt)}
                        </button>
                      );
                    })}
                  </div>
                )}
            </>
          )}

        <label className={styles.field}><span>Patient name</span><input value={patientName} onChange={(event) => setPatientName(event.target.value)} placeholder="e.g. Muhammad Usman" autoComplete="name" /></label>
        <label className={styles.field}><span>Patient phone</span><input value={patientPhone} onChange={(event) => setPatientPhone(event.target.value)} placeholder="0300 1234567" autoComplete="tel" /></label>
        <label className={styles.field}><span>Reason for visit <em>optional</em></span><textarea rows={3} value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Briefly describe your concern" /></label>

        <div className={styles.summaryBox}>
          <span>Doctor</span><strong>{doctor.user.name}</strong>
          <span>Fee payable</span><strong>{money(doctor.feeMinor)}</strong>
          <span>Duration</span><strong>30 minutes</strong>
        </div>

        <button className={styles.primaryButton} onClick={book} disabled={busy || !selectedSlot}>{busy ? 'Booking…' : `Confirm booking · ${money(doctor.feeMinor)}`}</button>
        <p className={styles.hint}>Free cancellation before confirmation. Please arrive 10 minutes early for in-person visits.</p>
      </aside>
    </div>
  );
}
