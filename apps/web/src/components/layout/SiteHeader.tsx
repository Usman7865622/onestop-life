import Link from 'next/link';
import styles from './site-chrome.module.css';

export default function SiteHeader() {
  return (
    <header className={styles.header}>
      <div className={styles.trustBar}>
        <div className={styles.container}>
          <span>Thoughtful essentials for everyday care</span>
          <div><span>Free delivery over <strong>Rs. 3,000</strong></span><i aria-hidden="true" /><span>Cash on delivery available</span></div>
        </div>
      </div>

      <div className={styles.mainBar}>
        <div className={`${styles.container} ${styles.mainBarInner}`}>
          <Link className={styles.brand} href="/" aria-label="OneStop Life home">
            <span className={styles.brandMark} aria-hidden="true">O<span /></span>
            <span className={styles.brandWords}><strong>OneStop <b>Life</b></strong><small>EVERYDAY CARE, MADE EASIER</small></span>
          </Link>

          <nav className={styles.navigation} aria-label="Main navigation">
            <Link href="/">Home</Link>
            <Link href="/products">Shop</Link>
            <Link href="/#trending">Trending</Link>
            <Link href="/#why-onestop">Our promise</Link>
            <Link href="/#contact">Support</Link>
          </nav>

          <div className={styles.actions}>
            <Link className={styles.accountLink} href="/#account">Account</Link>
            <Link className={styles.cartLink} href="/cart" aria-label="Open shopping cart">
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
                <path d="M3.5 4.5h2l2.1 10.2a2 2 0 0 0 2 1.6h7.9a2 2 0 0 0 1.9-1.4l1.4-6.1H6.4M9.2 20h.1m7.3 0h.1" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>Cart</span>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
