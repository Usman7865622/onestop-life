'use client';

import Link from 'next/link';
import { useState } from 'react';
import { SectionIcon } from '../home/SectionIcons';
import styles from './mega-menu.module.css';

const CATEGORIES = [
  { name: 'Trending essentials', href: '/products#trending-essentials', icon: 'bolt' },
  { name: 'Home health', href: '/products#home-health', icon: 'plus' },
  { name: 'Wellness', href: '/products#wellness', icon: 'heart' },
  { name: 'Vitamins', href: '/products#vitamins', icon: 'pill' },
  { name: 'Personal care', href: '/products#personal-care', icon: 'spark' },
  { name: 'Baby care', href: '/products#baby-care', icon: 'users' },
  { name: 'Pet care', href: '/products#pet-care', icon: 'heart' },
  { name: 'Devices', href: '/products#devices', icon: 'grid' },
] as const;

const MORE_LINKS = [
  { name: 'Facilities', href: '/facilities' },
  { name: 'My Appointments', href: '/appointments' },
  { name: 'Trending', href: '/#trending' },
  { name: 'Our promise', href: '/#why-onestop' },
  { name: 'Support', href: '/#contact' },
  { name: 'Contact', href: '/contact' },
];

export function ShopMegaMenu() {
  const [open, setOpen] = useState(false);
  let timer: ReturnType<typeof setTimeout> | null = null;

  const enter = () => { if (timer) clearTimeout(timer); setOpen(true); };
  const leave = () => { timer = setTimeout(() => setOpen(false), 150); };

  return (
    <div className={styles.megaWrap} onMouseEnter={enter} onMouseLeave={leave}>
      <Link
        href="/products"
        className={styles.navLink}
        aria-haspopup="true"
        aria-expanded={open}
        onFocus={enter}
      >
        Shop <SectionIcon name="chevron" size={13} />
      </Link>
      {open && (
        <div className={styles.mega} role="menu">
          <div className={styles.megaGrid}>
            <div>
              <p className={styles.megaTitle}>Shop by category</p>
              <div className={styles.catGrid}>
                {CATEGORIES.map(c => (
                  <Link key={c.name} href={c.href} className={styles.catLink} onClick={() => setOpen(false)}>
                    <span className={styles.catIcon}><SectionIcon name={c.icon as any} size={18} /></span>
                    {c.name}
                  </Link>
                ))}
              </div>
            </div>
            <Link href="/products" className={styles.promo} onClick={() => setOpen(false)}>
              <span className={styles.promoBadge}>Limited time</span>
              <strong>Flash deals up to 20% off</strong>
              <small>Medicines, wellness & home essentials</small>
              <span className={styles.promoCta}>Shop deals <SectionIcon name="arrowRight" size={14} /></span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export function MoreMenu() {
  const [open, setOpen] = useState(false);
  let timer: ReturnType<typeof setTimeout> | null = null;

  const enter = () => { if (timer) clearTimeout(timer); setOpen(true); };
  const leave = () => { timer = setTimeout(() => setOpen(false), 150); };

  return (
    <div className={styles.megaWrap} onMouseEnter={enter} onMouseLeave={leave}>
      <button
        type="button"
        className={styles.navLink}
        aria-haspopup="true"
        aria-expanded={open}
        onFocus={enter}
        onClick={() => setOpen(o => !o)}
      >
        More <SectionIcon name="chevron" size={13} />
      </button>
      {open && (
        <div className={`${styles.mega} ${styles.more}`} role="menu">
          {MORE_LINKS.map(l => (
            <Link key={l.name} href={l.href} className={styles.moreLink} onClick={() => setOpen(false)}>
              {l.name}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
