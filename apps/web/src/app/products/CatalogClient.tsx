'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import styles from './page.module.css';
import StripePaymentPanel, { validateCardFields, validateWalletFields, PaymentMethodId } from '../../components/checkout/StripePaymentPanel';


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

/** The delivery address is captured in structured parts (house / street /
 *  area) and stored as one joined string, so the orders API contract and
 *  previously saved addresses stay exactly as they were. */
function splitAddress(full: string): { house: string; street: string; area: string } {
  const parts = full.split(',').map((p) => p.trim()).filter(Boolean);
  if (parts.length >= 3) return { house: parts[0], street: parts[1], area: parts.slice(2).join(', ') };
  if (parts.length === 2) return { house: '', street: parts[0], area: parts[1] };
  return { house: '', street: parts[0] ?? '', area: '' };
}

function joinAddress(house: string, street: string, area: string): string {
  return [house, street, area].map((p) => p.trim()).filter(Boolean).join(', ');
}

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

const PAKISTAN_CITIES = ['Karachi', 'Lahore', 'Islamabad', 'Rawalpindi', 'Faisalabad', 'Multan', 'Peshawar', 'Quetta', 'Hyderabad', 'Sialkot', 'Gujranwala', 'Bahawalpur', 'Sargodha', 'Abbottabad', 'Other'];

function formatPhone(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 4) return digits;
  return `${digits.slice(0, 4)} ${digits.slice(4)}`;
}

function deliveryWindow(speed: 'STANDARD' | 'EXPRESS') {
  const fmt = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Karachi', day: 'numeric', month: 'short' });
  const day = 86400000;
  const now = Date.now();
  if (speed === 'EXPRESS') return `Tomorrow, ${fmt.format(new Date(now + day))}`;
  return `${fmt.format(new Date(now + 2 * day))} – ${fmt.format(new Date(now + 4 * day))}`;
}

const PAYMENT_LABELS: Record<string, string> = { CARD: 'Card', JAZZCASH: 'JazzCash', EASYPAISA: 'Easypaisa', WALLET: 'OneStop Wallet', COD: 'Cash on delivery' };

const SLOT_TIMES = ['Morning (9 AM – 12 PM)', 'Afternoon (12 – 5 PM)', 'Evening (5 – 9 PM)'];

function slotDays(speed: 'STANDARD' | 'EXPRESS') {
  const fmt = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Karachi', weekday: 'short', day: 'numeric', month: 'short' });
  const day = 86400000;
  const now = Date.now();
  const start = speed === 'EXPRESS' ? 1 : 2;
  const count = speed === 'EXPRESS' ? 1 : 6;
  return Array.from({ length: count }, (_, i) => fmt.format(new Date(now + (start + i) * day)));
}

const GIFT_WRAP_MINOR = 10000;

export default function CatalogClient({ products }: CatalogClientProps) {
  const [cart, setCart] = useState<CartLine[]>([]);
  const [cartLoaded, setCartLoaded] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [discountCode, setDiscountCode] = useState('');
  const [shippingName, setShippingName] = useState('');
  const [shippingPhone, setShippingPhone] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [addrHouse, setAddrHouse] = useState('');
  const [addrStreet, setAddrStreet] = useState('');
  const [addrArea, setAddrArea] = useState('');
  const [coStep, setCoStep] = useState<1 | 2 | 3>(1);
  const [placedOrder, setPlacedOrder] = useState<{ id: string; totalMinor: number } | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [shippingCity, setShippingCity] = useState('');
  const [shippingPostalCode, setShippingPostalCode] = useState('');
  const [addressLabel, setAddressLabel] = useState('Home');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [deliverySpeed, setDeliverySpeed] = useState<'STANDARD' | 'EXPRESS'>('STANDARD');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodId>('COD');
  const [cardEmail, setCardEmail] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [cardName, setCardName] = useState('');
  const [walletNumber, setWalletNumber] = useState('');
  const [walletName, setWalletName] = useState('');
  const [busy, setBusy] = useState(false);
  const [saveDetails, setSaveDetails] = useState(false);
  const [slotDay, setSlotDay] = useState(0);
  const [slotTime, setSlotTime] = useState(0);
  const [giftWrap, setGiftWrap] = useState(false);
  const [giftMessage, setGiftMessage] = useState('');
  const [discountApplied, setDiscountApplied] = useState<{ code: string; amountMinor: number } | null>(null);
  const [discountBusy, setDiscountBusy] = useState(false);
  const [discountError, setDiscountError] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [storeWalletBalance, setStoreWalletBalance] = useState<number | null>(null);
  const [emiPlan, setEmiPlan] = useState('');
  const [savedAddresses, setSavedAddresses] = useState<Array<{ id: string; label: string; name: string; phone: string; address: string; city: string; postalCode?: string | null }>>([]);
  const [saveToAddressBook, setSaveToAddressBook] = useState(false);
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
  const [qvQty, setQvQty] = useState(1);
  const [toast, setToast] = useState<{ id: number; text: string } | null>(null);
  const toastTimer = useRef<number | null>(null);
  const showToast = (text: string) => {
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    setToast({ id: Date.now(), text });
    toastTimer.current = window.setTimeout(() => setToast(null), 2400);
  };
  const dealsRail = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const token = window.localStorage.getItem('onestop-access-token');
    if (token) {
      fetch('/api/wallet', { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => r.ok ? r.json() : null)
        .then((d) => { if (d && typeof d.balanceMinor === 'number') setStoreWalletBalance(d.balanceMinor); })
        .catch(() => {});
      fetch('/api/addresses', { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => r.ok ? r.json() : [])
        .then((d) => { if (Array.isArray(d)) setSavedAddresses(d); })
        .catch(() => {});
      // Prefill contact details from the account so signed-in customers
      // never retype their own name and number. Saved delivery details
      // (applied below) and anything already typed always win.
      fetch('/api/users/me', { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => r.ok ? r.json() : null)
        .then((d) => {
          if (!d) return;
          if (d.name) setShippingName((cur) => cur || d.name);
          if (d.phone) setShippingPhone((cur) => cur || formatPhone(d.phone));
        })
        .catch(() => {});
    }
    const stored = window.localStorage.getItem('onestop-cart');
    if (stored) { try { setCart(JSON.parse(stored) as CartLine[]); } catch { /* ignore */ } }
    setCartLoaded(true);
    try {
      const saved = JSON.parse(window.localStorage.getItem('onestop-delivery') ?? 'null') as null | { name?: string; phone?: string; address?: string; city?: string; postal?: string; label?: string; notes?: string };
      if (saved) {
        if (saved.name) setShippingName(saved.name);
        if (saved.phone) setShippingPhone(saved.phone);
        if (saved.address) {
          const p = splitAddress(saved.address);
          setAddrHouse(p.house); setAddrStreet(p.street); setAddrArea(p.area);
          setShippingAddress(saved.address);
        }
        if (saved.city) setShippingCity(saved.city);
        if (saved.postal) setShippingPostalCode(saved.postal);
        if (saved.label) setAddressLabel(saved.label);
        if (saved.notes) setDeliveryNotes(saved.notes);
        setSaveDetails(true);
      }
    } catch { /* ignore corrupt saved details */ }
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
  const shipping = deliverySpeed === 'EXPRESS' ? 25000 : subtotal >= 300000 || subtotal === 0 ? 0 : 15000;
  const discountMinor = discountApplied?.amountMinor ?? 0;
  const giftMinor = giftWrap ? GIFT_WRAP_MINOR : 0;
  const total = subtotal - discountMinor + shipping + giftMinor;
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
  const addToCartQty = (product: Product, qty: number) => {
    if (qty < 1) return;
    setCart((cur) => {
      const ex = cur.find((i) => i.id === product.id);
      if (ex) return cur.map((i) => (i.id === product.id ? { ...i, quantity: i.quantity + qty } : i));
      return [...cur, { ...product, quantity: qty }];
    });
    setAddedId(product.id);
    window.setTimeout(() => setAddedId((id) => (id === product.id ? null : id)), 1200);
  };
  const updateQuantity = (id: string, qty: number) =>
    setCart((cur) => (qty < 1 ? cur.filter((i) => i.id !== id) : cur.map((i) => (i.id === id ? { ...i, quantity: qty } : i))));
  const toggleWishlist = (product: Product) => {
    const adding = !wishlist.includes(product.id);
    setWishlist((cur) => (cur.includes(product.id) ? cur.filter((x) => x !== product.id) : [...cur, product.id]));
    showToast(adding ? `♥ ${product.nameEn} saved to your wishlist` : `${product.nameEn} removed from wishlist`);
  };
  const openQuickView = (product: Product) => {
    setQuickView(product);
    setQvQty(1);
    setRecentlyViewed((cur) => [product, ...cur.filter((i) => i.id !== product.id)].slice(0, 6));
  };

  const clearFieldError = (key: string) =>
    setFieldErrors((cur) => {
      if (!cur[key]) return cur;
      const next = { ...cur };
      delete next[key];
      return next;
    });

  const updateAddrPart = (part: 'house' | 'street' | 'area', value: string) => {
    const next = { house: addrHouse, street: addrStreet, area: addrArea, [part]: value };
    setAddrHouse(next.house);
    setAddrStreet(next.street);
    setAddrArea(next.area);
    setShippingAddress(joinAddress(next.house, next.street, next.area));
    if (part !== 'house') clearFieldError(part);
    setSelectedAddressId(null);
  };

  const fillAddress = (full: string) => {
    const p = splitAddress(full);
    setAddrHouse(p.house);
    setAddrStreet(p.street);
    setAddrArea(p.area);
    setShippingAddress(full);
  };

  const applySavedAddress = (a: { id: string; label: string; name: string; phone: string; address: string; city: string; postalCode?: string | null }) => {
    setShippingName(a.name);
    setShippingPhone(a.phone);
    fillAddress(a.address);
    setShippingCity(a.city);
    setShippingPostalCode(a.postalCode ?? '');
    setAddressLabel(a.label);
    setSelectedAddressId(a.id);
    setFieldErrors({});
  };

  /** Step 1 validation: every required delivery field, with a message per
   *  field so the customer fixes the exact box instead of guessing. */
  const validateDetails = (): Record<string, string> => {
    const errs: Record<string, string> = {};
    if (!shippingName.trim()) errs.name = 'Enter the name of the person receiving this order.';
    const digits = shippingPhone.replace(/\D/g, '');
    if (!digits) errs.phone = 'Enter a mobile number.';
    else if (!/^03\d{9}$/.test(digits)) errs.phone = 'Enter a valid mobile number (03XX XXXXXXX — 11 digits).';
    if (!addrStreet.trim()) errs.street = 'Enter the street address.';
    if (!addrArea.trim()) errs.area = 'Enter the area or locality.';
    if (!shippingCity.trim()) errs.city = 'Select your city.';
    return errs;
  };

  const continueToPayment = () => {
    const errs = validateDetails();
    setFieldErrors(errs);
    if (Object.keys(errs).length) {
      setError('A few delivery details are missing — they are marked in the form below.');
      return;
    }
    setError('');
    setCoStep(2);
  };

  const precheck = () => {
    const token = window.localStorage.getItem('onestop-access-token');
    if (!token) return 'Sign in from the login page before placing an order.';
    const errs = validateDetails();
    if (Object.keys(errs).length) {
      setFieldErrors(errs);
      setCoStep(1);
      return 'Your delivery details are incomplete — the missing fields are marked in step 1.';
    }
    if (paymentMethod === 'WALLET') {
      if (storeWalletBalance === null) return 'Sign in to use your OneStop wallet.';
      if (storeWalletBalance < total) return 'Insufficient wallet balance — top up from your dashboard or choose another payment method.';
    }
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
          shippingCity, shippingPostalCode: shippingPostalCode || undefined,
          addressLabel, deliveryNotes: deliveryNotes || undefined, deliverySpeed,
          deliverySlot,
          giftWrap: giftWrap || undefined,
          giftMessage: giftWrap && giftMessage.trim() ? giftMessage.trim() : undefined,
          discountCode: discountCode || undefined, paymentMethod,
          emiPlan: paymentMethod === 'CARD' && emiPlan ? emiPlan : undefined,
        }),
      });
      const payload = (await res.json()) as { message?: string; order?: { id: string; totalMinor: number } };
      if (!res.ok) throw new Error(Array.isArray(payload.message) ? payload.message.join(', ') : payload.message ?? 'Unable to place order');
      if (saveDetails) {
        window.localStorage.setItem('onestop-delivery', JSON.stringify({ name: shippingName, phone: shippingPhone, address: shippingAddress, city: shippingCity, postal: shippingPostalCode, label: addressLabel, notes: deliveryNotes }));
      } else {
        window.localStorage.removeItem('onestop-delivery');
      }
      if (saveToAddressBook) {
        const bookToken = window.localStorage.getItem('onestop-access-token');
        fetch('/api/addresses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${bookToken}` },
          body: JSON.stringify({ label: addressLabel, name: shippingName, phone: shippingPhone, address: shippingAddress, city: shippingCity, postalCode: shippingPostalCode || undefined }),
        }).catch(() => {});
        setSaveToAddressBook(false);
      }
      setCart([]); setCartOpen(false); setDiscountCode('');
      setPlacedOrder({ id: payload.order?.id ?? '', totalMinor: payload.order?.totalMinor ?? total });
      setCoStep(3);
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
  const isWallet = paymentMethod === 'JAZZCASH' || paymentMethod === 'EASYPAISA';
  const days = slotDays(deliverySpeed);
  const deliverySlot = `${days[Math.min(slotDay, days.length - 1)]} · ${SLOT_TIMES[slotTime]}`;

  /** Test-mode wallet payment: validates the mobile-wallet form, simulates
   *  the in-app approval, then places the order. No real money moves. */
  const applyDiscount = async () => {
    const code = discountCode.trim();
    if (!code) { setDiscountError('Enter a discount code first.'); return; }
    setDiscountBusy(true); setDiscountError('');
    try {
      const res = await fetch('/api/orders/validate-discount', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, subtotalMinor: subtotal }),
      });
      const payload = await res.json() as { code?: string; amountMinor?: number; message?: string | string[] };
      if (!res.ok) throw new Error(Array.isArray(payload.message) ? payload.message.join(', ') : payload.message ?? 'Invalid code');
      setDiscountApplied({ code: payload.code ?? code.toUpperCase(), amountMinor: payload.amountMinor ?? 0 });
      setDiscountCode(payload.code ?? code.toUpperCase());
    } catch (e) {
      setDiscountError(e instanceof Error ? e.message : 'Invalid code');
      setDiscountApplied(null);
    } finally { setDiscountBusy(false); }
  };

  const payWithWallet = async () => {
    const blocked = precheck();
    if (blocked) { setError(blocked); return; }
    const walletError = validateWalletFields({ number: walletNumber, name: walletName }, paymentMethod === 'JAZZCASH' ? 'JazzCash' : 'Easypaisa');
    if (walletError) { setError(walletError); return; }
    setBusy(true); setError('');
    await new Promise((resolve) => setTimeout(resolve, 1400));
    await submitCheckout();
  };

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
              {shown.map((p, idx) => {
                const cartQty = cart.find((i) => i.id === p.id)?.quantity ?? 0;
                return (
                <article className={styles.card} key={p.id} style={{ '--card-index': idx } as React.CSSProperties}>
                  <button className={styles.cardMedia} onClick={() => openQuickView(p)} aria-label={`Quick view ${p.nameEn}`}>
                    <span className={styles.cardMediaFrame}>
                      {<ProdImg src={p.imageUrl} name={p.nameEn} category={category} iconClassName={styles.cardIcon} />}
                      {p.inStock !== false ? (
                        <span className={styles.quickAdd}>
                          <span role="button" tabIndex={0} className={styles.quickAddBtn}
                            aria-label={`Quick add ${p.nameEn} to cart`}
                            onClick={(e) => { e.stopPropagation(); addToCart(p); }}
                            onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); addToCart(p); } }}>
                            {addedId === p.id ? '✓ Added to cart' : '+ Quick add'}
                          </span>
                        </span>
                      ) : null}
                    </span>
                    <span className={styles.wishWrap}>
                      <span role="button" tabIndex={0} aria-label={`${wishlist.includes(p.id) ? 'Remove' : 'Save'} ${p.nameEn}`}
                        className={wishlist.includes(p.id) ? styles.wishOn : styles.wish}
                        onClick={(e) => { e.stopPropagation(); toggleWishlist(p); }}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); toggleWishlist(p); } }}>
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
                    {cartQty > 0 ? (
                      <div className={styles.cardStepper}>
                        <div className={styles.qty}>
                          <button onClick={() => updateQuantity(p.id, cartQty - 1)} aria-label={`Remove one ${p.nameEn}`}>−</button>
                          <span>{cartQty}</span>
                          <button onClick={() => updateQuantity(p.id, cartQty + 1)} aria-label={`Add one more ${p.nameEn}`}>+</button>
                        </div>
                        <span className={styles.inCartLbl}>in your cart</span>
                      </div>
                    ) : (
                      <button className={addedId === p.id ? styles.addedBtn : styles.addBtn} disabled={p.inStock === false} onClick={() => addToCart(p)}>
                        {addedId === p.id ? '✓ Added' : p.inStock === false ? 'Out of stock' : 'Add to cart'}
                      </button>
                    )}
                  </div>
                </article>
                );
              })}
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
              <div className={styles.qvActions}>
                <div className={styles.qty} aria-label="Choose quantity">
                  <button onClick={() => setQvQty((q) => Math.max(1, q - 1))} aria-label="Decrease quantity">−</button>
                  <span>{qvQty}</span>
                  <button onClick={() => setQvQty((q) => Math.min(99, q + 1))} aria-label="Increase quantity">+</button>
                </div>
                <button className={styles.addBtn} disabled={quickView.inStock === false} onClick={() => { addToCartQty(quickView, qvQty); setQuickView(null); }}>
                  {quickView.inStock === false ? 'Out of stock' : qvQty > 1 ? `Add ${qvQty} to cart` : 'Add to cart'}
                </button>
              </div>
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
                  <button className={styles.checkoutBtn} onClick={() => { setCheckoutOpen(true); setCartOpen(false); setCoStep(1); setPlacedOrder(null); setFieldErrors({}); setError(''); }}>Checkout →</button>
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
            <div className={styles.coSteps}>
              <span className={coStep === 1 ? styles.stepOn : styles.stepDone}><b>{coStep > 1 ? '✓' : '1'}</b> Details</span><i />
              <span className={coStep === 2 ? styles.stepOn : coStep > 2 ? styles.stepDone : undefined}><b>{coStep > 2 ? '✓' : '2'}</b> Payment</span><i />
              <span className={coStep === 3 ? styles.stepOn : undefined}><b>3</b> Done</span>
            </div>
            {error && coStep !== 3 ? <p className={styles.storeError} role="alert" style={{ margin: '12px 28px 0' }}>{error}</p> : null}
            {coStep === 3 && placedOrder ? (
              <div className={styles.doneWrap}>
                <div className={styles.doneCheck} aria-hidden="true">✓</div>
                <h3>Order placed — thank you!</h3>
                <p>Order <b>#{placedOrder.id.slice(0, 8)}</b> · {money(placedOrder.totalMinor)} · {PAYMENT_LABELS[paymentMethod]}</p>
                <div className={styles.doneCard}>
                  <div><span aria-hidden="true">📍</span><p>{shippingAddress}{shippingCity ? `, ${shippingCity}` : ''} <i>({addressLabel})</i></p></div>
                  <div><span aria-hidden="true">{deliverySpeed === 'EXPRESS' ? '⚡' : '🚚'}</span><p>{deliverySpeed === 'EXPRESS' ? 'Express' : 'Standard'} · {deliverySlot}</p></div>
                  <div><span aria-hidden="true">📞</span><p>We will call {shippingPhone} if the rider needs directions.</p></div>
                </div>
                <div className={styles.doneActions}>
                  <button className={styles.checkoutBtn} onClick={() => setCheckoutOpen(false)}>Continue shopping</button>
                  <a className={styles.backBtn} href="/dashboard">Track in my dashboard →</a>
                </div>
              </div>
            ) : (
            <div className={styles.coGrid}>
              <div className={styles.coForm}>
                {coStep === 1 ? (
                  <>
                    {savedAddresses.length ? (
                      <div className={styles.addrBook}>
                        <span className={styles.slotLabel}>Deliver to a saved address</span>
                        <div className={styles.addrCards}>
                          {savedAddresses.map((a) => (
                            <button key={a.id} type="button" className={selectedAddressId === a.id ? styles.addrCardActive : styles.addrCard} onClick={() => applySavedAddress(a)}>
                              <b>{a.label} · {a.name}</b>
                              <span>{a.address}, {a.city}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : null}
                    <p className={styles.coSection}>Contact</p>
                    <div className={styles.coRow}>
                      <label><span>Full name</span><input className={fieldErrors.name ? styles.inputErr : undefined} value={shippingName} onChange={(e) => { setShippingName(e.target.value); clearFieldError('name'); }} autoComplete="name" />{fieldErrors.name ? <p className={styles.fieldErr}>{fieldErrors.name}</p> : null}</label>
                      <label><span>Phone</span><input className={fieldErrors.phone ? styles.inputErr : undefined} value={shippingPhone} onChange={(e) => { setShippingPhone(formatPhone(e.target.value)); clearFieldError('phone'); }} autoComplete="tel" inputMode="numeric" placeholder="03XX XXXXXXX" />{fieldErrors.phone ? <p className={styles.fieldErr}>{fieldErrors.phone}</p> : null}</label>
                    </div>
                    <p className={styles.coSection}>Address</p>
                    <label><span>House / flat <i>(optional)</i></span><input value={addrHouse} onChange={(e) => updateAddrPart('house', e.target.value)} autoComplete="address-line1" placeholder="e.g. House 12, Flat 4B" /></label>
                    <label><span>Street address</span><input className={fieldErrors.street ? styles.inputErr : undefined} value={addrStreet} onChange={(e) => updateAddrPart('street', e.target.value)} autoComplete="address-line2" placeholder="e.g. Street 5, Block C" />{fieldErrors.street ? <p className={styles.fieldErr}>{fieldErrors.street}</p> : null}</label>
                    <label><span>Area / locality</span><input className={fieldErrors.area ? styles.inputErr : undefined} value={addrArea} onChange={(e) => updateAddrPart('area', e.target.value)} autoComplete="address-level3" placeholder="e.g. Gulberg III" />{fieldErrors.area ? <p className={styles.fieldErr}>{fieldErrors.area}</p> : null}</label>
                    <div className={styles.coRow}>
                      <label><span>City</span><select className={fieldErrors.city ? styles.inputErr : undefined} value={shippingCity} onChange={(e) => { setShippingCity(e.target.value); clearFieldError('city'); }}><option value="">Select city</option>{PAKISTAN_CITIES.map((city) => <option key={city} value={city}>{city}</option>)}</select>{fieldErrors.city ? <p className={styles.fieldErr}>{fieldErrors.city}</p> : null}</label>
                      <label><span>Postal code <i>(optional)</i></span><input value={shippingPostalCode} onChange={(e) => setShippingPostalCode(e.target.value.replace(/\D/g, '').slice(0, 5))} inputMode="numeric" placeholder="e.g. 75000" /></label>
                    </div>
                    <div className={styles.chipRow} role="group" aria-label="Address type">{['Home', 'Office', 'Other'].map((label) => <button key={label} type="button" className={addressLabel === label ? styles.chipActive : styles.chip} onClick={() => setAddressLabel(label)}>{label}</button>)}</div>
                    <label><span>Delivery notes <i>(optional)</i></span><textarea value={deliveryNotes} onChange={(e) => setDeliveryNotes(e.target.value)} rows={2} placeholder="Gate code, landmark, rider instructions…" /></label>
                    <label className={styles.rememberRow}><input type="checkbox" checked={saveDetails} onChange={(e) => setSaveDetails(e.target.checked)} /><span>Save my delivery details for next time</span></label>
                    <label className={styles.rememberRow}><input type="checkbox" checked={saveToAddressBook} onChange={(e) => setSaveToAddressBook(e.target.checked)} /><span>Also save this address to my address book</span></label>
                    <p className={styles.coSection}>Delivery</p>
                    <div className={styles.speedRow} role="radiogroup" aria-label="Delivery speed">
                      <button type="button" role="radio" aria-checked={deliverySpeed === 'STANDARD'} className={deliverySpeed === 'STANDARD' ? styles.speedActive : styles.speed} onClick={() => { setDeliverySpeed('STANDARD'); setSlotDay(0); }}><span aria-hidden="true">🚚</span><span><b>Standard</b><small>{deliveryWindow('STANDARD')}</small></span><b>{subtotal >= 300000 ? 'Free' : money(15000)}</b></button>
                      <button type="button" role="radio" aria-checked={deliverySpeed === 'EXPRESS'} className={deliverySpeed === 'EXPRESS' ? styles.speedActive : styles.speed} onClick={() => { setDeliverySpeed('EXPRESS'); setSlotDay(0); }}><span aria-hidden="true">⚡</span><span><b>Express</b><small>{deliveryWindow('EXPRESS')}</small></span><b>{money(25000)}</b></button>
                    </div>
                    <div className={styles.slotSection}><span className={styles.slotLabel}>Choose your delivery slot</span><div className={styles.chipRow} role="group" aria-label="Delivery day">{days.map((d, i) => <button key={d} type="button" className={Math.min(slotDay, days.length - 1) === i ? styles.chipActive : styles.chip} onClick={() => setSlotDay(i)}>{d}</button>)}</div><div className={styles.chipRow} role="group" aria-label="Delivery time">{SLOT_TIMES.map((t, i) => <button key={t} type="button" className={slotTime === i ? styles.chipActive : styles.chip} onClick={() => setSlotTime(i)}>{t}</button>)}</div></div>
                  </>
                ) : (
                  <>
                    <div className={styles.reviewBlock} aria-label="Delivery review">
                      <div><span aria-hidden="true">📍</span><p><b>{shippingName}</b> · {shippingPhone}<br />{shippingAddress}, {shippingCity} <i>({addressLabel})</i></p></div>
                      <div><span aria-hidden="true">{deliverySpeed === 'EXPRESS' ? '⚡' : '🚚'}</span><p>{deliverySpeed === 'EXPRESS' ? 'Express' : 'Standard'} · {deliverySlot}</p></div>
                      <button type="button" className={styles.editLink} onClick={() => setCoStep(1)}>Edit delivery details</button>
                    </div>
                    <div className={styles.discountRow}><label><span>Discount code</span><input value={discountCode} onChange={(e) => { setDiscountCode(e.target.value.toUpperCase()); setDiscountApplied(null); setDiscountError(''); }} placeholder="WELCOME10" /></label><button type="button" className={styles.applyBtn} onClick={applyDiscount} disabled={discountBusy}>{discountBusy ? 'Checking…' : 'Apply'}</button></div>{discountApplied ? <p className={styles.discountOk} role="status">✓ {discountApplied.code} applied · you save {money(discountApplied.amountMinor)}</p> : null}{discountError ? <p className={styles.discountErr} role="alert">{discountError}</p> : null}
                    <label className={styles.rememberRow}><input type="checkbox" checked={giftWrap} onChange={(e) => setGiftWrap(e.target.checked)} /><span>🎁 Add gift wrap · {money(GIFT_WRAP_MINOR)}</span></label>{giftWrap ? <label><span>Gift message <i>(optional)</i></span><textarea value={giftMessage} onChange={(e) => setGiftMessage(e.target.value)} rows={2} maxLength={200} placeholder="Write your message for the recipient…" /></label> : null}
                    <p className={styles.coSection}>Payment</p>
                    <StripePaymentPanel items={cart} subtotal={subtotal} shipping={shipping} total={total} paymentMethod={paymentMethod} onPaymentMethodChange={setPaymentMethod} storeWalletBalance={storeWalletBalance} emiPlan={emiPlan} setEmiPlan={setEmiPlan} cardEmail={cardEmail} setCardEmail={setCardEmail} cardNumber={cardNumber} setCardNumber={setCardNumber} cardExpiry={cardExpiry} setCardExpiry={setCardExpiry} cardCvc={cardCvc} setCardCvc={setCardCvc} cardName={cardName} setCardName={setCardName} walletNumber={walletNumber} setWalletNumber={setWalletNumber} walletName={walletName} setWalletName={setWalletName} money={money} />
                    <button type="button" className={styles.backBtn} onClick={() => setCoStep(1)}>← Back to delivery details</button>
                  </>
                )}
              </div>
              <aside className={styles.coSummary}>
                <p>Order summary</p>
                <div className={styles.totals}><span>Items ({cartCount})</span><b>{money(subtotal)}</b>{discountMinor > 0 ? <><span>Discount ({discountApplied?.code})</span><b>−{money(discountMinor)}</b></> : null}<span>Delivery</span><b>{shipping ? money(shipping) : 'Free'}</b>{giftWrap ? <><span>Gift wrap</span><b>{money(giftMinor)}</b></> : null}<span className={styles.grand}>Total</span><b className={styles.grand}>{money(total)}</b></div>
                <div className={styles.reviewBlock} aria-label="Order review"><div><span aria-hidden="true">📍</span><p>{[shippingAddress.trim(), shippingCity.trim()].filter(Boolean).join(', ') || 'Add your address'} <i>({addressLabel})</i></p></div><div><span aria-hidden="true">{deliverySpeed === 'EXPRESS' ? '⚡' : '🚚'}</span><p>{deliverySpeed === 'EXPRESS' ? 'Express' : 'Standard'} · {deliveryWindow(deliverySpeed)}</p></div><div><span aria-hidden="true">💳</span><p>{PAYMENT_LABELS[paymentMethod]}</p></div></div>
                {coStep === 1 ? (
                  <button className={styles.checkoutBtn} onClick={continueToPayment}>Continue to payment →</button>
                ) : (
                  <button className={styles.checkoutBtn} onClick={paymentMethod === 'CARD' ? payWithCard : isWallet ? payWithWallet : checkout} disabled={busy}>{busy ? 'Placing…' : paymentMethod === 'CARD' ? `Pay ${money(total)}` : paymentMethod === 'JAZZCASH' ? `Pay with JazzCash · ${money(total)}` : paymentMethod === 'EASYPAISA' ? `Pay with Easypaisa · ${money(total)}` : `Place order · ${money(total)}`}</button>
                )}
                <small>🔒 Protected · tracked delivery</small>
              </aside>
            </div>
            )}
          </section>
        </div>
      ) : null}

      {/* Wishlist / feedback toast */}
      {toast ? <div key={toast.id} className={styles.toast} role="status">{toast.text}</div> : null}

      {/* Sticky mobile cart */}
      {cartCount > 0 && !cartOpen && !checkoutOpen ? (
        <button className={styles.stickyCart} onClick={() => setCartOpen(true)} aria-label={`Open cart, ${cartCount} items, ${money(total)}`}>
          <span>🛒 {cartCount} item{cartCount === 1 ? '' : 's'}</span><b>{money(total)} →</b>
        </button>
      ) : null}
    </div>
  );
}
