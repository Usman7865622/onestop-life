import type { Metadata } from 'next';
import Link from 'next/link';
import Breadcrumbs from '../../components/layout/Breadcrumbs';
import { pageMetadata } from '../../lib/seo';
import styles from './about.module.css';

export const metadata: Metadata = pageMetadata({
  title: 'About Us',
  description: 'OneStop Life is a Pakistani platform bringing verified doctors, labs, blood banks, pharmacies and an everyday-care store into one trusted app.',
  path: '/about',
});

const API_URL =
  process.env.API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'https://api-production-7a91a.up.railway.app';

async function count(path: string): Promise<number> {
  try {
    const res = await fetch(`${API_URL}${path}`, { cache: 'no-store' });
    if (!res.ok) return 0;
    const data = (await res.json()) as { items?: unknown[] } | unknown[];
    return Array.isArray(data) ? data.length : (data.items?.length ?? 0);
  } catch {
    return 0;
  }
}

const SERVICES = [
  { icon: '🩺', title: 'Book verified doctors', body: 'Real availability slots from PMDC-checked doctors — pick a time, book, and get seen.', href: '/doctors' },
  { icon: '🏥', title: 'Hospitals, clinics & labs', body: 'Facilities across Pakistan with clear locations, services and booking paths.', href: '/facilities' },
  { icon: '🧪', title: 'Lab tests at home', body: 'Order a test, a collector comes to your door, results come back to your dashboard.', href: '/labs' },
  { icon: '🩸', title: 'Blood banks & requests', body: 'Find blood near you, or post a request — donor contact is shared only with signed-in members.', href: '/blood' },
  { icon: '💊', title: 'Medicines & pharmacy', body: 'A full pharmacy catalogue. Prescription medicines are pharmacist-verified before dispatch.', href: '/pharmacy' },
  { icon: '🛒', title: 'Everyday-care store', body: 'Home health, wellness, mother & baby, pet care and daily essentials, delivered to your door.', href: '/products' },
];

const PRINCIPLES = [
  { title: 'Verification before listing', body: 'Doctors submit PMDC registration and are approved through a verification queue before a single patient can book them.' },
  { title: 'Reviews only after real visits', body: 'Ratings on OneStop Life come from completed appointments only — never from browsing, never bought.' },
  { title: 'Pharmacists hold the line', body: 'No prescription medicine leaves until a pharmacist has checked it against a valid prescription.' },
  { title: 'Clear money rules', body: 'Prices, delivery, discount limits and refunds are published and honoured as written.' },
];

export default async function AboutPage() {
  const [doctors, products, facilities] = await Promise.all([
    count('/doctors'),
    count('/products'),
    count('/facilities'),
  ]);
  const stats = [
    ...(doctors ? [{ value: doctors, label: 'verified doctors' }] : []),
    ...(products ? [{ value: products, label: 'products & medicines' }] : []),
    ...(facilities ? [{ value: facilities, label: 'clinics, hospitals & labs' }] : []),
  ];

  return (
    <main className={styles.page}>
      <Breadcrumbs items={[{ name: 'About Us', path: '/about' }]} />
      <header className={styles.hero}>
        <span className={styles.eyebrow}>About OneStop Life</span>
        <h1 className={styles.title}>Healthcare and daily care, finally in one place.</h1>
        <p className={styles.lead}>
          OneStop Life is a Pakistani platform that brings verified doctors, hospitals, clinics, laboratories,
          blood banks, pharmacies and an everyday-care store together in a single app — so getting care stops
          meaning five different websites and a dozen phone calls.
        </p>
        {stats.length ? (
          <div className={styles.stats} aria-label="OneStop Life in numbers">
            {stats.map((s) => (
              <span key={s.label} className={styles.stat}>
                <strong>{s.value.toLocaleString('en-PK')}</strong> {s.label}
              </span>
            ))}
          </div>
        ) : null}
      </header>

      <section aria-labelledby="about-services">
        <h2 id="about-services" className={styles.h2}>What you can do here</h2>
        <div className={styles.grid}>
          {SERVICES.map((s) => (
            <Link key={s.title} href={s.href} className={styles.card}>
              <span className={styles.cardIcon} aria-hidden="true">{s.icon}</span>
              <strong>{s.title}</strong>
              <p>{s.body}</p>
              <span className={styles.cardLink}>Open →</span>
            </Link>
          ))}
        </div>
      </section>

      <section aria-labelledby="about-principles">
        <h2 id="about-principles" className={styles.h2}>How we earn trust</h2>
        <div className={styles.grid}>
          {PRINCIPLES.map((p) => (
            <article key={p.title} className={styles.card}>
              <span className={styles.cardIcon} aria-hidden="true">✓</span>
              <strong>{p.title}</strong>
              <p>{p.body}</p>
            </article>
          ))}
        </div>
        <p className={styles.moreLink}>
          The full detail lives on our <Link href="/how-we-verify">How we verify</Link> page.
        </p>
      </section>

      <section className={styles.founder} aria-labelledby="about-founder">
        <div>
          <h2 id="about-founder" className={styles.h2}>Built in Pakistan</h2>
          <p>
            OneStop Life was founded and is run by <strong>Muhammad Usman</strong>, who started the platform in
            2026 with a simple frustration: healthcare in Pakistan is excellent in person and fragmented online.
            OneStop Life is his answer — one verified, honest place for the care a family needs every week.
          </p>
          <p>
            Questions, partnership ideas, or a facility that should be listed?{' '}
            <Link href="/contact">Write to us</Link> or email{' '}
            <a href="mailto:support@onestop.life">support@onestop.life</a>.
          </p>
        </div>
      </section>
    </main>
  );
}
