'use client';

import { useEffect, useRef, useState, type ReactNode, type CSSProperties } from 'react';
import styles from './Reveal.module.css';

type RevealProps = {
  children: ReactNode;
  delay?: number;
  className?: string;
  as?: 'div' | 'section' | 'article';
};

/**
 * Scroll-triggered reveal wrapper. Elements fade and slide up
 * when they enter the viewport. Respects prefers-reduced-motion.
 */
export default function Reveal({ children, delay = 0, className = '', as = 'div' }: RevealProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const Tag = as as 'div';
  const style = { '--reveal-delay': `${delay}ms` } as CSSProperties;

  return (
    <Tag ref={ref} style={style} className={`${styles.reveal} ${visible ? styles.visible : ''} ${className}`}>
      {children}
    </Tag>
  );
}
