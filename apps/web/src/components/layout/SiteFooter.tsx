import Link from 'next/link';
import styles from './site-chrome.module.css';

export default function SiteFooter() {
  return (
    <footer className={styles.footer} id="site-footer">
      <div className={`${styles.container} ${styles.footerMain}`}>
        <div className={styles.footerBrand}>
          <Link className={styles.footerLogo} href="/" aria-label="OneStop Life home">
            <span className={styles.brandMark} aria-hidden="true">O<span /></span>
            <span className={styles.brandWords}><strong>OneStop <b>Life</b></strong><small>EVERYDAY CARE, MADE EASIER</small></span>
          </Link>
          <p>Useful essentials for your health, home, family, and companions, all in one considered store.</p>
          <Link className={styles.footerShopCta} href="/products">Explore the store <span aria-hidden="true">→</span></Link>
        </div>

        <nav className={styles.footerColumn} aria-label="Explore OneStop">
          <h2>Explore</h2>
          <Link href="/">Home</Link>
          <Link href="/products">Shop all products</Link>
          <Link href="/pharmacy">Medicines & pharmacy</Link>
          <Link href="/doctors">Book a doctor</Link>
          <Link href="/facilities">Hospitals, clinics & labs</Link>
          <Link href="/labs">Lab tests at home</Link>
          <Link href="/blood">Blood banks & requests</Link>
          <Link href="/login">Login / Sign up</Link>
          <Link href="/dashboard">My dashboard</Link>
          <Link href="/cart">Your shopping cart</Link>
          <Link href="/#why-onestop">Why OneStop</Link>
        </nav>

        <nav className={styles.footerColumn} aria-label="Shop categories">
          <h2>Shop by need</h2>
          <Link href="/products#home-health">Home health</Link>
          <Link href="/products#pet-care">Pet care</Link>
          <Link href="/products#wellness">Wellness</Link>
          <Link href="/pharmacy">Medicines</Link>
        </nav>

        <div className={styles.footerColumn} id="footer-support">
          <h2>We&rsquo;re here to help</h2>
          <p>Questions about products, delivery, or an order?</p>
          <a href="mailto:support@onestop.life">support@onestop.life</a>
          <a href="tel:+923001234567">+92 300 1234567</a>
          <span>Mon&ndash;Fri, 9:00&ndash;18:00 PKT</span>
        </div>
      </div>

      <div className={styles.trustStrip}>
        <div className={styles.container}>
          <span>DRAP-licensed partner pharmacies</span>
          <span>Provincial healthcare commission rules</span>
          <span>PMDC-verified doctor credentials</span>
          <span>Valid prescription needed for Rx medicines</span>
          <span className={styles.trustEmergency}>Emergency? Call <a href="tel:15">15</a> or <a href="tel:1122">Rescue 1122</a></span>
        </div>
      </div>

      <div className={styles.footerBottom}>
        <div className={styles.container}>
          <span>&copy; {new Date().getFullYear()} OneStop Life. All rights reserved. &middot; Carefully chosen. Clearly delivered.</span>
          <span>
            <Link href="/privacy" style={{ color: 'inherit', marginRight: 16 }}>Privacy Policy</Link>
            <Link href="/contact" style={{ color: 'inherit' }}>Contact Us</Link>
          </span>
        </div>
      </div>
    </footer>
  );
}
