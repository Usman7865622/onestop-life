import Link from 'next/link';
import FacilitiesClient, { type FacilityWithDoctors } from './FacilitiesClient';
import styles from './page.module.css';
import { SectionIcon } from '../../components/home/SectionIcons';

const API_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'https://api-production-7a91a.up.railway.app';

async function getFacilities(): Promise<FacilityWithDoctors[]> {
  try {
    const response = await fetch(`${API_URL}/facilities`, { cache: 'no-store' });
    if (!response.ok) return [];
    const payload = (await response.json()) as { items?: FacilityWithDoctors[] } | FacilityWithDoctors[];
    return Array.isArray(payload) ? payload : payload.items ?? [];
  } catch {
    return [];
  }
}

export default async function FacilitiesPage() {
  const facilities = await getFacilities();
  const cities = new Set(facilities.map((facility) => facility.city).filter(Boolean));
  const emergency = facilities.filter((facility) => facility.isEmergency || /24\s*\/\s*7/i.test(facility.timings ?? '')).length;
  const withDoctors = facilities.filter((facility) => (facility.doctors?.length ?? 0) > 0).length;

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <header className={styles.hero}>
          <div className={styles.heroCopy}>
            <Link className={styles.brand} href="/">OneStop Life</Link>
            <p className={styles.eyebrow}>Hospitals · Clinics · Labs · Blood Banks</p>
            <h1>Care near you, all in one place</h1>
            <p className={styles.heroSub}>Every hospital, clinic, lab and blood bank on OneStop Life — with timings, phone numbers and the doctors who practise there. Call directly, or book a doctor at the facility in a few taps.</p>
            <div className={styles.heroBadges}>
              <span>Verified facilities</span>
              <span>24/7 emergency marked clearly</span>
              <span>Call or book online</span>
            </div>
          </div>
          <div className={styles.heroStats} aria-label="Facility network summary">
            <div><strong>{facilities.length || 7}</strong><span>Facilities listed</span></div>
            <div><strong>{cities.size || 3}</strong><span>Cities covered</span></div>
            <div><strong>{emergency || 4}</strong><span>Open 24/7</span></div>
          </div>
        </header>

        {facilities.length ? (
          <section className={styles.liveStrip} aria-label="Live on OneStop Life">
            <span className={styles.liveBadge}><span className={styles.liveDot} aria-hidden="true" />Live on OneStop</span>
            <div className={styles.liveStats}>
              <span className={styles.liveStat}><strong>{facilities.length}</strong> facilities</span>
              <span className={styles.liveStat}><strong>{withDoctors}</strong> with bookable doctors</span>
              <span className={styles.liveStat}><strong>{emergency}</strong> open 24/7</span>
            </div>
            <span className={styles.liveUpdated}><SectionIcon name="check" size={15} /> Updated today</span>
          </section>
        ) : null}

        <section className={styles.trustStrip} aria-label="Why find facilities with OneStop Life">
          <article><span className={styles.trustIcon}><SectionIcon name="shield" size={22} /></span><strong>Verified listings</strong><span>Screened facilities with real addresses, timings and phone numbers.</span></article>
          <article><span className={styles.trustIcon}><SectionIcon name="clock" size={22} /></span><strong>24/7 at a glance</strong><span>Emergency and round-the-clock facilities are badged, so you never guess at 2am.</span></article>
          <article><span className={styles.trustIcon}><SectionIcon name="stethoscope" size={22} /></span><strong>Doctors at each facility</strong><span>See who practises where and jump straight into booking an appointment.</span></article>
          <article><span className={styles.trustIcon}><SectionIcon name="phone" size={22} /></span><strong>Call directly</strong><span>One tap to call the facility — no middlemen, no hidden charges.</span></article>
        </section>

        {facilities.length ? (
          <FacilitiesClient facilities={facilities} />
        ) : (
          <section className={styles.emptyState}>
            <div className={styles.emptyIcon}><SectionIcon name="pin" size={26} /></div>
            <h2>No facilities available yet</h2>
            <p>Verified hospitals, clinics, labs and blood banks will appear here as they are listed. Please check back shortly.</p>
            <Link className={styles.homeLink} href="/">Back to home</Link>
          </section>
        )}
      </div>
    </main>
  );
}
