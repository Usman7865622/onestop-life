'use client';

import Link from 'next/link';
import { useMemo, useState, type CSSProperties } from 'react';
import styles from './page.module.css';
import { FACILITY_FALLBACK, FACILITY_STYLE, SectionIcon } from '../../components/home/SectionIcons';
import type { Facility } from '../../lib/doctors/types';

export type FacilityDoctorLink = {
  doctorProfile: {
    id: string;
    speciality: string;
    user: { id: string; name: string | null };
  };
};

export type FacilityWithDoctors = Facility & {
  doctors?: FacilityDoctorLink[];
};

const TYPE_FILTERS = ['All types', 'HOSPITAL', 'CLINIC', 'LAB', 'BLOOD_BANK', 'PHARMACY'] as const;

function typeLabel(type: string) {
  return FACILITY_STYLE[type]?.label ?? FACILITY_FALLBACK.label;
}

function isOpen247(facility: Facility) {
  return Boolean(facility.isEmergency) || /24\s*\/\s*7/i.test(facility.timings ?? '');
}

function actionFor(facility: Facility): { href: string; label: string } {
  if (facility.type === 'LAB') return { href: '/labs', label: 'Book a lab test' };
  if (facility.type === 'BLOOD_BANK') return { href: '/blood', label: 'Blood banks & requests' };
  if (facility.type === 'PHARMACY') return { href: '/products', label: 'Shop medicines' };
  return { href: '/doctors', label: 'Find doctors here' };
}

export default function FacilitiesClient({ facilities }: { facilities: FacilityWithDoctors[] }) {
  const [search, setSearch] = useState('');
  const [type, setType] = useState<(typeof TYPE_FILTERS)[number]>('All types');
  const [city, setCity] = useState('All cities');
  const [only247, setOnly247] = useState(false);

  const cities = useMemo(() => ['All cities', ...Array.from(new Set(facilities.map((facility) => facility.city))).sort()], [facilities]);
  const typeCounts = useMemo(() => {
    const counts = new Map<string, number>();
    facilities.forEach((facility) => counts.set(facility.type, (counts.get(facility.type) ?? 0) + 1));
    return counts;
  }, [facilities]);

  const visible = useMemo(() => facilities.filter((facility) => {
    const doctorText = (facility.doctors ?? []).map((link) => `${link.doctorProfile.user.name ?? ''} ${link.doctorProfile.speciality}`).join(' ');
    const text = `${facility.name} ${typeLabel(facility.type)} ${facility.address} ${facility.city} ${doctorText}`.toLowerCase();
    const matchesSearch = !search.trim() || text.includes(search.trim().toLowerCase());
    const matchesType = type === 'All types' || facility.type === type;
    const matchesCity = city === 'All cities' || facility.city === city;
    const matches247 = !only247 || isOpen247(facility);
    return matchesSearch && matchesType && matchesCity && matches247;
  }), [city, facilities, only247, search, type]);

  const clearFilters = () => {
    setSearch('');
    setType('All types');
    setCity('All cities');
    setOnly247(false);
  };

  const hasFilters = Boolean(search) || type !== 'All types' || city !== 'All cities' || only247;

  return (
    <>
      <section className={styles.searchPanel} aria-label="Find a facility">
        <label className={`${styles.filterField} ${styles.searchField}`}>
          <span>Search by facility, area or doctor</span>
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Try hospital, Gulberg, blood bank, Dr. Ahmed…" />
        </label>
        <label className={styles.filterField}>
          <span>City</span>
          <select value={city} onChange={(event) => setCity(event.target.value)}>{cities.map((item) => <option key={item}>{item}</option>)}</select>
        </label>
        <label className={styles.toggleField}>
          <input type="checkbox" checked={only247} onChange={(event) => setOnly247(event.target.checked)} />
          <span>Open 24/7 only</span>
        </label>
      </section>

      <div className={styles.chipRow} aria-label="Browse by facility type">
        {TYPE_FILTERS.map((item) => {
          const active = type === item;
          const count = item === 'All types' ? facilities.length : typeCounts.get(item) ?? 0;
          const label = item === 'All types' ? 'All types' : typeLabel(item);
          return (
            <button key={item} type="button" className={active ? `${styles.chip} ${styles.chipActive}` : styles.chip} onClick={() => setType(item)}>
              {label}<span>{count}</span>
            </button>
          );
        })}
      </div>

      <div className={styles.resultsHeader}>
        <p className={styles.resultCount}>{visible.length} {visible.length === 1 ? 'facility' : 'facilities'} found{city !== 'All cities' ? ` in ${city}` : ''}{type !== 'All types' ? ` · ${typeLabel(type)}` : ''}{only247 ? ' · open 24/7' : ''}</p>
        {hasFilters ? <button type="button" className={styles.clearButton} onClick={clearFilters}>Clear filters</button> : null}
      </div>

      {visible.length ? (
        <div className={styles.grid}>
          {visible.map((facility) => {
            const style = FACILITY_STYLE[facility.type] ?? FACILITY_FALLBACK;
            const open247 = isOpen247(facility);
            const action = actionFor(facility);
            const doctors = facility.doctors ?? [];
            return (
              <article key={facility.id} className={styles.card} style={{ '--fac-from': style.from, '--fac-to': style.to, '--fac-soft': style.soft } as CSSProperties}>
                <div className={styles.cardTop}>
                  <span className={styles.medal}><SectionIcon name={style.icon} size={26} /></span>
                  {open247 ? <span className={styles.openBadge}><span className={styles.openDot} aria-hidden="true" />24/7</span> : null}
                </div>
                <span className={styles.typeLabel}>{style.label}</span>
                <h3 className={styles.cardName}>{facility.name}</h3>
                <p className={styles.meta}><SectionIcon name="pin" size={15} /><span>{facility.address}, {facility.city}</span></p>
                {facility.timings ? <p className={styles.meta}><SectionIcon name="clock" size={15} /><span>{facility.timings}</span></p> : null}
                {facility.phone ? <a className={styles.callLink} href={`tel:${facility.phone.replace(/[^+\d]/g, '')}`}><SectionIcon name="phone" size={15} />{facility.phone}</a> : null}

                {doctors.length ? (
                  <div className={styles.doctorList}>
                    <p className={styles.doctorHeading}>{doctors.length} {doctors.length === 1 ? 'doctor' : 'doctors'} here</p>
                    {doctors.slice(0, 3).map((link) => (
                      <Link key={link.doctorProfile.id} className={styles.doctorLink} href={`/doctors/${link.doctorProfile.id}`}>
                        <span>{link.doctorProfile.user.name ?? 'Doctor'}</span><span className={styles.doctorSpec}>{link.doctorProfile.speciality} →</span>
                      </Link>
                    ))}
                    {doctors.length > 3 ? <p className={styles.moreDoctors}>+{doctors.length - 3} more — see all doctors</p> : null}
                  </div>
                ) : null}

                <div className={styles.cardFooter}>
                  <Link className={styles.actionButton} href={action.href}>{action.label}</Link>
                  {facility.phone ? <a className={styles.callButton} href={`tel:${facility.phone.replace(/[^+\d]/g, '')}`}>Call</a> : null}
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <section className={styles.emptyState}>
          <div className={styles.emptyIcon}><SectionIcon name="pin" size={26} /></div>
          <h2>No facilities match your search</h2>
          <p>Try a different city or facility type, or clear the 24/7 filter to see everything near you.</p>
          <button type="button" className={styles.homeLinkButton} onClick={clearFilters}>Show all facilities</button>
        </section>
      )}
    </>
  );
}
