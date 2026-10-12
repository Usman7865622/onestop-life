'use client';

import FormIcon from './FormIcon';
import styles from './medicine-visual.module.css';

const CLASS_GRADIENTS: Record<string, string> = {
  'Pain Relief': 'linear-gradient(135deg, #b45309, #f59e0b)',
  Antibiotics: 'linear-gradient(135deg, #1d4ed8, #60a5fa)',
  'Diabetes Care': 'linear-gradient(135deg, #0f766e, #2dd4bf)',
  'Heart & BP': 'linear-gradient(135deg, #be123c, #fb7185)',
  'Stomach & Digestion': 'linear-gradient(135deg, #c2410c, #fb923c)',
  'Allergy & Asthma': 'linear-gradient(135deg, #0284c7, #38bdf8)',
  'Cold, Cough & Flu': 'linear-gradient(135deg, #4f46e5, #818cf8)',
  'Vitamins & Supplements': 'linear-gradient(135deg, #4d7c0f, #a3e635)',
  'Skin Care': 'linear-gradient(135deg, #be185d, #f472b6)',
  'Eye & Ear': 'linear-gradient(135deg, #0e7490, #22d3ee)',
  'Mental Health': 'linear-gradient(135deg, #7e22ce, #c084fc)',
  "Women's Health": 'linear-gradient(135deg, #a21caf, #e879f9)',
  'Bone & Joint': 'linear-gradient(135deg, #475569, #94a3b8)',
};

const DEFAULT_GRADIENT = 'linear-gradient(135deg, #15803d, #4ade80)';

type MedicineVisualProps = {
  form?: string | null;
  therapeuticClass?: string | null;
  name?: string | null;
  className?: string;
};

/**
 * Designed medicine tile: class-tinted gradient + dosage-form icon +
 * generic-name initial. Replaces repetitive stock photos with a
 * consistent, professional visual for all 222 catalogue medicines.
 */
export default function MedicineVisual({ form, therapeuticClass, name, className }: MedicineVisualProps) {
  const gradient = (therapeuticClass && CLASS_GRADIENTS[therapeuticClass]) ?? DEFAULT_GRADIENT;
  const initial = (name ?? '').trim().charAt(0).toUpperCase() || '✚';
  return (
    <div
      className={className ? `${styles.tile} ${className}` : styles.tile}
      style={{ background: gradient }}
      aria-hidden="true"
    >
      <FormIcon form={form ?? undefined} />
      <span className={styles.initial}>{initial}</span>
    </div>
  );
}
