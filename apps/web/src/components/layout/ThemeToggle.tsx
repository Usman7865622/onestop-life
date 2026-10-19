'use client';

import { useEffect, useState } from 'react';
import { SectionIcon } from '../home/SectionIcons';

export default function ThemeToggle() {
  const [dark, setDark] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('osl-theme');
      const isDark =
        stored === 'dark' ||
        (!stored && window.matchMedia('(prefers-color-scheme: dark)').matches);
      setDark(isDark);
      document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    } catch {
      /* storage unavailable — stay light */
    }
    setReady(true);
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    try {
      localStorage.setItem('osl-theme', next ? 'dark' : 'light');
    } catch {
      /* ignore */
    }
    document.documentElement.setAttribute('data-theme', next ? 'dark' : 'light');
  };

  if (!ready) return null;

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      style={{
        display: 'inline-grid',
        placeItems: 'center',
        width: 40,
        height: 40,
        borderRadius: 'var(--radius-sm)',
        border: '1px solid var(--line)',
        background: 'var(--surface)',
        color: 'var(--muted)',
        transition: 'color .2s, border-color .2s, transform .15s',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--primary)'; e.currentTarget.style.borderColor = 'var(--primary)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--muted)'; e.currentTarget.style.borderColor = 'var(--line)'; }}
    >
      <SectionIcon name={dark ? 'sun' : 'moon'} size={20} />
    </button>
  );
}
