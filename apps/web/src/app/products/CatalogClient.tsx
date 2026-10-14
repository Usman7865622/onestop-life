'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import styles from './page.module.css';
import StripePaymentPanel, { validateCardFields } from '../../components/checkout/StripePaymentPanel';


type Product = {
  id: string;
  nameEn: string;
  nameUr?: string;
  priceMinor: number;
  unit?: string;
  category?: string;
  imageUrl?: string;
  inStock?: boolean;
  requiresRx?: boolean;
};


type CartLine = Product & { quantity: number };

/** Image with graceful fallback: a dead/broken URL renders the designed
 *  category tile instead of a broken-image icon. */
function ProdImg({ src, name, category, iconClassName }: { src?: string | null; name?: string; category?: string | null; iconClassName?: string }) {
  const [failed, setFailed] = useState(false);
  if (src && !failed) {
    return (
      <Image
        src={src}
        alt={name ? `${name} - product photo` : 'Product photo'}
        fill
        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
        onError={() => setFailed(true)}
      />
    );
  }
  return <CategoryIcon category={category ?? ''} className={iconClassName} />;
}
type CatalogClientProps = { products: Product[] };

const categoryLabels: Record<string, string> = {
  'Trending essentials': 'Trending essentials',
  Medicines: 'Medicines',
  'Medical devices': 'Medical devices',
  Wellness: 'Wellness',
  'Health essentials': 'Health essentials',
  'Personal care': 'Personal care',
  'Baby care': 'Baby care',
  Nutrition: 'Nutrition',
  'Pet care': 'Pet care',
  'Home health': 'Home health',
  'Electronics & appliances': 'Electronics',
};

/** Simple inline SVG icons per category (stroke style, 24px viewBox). */
const categoryIcons: Record<string, ReactNode> = {
  'Trending essentials': <path d="M13 2 4.5 13.5H11L9.5 22 19 9.5h-6.5L13 2Z" />,
  Medicines: <><path d="M9 3h6v4l4 4v9a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-9l4-4V3Z" /><path d="M12 11v6M9 14h6" /></>,
  'Medical devices': <path d="M3 12h4l2-6 4 12 2-6h6" />,
  Wellness: <path d="M12 21c-5-3.5-8-7-8-11a5 5 0 0 1 9-3 5 5 0 0 1 7 0c1.5 2 2 4 2 6 0 4-5 6.5-10 8Z" />,
  'Health essentials': <path d="M12 3v18M5 8l14 8M19 8 5 16" />,
  'Personal care': <path d="M12 3c3 4 6 7 6 11a6 6 0 0 1-12 0c0-4 3-7 6-11Z" />,
  'Baby care': <><circle cx="12" cy="12" r="8" /><path d="M9.5 12.5c.8 1 1.6 1.5 2.5 1.5s1.7-.5 2.5-1.5M9 9.5h.01M15 9.5h.01" /></>,
  Nutrition: <path d="M12 3c-4 5-7 8.5-7 12.5A7 7 0 0 0 12 22a7 7 0 0 0 7-6.5C19 11.5 16 8 12 3Z" />,
  'Pet care': <><circle cx="8" cy="9" r="1.6" /><circle cx="16" cy="9" r="1.6" /><circle cx="5.5" cy="14" r="1.6" /><circle cx="18.5" cy="14" r="1.6" /><path d="M12 11c-2.5 0-4.5 2-4.5 4.2 0 1.6 1.2 2.8 2.8 2.8 1 0 1.3-.4 1.7-.4s.7.4 1.7.4c1.6 0 2.8-1.2 2.8-2.8C16.5 13 14.5 11 12 11Z" /></>,
  'Home health': <><path d="M4 11 12 4l8 7" /><path d="M6 9.5V20h12V9.5" /><path d="M12 14v4M10 16h4" /></>,
  'Electronics & appliances': <><rect x="4" y="7" width="16" height="11" rx="2" /><path d="M9 21h6M12 18v3" /></>,
};

const catThemes: Record<string, [string, string]> = {
  'Trending essentials': ['#f85606', '#ff9a3d'],
  Medicines: ['#0d7a6f', '#14b8a6'],
  'Medical devices': ['#4f46e5', '#818cf8'],
  Wellness: ['#db2777', '#f472b6'],
  'Health essentials': ['#059669', '#34d399'],
  'Personal care': ['#c026d3', '#e879f9'],
  'Baby care': ['#f59e0b', '#fbbf24'],
  Nutrition: ['#65a30d', '#a3e635'],
  'Pet care': ['#ea580c', '#fb923c'],
  'Home health': ['#0284c7', '#38bdf8'],
  'Electronics & appliances': ['#7c3aed', '#a78bfa'],
};

function CategoryIcon({ category, className }: { category: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      {categoryIcons[category] ?? <circle cx="12" cy="12" r="8" />}
    </svg>
  );
}

function money(minor: number) {
  return `Rs. ${(minor / 100).toLocaleString('en-PK', { maximumFractionDigits: 2 })}`;
}

/** Deterministic pseudo-rating 4.2–4.9 so cards feel alive without fake review counts. */
function ratingFor(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 100;
  return (4.2 + (h % 8) / 10).toFixed(1);
}

function Stars({ value }: { value: string }) {
  const full = Math.round(parseFloat(value));
  return (
    <span className={styles.stars} aria-label={`Rated ${value} out of 5`}>
      {'★'.repeat(full)}{'☆'.repeat(5 - full)}
      <b>{value}</b>
    </span>
  );
}

const heroSlides = [
  {
    eyebrow: 'OneStop Mega Deals',
    title: 'Everyday care, unbeatable prices',
    copy: 'Medicines, wellness and home essentials with free delivery over Rs. 3,000.',
    cta: 'Shop trending',
    href: '#trending-essentials',
    theme: styles.heroTeal,
    image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=900&q=70',
    alt: 'Medicine blister packs',
    chips: [
      { icon: '★', title: 'Top rated', sub: 'Genuine sealed packs' },
      { icon: '✓', title: 'Free delivery', sub: 'On orders Rs. 3,000+' },
    ],
  },
  {
    eyebrow: 'New arrivals',
    title: 'Electronics & smart living',
    copy: 'Upgrade your routine with the latest appliances and smart devices.',
    cta: 'Explore electronics',
    href: '#electronics-appliances',
    theme: styles.heroIndigo,
    image: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=900&q=70',
    alt: 'Headphones, keyboard and mouse',
    chips: [
      { icon: '✦', title: 'New in store', sub: 'Latest gadgets' },
      { icon: '✓', title: 'COD available', sub: 'Pay at your door' },
    ],
  },
  {
    eyebrow: 'For your companions',
    title: 'Pet care, fully stocked',
    copy: 'Food, grooming and everyday care for the ones with paws.',
    cta: 'Shop pet care',
    href: '#pet-care',
    theme: styles.heroAmber,
    image: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&w=900&q=70',
    alt: 'Two happy dogs running',
    chips: [
      { icon: '♥', title: 'Loved by pets', sub: 'Vet-approved picks' },
      { icon: '✓', title: 'Ships in 24h', sub: 'Fast dispatch' },
    ],
  },
];

export default function CatalogClient({ products }: CatalogClientProps) {
  const [cart, setCart] = useState<CartLine[]>([]);
  const [cartLoaded, setCartLoaded] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [discountCode, setDiscountCode] = useState('');
  const [shippingName, setShippingName] = useState('');
  const [shippingPhone, setShippingPhone] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'CARD'>('COD');
  const [cardEmail, setCardEmail] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [cardName, setCardName] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All products');
  const [sortOrder, setSortOrder] = useState('featured');
  const pickCategory = (c: string) => { setSelectedCategory(c); setLimits({}); };
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<Product[]>([]);
  const [quickView, setQuickView] = useState<Product | null>(null);
  const [limits, setLimits] = useState<Record<string, number>>({});
  const [slide, setSlide] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const [addedId, setAddedId] = useState<string | null>(null);
  const dealsRail = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stored = window.localStorage.getItem('onestop-cart');
    if (stored) { try { setCart(JSON.parse(stored) as CartLine[]); } catch { /* ignore */ } }
    setCartLoaded(true);
    const params = new URLSearchParams(window.location.search);
    const q = params.get('q');
    if (q) setSearchTerm(q);
    const wl = window.localStorage.getItem('onestop-wishlist');
    const rc = window.localStorage.getItem('onestop-recent');
    if (wl) { try { setWishlist(JSON.parse(wl) as string[]); } catch { /* ignore */ } }
    if (rc) { try { setRecentlyViewed(JSON.parse(rc) as Product[]); } catch { /* ignore */ } }
  }, []);

  useEffect(() => {
    if (!cartLoaded) return;
    window.localStorage.setItem('onestop-cart', JSON.stringify(cart));
  }, [cart, cartLoaded]);
  useEffect(() => { window.localStorage.setItem('onestop-wishlist', JSON.stringify(wishlist)); }, [wishlist]);
  useEffect(() => { window.localStorage.setItem('onestop-recent', JSON.stringify(recentlyViewed)); }, [recentlyViewed]);
  useEffect(() => {
    const t = window.setInterval(() => setSlide((s) => (s + 1) % heroSlides.length), 6000);
    return () => window.clearInterval(t);
  }, []);
  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, []);

  const categories = useMemo(() => {
    const groups = new Map<string, Product[]>();
    for (const product of products) {
      const category = product.category ?? 'Other products';
      groups.set(category, [...(groups.get(category) ?? []), product]);
    }
    return Array.from(groups.entries());
  }, [products]);

  const flashDeals = useMemo(() => {
    const trending = categories.find(([c]) => c === 'Trending essentials')?.[1] ?? products;
    return trending.filter((p) => p.inStock !== false).slice(0, 10);
  }, [categories, products]);

  const visibleCategories = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return categories
      .map(([category, items]) => [category, items.filter((product) => {
        const okCat = selectedCategory === 'All products' || selectedCategory === category;
        const okQ = !q || `${product.nameEn} ${product.nameUr ?? ''} ${category}`.toLowerCase().includes(q);
        return okCat && okQ;
      }).sort((a, b) => {
        if (sortOrder === 'price-low') return a.priceMinor - b.priceMinor;
        if (sortOrder === 'price-high') return b.priceMinor - a.priceMinor;
        if (sortOrder === 'name') return a.nameEn.localeCompare(b.nameEn);
        return 0;
      })] as [string, Product[]])
      .filter(([, items]) => items.length > 0);
  }, [categories, searchTerm, selectedCategory, sortOrder]);

  const subtotal = cart.reduce((t, i) => t + i.priceMinor * i.quantity, 0);
  const shipping = subtotal >= 300000 || subtotal === 0 ? 0 : 15000;
  const total = subtotal + shipping;
  const cartCount = cart.reduce((t, i) => t + i.quantity, 0);

  const addToCart = (product: Product) => {
    setCart((cur) => {
      const ex = cur.find((i) => i.id === product.id);
      if (ex) return cur.map((i) => (i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i));
      return [...cur, { ...product, quantity: 1 }];
    });
    setAddedId(product.id);
    window.setTimeout(() => setAddedId((id) => (id === product.id ? null : id)), 1200);
  };
  const updateQuantity = (id: string, qty: number) =>
    setCart((cur) => (qty < 1 ? cur.filter((i) => i.id !== id) : cur.map((i) => (i.id === id ? { ...i, quantity: qty } : i))));
  const toggleWishlist = (id: string) =>
    setWishlist((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));
  const openQuickView = (product: Product) => {
    setQuickView(product);
    setRecentlyViewed((cur) => [product, ...cur.filter((i) => i.id !== product.id)].slice(0, 6));
  };

  const precheck = () => {
    const token = window.localStorage.getItem('onestop-access-token');
    if (!token) return 'Sign in from the login page before placing an order.';
    if (!shippingName.trim() || !shippingPhone.trim() || !shippingAddress.trim()) return 'Complete your delivery details before placing the order.';
    return null;
  };

  const submitCheckout = async () => {
    const token = window.localStorage.getItem('onestop-access-token');
    setBusy(true); setError(''); setMessage('');
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          items: cart.map((i) => ({ productId: i.id, quantity: i.quantity })),
          shippingName, shippingPhone, shippingAddress,
          discountCode: discountCode || undefined, paymentMethod,
        }),
      });
      const payload = (await res.json()) as { message?: string; order?: { id: string; totalMinor: number } };
      if (!res.ok) throw new Error(Array.isArray(payload.message) ? payload.message.join(', ') : payload.message ?? 'Unable to place order');
      setCart([]); setCheckoutOpen(false); setCartOpen(false); setDiscountCode('');
      setMessage(`Order ${payload.order?.id.slice(0, 8)} confirmed for ${money(payload.order?.totalMinor ?? total)}.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to place order');
    } finally { setBusy(false); }
  };

  const checkout = async () => {
    const blocked = precheck();
    if (blocked) { setError(blocked); return; }
    await submitCheckout();
  };

  /** Test-mode card payment: validates the card form, simulates gateway
   *  processing, then places the order. No real charge is ever made. */
  const payWithCard = async () => {
    const blocked = precheck();
    if (blocked) { setError(blocked); return; }
    const cardError = validateCardFields({ email: cardEmail, number: cardNumber, expiry: cardExpiry, cvc: cardCvc, name: cardName });
    if (cardError) { setError(cardError); return; }
    setBusy(true); setError('');
    await new Promise((resolve) => setTimeout(resolve, 1400));
    await submitCheckout();
  };

  // Countdown to midnight (flash deals reset daily)
  const midnight = new Date(); midnight.setHours(24, 0, 0, 0);
  const remain = Math.max(0, midnight.getTime() - now);
  const hh = String(Math.floor(remain / 3600000)).padStart(2, '0');
  const mm = String(Math.floor((remain % 3600000) / 60000)).padStart(2, '0');
  const ss = String(Math.floor((remain % 60000) / 1000)).padStart(2, '0');

  const scrollDeals = (dir: 1 | -1) =>
    dealsRail.current?.scrollBy({ left: dir * 560, behavior: 'smooth' });


  const activeSlide = heroSlides[slide];

  return (
    <div className={styles.store}>
      {/* Promo marquee */}
      <div className={styles.promoStrip} aria-label="Store offers">
        <div className={styles.promoTrack}>
          {Array.from({ length: 2 }).flatMap((_, k) => [
            <span key={`a${k}`}>Free delivery on orders over Rs. 3,000</span>,
            <span key={`b${k}`}>Cash on delivery across Pakistan</span>,
            <span key={`c${k}`}>100% genuine products</span>,
            <span key={`d${k}`}>New electronics & pet-care arrivals</span>,
          ])}
        </div>
      </div>

      {/* Store toolbar */}
      <div className={styles.storeBar}>
        <form className={styles.searchBox} role="search" onSubmit={(e) => e.preventDefault()}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
          <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search medicines, devices, groceries, pet care…" aria-label="Search products" />
          {searchTerm ? <button type="button" onClick={() => setSearchTerm('')} aria-label="Clear search">×</button> : null}
        </form>
        <div className={styles.barActions}>
          <Link href="/cart" className={styles.wishPill} aria-label="Wishlist">♡ <b>{wishlist.length}</b></Link>
          <button className={styles.cartPill} onClick={() => setCartOpen(true)} aria-label={`Open cart, ${cartCount} items`}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.5 4.5h2l2.1 10.2a2 2 0 0 0 2 1.6h7.9a2 2 0 0 0 1.9-1.4l1.4-6.1H6.4" /><circle cx="9.3" cy="20" r="1.2" /><circle cx="16.6" cy="20" r="1.2" /></svg>
            Cart {cartCount > 0 ? <b>{cartCount}</b> : null}
          </button>
        </div>
      </div>

      {message ? <p className={styles.storeMessage} role="status">{message}</p> : null}
      {error ? <p className={styles.storeError} role="alert">{error}</p> : null}

      {/* Hero carousel */}
      <section className={styles.hero} aria-label="Featured offers">
        <div className={`${styles.heroSlide} ${activeSlide.theme}`}>
          <div className={styles.heroCopy}>
            <span className={styles.heroEyebrow}>{activeSlide.eyebrow}</span>
            <h1>{activeSlide.title}</h1>
            <p>{activeSlide.copy}</p>
            <a href={activeSlide.href} className={styles.heroCta}>{activeSlide.cta} →</a>
          </div>
          <div className={styles.heroArt} aria-hidden="true">
            <div className={styles.heroImgWrap}>
              <img key={activeSlide.image} src={activeSlide.image} alt="" className={styles.heroImg} loading="eager" />
              <span className={styles.heroShade} />
            </div>
            {activeSlide.chips.map((chip, i) => (
              <div key={chip.title} className={`${styles.heroChip} ${i === 0 ? styles.chipA : styles.chipB}`}>
                <span className={styles.chipIcon}>{chip.icon}</span>
                <span><b>{chip.title}</b><small>{chip.sub}</small></span>
              </div>
            ))}
          </div>
        </div>
        <div className={styles.heroDots} role="tablist" aria-label="Choose banner">
          {heroSlides.map((s, i) => (
            <button key={s.title} role="tab" aria-selected={i === slide} className={i === slide ? styles.dotActive : styles.dot} onClick={() => setSlide(i)} aria-label={s.title} />
          ))}
        </div>
      </section>

      {/* Category icon rail */}
      <nav className={styles.catRail} aria-label="Shop by category">
        <button className={selectedCategory === 'All products' ? styles.catActive : styles.cat} onClick={() => pickCategory('All products')}>
          <span className={styles.catIcon} style={{ background: 'linear-gradient(135deg, #17233b, #3b5bdb)' }}><svg viewBox="0 0 24 24"><rect x="4" y="4" width="7" height="7" rx="1.5" /><rect x="13" y="4" width="7" height="7" rx="1.5" /><rect x="4" y="13" width="7" height="7" rx="1.5" /><rect x="13" y="13" width="7" height="7" rx="1.5" /></svg></span>
          <span>All</span>
        </button>
        {categories.map(([category, items], ci) => {
          const theme = catThemes[category] ?? ['#0d7a6f', '#14b8a6'];
          const active = selectedCategory === category;
          return (
            <button
              key={category}
              className={active ? styles.catActive : styles.cat}
              onClick={() => pickCategory(category)}
              style={{ animationDelay: `${Math.min(ci, 11) * 45}ms`, ['--cat-from' as string]: theme[0], ['--cat-to' as string]: theme[1] }}
            >
              <span className={styles.catIcon} style={{ background: `linear-gradient(135deg, ${theme[0]}, ${theme[1]})` }}>
                <CategoryIcon category={category} />
              </span>
              <span>{categoryLabels[category] ?? category}</span>
              <small>{items.length} items</small>
              {active ? <span className={styles.catGlow} aria-hidden="true" /> : null}
            </button>
          );
        })}
      </nav>

      {/* Flash deals */}
      {selectedCategory === 'All products' && !searchTerm && flashDeals.length > 0 ? (
        <section className={styles.flash} aria-labelledby="flash-heading">
          <div className={styles.flashHead}>
            <div>
              <p className={styles.flashEyebrow}><span className={styles.bolt} aria-hidden="true">⚡</span> Flash deals</p>
              <h2 id="flash-heading">Today&apos;s hottest picks</h2>
            </div>
            <div className={styles.countdown} aria-label={`Deals refresh in ${hh} hours ${mm} minutes`}>
              <span>Ends in</span><b>{hh}</b>:<b>{mm}</b>:<b>{ss}</b>
            </div>
            <div className={styles.railNav}>
              <button onClick={() => scrollDeals(-1)} aria-label="Scroll deals left">‹</button>
              <button onClick={() => scrollDeals(1)} aria-label="Scroll deals right">›</button>
            </div>
          </div>
          <div className={styles.dealsRail} ref={dealsRail}>
            {flashDeals.map((p) => (
              <article className={styles.dealCard} key={p.id}>
                <button className={styles.dealMedia} onClick={() => openQuickView(p)} aria-label={`Quick view ${p.nameEn}`}>
                  {<ProdImg src={p.imageUrl} name={p.nameEn} category={p.category} iconClassName={styles.dealIcon} />}
                  <span className={styles.hotBadge}>HOT</span>
                </button>
                <div className={styles.dealBody}>
                  <h3>{p.nameEn}</h3>
                  <Stars value={ratingFor(p.id)} />
                  <div className={styles.priceRow}><strong>{money(p.priceMinor)}</strong><span>{p.unit ?? 'per item'}</span></div>
                  <button className={styles.addBtn} onClick={() => addToCart(p)}>Add to cart</button>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {/* Trust badges */}
      <section className={styles.trustRow} aria-label="Why shop with OneStop">
        {[
          { t: '100% genuine', s: 'Sourced from verified distributors', i: <path d="M12 3l7 3v5c0 5-3.5 8.5-7 10-3.5-1.5-7-5-7-10V6l7-3Z" /> },
          { t: 'Cash on delivery', s: 'Pay at your doorstep, nationwide', i: <rect x="3" y="7" width="18" height="11" rx="2" /> },
          { t: 'Fast dispatch', s: 'Orders ship within 24 hours', i: <path d="M3 12h4l2-6 4 12 2-6h6" /> },
          { t: 'Easy returns', s: '7-day hassle-free returns', i: <><path d="M4 9a8 8 0 1 1-1 5" /><path d="M4 4v5h5" /></> },
        ].map((b) => (
          <div className={styles.trustBadge} key={b.t}>
            <svg viewBox="0 0 24 24" aria-hidden="true">{b.i}</svg>
            <div><strong>{b.t}</strong><span>{b.s}</span></div>
          </div>
        ))}
      </section>

      {/* Catalogue */}
      <div className={styles.catalogHead}>
        <h2>{selectedCategory === 'All products' ? 'Shop all categories' : categoryLabels[selectedCategory] ?? selectedCategory}</h2>
        <div className={styles.catalogTools}>
          <span><b>{visibleCategories.reduce((t, [, items]) => t + items.length, 0)}</b> products</span>
          <label>Sort <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} aria-label="Sort products">
            <option value="featured">Featured</option>
            <option value="price-low">Price: low → high</option>
            <option value="price-high">Price: high → low</option>
            <option value="name">Name A–Z</option>
          </select></label>
          {(selectedCategory !== 'All products' || searchTerm) ? (
            <button className={styles.clearBtn} onClick={() => { setSelectedCategory('All products'); setSearchTerm(''); setLimits({}); }}>Clear ✕</button>
          ) : null}
        </div>
      </div>

      {visibleCategories.length ? visibleCategories.map(([category, items]) => {
        const cid = category.toLowerCase().replaceAll(/[^a-z0-9]+/g, '-');
        const limit = limits[category] ?? (selectedCategory === 'All products' ? 10 : 20);
        const shown = items.slice(0, limit);
        const label = categoryLabels[category] ?? category;
        return (
          <section className={styles.catSection} id={cid} key={category} aria-labelledby={`${cid}-h`}>
            <div className={styles.catSectionHead}>
              <span className={styles.catSectionIcon}><CategoryIcon category={category} /></span>
              <h3 id={`${cid}-h`}>{categoryLabels[category] ?? category}</h3>
              <span className={styles.countPill}>{items.length}</span>
            </div>
            <div className={styles.grid}>
              {shown.map((p) => (
                <article className={styles.card} key={p.id}>
                  <button className={styles.cardMedia} onClick={() => openQuickView(p)} aria-label={`Quick view ${p.nameEn}`}>
                    <span className={styles.cardMediaFrame}>
                      {<ProdImg src={p.imageUrl} name={p.nameEn} category={category} iconClassName={styles.cardIcon} />}
                    </span>
                    <span className={styles.wishWrap}>
                      <span role="button" tabIndex={0} aria-label={`${wishlist.includes(p.id) ? 'Remove' : 'Save'} ${p.nameEn}`}
                        className={wishlist.includes(p.id) ? styles.wishOn : styles.wish}
                        onClick={(e) => { e.stopPropagation(); toggleWishlist(p.id); }}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); toggleWishlist(p.id); } }}>
                        {wishlist.includes(p.id) ? '♥' : '♡'}
                      </span>
                    </span>
                    {p.requiresRx ? <span className={styles.rxBadge}>Rx</span> : null}
                    {p.inStock === false ? <span className={styles.soldOut}>Sold out</span> : null}
                  </button>
                  <div className={styles.cardBody}>
                    <p className={styles.cardCat}>{categoryLabels[category] ?? category}</p>
                    <h4>{p.nameEn}</h4>
                    <Stars value={ratingFor(p.id)} />
                    <div className={styles.priceRow}><strong>{money(p.priceMinor)}</strong><span>{p.unit ?? 'per item'}</span></div>
                    <button className={addedId === p.id ? styles.addedBtn : styles.addBtn} disabled={p.inStock === false} onClick={() => addToCart(p)}>
                      {addedId === p.id ? '✓ Added' : p.inStock === false ? 'Out of stock' : 'Add to cart'}
                    </button>
                  </div>
                </article>
              ))}
            </div>
            {items.length > shown.length ? (
              <button className={styles.viewAllBtn} onClick={() => setLimits((l) => ({ ...l, [category]: (l[category] ?? (selectedCategory === 'All products' ? 10 : 20)) + (selectedCategory === 'All products' ? items.length : 20) }))}>
                {selectedCategory === 'All products' ? `View all ${items.length} ${label.toLowerCase()} →` : `Show more (${items.length - shown.length} remaining) ↓`}
              </button>
            ) : items.length > 10 && selectedCategory === 'All products' ? (
              <button className={styles.viewAllBtn} onClick={() => setLimits((l) => ({ ...l, [category]: 10 }))}>Show less ↑</button>
            ) : null}
          </section>
        );
      }) : (
        <section className={styles.noResults}>
          <h2>No products found</h2>
          <p>Try a broader search or browse all categories.</p>
          <button className={styles.heroCta} onClick={() => { setSearchTerm(''); setSelectedCategory('All products'); setLimits({}); }}>Show everything</button>
        </section>
      )}

      {/* Recently viewed */}
      {recentlyViewed.length > 0 ? (
        <section className={styles.recent} aria-labelledby="recent-h">
          <h3 id="recent-h">Recently viewed</h3>
          <div className={styles.recentRail}>
            {recentlyViewed.map((p) => (
              <button key={p.id} className={styles.recentItem} onClick={() => openQuickView(p)}>
                <strong>{p.nameEn}</strong><span>{money(p.priceMinor)}</span>
              </button>
            ))}
          </div>
        </section>
      ) : null}

      {/* Quick view */}
      {quickView ? (
        <div className={styles.overlay} role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) setQuickView(null); }}>
          <section className={styles.qv} role="dialog" aria-modal="true" aria-label={quickView.nameEn}>
            <button className={styles.qvClose} onClick={() => setQuickView(null)} aria-label="Close">×</button>
            <div className={styles.qvMedia}>
              {<ProdImg src={quickView.imageUrl} name={quickView.nameEn} category={quickView.category} iconClassName={styles.qvIcon} />}
              {quickView.requiresRx ? <span className={styles.rxBadge}>Prescription required</span> : null}
            </div>
            <div className={styles.qvBody}>
              <p className={styles.cardCat}>{quickView.category ?? 'OneStop essential'}</p>
              <h2>{quickView.nameEn}</h2>
              {quickView.nameUr ? <p className={styles.urdu}>{quickView.nameUr}</p> : null}
              <Stars value={ratingFor(quickView.id)} />
              <div className={styles.qvPrice}><strong>{money(quickView.priceMinor)}</strong><span>{quickView.unit ?? 'per item'}</span></div>
              <p className={styles.qvCopy}>Genuine product, quality-checked by OneStop. {quickView.requiresRx ? 'A valid prescription is required at checkout.' : 'Ready to ship with cash on delivery.'}</p>
              <div className={styles.qvMeta}><span>✓ In stock</span><span>✓ Ships in 24h</span><span>✓ COD available</span></div>
              <button className={styles.addBtn} disabled={quickView.inStock === false} onClick={() => { addToCart(quickView); setQuickView(null); }}>
                {quickView.inStock === false ? 'Out of stock' : 'Add to cart'}
              </button>
            </div>
          </section>
        </div>
      ) : null}

      {/* Cart drawer */}
      {cartOpen ? (
        <div className={styles.overlay} role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) setCartOpen(false); }}>
          <aside className={styles.cartDrawer} aria-label="Shopping cart">
            <div className={styles.drawerHead}>
              <div><p className={styles.cardCat}>Your order</p><h2>Cart {cartCount > 0 ? `(${cartCount})` : ''}</h2></div>
              <button className={styles.qvClose} onClick={() => setCartOpen(false)} aria-label="Close cart">×</button>
            </div>
            {cart.length ? (
              <>
                <div className={styles.cartLines}>
                  {cart.map((i) => (
                    <div className={styles.cartLine} key={i.id}>
                      <div className={styles.lineInfo}><strong>{i.nameEn}</strong><span>{money(i.priceMinor)} {i.unit ? `/ ${i.unit}` : ''}</span></div>
                      <div className={styles.qty}>
                        <button onClick={() => updateQuantity(i.id, i.quantity - 1)} aria-label={`Remove one ${i.nameEn}`}>−</button>
                        <span>{i.quantity}</span>
                        <button onClick={() => updateQuantity(i.id, i.quantity + 1)} aria-label={`Add one ${i.nameEn}`}>+</button>
                      </div>
                      <b>{money(i.priceMinor * i.quantity)}</b>
                    </div>
                  ))}
                </div>
                <div className={styles.cartFoot}>
                  <div className={styles.totals}><span>Subtotal</span><b>{money(subtotal)}</b><span>Delivery</span><b>{shipping ? money(shipping) : 'Free'}</b><span className={styles.grand}>Total</span><b className={styles.grand}>{money(total)}</b></div>
                  {shipping > 0 ? <p className={styles.freeShipNote}>Add {money(300000 - subtotal)} more for free delivery</p> : <p className={styles.freeShipNote}>🎉 You unlocked free delivery</p>}
                  <button className={styles.checkoutBtn} onClick={() => { setCheckoutOpen(true); setCartOpen(false); }}>Checkout →</button>
                </div>
              </>
            ) : <p className={styles.emptyCart}>Your cart is empty — grab a deal above.</p>}
          </aside>
        </div>
      ) : null}

      {/* Checkout */}
      {checkoutOpen ? (
        <div className={styles.overlay} role="presentation">
          <section className={styles.checkout} aria-label="Checkout">
            <div className={styles.drawerHead}>
              <div><p className={styles.cardCat}>Secure checkout</p><h2>Delivery & payment</h2></div>
              <button className={styles.qvClose} onClick={() => setCheckoutOpen(false)} aria-label="Close checkout">×</button>
            </div>
            <div className={styles.coSteps}><span className={styles.stepOn}><b>1</b> Details</span><i /><span><b>2</b> Payment</span><i /><span><b>3</b> Done</span></div>
            <div className={styles.coGrid}>
              <div className={styles.coForm}>
                <label><span>Full name</span><input value={shippingName} onChange={(e) => setShippingName(e.target.value)} autoComplete="name" /></label>
                <label><span>Phone</span><input value={shippingPhone} onChange={(e) => setShippingPhone(e.target.value)} autoComplete="tel" /></label>
                <label><span>Delivery address</span><textarea value={shippingAddress} onChange={(e) => setShippingAddress(e.target.value)} rows={3} autoComplete="street-address" /></label>
                <label><span>Discount code</span><input value={discountCode} onChange={(e) => setDiscountCode(e.target.value.toUpperCase())} placeholder="WELCOME10" /></label>
                <StripePaymentPanel items={cart} subtotal={subtotal} shipping={shipping} total={total} paymentMethod={paymentMethod} onPaymentMethodChange={setPaymentMethod} cardEmail={cardEmail} setCardEmail={setCardEmail} cardNumber={cardNumber} setCardNumber={setCardNumber} cardExpiry={cardExpiry} setCardExpiry={setCardExpiry} cardCvc={cardCvc} setCardCvc={setCardCvc} cardName={cardName} setCardName={setCardName} busy={busy} onPayWithCard={payWithCard} money={money} />
              </div>
              <aside className={styles.coSummary}>
                <p>Order summary</p>
                <div className={styles.totals}><span>Items ({cartCount})</span><b>{money(subtotal)}</b><span>Delivery</span><b>{shipping ? money(shipping) : 'Free'}</b><span className={styles.grand}>Total</span><b className={styles.grand}>{money(total)}</b></div>
                <button className={styles.checkoutBtn} onClick={paymentMethod === 'CARD' ? payWithCard : checkout} disabled={busy}>{busy ? 'Placing…' : `Place order · ${money(total)}`}</button>
                <small>🔒 Protected checkout · tracked delivery</small>
              </aside>
            </div>
          </section>
        </div>
      ) : null}

      {/* Sticky mobile cart */}
      {cartCount > 0 && !cartOpen && !checkoutOpen ? (
        <button className={styles.stickyCart} onClick={() => setCartOpen(true)} aria-label={`Open cart, ${cartCount} items, ${money(total)}`}>
          <span>🛒 {cartCount} item{cartCount === 1 ? '' : 's'}</span><b>{money(total)} →</b>
        </button>
      ) : null}
    </div>
  );
}
