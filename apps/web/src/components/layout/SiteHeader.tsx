'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import styles from './site-chrome.module.css';
import Logo from './Logo';
import ThemeToggle from './ThemeToggle';
import { apiFetch } from '../../lib/auth/api';
import { readAccessToken } from '../../lib/auth/session';
import type { PublicUser } from '../../lib/auth/types';

export default function SiteHeader() {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const token = readAccessToken();
    if (!token) {
      setChecked(true);
      return;
    }
    let cancelled = false;
    void apiFetch<PublicUser>('/users/me', { method: 'GET' }, token)
      .then((me) => { if (!cancelled) setUser(me); })
      .catch(() => { if (!cancelled) setUser(null); })
      .finally(() => { if (!cancelled) setChecked(true); });
    return () => { cancelled = true; };
  }, []);

  return (
    <header className={styles.header}>
      <div className={styles.trustBar}>
        <div className={styles.container}>
          <div><span>Free delivery over <strong>Rs. 3,000</strong></span><i aria-hidden="true" /><span>Cash on delivery available</span></div>
        </div>
      </div>

      <div className={styles.mainBar}>
        <div className={`${styles.container} ${styles.mainBarInner}`}>
          <Link className={styles.brand} href="/" aria-label="OneStop Life home">
            <Logo size={40} />
            <span className={styles.brandWords}><strong>OneStop <b>Life</b></strong><small>EVERYDAY CARE, MADE EASIER</small></span>
          </Link>

          <nav className={styles.navigation} aria-label="Main navigation">
            <Link href="/">Home</Link>
            <Link href="/products">Shop</Link>
            <Link href="/pharmacy">Pharmacy</Link>
            <Link href="/doctors">Doctors</Link>
            <Link href="/facilities">Facilities</Link>
            <Link href="/labs">Labs</Link>
            <Link href="/blood">Blood</Link>
            <Link href="/appointments">My Appointments</Link>
            <Link href="/#trending">Trending</Link>
            <Link href="/#why-onestop">Our promise</Link>
            <Link href="/#contact">Support</Link>
          </nav>

          <div className={styles.actions}>
            <ThemeToggle />
            {checked && user ? (
              <Link className={styles.accountLink} href="/dashboard">Dashboard{user.name ? ` · ${user.name.split(' ')[0]}` : ''}</Link>
            ) : (
              <>
                <Link className={styles.loginButton} href="/login">Login</Link>
                <Link className={styles.signupButton} href="/login?mode=signup">Sign up</Link>
              </>
            )}

          </div>
        </div>
      </div>
    </header>
  );
}
