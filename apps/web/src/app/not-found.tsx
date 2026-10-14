import Link from 'next/link';
import type { Metadata } from 'next';
import { pageMetadata } from '../lib/seo';

export const metadata: Metadata = pageMetadata({
  title: 'Page not found',
  description: 'The page you are looking for does not exist on OneStop Life.',
  path: '/404',
  noIndex: true,
});

export default function NotFound() {
  return (
    <main style={{ maxWidth: 640, margin: '0 auto', padding: '72px 24px', textAlign: 'center' }}>
      <p style={{ fontSize: 13, letterSpacing: 2, textTransform: 'uppercase', opacity: 0.6 }}>404</p>
      <h1 style={{ fontSize: 32, margin: '12px 0' }}>This page went for a checkup</h1>
      <p style={{ opacity: 0.75, lineHeight: 1.6 }}>
        The page you are looking for does not exist or may have been moved.
        Let&apos;s get you back to care.
      </p>
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 28, flexWrap: 'wrap' }}>
        <Link
          href="/"
          style={{ background: '#0f766e', color: '#fff', padding: '12px 24px', borderRadius: 999, textDecoration: 'none', fontWeight: 600 }}
        >
          Back to home
        </Link>
        <Link
          href="/doctors"
          style={{ border: '1px solid #0f766e', color: '#0f766e', padding: '12px 24px', borderRadius: 999, textDecoration: 'none', fontWeight: 600 }}
        >
          Find a doctor
        </Link>
      </div>
    </main>
  );
}
