import PharmacyClient from './PharmacyClient';
import styles from './page.module.css';
import type { Medicine, MedicineClass } from '../../lib/pharmacy/types';

const API_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'https://api-production-7a91a.up.railway.app';

async function getMedicineClasses(): Promise<MedicineClass[]> {
  try {
    const response = await fetch(`${API_URL}/medicines/classes`, { cache: 'no-store' });
    if (!response.ok) return [];
    const payload = (await response.json()) as { items?: MedicineClass[] } | MedicineClass[];
    return Array.isArray(payload) ? payload : payload.items ?? [];
  } catch {
    return [];
  }
}

async function getMedicines(): Promise<Medicine[]> {
  const all: Medicine[] = [];
  try {
    let page = 1;
    let totalPages = 1;
    do {
      const response = await fetch(`${API_URL}/medicines?page=${page}&pageSize=100`, { cache: 'no-store' });
      if (!response.ok) break;
      const payload = (await response.json()) as { items?: Medicine[]; totalPages?: number };
      all.push(...(payload.items ?? []));
      totalPages = payload.totalPages ?? 1;
      page += 1;
    } while (page <= totalPages && page <= 10);
  } catch {
    return all;
  }
  return all;
}

export default async function PharmacyPage() {
  const [medicines, classes] = await Promise.all([getMedicines(), getMedicineClasses()]);
  const totalFromClasses = classes.reduce((sum, item) => sum + item.count, 0);
  const total = totalFromClasses || medicines.length;
  const rxCount = medicines.filter((medicine) => medicine.requiresRx).length;
  const otcCount = medicines.length - rxCount;

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <header className={styles.hero}>
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>Pharmacy · Genuine Medicines · Home Delivery</p>
            <h1>Your pharmacy, delivered</h1>
            <p className={styles.heroSub}>Browse genuine medicines by condition, compare pack sizes and prices upfront, and order for cash-on-delivery. Prescription-required items are clearly marked before you check out.</p>
            <div className={styles.heroBadges}>
              <span>Genuine, sealed packs</span>
              <span>Upfront prices</span>
              <span>COD available</span>
            </div>
          </div>
          <div className={styles.heroStats} aria-label="Pharmacy summary">
            <div><strong>{total || 200}+</strong><span>Medicines listed</span></div>
            <div><strong>{classes.length || 13}</strong><span>Care categories</span></div>
            <div><strong>{otcCount}</strong><span>No prescription needed</span></div>
          </div>
        </header>

        <section className={styles.trustStrip} aria-label="Why order medicines with OneStop Life">
          <article><strong>Licensed pharmacy partners</strong><span>Medicines are dispensed by licensed pharmacies.</span></article>
          <article><strong>Rx checked before dispatch</strong><span>Items marked “Rx required” need a valid prescription, which our team will ask for before delivery.</span></article>
          <article><strong>Sealed &amp; in-date packs</strong><span>Every pack is sealed and checked before it leaves the shelf.</span></article>
          <article><strong>Free delivery over Rs. 3,000</strong><span>Standard delivery is Rs. 150, free above the threshold.</span></article>
        </section>

        <PharmacyClient medicines={medicines} classes={classes} />
      </div>
    </main>
  );
}
