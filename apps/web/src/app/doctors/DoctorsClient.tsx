'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import styles from './page.module.css';
import DoctorAvatar from '../../components/doctors/DoctorAvatar';
import StarRating from '../../components/doctors/StarRating';
import { money, type Doctor } from '../../lib/doctors/types';

function countBy(doctors: Doctor[], value: (doctor: Doctor) => string[]) {
  const counts = new Map<string, number>();
  doctors.forEach((doctor) => value(doctor).forEach((item) => counts.set(item, (counts.get(item) ?? 0) + 1)));
  return counts;
}

export default function DoctorsClient({
  doctors,
  initialSpeciality,
  initialCity,
}: {
  doctors: Doctor[];
  initialSpeciality?: string;
  initialCity?: string;
}) {
  const [search, setSearch] = useState('');
  const specialities = useMemo(() => ['All specialities', ...Array.from(new Set(doctors.map((doctor) => doctor.speciality))).sort()], [doctors]);
  const cities = useMemo(() => ['All cities', ...Array.from(new Set(doctors.flatMap((doctor) => doctor.facilities.map((item) => item.facility.city)))).sort()], [doctors]);
  const [speciality, setSpeciality] = useState(() => (initialSpeciality && specialities.includes(initialSpeciality) ? initialSpeciality : 'All specialities'));
  const [city, setCity] = useState(() => (initialCity && cities.includes(initialCity) ? initialCity : 'All cities'));
  const specialityCounts = useMemo(() => countBy(doctors, (doctor) => [doctor.speciality]), [doctors]);

  const visible = useMemo(() => doctors.filter((doctor) => {
    const name = doctor.user.name ?? '';
    const facilityText = doctor.facilities.map((item) => `${item.facility.name} ${item.facility.city}`).join(' ');
    const text = `${name} ${doctor.speciality} ${doctor.qualifications ?? ''} ${doctor.about ?? ''} ${facilityText}`.toLowerCase();
    const matchesSearch = !search.trim() || text.includes(search.trim().toLowerCase());
    const matchesSpeciality = speciality === 'All specialities' || doctor.speciality === speciality;
    const matchesCity = city === 'All cities' || doctor.facilities.some((item) => item.facility.city === city);
    return matchesSearch && matchesSpeciality && matchesCity;
  }), [city, doctors, search, speciality]);

  const clearFilters = () => {
    setSearch('');
    setSpeciality('All specialities');
    setCity('All cities');
  };

  return (
    <>
      <section className={styles.searchPanel} aria-label="Find a doctor">
        <label className={`${styles.filterField} ${styles.searchField}`}>
          <span>Search by doctor, speciality or condition</span>
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Try cardiologist, skin, migraine, tooth pain…" />
        </label>
        <label className={styles.filterField}>
          <span>City</span>
          <select value={city} onChange={(event) => setCity(event.target.value)}>{cities.map((item) => <option key={item}>{item}</option>)}</select>
        </label>
      </section>

      <div className={styles.chipRow} aria-label="Browse by speciality">
        {specialities.map((item) => {
          const active = speciality === item;
          const count = item === 'All specialities' ? doctors.length : specialityCounts.get(item) ?? 0;
          return (
            <button key={item} type="button" className={active ? `${styles.chip} ${styles.chipActive}` : styles.chip} onClick={() => setSpeciality(item)}>
              {item}<span>{count}</span>
            </button>
          );
        })}
      </div>

      <div className={styles.resultsHeader}>
        <p className={styles.resultCount}>{visible.length} {visible.length === 1 ? 'doctor' : 'doctors'} found{city !== 'All cities' ? ` in ${city}` : ''}{speciality !== 'All specialities' ? ` for ${speciality}` : ''}</p>
        {(search || speciality !== 'All specialities' || city !== 'All cities') ? <button type="button" className={styles.clearButton} onClick={clearFilters}>Clear filters</button> : null}
      </div>

      {visible.length ? (
        <div className={styles.grid}>
          {visible.map((doctor, idx) => {
            const facility = doctor.facilities[0]?.facility;
            return (
              <article className={styles.card} key={doctor.id} style={{ '--doc-index': idx } as React.CSSProperties}>
                <div className={styles.cardTop}>
                  <DoctorAvatar name={doctor.user.name} size={64} className={styles.avatar} />
                  <div className={styles.cardTitle}>
                    <div className={styles.nameRow}><h3>{doctor.user.name ?? 'Doctor'}</h3>{doctor.pmdcNumber ? <span className={styles.verified}>PMDC verified</span> : <span className={styles.verified}>Verified</span>}</div>
                    <p className={styles.speciality}>{doctor.speciality}</p>
                    {doctor.qualifications ? <p className={styles.qual}>{doctor.qualifications}</p> : null}
                    <div className={styles.ratingRow}>
                      <StarRating value={doctor.avgRating ?? 0} size={14} />
                      {doctor.reviewCount > 0 ? (
                        <span className={styles.ratingText}>{doctor.avgRating.toFixed(1)} · {doctor.reviewCount} review{doctor.reviewCount === 1 ? '' : 's'}</span>
                      ) : (
                        <span className={styles.ratingTextMuted}>New on OneStop</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className={styles.quickStats}>
                  <span><strong>{doctor.experienceYears} yrs</strong> experience</span>
                  {doctor.consultationCount ? <span><strong>{doctor.consultationCount.toLocaleString('en-PK')}+</strong> consultations</span> : null}
                  <span>{doctor.languages.join(' · ')}</span>
                  <span>{facility ? `${facility.city}` : 'Video available'}</span>
                </div>

                {facility ? <p className={styles.location}><strong>{facility.name}</strong><span>{facility.address}, {facility.city}</span></p> : null}
                {doctor.about ? <p className={styles.about}>{doctor.about}</p> : null}

                <div className={styles.cardFooter}>
                  <div className={styles.fee}><strong>{money(doctor.feeMinor)}</strong><span>Consultation fee</span></div>
                  <Link className={styles.bookButton} href={`/doctors/${doctor.id}`}>Book Appointment</Link>
                </div>
                <p className={styles.cardNote}>In-person & video · Pay at clinic · Instant request</p>
              </article>
            );
          })}
        </div>
      ) : (
        <section className={styles.emptyState}>
          <div className={styles.emptyIcon}>⌕</div>
          <h2>No doctors match your search</h2>
          <p>Try a different speciality, city or keyword like fever, skin, teeth or migraine.</p>
          <button type="button" className={styles.homeLinkButton} onClick={clearFilters}>Show all doctors</button>
        </section>
      )}
    </>
  );
}
