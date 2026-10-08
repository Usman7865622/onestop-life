'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import styles from '../../app/page.module.css';
import { apiFetch } from '../../lib/auth/api';
import { readAccessToken } from '../../lib/auth/session';
import type { PublicUser } from '../../lib/auth/types';

export default function HomeAccountBar() {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [checked, setChecked] = useState(false);

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

  if (!checked) return null;

  if (!user) {
    return (
      <div className={styles.accountBar}>
        <p><strong>New or returning?</strong> Choose how you want to continue — patient, doctor, business or admin — before you sign in.</p>
        <Link className={styles.accountBarButton} href="/login">Login / Sign up</Link>
      </div>
    );
  }

  return (
    <div className={styles.accountBar}>
      <p>Signed in as <strong>{user.name || user.phone || user.email}</strong> · {user.roles.join(', ') || 'Customer'}</p>
      <Link className={styles.accountBarButton} href="/dashboard">Open my dashboard</Link>
    </div>
  );
}
