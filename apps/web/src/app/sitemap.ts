import type { MetadataRoute } from 'next';
import { SITE_URL } from '../lib/seo';

const API_URL =
  process.env.API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'https://api-production-7a91a.up.railway.app';

/** Static marketing/discovery routes. Auth and dashboard routes are excluded on purpose. */
const STATIC_ROUTES = [
  '/',
  '/doctors',
  '/facilities',
  '/labs',
  '/blood',
  '/pharmacy',
  '/products',
  '/privacy',
  '/contact',
];

async function fetchDoctorIds(): Promise<string[]> {
  try {
    const res = await fetch(`${API_URL}/doctors`, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const data = await res.json();
    const items = Array.isArray(data) ? data : data.items ?? [];
    return items.map((item: { id?: string }) => item?.id).filter(Boolean);
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const doctorIds = await fetchDoctorIds();
  const now = new Date();

  const entries: MetadataRoute.Sitemap = STATIC_ROUTES.map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: now,
    changeFrequency: path === '/' ? 'daily' : 'weekly',
    priority: path === '/' ? 1 : 0.8,
  }));

  for (const id of doctorIds) {
    entries.push({
      url: `${SITE_URL}/doctors/${id}`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.7,
    });
  }

  return entries;
}
