import Link from 'next/link';
import HeroSearch from '../components/home/HeroSearch';
import HomeAccountBar from '../components/home/HomeAccountBar';
import styles from './page.module.css';
import type { Doctor, Facility } from '../lib/doctors/types';
import { doctorAvatarStyle, doctorInitials, money as doctorMoney } from '../lib/doctors/types';

const API_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'https://api-production-7a91a.up.railway.app';

type Product = {
  id: string;
  nameEn: string;
  nameUr?: string | null;
  priceMinor: number;
  unit: string;
  category: string | null;
  imageUrl: string | null;
  inStock: boolean;
};

function money(minor: number) {
  return `Rs. ${(minor / 100).toLocaleString('en-PK', { maximumFractionDigits: 0 })}`;
}

function comparePrice(minor: number) {
  return money(Math.round(minor * 1.25));
}

async function getProducts(): Promise<Product[]> {
  try {
    const response = await fetch(`${API_URL}/products`, { cache: 'no-store' });
    if (!response.ok) return [];
    const payload = (await response.json()) as { items?: Product[] };
    return payload.items ?? [];
  } catch { return []; }
}

async function getDoctors(): Promise<Doctor[]> {
  try {
    const response = await fetch(`${API_URL}/doctors`, { cache: 'no-store' });
    if (!response.ok) return [];
    const payload = (await response.json()) as { items?: Doctor[] };
    return payload.items ?? [];
  } catch { return []; }
}

async function getFacilities(): Promise<Facility[]> {
  try {
    const response = await fetch(`${API_URL}/facilities`, { cache: 'no-store' });
    if (!response.ok) return [];
    const payload = (await response.json()) as Facility[] | { items?: Facility[] };
    return Array.isArray(payload) ? payload : payload.items ?? [];
  } catch { return []; }
}

function ProductCard({ product, badge }: { product: Product; badge?: string }) {
  return (
    <article className={styles.productCard}>
      <div className={styles.productImage} role="img" aria-label={`${product.nameEn} product image`} style={product.imageUrl ? { backgroundImage: `url(${product.imageUrl})` } : undefined}>
        {!product.imageUrl ? product.nameEn.slice(0, 1) : null}
        {badge ? <span className={styles.productBadge}>{badge}</span> : null}
      </div>
      <div className={styles.productBody}>
        <span className={styles.productCategory}>{product.category ?? 'Everyday care'}</span>
        <h3>{product.nameEn}</h3>
        <div className={styles.productPriceRow}>
          <strong>{money(product.priceMinor)}</strong>
          <span>{product.unit}</span>
        </div>
        <span className={product.inStock === false ? styles.outOfStock : styles.inStock}>{product.inStock === false ? 'Out of stock' : 'Ready to ship'}</span>
        <Link className={styles.productLink} href="/products">Shop now →</Link>
      </div>
    </article>
  );
}

export default async function HomePage() {
  const [products, doctors, facilities] = await Promise.all([getProducts(), getDoctors(), getFacilities()]);

  const trending = products.filter((p) => (p.category ?? '').toLowerCase().includes('trending'));
  const trendingToShow = (trending.length ? trending : products).slice(0, 8);
  const deals = [...products].sort((a, b) => b.priceMinor - a.priceMinor).slice(0, 4);
  const categoryCounts = new Map<string, number>();
  for (const product of products) {
    const category = product.category ?? 'Everyday care';
    categoryCounts.set(category, (categoryCounts.get(category) ?? 0) + 1);
  }
  const categories = Array.from(categoryCounts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const topDoctors = doctors.slice(0, 3);

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <HomeAccountBar />

        <section className={styles.hero} aria-labelledby="home-hero-heading">
          <div className={styles.heroCopy}>
            <span className={styles.badge}>Healthcare + everyday store · Pakistan</span>
            <h1 id="home-hero-heading">Good care should feel this easy.</h1>
            <p>Book verified doctors, shop genuine medicines and daily essentials, and get COD delivery — all from one calm, professional OneStop Life store.</p>
            <HeroSearch />
            <div className={styles.heroActions}>
              <Link className={styles.primaryButton} href="/products">Explore the store</Link>
              <Link className={styles.secondaryButtonLight} href="/doctors">Book a doctor</Link>
            </div>
            <div className={styles.heroProof}>
              <span><strong>{products.length || 36}+</strong> products</span>
              <span><strong>{doctors.length || 12}+</strong> verified doctors</span>
              <span><strong>{facilities.length || 5}</strong> clinics &amp; hospitals</span>
            </div>
          </div>
          <div className={styles.heroPanel} aria-label="Popular care picks">
            <div className={`${styles.heroTile} ${styles.heroTileTall}`}><span>Home health</span><strong>Ready for the everyday.</strong></div>
            <div className={styles.heroTile}><span>Doctors</span><strong>Book in minutes.</strong></div>
            <div className={styles.heroTile}><span>Wellness</span><strong>Small rituals. Better days.</strong></div>
          </div>
        </section>

        <section className={styles.trustStrip} aria-label="Why shoppers trust OneStop Life">
          <article><strong>Cash on delivery</strong><span>Pay at your door. Free delivery over Rs. 3,000.</span></article>
          <article><strong>Verified professionals</strong><span>Doctors and businesses are licence-checked.</span></article>
          <article><strong>Fast, tracked delivery</strong><span>Clear pricing from shelf to doorstep.</span></article>
          <article><strong>Genuine medicines</strong><span>Sourced for everyday care you can trust.</span></article>
        </section>

        <section className={styles.section} aria-labelledby="categories-heading">
          <div className={styles.sectionHeader}>
            <div><p className={styles.kicker}>Shop by need</p><h2 id="categories-heading">Categories for daily life</h2><p>Start with what your home needs today.</p></div>
            <Link className={styles.textLink} href="/products">View all products</Link>
          </div>
          {categories.length ? (
            <div className={styles.categoryGrid}>
              {categories.map(([category, count]) => (
                <Link key={category} className={styles.categoryTile} href={`/products#${category.toLowerCase().replaceAll(' ', '-').replaceAll('&', '-')}`}>
                  <span className={styles.categoryIcon} aria-hidden="true">{category.slice(0, 1)}</span>
                  <strong>{category}</strong>
                  <span>{count} product{count === 1 ? '' : 's'}</span>
                </Link>
              ))}
            </div>
          ) : <p className={styles.emptyNote}>Categories will appear as soon as the catalogue is available.</p>}
        </section>

        <section className={styles.section} id="trending" aria-labelledby="trending-heading">
          <div className={styles.sectionHeader}>
            <div><p className={styles.kicker}>Trending today · Updated for 2026</p><h2 id="trending-heading">Trending today</h2><p>The health and daily-life picks Pakistan is reaching for right now — smart bands, sun protection, protein, air care and more.</p></div>
            <Link className={styles.textLink} href="/products">Shop trending</Link>
          </div>
          {trendingToShow.length ? (
            <div className={styles.productGrid}>
              {trendingToShow.map((product) => <ProductCard key={product.id} product={product} badge="Trending" />)}
            </div>
          ) : <p className={styles.emptyNote}>Trending products will appear here shortly.</p>}
        </section>

        <section className={styles.sectionAlt} aria-labelledby="deals-heading">
          <div className={styles.sectionHeader}>
            <div><p className={styles.kicker}>Today&apos;s value picks</p><h2 id="deals-heading">Deals worth a look</h2><p>Premium care picks with a clear was/now view. Final price is always confirmed at checkout — no fake stock, no surprises.</p></div>
            <Link className={styles.textLink} href="/products">See all deals</Link>
          </div>
          {deals.length ? (
            <div className={styles.productGrid}>
              {deals.map((product) => (
                <article className={styles.productCard} key={product.id}>
                  <div className={styles.productImage} role="img" aria-label={`${product.nameEn} product image`} style={product.imageUrl ? { backgroundImage: `url(${product.imageUrl})` } : undefined}>{!product.imageUrl ? product.nameEn.slice(0, 1) : null}<span className={styles.dealBadge}>Save 20%</span></div>
                  <div className={styles.productBody}>
                    <span className={styles.productCategory}>{product.category ?? 'Everyday care'}</span>
                    <h3>{product.nameEn}</h3>
                    <div className={styles.dealPriceRow}><strong>{money(product.priceMinor)}</strong><s>{comparePrice(product.priceMinor)}</s></div>
                    <span className={styles.inStock}>Ready to ship · COD available</span>
                    <Link className={styles.productLink} href="/products">Grab this deal →</Link>
                  </div>
                </article>
              ))}
            </div>
          ) : null}
        </section>

        <section className={styles.doctorsBanner} aria-labelledby="doctors-heading">
          <div className={styles.doctorsCopy}>
            <p className={styles.kickerLight}>Doctors · Clinics · Video visits</p>
            <h2 id="doctors-heading">Book a verified doctor in minutes</h2>
            <p>Upfront fees, real clinic locations and Urdu/English support across Lahore, Karachi and Islamabad.</p>
            <Link className={styles.primaryButton} href="/doctors">Book a doctor</Link>
          </div>
          <div className={styles.doctorMiniGrid}>
            {topDoctors.length ? topDoctors.map((doctor) => {
              const facility = doctor.facilities[0]?.facility;
              return (
                <Link key={doctor.id} className={styles.doctorMiniCard} href={`/doctors/${doctor.id}`}>
                  <span className={styles.doctorAvatar} style={doctorAvatarStyle(doctor.speciality)} aria-hidden="true">{doctorInitials(doctor.user.name)}</span>
                  <span className={styles.doctorMiniBody}>
                    <strong>{doctor.user.name ?? 'Doctor'}</strong>
                    <span>{doctor.speciality}{facility ? ` · ${facility.city}` : ''}</span>
                    <span>{doctorMoney(doctor.feeMinor)} · {doctor.experienceYears} yrs exp.</span>
                  </span>
                </Link>
              );
            }) : <p className={styles.doctorFallback}>Verified doctors will appear here soon. <Link href="/doctors">Browse doctors →</Link></p>}
          </div>
        </section>

        {facilities.length ? (
          <section className={styles.section} aria-labelledby="facilities-heading">
            <div className={styles.sectionHeader}>
              <div><p className={styles.kicker}>Clinics &amp; hospitals</p><h2 id="facilities-heading">Care near you</h2><p>Clinics, hospitals and labs already on OneStop Life.</p></div>
              <Link className={styles.textLink} href="/doctors">Find care</Link>
            </div>
            <div className={styles.facilityStrip}>
              {facilities.slice(0, 5).map((facility) => (
                <article key={facility.id} className={styles.facilityCard}>
                  <span className={styles.facilityType}>{facility.type.replaceAll('_', ' ')}{facility.isEmergency ? ' · 24/7' : ''}</span>
                  <strong>{facility.name}</strong>
                  <span>{facility.address}, {facility.city}</span>
                  {facility.timings ? <span>{facility.timings}</span> : null}
                </article>
              ))}
            </div>
          </section>
        ) : null}

        <section className={styles.section} id="why-onestop" aria-labelledby="why-heading">
          <div className={styles.sectionHeader}>
            <div><p className={styles.kicker}>A calmer way to shop for care</p><h2 id="why-heading">Why OneStop</h2><p>Useful products and trusted professional access, together in one place.</p></div>
          </div>
          <div className={styles.whyGrid}>
            <article><span>01</span><h3>One considered catalogue</h3><p>Health, home, baby, wellness and veterinary essentials in one clear store.</p></article>
            <article><span>02</span><h3>Built around real life</h3><p>Save your details, repeat useful orders and keep doctor bookings close by.</p></article>
            <article><span>03</span><h3>Clear from shelf to door</h3><p>Simple pricing, visible availability, delivery thresholds and checkout you can understand.</p></article>
            <article><span>04</span><h3>Trust you can check</h3><p>Verified doctors and businesses, upfront fees and licences reviewed by our team.</p></article>
          </div>
        </section>

        <section className={styles.sectionAlt} aria-labelledby="how-heading">
          <div className={styles.sectionHeader}>
            <div><p className={styles.kicker}>Simple by design</p><h2 id="how-heading">How it works</h2></div>
          </div>
          <div className={styles.stepsGrid}>
            <article><span>1</span><h3>Choose your path</h3><p>Sign in as a patient, doctor, pharmacy/business or admin — we ask first, every time.</p></article>
            <article><span>2</span><h3>Book or shop</h3><p>Pick a doctor with an upfront fee, or add genuine essentials to your cart.</p></article>
            <article><span>3</span><h3>Relax, we deliver care</h3><p>Visit the clinic, join by video, or pay COD at your door. Track everything in your dashboard.</p></article>
          </div>
        </section>

        <section className={styles.section} aria-labelledby="stories-heading">
          <div className={styles.sectionHeader}>
            <div><p className={styles.kicker}>Customer stories</p><h2 id="stories-heading">Loved for everyday care</h2><p>Demo stories from early OneStop Life customers.</p></div>
          </div>
          <div className={styles.testimonialGrid}>
            <figure><blockquote>“Booked a dermatologist in Lahore the same evening. Fee was clear before I confirmed — no surprises at the clinic.”</blockquote><figcaption>Ayesha K. · Lahore · Doctor booking</figcaption></figure>
            <figure><blockquote>“My monthly vitamins and baby essentials arrive together now. COD makes it easy for my parents to order too.”</blockquote><figcaption>Bilal R. · Karachi · Store customer</figcaption></figure>
            <figure><blockquote>“As a seller, verification was straightforward and my products were live without chasing support.”</blockquote><figcaption>Pharmacy partner · Islamabad · Business</figcaption></figure>
          </div>
        </section>

        <section className={styles.ctaSection} id="contact" aria-labelledby="cta-heading">
          <div>
            <p className={styles.kickerLight}>One account for care &amp; commerce</p>
            <h2 id="cta-heading">Get care updates, deals and refill reminders.</h2>
            <p>Join OneStop Life today, or talk to our team about products, delivery, professional verification or an existing order.</p>
          </div>
          <div className={styles.ctaActions}>
            <Link className={styles.primaryButton} href="/login">Create my account</Link>
            <a href="mailto:support@onestop.life">support@onestop.life</a>
            <a href="tel:+923001234567">+92 300 1234567</a>
            <span>Mon–Fri, 9:00–18:00 PKT</span>
          </div>
        </section>

        <section className={styles.section} aria-labelledby="faq-heading">
          <div className={styles.sectionHeader}>
            <div><p className={styles.kicker}>Good to know</p><h2 id="faq-heading">Essential information</h2></div>
          </div>
          <div className={styles.faqList}>
            <details><summary>Delivery and free shipping</summary><p>Standard delivery is Rs. 150. Orders over Rs. 3,000 qualify for free delivery. Timing depends on your address and product availability.</p></details>
            <details><summary>Returns and refunds</summary><p>Contact support with your order number for damaged, incorrect or eligible returned items. Approved refunds are recorded against the original payment.</p></details>
            <details><summary>Payment options</summary><p>Cash on delivery is available. Card checkout is enabled in test mode until a live payment gateway is connected.</p></details>
            <details><summary>How do I sign in as a doctor or business?</summary><p>Go to <Link href="/login">Login</Link>, choose Doctor or Pharmacy / Business first, then sign in. If your professional role is not approved yet, submit verification from your dashboard.</p></details>
            <details><summary>Professional verification</summary><p>Sign in, choose your path, submit your credentials from the dashboard, and our review team will assess your application.</p></details>
          </div>
        </section>
      </div>
    </main>
  );
}
