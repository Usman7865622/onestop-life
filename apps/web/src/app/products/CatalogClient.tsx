'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import styles from './page.module.css';
import ShopAssistant, { type AssistantProduct } from './ShopAssistant';

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

type CartLine = Product & { quantity: number };

type CatalogClientProps = { products: Product[] };

const categoryLabels: Record<string, string> = {
  'Trending essentials': 'Trending essentials',
  Medicines: 'Medicines',
  'Medical devices': 'Medical devices & appliances',
  Wellness: 'Wellness & supplements',
  'Health essentials': 'Health essentials',
  'Personal care': 'Personal care',
  'Baby care': 'Baby care',
  Nutrition: 'Nutrition',
  'Pet care': 'Veterinary & pet care',
  'Home health': 'Home health',
  'Electronics & appliances': 'Electronics & appliances',
};

const categoryIcons: Record<string, string> = {
  'Trending essentials': '★',
  Medicines: '✚',
  'Medical devices': '⌁',
  Wellness: '✦',
  'Health essentials': '✓',
  'Personal care': '✧',
  'Baby care': '♡',
  Nutrition: '◒',
  'Pet care': '♥',
  'Home health': '⌂',
  'Electronics & appliances': '◉',
};

const categoryShortLabels: Record<string, string> = {
  'Electronics & appliances': 'Electronics',
  'Medical devices': 'Medical devices',
  'Pet care': 'Pet care',
  'Health essentials': 'Health essentials',
};

function money(minor: number) {
  return `Rs. ${(minor / 100).toFixed(2)}`;
}

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
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All products');
  const [sortOrder, setSortOrder] = useState('featured');
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<Product[]>([]);
  const [quickView, setQuickView] = useState<Product | null>(null);

  useEffect(() => {
    const stored = window.localStorage.getItem('onestop-cart');
    if (stored) setCart(JSON.parse(stored) as CartLine[]);
    setCartLoaded(true);
  }, []);

  useEffect(() => {
    if (!cartLoaded) return;
    window.localStorage.setItem('onestop-cart', JSON.stringify(cart));
  }, [cart, cartLoaded]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get('q');
    if (q) setSearchTerm(q);
  }, []);

  useEffect(() => {
    const storedWishlist = window.localStorage.getItem('onestop-wishlist');
    const storedRecent = window.localStorage.getItem('onestop-recent');
    if (storedWishlist) setWishlist(JSON.parse(storedWishlist) as string[]);
    if (storedRecent) setRecentlyViewed(JSON.parse(storedRecent) as Product[]);
  }, []);

  useEffect(() => {
    window.localStorage.setItem('onestop-wishlist', JSON.stringify(wishlist));
  }, [wishlist]);

  useEffect(() => {
    window.localStorage.setItem('onestop-recent', JSON.stringify(recentlyViewed));
  }, [recentlyViewed]);

  const categories = useMemo(() => {
    const groups = new Map<string, Product[]>();
    for (const product of products) {
      const category = product.category ?? 'Other products';
      groups.set(category, [...(groups.get(category) ?? []), product]);
    }
    return Array.from(groups.entries());
  }, [products]);

  const assistantProducts = useMemo<AssistantProduct[]>(() => products.map((product) => ({
    id: product.id,
    nameEn: product.nameEn,
    nameUr: product.nameUr ?? null,
    priceMinor: product.priceMinor,
    unit: product.unit ?? 'item',
    category: product.category ?? null,
    imageUrl: product.imageUrl ?? null,
    inStock: product.inStock ?? true,
  })), [products]);

  const visibleCategories = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    return categories
      .map(([category, items]) => [category, items.filter((product) => {
        const matchesCategory = selectedCategory === 'All products' || selectedCategory === category;
        const matchesSearch = !normalizedSearch || `${product.nameEn} ${product.nameUr ?? ''} ${category}`.toLowerCase().includes(normalizedSearch);
        return matchesCategory && matchesSearch;
      }).sort((first, second) => {
        if (sortOrder === 'price-low') return first.priceMinor - second.priceMinor;
        if (sortOrder === 'price-high') return second.priceMinor - first.priceMinor;
        if (sortOrder === 'name') return first.nameEn.localeCompare(second.nameEn);
        return 0;
      })] as [string, Product[]])
      .filter(([, items]) => items.length > 0);
  }, [categories, searchTerm, selectedCategory, sortOrder]);

  const subtotal = cart.reduce((total, item) => total + item.priceMinor * item.quantity, 0);
  const shipping = subtotal >= 300000 || subtotal === 0 ? 0 : 15000;
  const total = subtotal + shipping;
  const checkoutProduct = cart[0];
  const checkoutCategory = checkoutProduct?.category ?? 'everyday essentials';

  const addToCart = (product: Product) => {
    setCart((current) => {
      const existing = current.find((item) => item.id === product.id);
      if (existing) return current.map((item) => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      return [...current, { ...product, quantity: 1 }];
    });
    setMessage(`${product.nameEn} added to your cart.`);
  };

  const updateQuantity = (productId: string, quantity: number) => {
    setCart((current) => quantity < 1 ? current.filter((item) => item.id !== productId) : current.map((item) => item.id === productId ? { ...item, quantity } : item));
  };

  const toggleWishlist = (productId: string) => {
    setWishlist((current) => current.includes(productId) ? current.filter((id) => id !== productId) : [...current, productId]);
  };

  const openQuickView = (product: Product) => {
    setQuickView(product);
    setRecentlyViewed((current) => [product, ...current.filter((item) => item.id !== product.id)].slice(0, 4));
  };

  const checkout = async () => {
    const token = window.localStorage.getItem('onestop-access-token');
    if (!token) {
      setError('Sign in from the login page before placing an order.');
      return;
    }
    if (!shippingName.trim() || !shippingPhone.trim() || !shippingAddress.trim()) {
      setError('Complete your delivery details before placing the order.');
      return;
    }

    setBusy(true);
    setError('');
    setMessage('');
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          items: cart.map((item) => ({ productId: item.id, quantity: item.quantity })),
          shippingName,
          shippingPhone,
          shippingAddress,
          discountCode: discountCode || undefined,
          paymentMethod,
        }),
      });
      const payload = await response.json() as { message?: string; order?: { id: string; totalMinor: number } };
      if (!response.ok) throw new Error(Array.isArray(payload.message) ? payload.message.join(', ') : payload.message ?? 'Unable to place order');
      setCart([]);
      setCheckoutOpen(false);
      setCartOpen(false);
      setDiscountCode('');
      setMessage(`Order ${payload.order?.id.slice(0, 8)} confirmed for ${money(payload.order?.totalMinor ?? total)}.`);
    } catch (checkoutError) {
      setError(checkoutError instanceof Error ? checkoutError.message : 'Unable to place order');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className={styles.marketHeader}>
        <form className={styles.searchForm} role="search" onSubmit={(event) => event.preventDefault()}>
          <label htmlFor="catalog-search">Search the store</label>
          <input id="catalog-search" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search medicines, appliances, pet care..." />
          <button type="submit" aria-label="Search products"><span aria-hidden="true">⌕</span> Search</button>
        </form>
      </div>

      <div className={styles.announcementBar} aria-label="Store announcements">
        <span className={styles.liveDot} aria-hidden="true" />
        <strong>OneStop daily edit</strong>
        <span>Free delivery over Rs. 3,000</span>
        <span>Cash on delivery available</span>
        <span>New electronics and pet-care arrivals</span>
      </div>

      <section className={styles.featuredBand} aria-labelledby="featured-heading">
        <div><p className={styles.featuredEyebrow}>The OneStop edit</p><h2 id="featured-heading">Everyday care, thoughtfully stocked.</h2><p>Essentials for your home, health, family, and companions, selected for simple repeat shopping.</p></div>
        <div className={styles.featuredStats}><strong>{products.length}</strong><span>products ready to ship</span><strong>Rs. 3,000</strong><span>free delivery threshold</span></div>
      </section>

      {message ? <p className={styles.storeMessage} role="status">{message}</p> : null}
      {error ? <p className={styles.storeError} role="alert">{error}</p> : null}

      <div className={styles.catalogLayout}>
        <aside className={styles.filterRail} aria-label="Shop categories">
          <div className={styles.filterHeading}><span>Browse</span><strong>{products.length}</strong></div>
          <button className={selectedCategory === 'All products' ? styles.filterActive : styles.filterButton} onClick={() => setSelectedCategory('All products')}><span className={styles.filterName}><i className={styles.categoryIcon} aria-hidden="true">◈</i>All products</span><span>{products.length}</span></button>
          {categories.map(([category, items]) => <button className={selectedCategory === category ? styles.filterActive : styles.filterButton} onClick={() => setSelectedCategory(category)} key={category}><span className={styles.filterName}><i className={styles.categoryIcon} aria-hidden="true">{categoryIcons[category] ?? '•'}</i>{categoryLabels[category] ?? category}</span><span>{items.length}</span></button>)}
          <div className={styles.railNote}><strong>Simple delivery</strong><p>Free shipping on orders over Rs. 3,000.</p></div>
        </aside>

        <div className={styles.resultsColumn}>
          <div className={styles.resultsToolbar}><span><strong>{visibleCategories.reduce((total, [, items]) => total + items.length, 0)}</strong> results</span><div className={styles.resultActions}><span className={styles.wishlistCount}>{wishlist.length} saved</span><label htmlFor="sort-products">Sort by</label><select id="sort-products" value={sortOrder} onChange={(event) => setSortOrder(event.target.value)}><option value="featured">Featured</option><option value="price-low">Price: low to high</option><option value="price-high">Price: high to low</option><option value="name">Name</option></select><button className={styles.clearFilter} onClick={() => { setSelectedCategory('All products'); setSearchTerm(''); setSortOrder('featured'); }}>Clear filters</button></div></div>
          {visibleCategories.length ? <div className={styles.categorySections}>
        {visibleCategories.map(([category, items]) => {
          const categoryId = category.toLowerCase().replaceAll(' ', '-');
          return (
            <section className={styles.categorySection} id={categoryId} key={category} aria-labelledby={`${categoryId}-heading`}>
              <div className={styles.categoryHeader}>
                <div>
                  <p className={styles.categoryEyebrow}>Product type</p>
                  <h2 id={`${categoryId}-heading`}>{categoryLabels[category] ?? category}</h2>
                </div>
                <span>{items.length} {items.length === 1 ? 'product' : 'products'}</span>
              </div>
              <div className={styles.grid}>
                {items.map((product) => (
                  <article className={styles.card} key={product.id}>
                    <div className={styles.productImage} role="img" aria-label={`${product.nameEn} product image`} style={product.imageUrl ? { backgroundImage: `url(${product.imageUrl})` } : undefined}>
                      {!product.imageUrl ? product.nameEn.slice(0, 1) : null}
                      <span className={styles.imageCategoryBadge}><i aria-hidden="true">{categoryIcons[category] ?? '•'}</i>{categoryShortLabels[category] ?? categoryLabels[category] ?? category}</span>
                    </div>
                    <div className={styles.cardBody}>
                          <div className={styles.productMeta}><span>{product.inStock === false ? 'Unavailable' : 'In stock'}</span><span aria-label="Customer rating">★★★★★</span></div>
                          <button className={styles.wishlistButton} onClick={() => toggleWishlist(product.id)} aria-label={`${wishlist.includes(product.id) ? 'Remove' : 'Save'} ${product.nameEn} ${wishlist.includes(product.id) ? 'from' : 'to'} wishlist`}>{wishlist.includes(product.id) ? '♥ Saved' : '♡ Save'}</button>
                          <h3>{product.nameEn}</h3>
                      {product.nameUr ? <p className={styles.urdu}>{product.nameUr}</p> : null}
                      <div className={styles.cardFooter}>
                        <strong>{money(product.priceMinor)}</strong>
                        <span>{product.unit ?? 'per item'}</span>
                      </div>
                          <span className={product.inStock === false ? styles.outOfStock : styles.inStock}>{product.inStock === false ? 'Out of stock' : 'Ready to ship'}</span>
                          <div className={styles.cardActions}><button className={styles.quickViewButton} onClick={() => openQuickView(product)}><span aria-hidden="true">◉</span> Quick view</button><button className={styles.addButton} onClick={() => addToCart(product)} disabled={product.inStock === false}><span aria-hidden="true">+</span> Add to cart</button></div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          );
        })}
          </div> : <section className={styles.noResults}><h2>No products found</h2><p>Try a broader search or browse all categories.</p></section>}
        </div>
      </div>

      <section className={styles.shopSuggestions} aria-labelledby="shop-smarter-heading">
        <div className={styles.suggestionIntro}><p className={styles.categoryEyebrow}>More from OneStop</p><h2 id="shop-smarter-heading">Shop smarter, every day.</h2><span>Helpful shortcuts for the way you buy.</span></div>
        <Link href="/cart" className={styles.suggestionCard}><span className={styles.suggestionIcon} aria-hidden="true">↻</span><strong>Repeat a useful order</strong><span>Keep essentials close.</span><b>Open cart -&gt;</b></Link>
        <Link href="#home-health" className={styles.suggestionCard}><span className={styles.suggestionIcon} aria-hidden="true">✓</span><strong>Build a care kit</strong><span>Home health essentials.</span><b>Explore picks -&gt;</b></Link>
        <Link href="#electronics-&-appliances" className={styles.suggestionCard}><span className={styles.suggestionIcon} aria-hidden="true">✦</span><strong>Upgrade your routine</strong><span>Smart living arrivals.</span><b>See electronics -&gt;</b></Link>
      </section>

      {recentlyViewed.length ? <section className={styles.recentSection} aria-labelledby="recent-heading"><div className={styles.recentHeader}><div><p className={styles.categoryEyebrow}>Your browsing trail</p><h2 id="recent-heading">Recently viewed</h2></div><span>Saved on this device</span></div><div className={styles.recentGrid}>{recentlyViewed.map((product) => <button className={styles.recentItem} key={product.id} onClick={() => openQuickView(product)}><span>{product.category ?? 'Product'}</span><strong>{product.nameEn}</strong><small>{money(product.priceMinor)}</small></button>)}</div></section> : null}

      {quickView ? <div className={`${styles.overlay} ${styles.centerOverlay}`} role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setQuickView(null)}><section className={styles.quickViewPanel} role="dialog" aria-modal="true" aria-labelledby="quick-view-title"><button className={styles.closeButton} onClick={() => setQuickView(null)} aria-label="Close quick view">×</button><div className={styles.quickViewImage} role="img" aria-label={`${quickView.nameEn} product image`} style={quickView.imageUrl ? { backgroundImage: `url(${quickView.imageUrl})` } : undefined} /><div className={styles.quickViewBody}><p className={styles.categoryEyebrow}>{quickView.category ?? 'OneStop essential'}</p><h2 id="quick-view-title">{quickView.nameEn}</h2><div className={styles.quickViewRating}>★★★★★ <span>Trusted everyday pick</span></div><strong>{money(quickView.priceMinor)}</strong><p>Ready for everyday use, with reliable delivery and easy checkout through OneStop Life.</p><div className={styles.quickViewMeta}><span>In stock</span><span>Fast delivery</span></div><button className={styles.primaryAction} onClick={() => { addToCart(quickView); setQuickView(null); }}>Add to cart</button></div></section></div> : null}

      {cartOpen ? (
        <div className={styles.overlay} role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setCartOpen(false)}>
          <aside className={styles.cartPanel} aria-label="Shopping cart">
            <div className={styles.panelHeader}>
              <div><p className={styles.categoryEyebrow}>Your order</p><h2>Shopping cart</h2></div>
              <button className={styles.closeButton} onClick={() => setCartOpen(false)} aria-label="Close shopping cart">×</button>
            </div>
            {cart.length ? <div className={styles.cartLines}>{cart.map((item) => (
              <div className={styles.cartLine} key={item.id}>
                <div><strong>{item.nameEn}</strong><span>{money(item.priceMinor)}</span></div>
                <div className={styles.quantityControls}>
                  <button onClick={() => updateQuantity(item.id, item.quantity - 1)} aria-label={`Decrease ${item.nameEn}`}>−</button>
                  <span>{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.id, item.quantity + 1)} aria-label={`Increase ${item.nameEn}`}>+</button>
                </div>
              </div>
            ))}</div> : <p className={styles.emptyCart}>Your cart is ready for something useful.</p>}
            <div className={styles.cartSummary}><span>Subtotal</span><strong>{money(subtotal)}</strong><span>Delivery</span><strong>{shipping ? money(shipping) : 'Free'}</strong><span className={styles.totalLabel}>Total</span><strong className={styles.totalValue}>{money(total)}</strong></div>
            <button className={styles.primaryAction} onClick={() => { setCheckoutOpen(true); setCartOpen(false); }} disabled={!cart.length}>Continue to checkout</button>
          </aside>
        </div>
      ) : null}

      {checkoutOpen ? (
        <div className={styles.overlay} role="presentation">
          <section className={styles.checkoutPanel} aria-label="Checkout">
            <div className={styles.panelHeader}><div><p className={styles.categoryEyebrow}>Secure checkout</p><h2>Complete your order</h2></div><button className={styles.closeButton} onClick={() => setCheckoutOpen(false)} aria-label="Close checkout">×</button></div>
            <div className={styles.checkoutSteps}><span className={styles.stepActive}><b>1</b> Delivery</span><i /> <span><b>2</b> Payment</span><i /> <span><b>3</b> Confirm</span></div>
            <div className={styles.checkoutVisual} style={checkoutProduct?.imageUrl ? { backgroundImage: `linear-gradient(90deg, rgba(23, 35, 55, 0.92), rgba(23, 35, 55, 0.28)), url(${checkoutProduct.imageUrl})` } : undefined}><div><span>ONE STOP SECURE CHECKOUT</span><strong>Your {checkoutCategory.toLowerCase()} order is ready to go.</strong><small>Protected checkout · tracked delivery</small></div></div>
            <div className={styles.checkoutLayout}><div className={styles.checkoutForm}><h3>Delivery details</h3><div className={styles.checkoutGrid}><label className={styles.field}><span>Full name</span><input value={shippingName} onChange={(event) => setShippingName(event.target.value)} autoComplete="name" /></label><label className={styles.field}><span>Phone</span><input value={shippingPhone} onChange={(event) => setShippingPhone(event.target.value)} autoComplete="tel" /></label></div><label className={styles.field}><span>Delivery address</span><textarea value={shippingAddress} onChange={(event) => setShippingAddress(event.target.value)} rows={3} autoComplete="street-address" /></label><label className={styles.field}><span>Discount code</span><input value={discountCode} onChange={(event) => setDiscountCode(event.target.value.toUpperCase())} placeholder="WELCOME10" /></label><fieldset className={styles.paymentOptions}><legend>Choose payment</legend><label><input type="radio" checked={paymentMethod === 'COD'} onChange={() => setPaymentMethod('COD')} /> <span>Cash on delivery</span><small>Pay when your order arrives</small></label><label><input type="radio" checked={paymentMethod === 'CARD'} onChange={() => setPaymentMethod('CARD')} /> <span>Card payment</span><small>Local test mode</small></label><div className={styles.cardBrands}><b>VISA</b><b>MC</b><b>AMEX</b><b>UnionPay</b></div></fieldset><p className={styles.secureNote}>🔒 Your checkout is protected. Discounts are checked securely on the server.</p></div><aside className={styles.checkoutSummary}><p>Order summary</p><strong>{cart.length} {cart.length === 1 ? 'item' : 'items'}</strong><div><span>Subtotal</span><b>{money(subtotal)}</b></div><div><span>Delivery</span><b>{shipping ? money(shipping) : 'Free'}</b></div><div className={styles.checkoutTotal}><span>Total</span><b>{money(total)}</b></div><button className={styles.primaryAction} onClick={checkout} disabled={busy}>{busy ? 'Processing...' : `Place order · ${money(total)}`}</button><small>Free delivery over Rs. 3,000</small></aside></div>
          </section>
        </div>
      ) : null}
      <ShopAssistant catalogProducts={assistantProducts} onAddToCart={(product: AssistantProduct) => addToCart({
        ...product,
        nameUr: product.nameUr ?? undefined,
        category: product.category ?? undefined,
        imageUrl: product.imageUrl ?? undefined,
      })} />
    </>
  );
}
