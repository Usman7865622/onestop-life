/**
 * Professional category iconography for the OneStop storefront.
 * Stroke-style inline SVGs (currentColor) + a per-category accent gradient,
 * so category tiles never fall back to cheap single-letter placeholders.
 */

import type { ReactNode } from 'react';

export type CategoryTheme = { from: string; to: string; soft: string };

export const FALLBACK_THEME: CategoryTheme = { from: '#166a91', to: '#38a3c8', soft: '#eef6f9' };

export const CATEGORY_THEMES: Record<string, CategoryTheme> = {
  'trending-essentials': { from: '#f97316', to: '#f43f5e', soft: '#fff3ec' },
  'electronics-appliances': { from: '#6366f1', to: '#38bdf8', soft: '#eef2ff' },
  'electronics---appliances': { from: '#6366f1', to: '#38bdf8', soft: '#eef2ff' },
  'pet-care': { from: '#b45309', to: '#f59e0b', soft: '#fdf4e3' },
  'medical-devices': { from: '#0ea5e9', to: '#166a91', soft: '#eaf6fd' },
  'home-health': { from: '#059669', to: '#34d399', soft: '#e9f8f1' },
  wellness: { from: '#16a34a', to: '#a3e635', soft: '#eef9e8' },
  nutrition: { from: '#dc2626', to: '#fb923c', soft: '#fdeeee' },
  'baby-care': { from: '#ec4899', to: '#f9a8d4', soft: '#fdeef6' },
  'health-essentials': { from: '#e11d48', to: '#fb7185', soft: '#fdeef1' },
  medicines: { from: '#7c3aed', to: '#c084fc', soft: '#f3eefe' },
  'personal-care': { from: '#0891b2', to: '#22d3ee', soft: '#e8f8fb' },
};

export function categorySlug(category: string): string {
  return category.trim().toLowerCase().replaceAll('&', 'and').replaceAll(/\s+/g, '-');
}

export function categoryTheme(category: string): CategoryTheme {
  return CATEGORY_THEMES[categorySlug(category)] ?? CATEGORY_THEMES[category.trim().toLowerCase().replaceAll(' ', '-')] ?? FALLBACK_THEME;
}

const PATHS: Record<string, ReactNode> = {
  'trending-essentials': (
    <>
      <path d="M12 21.5c4.1 0 6.8-2.6 6.8-6.1 0-3-2-5.1-3.3-6.6C14.1 7.2 13.2 5.6 13.2 3 10.4 4.9 8.1 7.2 8.1 10.7c-.9-.7-1.6-1.6-1.9-2.8-1.2 1.9-2.4 4.3-2.4 7 0 4 3.4 6.6 8.2 6.6Z" />
      <path d="M12 21.5c-1.9 0-3.2-1.2-3.2-3 0-1.5 1-2.4 1.9-3.4.6-.7 1.1-1.4 1.3-2.4 1.6 1.2 3 2.9 3 5.3 0 2-1.3 3.5-3 3.5Z" />
    </>
  ),
  'electronics-appliances': (
    <>
      <path d="M9 7.5V3M15 7.5V3" />
      <path d="M6.5 7.5h11V12a5.5 5.5 0 0 1-11 0V7.5Z" />
      <path d="M12 17.5V21" />
    </>
  ),
  'electronics---appliances': null,
  'pet-care': (
    <>
      <circle cx="5.5" cy="10" r="1.8" />
      <circle cx="9.3" cy="6.2" r="1.9" />
      <circle cx="14.7" cy="6.2" r="1.9" />
      <circle cx="18.5" cy="10" r="1.8" />
      <path d="M12 11.2c2.9 0 5.4 2.3 5.4 4.9 0 1.9-1.5 3.1-3.2 2.7-1.4-.3-3-.3-4.4 0-1.7.4-3.2-.8-3.2-2.7 0-2.6 2.5-4.9 5.4-4.9Z" />
    </>
  ),
  'medical-devices': (
    <>
      <path d="M12 20.5S4 15.6 4 9.9C4 6.9 6.2 5 8.6 5c1.4 0 2.7.7 3.4 1.8C12.7 5.7 14 5 15.4 5 17.8 5 20 6.9 20 9.9c0 5.7-8 10.6-8 10.6Z" />
      <path d="M6.5 12h3l1.5-3 2 5 1.5-2h3" />
    </>
  ),
  'home-health': (
    <>
      <path d="M4 11 12 4l8 7" />
      <path d="M6 9.5V20h12V9.5" />
      <path d="M12 11v6M9 14h6" />
    </>
  ),
  wellness: (
    <>
      <path d="M5 19C5 10 11 4.5 20 4c.5 9-4.9 15-13.5 15" />
      <path d="M5 19c1.5-4.5 4-8 8.5-10.5" />
    </>
  ),
  nutrition: (
    <>
      <path d="M12 7.5c-1.2-2-4-3-6.2-1.9C3.6 6.7 3 9.7 4 12.6c1 3.1 3 6.9 5 6.9 1 0 1.4-.4 3-.4s2 .4 3 .4c2 0 4-3.8 5-6.9 1-2.9.4-5.9-1.8-7C16 4.5 13.2 5.6 12 7.5Z" />
      <path d="M12 7.5c0-2 .9-3.5 3-4.5" />
    </>
  ),
  'baby-care': (
    <>
      <path d="M10 3.5h4" />
      <path d="M10.5 3.5c-.8 1.8.3 3 1.5 3s2.3-1.2 1.5-3" />
      <path d="M9 8.5h6l1 2v9a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2v-9l1-2Z" />
      <path d="M9 14h6" />
    </>
  ),
  'health-essentials': (
    <>
      <rect x="3.5" y="7" width="17" height="13" rx="2.5" />
      <path d="M9 7V5.5A2.5 2.5 0 0 1 11.5 3h1A2.5 2.5 0 0 1 15 5.5V7" />
      <path d="M12 10.5v6M9 13.5h6" />
    </>
  ),
  medicines: (
    <>
      <path d="m10.5 4.9 8.6 8.6a4.24 4.24 0 0 1-6 6L4.5 10.9a4.24 4.24 0 0 1 6-6Z" />
      <path d="m7.5 7.9 8.6 8.6" />
    </>
  ),
  'personal-care': (
    <>
      <path d="M12 3.5s6 6.6 6 11a6 6 0 0 1-12 0c0-4.4 6-11 6-11Z" />
      <path d="M9.5 14.5a2.8 2.8 0 0 0 2 3.5" />
    </>
  ),
  fallback: (
    <>
      <rect x="4" y="4" width="7" height="7" rx="1.8" />
      <rect x="13" y="4" width="7" height="7" rx="1.8" />
      <rect x="4" y="13" width="7" height="7" rx="1.8" />
      <rect x="13" y="13" width="7" height="7" rx="1.8" />
    </>
  ),
};
PATHS['electronics---appliances'] = PATHS['electronics-appliances'];

export default function CategoryIcon({ category, size = 30 }: { category: string; size?: number }) {
  const slug = categorySlug(category);
  const legacySlug = category.trim().toLowerCase().replaceAll(' ', '-');
  const paths = PATHS[slug] ?? PATHS[legacySlug] ?? PATHS.fallback;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      {paths}
    </svg>
  );
}
