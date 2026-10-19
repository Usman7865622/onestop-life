'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import styles from './site-chrome.module.css';
import HeaderSearch from './HeaderSearch';
import CitySelector from './CitySelector';
import AccountMenu from './AccountMenu';
import { ShopMegaMenu, MoreMenu } from './ShopMegaMenu';
import { SectionIcon } from '../home/SectionIcons';
import { useCounts } from './useCounts';

export default function SiteHeader() {
  const [slim, setSlim] = useState(false);
  const { cartCount, wishCount } = useCounts();

  useEffect(() => {
    const onScroll = () => setSlim(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className={`${styles.header} ${slim ? styles.slim : ''}`}>
      <div className={styles.trustBar}>
        <div className={styles.container}>
          <span>Free delivery over <strong>Rs. 3,000</strong></span>
          <i aria-hidden="true" />
          <span>Cash on delivery available</span>
          <i aria-hidden="true" />
          <span className={styles.trustHideMobile}>PMDC-verified doctors</span>
        </div>
      </div>

      <div className={styles.mainBar}>
        <div className={`${styles.container} ${styles.mainBarInner}`}>
          <Link className={styles.brand} href="/" aria-label="OneStop Life home">
            <span className={styles.brandMark} aria-hidden="true">O<span /></span>
            <span className={styles.brandWords}>
              <strong>OneStop <b>Life</b></strong>
              <small>EVERYDAY CARE, MADE EASIER</small>
            </span>
          </Link>

          <div className={styles.searchSlot}>
            <HeaderSearch />
          </div>

          <div className={styles.headerTools}>
            <CitySelector />
            <Link href="/products" className={styles.iconBtn} aria-label={`Wishlist, ${wishCount} items`}>
              <SectionIcon name="heartOutline" size={22} />
              {wishCount > 0 && <span className={styles.badge}>{wishCount > 99 ? '99+' : wishCount}</span>}
            </Link>
            <Link href="/cart" className={styles.iconBtn} aria-label={`Cart, ${cartCount} items`}>
              <SectionIcon name="cart" size={22} />
              {cartCount > 0 && <span className={styles.badge}>{cartCount > 99 ? '99+' : cartCount}</span>}
            </Link>
            <AccountMenu />
          </div>
        </div>
      </div>

      <nav className={styles.navRow} aria-label="Main navigation">
        <div className={`${styles.container} ${styles.navInner}`}>
          <ShopMegaMenu />
          <Link href="/pharmacy" className={styles.navLink}>Pharmacy</Link>
          <Link href="/doctors" className={styles.navLink}>Doctors</Link>
          <Link href="/labs" className={styles.navLink}>Labs</Link>
          <Link href="/blood" className={styles.navLink}>Blood</Link>
          <MoreMenu />
        </div>
      </nav>
    </header>
  );
}
