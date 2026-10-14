import Link from 'next/link';
import { breadcrumbJsonLd } from '../../lib/seo';

export type Crumb = { name: string; path: string };

/** Visual breadcrumbs + BreadcrumbList JSON-LD for SEO. */
export default function Breadcrumbs({ items }: { items: Crumb[] }) {
  if (items.length < 2) return null;
  const trail = [{ name: 'Home', path: '/' }, ...items];
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd(trail)) }}
      />
      <nav aria-label="Breadcrumb" style={{ fontSize: 13, marginBottom: 16 }}>
        <ol style={{ display: 'flex', flexWrap: 'wrap', gap: 8, listStyle: 'none', padding: 0, margin: 0 }}>
          {trail.map((crumb, i) => {
            const last = i === trail.length - 1;
            return (
              <li key={crumb.path} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {last ? (
                  <span aria-current="page" style={{ opacity: 0.65 }}>{crumb.name}</span>
                ) : (
                  <Link href={crumb.path} style={{ color: '#0f766e', textDecoration: 'none' }}>
                    {crumb.name}
                  </Link>
                )}
                {!last && <span aria-hidden="true" style={{ opacity: 0.4 }}>/</span>}
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
}
