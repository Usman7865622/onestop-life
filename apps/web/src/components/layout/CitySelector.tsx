'use client';

import { useEffect, useRef, useState } from 'react';
import { SectionIcon } from '../home/SectionIcons';
import styles from './city-selector.module.css';

export const CITIES = ['Lahore', 'Karachi', 'Islamabad', 'Rawalpindi', 'Faisalabad', 'Multan'];
const KEY = 'osl-city';

export function getCity(): string {
  if (typeof window === 'undefined') return 'Lahore';
  try {
    return localStorage.getItem(KEY) || 'Lahore';
  } catch {
    return 'Lahore';
  }
}

export default function CitySelector() {
  const [city, setCity] = useState('Lahore');
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCity(getCity());
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const pick = (c: string) => {
    setCity(c);
    try { localStorage.setItem(KEY, c); } catch { /* ignore */ }
    setOpen(false);
    window.dispatchEvent(new CustomEvent('osl-city-change', { detail: c }));
  };

  return (
    <div ref={ref} className={styles.wrap}>
      <button
        type="button"
        className={styles.trigger}
        onClick={() => setOpen(o => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Delivery city: ${city}. Change city`}
      >
        <SectionIcon name="pin" size={18} />
        <span>{city}</span>
        <SectionIcon name="chevron" size={14} />
      </button>
      {open && (
        <div className={styles.dropdown} role="listbox" aria-label="Choose city">
          {CITIES.map(c => (
            <button
              key={c}
              type="button"
              role="option"
              aria-selected={c === city}
              className={`${styles.option} ${c === city ? styles.active : ''}`}
              onClick={() => pick(c)}
            >
              <SectionIcon name="pin" size={16} />
              {c}
              {c === city && <SectionIcon name="check" size={16} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
