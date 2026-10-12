import Link from 'next/link';
import { Suspense } from 'react';
import CatalogClient from './CatalogClient';
import { CardGridSkeleton } from '../../components/ui/Skeletons';

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

const API_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'https://api-production-7a91a.up.railway.app';

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

async function ProductsContent() {
  const products = await getProducts();
  if (!products.length) {
    return (
      <main style={{ padding: '80px 20px', textAlign: 'center' }}>
        <h2>No products yet</h2>
        <p>Products will appear here after the catalogue import is completed.</p>
        <Link href="/">Back to home</Link>
      </main>
    );
  }
  return <CatalogClient products={products} />;
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<CardGridSkeleton />}>
      <ProductsContent />
    </Suspense>
  );
}
