'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import styles from '../../app/page.module.css';

type Tab = 'doctors' | 'medicines' | 'labs' | 'blood';

const TABS: Array<{ id: Tab; label: string }> = [
  { id: 'doctors', label: 'Doctors' },
  { id: 'medicines', label: 'Medicines' },
  { id: 'labs', label: 'Labs' },
  { id: 'blood', label: 'Blood' },
];

const SPECIALITIES = [
  'Cardiology',
  'Dermatology',
  'Pediatrics',
  'General Physician',
  'Gynecology',
  'Orthopedics',
  'Dentistry',
  'Ophthalmology',
  'ENT',
  'Neurology',
  'Psychiatry',
  'Gastroenterology',
];

const CITIES = ['Lahore', 'Karachi', 'Islamabad'];

const BLOOD_GROUPS: Array<{ code: string; label: string }> = [
  { code: 'A_POS', label: 'A+' },
  { code: 'A_NEG', label: 'A−' },
  { code: 'B_POS', label: 'B+' },
  { code: 'B_NEG', label: 'B−' },
  { code: 'AB_POS', label: 'AB+' },
  { code: 'AB_NEG', label: 'AB−' },
  { code: 'O_POS', label: 'O+' },
  { code: 'O_NEG', label: 'O−' },
];

export default function HeroSearch() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('doctors');
  const [speciality, setSpeciality] = useState('');
  const [city, setCity] = useState('');
  const [query, setQuery] = useState('');
  const [labQuery, setLabQuery] = useState('');
  const [group, setGroup] = useState('');

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (tab === 'doctors') {
      const params = new URLSearchParams();
      if (speciality) params.set('speciality', speciality);
      if (city) params.set('city', city);
      const suffix = params.toString();
      router.push(suffix ? `/doctors?${suffix}` : '/doctors');
      return;
    }
    if (tab === 'medicines') {
      const q = query.trim();
      router.push(q ? `/pharmacy?q=${encodeURIComponent(q)}` : '/pharmacy');
      return;
    }
    if (tab === 'labs') {
      const q = labQuery.trim();
      router.push(q ? `/labs?q=${encodeURIComponent(q)}` : '/labs');
      return;
    }
    const g = group.trim();
    router.push(g ? `/blood?group=${encodeURIComponent(g)}` : '/blood');
  };

  const switchTab = (next: Tab) => {
    setTab(next);
    setQuery('');
    setLabQuery('');
  };

  return (
    <div className={styles.heroTabs} role="search" aria-label="Search OneStop services">
      <div className={styles.heroTabBar} role="tablist" aria-label="What are you looking for?">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={tab === item.id}
            className={tab === item.id ? styles.heroTabActive : styles.heroTab}
            onClick={() => switchTab(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      <form className={`${styles.heroSearch} ${tab === 'doctors' ? styles.heroSearchWide : ''}`} onSubmit={submit}>
        {tab === 'doctors' && (
          <>
            <label className={styles.visuallyHidden} htmlFor="hero-speciality">Speciality</label>
            <select id="hero-speciality" value={speciality} onChange={(event) => setSpeciality(event.target.value)}>
              <option value="">All specialities</option>
              {SPECIALITIES.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
            <label className={styles.visuallyHidden} htmlFor="hero-city">City</label>
            <select id="hero-city" value={city} onChange={(event) => setCity(event.target.value)}>
              <option value="">All cities</option>
              {CITIES.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
            <button type="submit">Find doctors</button>
          </>
        )}

        {tab === 'medicines' && (
          <>
            <label className={styles.visuallyHidden} htmlFor="hero-medicine">Search medicines</label>
            <input
              id="hero-medicine"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Try paracetamol, Panadol, insulin…"
            />
            <button type="submit">Search pharmacy</button>
          </>
        )}

        {tab === 'labs' && (
          <>
            <label className={styles.visuallyHidden} htmlFor="hero-lab">Search lab tests</label>
            <input
              id="hero-lab"
              value={labQuery}
              onChange={(event) => setLabQuery(event.target.value)}
              placeholder="Try CBC, vitamin D, HbA1c…"
            />
            <button type="submit">Find tests</button>
          </>
        )}

        {tab === 'blood' && (
          <>
            <label className={styles.visuallyHidden} htmlFor="hero-group">Blood group</label>
            <select id="hero-group" value={group} onChange={(event) => setGroup(event.target.value)}>
              <option value="">Any group</option>
              {BLOOD_GROUPS.map((item) => (
                <option key={item.code} value={item.code}>{item.label}</option>
              ))}
            </select>
            <button type="submit">Find blood</button>
          </>
        )}
      </form>
    </div>
  );
}
