import type { Metadata } from 'next';

/** Canonical public URL of the web frontend. Override with NEXT_PUBLIC_SITE_URL on Railway. */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ||
  'https://web-production-b6b696.up.railway.app';

const SITE_NAME = 'OneStop Life';

type PageSeo = {
  title: string;
  description: string;
  path: string;
  image?: string;
  noIndex?: boolean;
};

/** Builds consistent per-page metadata: title, description, canonical, Open Graph, Twitter. */
export function pageMetadata({ title, description, path, image, noIndex }: PageSeo): Metadata {
  const url = `${SITE_URL}${path}`;
  const ogImage = image ?? `${SITE_URL}/hero-home-health.jpg`;
  return {
    title,
    description,
    alternates: { canonical: url },
    robots: noIndex ? { index: false, follow: true } : undefined,
    openGraph: {
      type: 'website',
      siteName: SITE_NAME,
      title: `${title} | ${SITE_NAME}`,
      description,
      url,
      images: [{ url: ogImage, width: 1200, height: 798, alt: title }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | ${SITE_NAME}`,
      description,
      images: [ogImage],
    },
  };
}

/** Google Search Console verification, set via NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION. */
export function googleVerification(): Metadata['verification'] {
  const code = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION;
  return code ? { google: code } : undefined;
}

/** Organization + WebSite JSON-LD for the homepage. */
export function organizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        name: SITE_NAME,
        url: SITE_URL,
        logo: `${SITE_URL}/hero-home-health.jpg`,
        description:
          'OneStop Life is a healthcare super-app for Pakistan: verified doctor appointments, lab tests with home collection, blood banks, and pharmacy delivery in one place.',
        contactPoint: [
          {
            '@type': 'ContactPoint',
            telephone: '+92-300-1234567',
            email: 'support@onestop.life',
            contactType: 'customer service',
            areaServed: 'PK',
            availableLanguage: ['en', 'ur'],
          },
        ],
      },
      {
        '@type': 'WebSite',
        name: SITE_NAME,
        url: SITE_URL,
        potentialAction: {
          '@type': 'SearchAction',
          target: { '@type': 'EntryPoint', urlTemplate: `${SITE_URL}/doctors?search={search_term_string}` },
          'query-input': 'required name=search_term_string',
        },
      },
    ],
  };
}

/** BreadcrumbList JSON-LD for a trail of {name, path} items. */
export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: `${SITE_URL}${item.path}`,
    })),
  };
}
