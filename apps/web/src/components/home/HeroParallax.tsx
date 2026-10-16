'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import styles from './HeroParallax.module.css';

type HeroParallaxProps = {
  children: ReactNode;
};

/**
 * Mouse-reactive parallax wrapper for the hero. Layers shift subtly
 * with cursor movement (2D translate only — no 3D). Disabled on
 * touch devices and prefers-reduced-motion.
 */
export default function HeroParallax({ children }: HeroParallaxProps) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof window === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (window.matchMedia('(hover: none)').matches) return;

    let raf = 0;
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;

    const onMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      // Normalize to -0.5..0.5
      targetX = (e.clientX - rect.left) / rect.width - 0.5;
      targetY = (e.clientY - rect.top) / rect.height - 0.5;
    };

    const onLeave = () => {
      targetX = 0;
      targetY = 0;
    };

    const tick = () => {
      // Smooth lerp for buttery motion
      currentX += (targetX - currentX) * 0.08;
      currentY += (targetY - currentY) * 0.08;
      el.style.setProperty('--px', currentX.toFixed(4));
      el.style.setProperty('--py', currentY.toFixed(4));
      raf = requestAnimationFrame(tick);
    };

    el.addEventListener('mousemove', onMove);
    el.addEventListener('mouseleave', onLeave);
    raf = requestAnimationFrame(tick);

    return () => {
      el.removeEventListener('mousemove', onMove);
      el.removeEventListener('mouseleave', onLeave);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div ref={ref} className={styles.parallax}>
      {children}
    </div>
  );
}
