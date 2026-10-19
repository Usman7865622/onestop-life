'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { SectionIcon } from '../home/SectionIcons';
import styles from './header-search.module.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api-production-7a91a.up.railway.app';

type Suggestion = {
  id: string;
  label: string;
  sub: string;
  href: string;
  kind: 'product' | 'medicine' | 'category';
};

const CATEGORIES = [
  'Trending essentials', 'Home health', 'Wellness', 'Pet care',
  'Baby care', 'Personal care', 'Vitamins', 'Devices',
];

export default function HeaderSearch() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(-1);
  const wrapRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const q = query.trim();
    if (q.length < 2) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      try {
        const [prodRes, medRes] = await Promise.all([
          fetch(`${API_URL}/products?search=${encodeURIComponent(q)}&limit=4`).then(r => r.ok ? r.json() : { items: [] }),
          fetch(`${API_URL}/medicines?search=${encodeURIComponent(q)}&limit=4`).then(r => r.ok ? r.json() : { items: [] }),
        ]);
        const out: Suggestion[] = [];
        for (const p of (prodRes.items ?? []).slice(0, 4)) {
          out.push({ id: `p-${p.id}`, label: p.nameEn, sub: `${p.category ?? 'Product'} · Rs. ${(p.priceMinor / 100).toLocaleString('en-PK')}`, href: `/products?q=${encodeURIComponent(q)}`, kind: 'product' });
        }
        for (const m of (medRes.items ?? medRes ?? []).slice(0, 4)) {
          const name = m.nameEn ?? m.name ?? 'Medicine';
          out.push({ id: `m-${m.id}`, label: name, sub: `Medicine${m.requiresRx ? ' · Rx required' : ''}`, href: `/pharmacy?q=${encodeURIComponent(q)}`, kind: 'medicine' });
        }
        for (const c of CATEGORIES.filter(c => c.toLowerCase().includes(q.toLowerCase())).slice(0, 2)) {
          out.push({ id: `c-${c}`, label: c, sub: 'Category', href: `/products#${c.toLowerCase().replaceAll(' ', '-')}`, kind: 'category' });
        }
        setSuggestions(out.slice(0, 8));
        setOpen(out.length > 0);
        setHighlight(-1);
      } catch {
        setSuggestions([]);
        setOpen(false);
      }
    }, 250);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  const go = (href: string) => {
    setOpen(false);
    setQuery('');
    router.push(href);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    if (highlight >= 0 && suggestions[highlight]) go(suggestions[highlight].href);
    else go(`/products?q=${encodeURIComponent(q)}`);
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setHighlight(h => Math.min(h + 1, suggestions.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setHighlight(h => Math.max(h - 1, -1)); }
    else if (e.key === 'Escape') setOpen(false);
  };

  const kindIcon = (k: Suggestion['kind']) =>
    k === 'medicine' ? 'pill' : k === 'category' ? 'grid' : 'package';

  const kindLabel = (k: Suggestion['kind']) =>
    k === 'medicine' ? 'Medicine' : k === 'category' ? 'Category' : 'Product';

  return (
    <div ref={wrapRef} className={styles.wrap}>
      <form onSubmit={submit} role="search" className={styles.form}>
        <SectionIcon name="search" size={20} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => { if (suggestions.length) setOpen(true); }}
          onKeyDown={onKey}
          placeholder="Search products, medicines, brands…"
          aria-label="Search products and medicines"
          autoComplete="off"
        />
        {query && (
          <button type="button" aria-label="Clear search" onClick={() => { setQuery(''); setSuggestions([]); setOpen(false); }}>
            <SectionIcon name="x" size={16} />
          </button>
        )}
        <button type="submit" className={styles.goBtn}>Search</button>
      </form>
      {open && suggestions.length > 0 && (
        <div className={styles.dropdown} role="listbox">
          {suggestions.map((s, i) => (
            <button
              key={s.id}
              type="button"
              role="option"
              aria-selected={i === highlight}
              className={`${styles.item} ${i === highlight ? styles.active : ''}`}
              onClick={() => go(s.href)}
              onMouseEnter={() => setHighlight(i)}
            >
              <span className={styles.itemIcon}><SectionIcon name={kindIcon(s.kind) as any} size={18} /></span>
              <span className={styles.itemText}>
                <strong>{s.label}</strong>
                <small>{s.sub}</small>
              </span>
              <span className={styles.kind}>{kindLabel(s.kind)}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
