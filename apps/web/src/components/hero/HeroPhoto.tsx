import Image from 'next/image';
import type { ReactNode } from 'react';
import styles from './hero-photo.module.css';

/**
 * Page hero photo: a professional photograph with the page's stat chips
 * overlaid at the bottom. Keeps every stat visible while adding the
 * photography that makes each page feel real.
 */
export default function HeroPhoto({ src, alt, label, children }: { src: string; alt: string; label: string; children: ReactNode }) {
  return (
    <figure className={styles.heroPhoto}>
      <Image src={src} alt={alt} fill sizes="340px" className={styles.photo} priority={false} />
      <figcaption className={styles.photoStats} aria-label={label}>
        {children}
      </figcaption>
    </figure>
  );
}
