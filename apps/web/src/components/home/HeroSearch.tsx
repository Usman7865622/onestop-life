'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import styles from '../../app/page.module.css';

export default function HeroSearch() {
  const router = useRouter();
  const [query, setQuery] = useState('');

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const q = query.trim();
    router.push(q ? `/products?q=${encodeURIComponent(q)}` : '/products');
  };

  return (
    <form className={styles.heroSearch} onSubmit={submit} role="search" aria-label="Search the OneStop store">
      <label className={styles.visuallyHidden} htmlFor="home-search">Search medicines, wellness, baby and pet care</label>
      <input
        id="home-search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search medicines, vitamins, baby care, pet care…"
      />
      <button type="submit">Search store</button>
    </form>
  );
}
