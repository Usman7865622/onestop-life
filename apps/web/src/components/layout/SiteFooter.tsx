'use client';

import Link from 'next/link';
import { useState } from 'react';
import styles from './site-chrome.module.css';
import { SectionIcon } from '../home/SectionIcons';

export default function SiteFooter() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const subscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes('@')) return;
    setSubscribed(true);
    try { localStorage.setItem('osl-newsletter', email); } catch { /* ignore */ }
  };

  return (
    <footer className={styles.footer} id="site-footer">
      <div className={styles.newsletter}>
        <div className={`${styles.container} ${styles.newsletterInner}`}>
          <div>
            <h2>Care updates, deals & refill reminders</h2>
            <p>One email a week. No spam, unsubscribe anytime.</p>
          </div>
          {subscribed ? (
            <p className={styles.newsOk}>You&apos;re on the list — welcome to OneStop Life.</p>
          ) : (
            <form className={styles.newsForm} onSubmit={subscribe}>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Your email address"
                aria-label="Email for newsletter"
              />
              <button type="submit">Subscribe</button>
            </form>
          )}
        </div>
      </div>

      <div className={`${styles.container} ${styles.footerMain}`}>
        <div className={styles.footerBrand}>
          <Link className={styles.footerLogo} href="/" aria-label="OneStop Life home">
            <span className={styles.brandMark} aria-hidden="true">O<span /></span>
            <span className={styles.brandWords}><strong>OneStop <b>Life</b></strong><small>EVERYDAY CARE, MADE EASIER</small></span>
          </Link>
          <p>Pakistan&apos;s healthcare super-app: verified doctors, genuine medicines, labs, blood banks and daily essentials — delivered.</p>
          <div className={styles.payRow} aria-label="Accepted payment methods">
            <span className={styles.payBadge}><SectionIcon name="cash" size={14} /> COD</span>
            <span className={styles.payBadge}><SectionIcon name="card" size={14} /> Card</span>
            <span className={styles.payBadge}><SectionIcon name="bolt" size={14} /> JazzCash</span>
            <span className={styles.payBadge}><SectionIcon name="bolt" size={14} /> Easypaisa</span>
          </div>
        </div>

        <nav className={styles.footerColumn} aria-label="Shop">
          <h2>Shop</h2>
          <Link href="/products">All products</Link>
          <Link href="/products#trending-essentials">Trending essentials</Link>
          <Link href="/products#wellness">Wellness</Link>
          <Link href="/products#baby-care">Baby care</Link>
          <Link href="/products#pet-care">Pet care</Link>
          <Link href="/cart">Your cart</Link>
        </nav>

        <nav className={styles.footerColumn} aria-label="Health services">
          <h2>Health services</h2>
          <Link href="/doctors">Book a doctor</Link>
          <Link href="/pharmacy">Pharmacy</Link>
          <Link href="/labs">Lab tests</Link>
          <Link href="/blood">Blood banks</Link>
          <Link href="/facilities">Hospitals & clinics</Link>
          <Link href="/appointments">My appointments</Link>
        </nav>

        <nav className={styles.footerColumn} aria-label="Company">
          <h2>Company</h2>
          <Link href="/#why-onestop">Why OneStop</Link>
          <Link href="/#trending">Trending</Link>
          <Link href="/dashboard">Dashboard</Link>
          <Link href="/login">Login / Sign up</Link>
        </nav>

        <div className={styles.footerColumn}>
          <h2>Support</h2>
          <p>Questions about products, delivery or an order?</p>
          <a className={styles.contactLink} href="mailto:support@onestop.life">support@onestop.life</a>
          <a className={styles.contactLink} href="tel:+923001234567">+92 300 1234567</a>
          <p>Mon–Fri, 9:00–18:00 PKT</p>
          <div className={styles.trustBadges}>
            <span className={styles.trustBadge}><SectionIcon name="shield" size={14} /> DRAP-licensed partners</span>
            <span className={styles.trustBadge}><SectionIcon name="shield" size={14} /> PMDC-verified doctors</span>
          </div>
          <p className={styles.emergency}>
            Emergency? Call <a href="tel:15">15</a> or <a href="tel:1122">Rescue 1122</a>
          </p>
        </div>
      </div>

      <div className={styles.footerBottom}>
        <div className={styles.container}>
          <span>&copy; {new Date().getFullYear()} OneStop Life. All rights reserved.</span>
          <nav aria-label="Legal">
            <Link href="/privacy">Privacy Policy</Link>
            <Link href="/contact">Contact Us</Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
