'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { SectionIcon } from '../home/SectionIcons';
import { apiFetch } from '../../lib/auth/api';
import { readAccessToken } from '../../lib/auth/session';
import type { PublicUser } from '../../lib/auth/types';
import styles from './account-menu.module.css';

export default function AccountMenu() {
  const router = useRouter();
  const [user, setUser] = useState<PublicUser | null>(null);
  const [checked, setChecked] = useState(false);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const token = readAccessToken();
    if (!token) { setChecked(true); return; }
    let cancelled = false;
    void apiFetch<PublicUser>('/users/me', { method: 'GET' }, token)
      .then((me) => { if (!cancelled) setUser(me); })
      .catch(() => { if (!cancelled) setUser(null); })
      .finally(() => { if (!cancelled) setChecked(true); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const logout = () => {
    try {
      localStorage.removeItem('osl-access-token');
      localStorage.removeItem('osl-refresh-token');
    } catch { /* ignore */ }
    setUser(null);
    setOpen(false);
    router.push('/');
    router.refresh();
  };

  if (!checked) return <span className={styles.skeleton} />;

  if (!user) {
    return (
      <div className={styles.guest}>
        <Link href="/login" className={styles.login}>Login</Link>
        <Link href="/login?mode=signup" className={styles.signup}>Sign up</Link>
      </div>
    );
  }

  const first = user.name?.split(' ')[0] ?? 'Account';

  return (
    <div ref={ref} className={styles.wrap}>
      <button
        type="button"
        className={styles.trigger}
        onClick={() => setOpen(o => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span className={styles.avatar} aria-hidden="true">
          <SectionIcon name="user" size={18} />
        </span>
        <span className={styles.name}>{first}</span>
        <SectionIcon name="chevron" size={14} />
      </button>
      {open && (
        <div className={styles.menu} role="menu">
          <div className={styles.menuHead}>
            <strong>{user.name ?? 'Account'}</strong>
            <small>{user.roles?.[0] ?? 'Patient'}</small>
          </div>
          <Link href="/dashboard" role="menuitem" onClick={() => setOpen(false)}>
            <SectionIcon name="grid" size={16} /> Dashboard
          </Link>
          <Link href="/appointments" role="menuitem" onClick={() => setOpen(false)}>
            <SectionIcon name="calendar" size={16} /> My Appointments
          </Link>
          <Link href="/cart" role="menuitem" onClick={() => setOpen(false)}>
            <SectionIcon name="cart" size={16} /> My Cart
          </Link>
          <button type="button" role="menuitem" onClick={logout} className={styles.logout}>
            <SectionIcon name="logout" size={16} /> Logout
          </button>
        </div>
      )}
    </div>
  );
}
