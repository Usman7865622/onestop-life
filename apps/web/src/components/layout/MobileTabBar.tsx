'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { SectionIcon, type SectionIconName } from '../home/SectionIcons';
import { useCounts } from './useCounts';
import styles from './mobile-tabbar.module.css';

const CATEGORIES = [
  'Trending essentials', 'Home health', 'Wellness', 'Vitamins',
  'Personal care', 'Baby care', 'Pet care', 'Devices',
];

function CategoryDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  if (!open) return null;
  const go = (c: string) => {
    onClose();
    router.push(`/products#${c.toLowerCase().replaceAll(' ', '-')}`);
  };
  return (
    <div className={styles.drawerOverlay} onClick={onClose}>
      <div className={styles.drawer} role="dialog" aria-label="Shop by category" onClick={(e) => e.stopPropagation()}>
        <div className={styles.drawerHead}>
          <strong>Shop by category</strong>
          <button type="button" aria-label="Close categories" onClick={onClose} className={styles.drawerClose}>
            <SectionIcon name="x" size={20} />
          </button>
        </div>
        <nav className={styles.drawerNav}>
          <button type="button" className={styles.drawerLink} onClick={() => { onClose(); router.push('/products'); }}>
            <SectionIcon name="grid" size={20} /> All products
          </button>
          {CATEGORIES.map(c => (
            <button key={c} type="button" className={styles.drawerLink} onClick={() => go(c)}>
              <SectionIcon name="chevronRight" size={18} /> {c}
            </button>
          ))}
          <button type="button" className={styles.drawerLink} onClick={() => { onClose(); router.push('/pharmacy'); }}>
            <SectionIcon name="pill" size={20} /> Pharmacy
          </button>
        </nav>
      </div>
    </div>
  );
}

export default function MobileTabBar() {
  const pathname = usePathname();
  const router = useRouter();
  const { cartCount } = useCounts();
  const [catOpen, setCatOpen] = useState(false);

  const tabs: Array<{ id: string; label: string; icon: SectionIconName; href?: string; action?: () => void; badge?: number }> = [
    { id: 'home', label: 'Home', icon: 'grid', href: '/' },
    { id: 'categories', label: 'Categories', icon: 'menu', action: () => setCatOpen(true) },
    { id: 'search', label: 'Search', icon: 'search', action: () => router.push('/products') },
    { id: 'cart', label: 'Cart', icon: 'cart', href: '/cart', badge: cartCount },
    { id: 'account', label: 'Account', icon: 'user', href: '/dashboard' },
  ];

  const isActive = (t: (typeof tabs)[number]) => {
    if (t.href === '/') return pathname === '/';
    if (t.href) return pathname.startsWith(t.href);
    return false;
  };

  return (
    <>
      <CategoryDrawer open={catOpen} onClose={() => setCatOpen(false)} />
      <nav className={styles.tabbar} aria-label="Mobile navigation">
        {tabs.map(t => {
          const active = isActive(t);
          const inner = (
            <>
              <span className={styles.tabIcon}>
                <SectionIcon name={t.icon} size={22} />
                {t.badge ? <span className={styles.tabBadge}>{t.badge > 99 ? '99+' : t.badge}</span> : null}
              </span>
              <span className={styles.tabLabel}>{t.label}</span>
            </>
          );
          const cls = `${styles.tab} ${active ? styles.active : ''}`;
          return t.href ? (
            <Link key={t.id} href={t.href} className={cls} aria-current={active ? 'page' : undefined}>{inner}</Link>
          ) : (
            <button key={t.id} type="button" className={cls} onClick={t.action}>{inner}</button>
          );
        })}
      </nav>
    </>
  );
}
