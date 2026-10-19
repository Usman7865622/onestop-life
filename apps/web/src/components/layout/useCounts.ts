'use client';

import { useEffect, useState } from 'react';

/** Live cart + wishlist counts from localStorage, synced across tabs. */
export function useCounts() {
  const [cartCount, setCartCount] = useState(0);
  const [wishCount, setWishCount] = useState(0);

  const read = () => {
    try {
      const cart = JSON.parse(localStorage.getItem('onestop-cart') ?? '[]') as Array<{ quantity?: number }>;
      setCartCount(cart.reduce((n, i) => n + (i.quantity ?? 1), 0));
    } catch { setCartCount(0); }
    try {
      const wish = JSON.parse(localStorage.getItem('onestop-wishlist') ?? '[]') as unknown[];
      setWishCount(wish.length);
    } catch { setWishCount(0); }
  };

  useEffect(() => {
    read();
    const onStorage = () => read();
    const onFocus = () => read();
    window.addEventListener('storage', onStorage);
    window.addEventListener('focus', onFocus);
    // Custom events fired by CatalogClient/CartClient after mutations
    window.addEventListener('osl-cart-change', onStorage);
    window.addEventListener('osl-wishlist-change', onStorage);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('osl-cart-change', onStorage);
      window.removeEventListener('osl-wishlist-change', onStorage);
    };
  }, []);

  return { cartCount, wishCount };
}
