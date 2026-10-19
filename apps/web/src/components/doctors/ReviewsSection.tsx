'use client';

import { useCallback, useEffect, useState } from 'react';
import StarRating from './StarRating';
import { apiFetch } from '../../lib/auth/api';
import { readAccessToken } from '../../lib/auth/session';
import { patientFirstName, type Review, type ReviewEligibility } from '../../lib/doctors/types';
import styles from './reviews.module.css';
import { SectionIcon } from '../home/SectionIcons';

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return '';
  }
}

function VerifiedShield() {
  return (
    <span className={styles.shield}>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M12 2l7.5 3v6.2c0 5-3.2 8.6-7.5 10.3-4.3-1.7-7.5-5.3-7.5-10.3V5L12 2z" fill="#147a3d" />
        <path d="M8.5 12l2.4 2.4L15.7 9.5" stroke="#fff" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      Verified visit
    </span>
  );
}

export default function ReviewsSection({ doctorId, doctorName, avgRating, reviewCount }: {
  doctorId: string;
  doctorName: string | null;
  avgRating: number;
  reviewCount: number;
}) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [eligibility, setEligibility] = useState<ReviewEligibility | null>(null);
  const [signedIn, setSignedIn] = useState(false);
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState('');

  const load = useCallback(async () => {
    try {
      const payload = await apiFetch<{ items: Review[] }>(`/doctors/${doctorId}/reviews?pageSize=10`);
      setReviews(payload.items ?? []);
    } catch {
      setReviews([]);
    } finally {
      setLoaded(true);
    }
  }, [doctorId]);

  useEffect(() => { load(); }, [load]);

  // Find the user's most recent completed appointment with this doctor to check
  // review eligibility. Only runs when the patient opens the review form.
  const checkEligibility = useCallback(async () => {
    const token = readAccessToken();
    if (!token) { setSignedIn(false); setEligibility(null); return; }
    setSignedIn(true);
    try {
      const appts = await apiFetch<Array<{ id: string; status: string; doctorProfile: { id: string } }>>('/appointments/mine', {}, token);
      const candidate = appts.find((a) => a.doctorProfile?.id === doctorId && a.status === 'COMPLETED');
      if (!candidate) { setEligibility({ canReview: false, reason: 'NOT_COMPLETED' }); return; }
      const result = await apiFetch<ReviewEligibility>(`/appointments/${candidate.id}/review-eligibility`, {}, token);
      setEligibility(result);
      (result as ReviewEligibility & { appointmentId?: string }).appointmentId = candidate.id;
    } catch {
      setEligibility(null);
    }
  }, [doctorId]);

  const openForm = () => {
    setError('');
    setDone('');
    checkEligibility();
    setFormOpen(true);
  };

  const submit = async () => {
    setError('');
    const token = readAccessToken();
    const appointmentId = (eligibility as ReviewEligibility & { appointmentId?: string } | null)?.appointmentId;
    if (!token || !appointmentId) { setError('Please sign in to write a review.'); return; }
    if (text.trim().length < 10) { setError('Please write at least 10 characters about your visit.'); return; }
    setBusy(true);
    try {
      await apiFetch('/reviews', {
        method: 'POST',
        body: JSON.stringify({ appointmentId, rating, title: title.trim() || undefined, text: text.trim() }),
      }, token);
      setDone('Thank you — your review is now visible to other patients.');
      setFormOpen(false);
      setText('');
      setTitle('');
      setRating(5);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not submit your review. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const distribution = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
  }));

  return (
    <section className={styles.sectionCard} aria-labelledby="reviews-heading">
      <div className={styles.headerRow}>
        <h2 id="reviews-heading">Patient reviews</h2>
        {!formOpen ? <button type="button" className={styles.writeButton} onClick={openForm}>Write a review</button> : null}
      </div>

      <div className={styles.summary}>
        <div className={styles.scoreBlock}>
          <strong>{avgRating > 0 ? avgRating.toFixed(1) : '—'}</strong>
          <StarRating value={avgRating} size={18} />
          <span>{reviewCount} verified review{reviewCount === 1 ? '' : 's'}</span>
        </div>
        {reviews.length > 0 ? (
          <div className={styles.distribution}>
            {distribution.map((row) => (
              <div key={row.star} className={styles.distRow}>
                <span>{row.star}<SectionIcon name="star" size={14} /></span>
                <div className={styles.distBar}><i style={{ width: reviews.length ? `${(row.count / reviews.length) * 100}%` : '0%' }} /></div>
                <span>{row.count}</span>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      {formOpen ? (
        <div className={styles.formCard}>
          {!signedIn ? (
            <p className={styles.note}>Please <a href="/login">sign in</a> to write a review. Only patients with a completed visit can review.</p>
          ) : eligibility === null ? (
            <p className={styles.note}>Checking your visits…</p>
          ) : !eligibility.canReview ? (
            <p className={styles.note}>
              {eligibility.reason === 'ALREADY_REVIEWED'
                ? 'You have already reviewed this visit. Thank you!'
                : `You can write a review after a completed visit with ${doctorName ?? 'this doctor'}.`}
            </p>
          ) : (
            <>
              <p className={styles.note}>How was your visit with {doctorName ?? 'this doctor'}?</p>
              <StarRating value={rating} size={26} interactive onRate={setRating} />
              <label className={styles.field}><span>Headline <em>optional</em></span>
                <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={100} placeholder="e.g. Listened carefully, clear plan" />
              </label>
              <label className={styles.field}><span>Your review</span>
                <textarea value={text} onChange={(e) => setText(e.target.value)} rows={4} maxLength={500} placeholder="What went well? What should other patients know?" />
              </label>
              {error ? <p className={styles.error} role="alert">{error}</p> : null}
              <div className={styles.formActions}>
                <button type="button" className={styles.primaryButton} onClick={submit} disabled={busy}>{busy ? 'Submitting…' : 'Submit review'}</button>
                <button type="button" className={styles.ghostButton} onClick={() => setFormOpen(false)}>Cancel</button>
              </div>
            </>
          )}
        </div>
      ) : null}

      {done ? <p className={styles.done} role="status">{done}</p> : null}

      {loaded ? (
        reviews.length ? (
          <ul className={styles.list}>
            {reviews.map((review) => (
              <li key={review.id} className={styles.item}>
                <div className={styles.itemHead}>
                  <span className={styles.avatar}>{patientFirstName(review.user?.name).slice(0, 1).toUpperCase()}</span>
                  <div>
                    <strong>{patientFirstName(review.user?.name)}</strong>
                    <div className={styles.itemMeta}>
                      <StarRating value={review.rating} size={13} />
                      <span>{formatDate(review.createdAt)}</span>
                      <VerifiedShield />
                    </div>
                  </div>
                </div>
                {review.title ? <p className={styles.itemTitle}>{review.title}</p> : null}
                <p className={styles.itemText}>{review.text}</p>
              </li>
            ))}
          </ul>
        ) : (
          <div className={styles.empty}>
            <span className={styles.emptyIcon} aria-hidden="true"><SectionIcon name="star" size={32} /></span>
            <h3>No reviews yet</h3>
            <p>Be the first to review {doctorName ?? 'this doctor'} after your visit. Your experience helps other patients choose with confidence.</p>
          </div>
        )
      ) : (
        <p className={styles.note}>Loading reviews…</p>
      )}
    </section>
  );
}
