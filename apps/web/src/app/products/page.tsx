import Link from 'next/link';
import CatalogClient from './CatalogClient';
import styles from './page.module.css';

type Product = {
  id: string;
  nameEn: string;
  nameUr?: string;
  priceMinor: number;
  unit?: string;
  category?: string;
  imageUrl?: string;
  inStock?: boolean;
};

const API_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

async function getProducts(): Promise<Product[]> {
  try {
    const response = await fetch(`${API_URL}/products`, { cache: 'no-store' });
    if (!response.ok) return [];
    const payload = (await response.json()) as { items?: Product[] };
    return payload.items ?? [];
  } catch {
    return [];
  }
}

export default async function ProductsPage() {
  const products = await getProducts();

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <header className={styles.header}>
          <div>
            <Link className={styles.backLink} href="/">OneStop Life</Link>
            <p className={styles.kicker}>OneStop marketplace</p>
            <h1>Better care, delivered.</h1>
            <p className={styles.subtitle}>Trusted health, home, baby, wellness, and veterinary essentials in one considered store.</p>
          </div>
          <span className={styles.count}>{products.length} products</span>
        </header>
        <section className={styles.visualBanner} aria-label="OneStop care collections">
          <div className={styles.visualCopy}><span className={styles.campaignTag}>THE ONESTOP EDIT</span><p>Small upgrades. Better everyday.</p><h2>Care that looks good in your home.</h2><Link href="#shop-by-need">Shop the collection <span aria-hidden="true">-&gt;</span></Link></div>
          <div className={`${styles.visualTile} ${styles.visualHomeHealth}`}><div className={styles.visualTileContent}><span><b>01</b> Home health</span><strong>Feel prepared.</strong></div></div>
          <div className={`${styles.visualTile} ${styles.visualPetCare}`}><div className={styles.visualTileContent}><span><b>02</b> Pet care</span><strong>Care deeply.</strong></div></div>
          <div className={`${styles.visualTile} ${styles.visualElectronics}`}><div className={styles.visualTileContent}><span><b>03</b> Smart living</span><strong>Live lighter.</strong></div></div>
        </section>
        <section className={styles.needStrip} id="shop-by-need" aria-label="Shop by need">
          <div className={styles.needIntro}><p>SHOP BY NEED</p><h2>Find your next useful thing.</h2></div>
          <a className={styles.needStayWell} href="#electronics-&-appliances"><i aria-hidden="true">+</i><strong>Stay well</strong><span>Health devices <b aria-hidden="true">-&gt;</b></span></a>
          <a className={styles.needPets} href="#pet-care"><i aria-hidden="true">♥</i><strong>Care for pets</strong><span>Vet essentials <b aria-hidden="true">-&gt;</b></span></a>
          <a className={styles.needFeelBetter} href="#wellness"><i aria-hidden="true">✦</i><strong>Feel better</strong><span>Wellness picks <b aria-hidden="true">-&gt;</b></span></a>
          <a className={styles.needPrepared} href="#home-health"><i aria-hidden="true">✓</i><strong>Be prepared</strong><span>Home health <b aria-hidden="true">-&gt;</b></span></a>
        </section>
        {products.length ? <CatalogClient products={products} /> : <section className={styles.emptyState}><div className={styles.emptyIcon}>+</div><h2>No products yet</h2><p>Products will appear here after the catalogue import is completed.</p><Link className={styles.homeLink} href="/">Back to portal</Link></section>}
      </div>
    </main>
  );
}
