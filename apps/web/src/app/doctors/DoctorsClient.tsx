'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import styles from './page.module.css';
import { money, type Doctor } from '../../lib/doctors/types';

export default function DoctorsClient({ doctors }: { doctors: Doctor[] }) {
  const [search, setSearch] = useState('');
  const [speciality, setSpeciality] = useState('All specialities');
  const [city, setCity] = useState('All cities');

  const specialities = useMemo(() => ['All specialities', ...Array.from(new Set(doctors.map((d) => d.speciality))).sort()], [doctors]);
  const cities = useMemo(() => ['All cities', ...Array.from(new Set(doctors.flatMap((d) => d.facilities.map((f) => f.facility.city)))).sort()], [doctors]);

  const visible = useMemo(() => doctors.filter((d) => {
    const name = d.user.name ?? '';
    const text = `${name} ${d.speciality} ${d.qualifications ?? ''} ${d.about ?? ''}`.toLowerCase();
    const matchesSearch = !search.trim() || text.includes(search.trim().toLowerCase());
    const matchesSpeciality = speciality === 'All specialities' || d.speciality === speciality;
    const matchesCity = city === 'All cities' || d.facilities.some((f) => f.facility.city === city);
    return matchesSearch && matchesSpeciality && matchesCity;
  }), [doctors, search, speciality, city]);

  return (
    <>
      <div className={styles.filters}>
        <label className={styles.filterField}><span>Search doctor</span><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Name, speciality, condition…" /></label>
        <label className={styles.filterField}><span>Speciality</span><select value={speciality} onChange={(e) => setSpeciality(e.target.value)}>{specialities.map((s) => <option key={s}>{s}</option>)}</select></label>
        <label className={styles.filterField}><span>City</span><select value={city} onChange={(e) => setCity(e.target.value)}>{cities.map((c) => <option key={c}>{c}</option>)}</select></label>
      </div>
      <p className={styles.resultCount}>{visible.length} {visible.length === 1 ? 'doctor' : 'doctors'} found</p>
      {visible.length ? (
        <div className={styles.grid}>
          {visible.map((doctor) => {
            const facility = doctor.facilities[0]?.facility;
            return (
              <article className={styles.card} key={doctor.id}>
                <div className={styles.cardTop}>
                  <div className={styles.avatar} aria-hidden="true">{(doctor.user.name ?? 'D').replace('Dr. ', '').slice(0, 1)}</div>
                  <div>
                    <h3>{doctor.user.name ?? 'Doctor'}</h3>
                    <p className={styles.speciality}>{doctor.speciality}</p>
                    {doctor.qualifications ? <p className={styles.qual}>{doctor.qualifications}</p> : null}
                  </div>
                  <span className={styles.verified}>✓ Verified</span>
                </div>
                <div className={styles.meta}>
                  <span>{doctor.experienceYears} yrs experience</span>
                  <span>{doctor.languages.join(' · ')}</span>
                  {facility ? <span>{facility.name} — {facility.city}</span> : <span>Video consultation available</span>}
                </div>
                {doctor.about ? <p className={styles.about}>{doctor.about}</p> : null}
                <div className={styles.cardFooter}>
                  <div><strong>{money(doctor.feeMinor)}</strong><span> consultation fee</span></div>
                  <Link className={styles.bookButton} href={`/doctors/${doctor.id}`}>Book appointment</Link>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <section className={styles.emptyState}><h2>No doctors match your search</h2><p>Try a different speciality or city.</p></section>
      )}
    </>
  );
}
