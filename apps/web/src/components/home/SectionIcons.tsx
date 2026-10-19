/**
 * Stroke-style section icons for the OneStop homepage and account pages.
 * Same visual language as CategoryIcon: 24px grid, currentColor, 1.8 stroke.
 */

import type { ReactNode } from 'react';

const P: Record<string, ReactNode> = {
  hospital: (<><path d="M5 21V7.5A1.5 1.5 0 0 1 6.5 6h11A1.5 1.5 0 0 1 19 7.5V21" /><path d="M3.5 21h17" /><path d="M12 9v6M9 12h6" /><path d="M9.5 17.5h.01M14.5 17.5h.01" /></>),
  clinic: (<><path d="M4 20V9.5L12 4l8 5.5V20" /><path d="M3 20h18" /><path d="M12 10.5v5M9.5 13h5" /><path d="M10 20v-3h4v3" /></>),
  lab: (<><path d="M10 3h4" /><path d="M10.5 3v5.2L5.6 17a2.4 2.4 0 0 0 2.1 3.5h8.6a2.4 2.4 0 0 0 2.1-3.5L13.5 8.2V3" /><path d="M8 14.5h8" /><path d="M10.5 17.5h.01M13.5 18.5h.01" /></>),
  blood: (<><path d="M12 3.5s6 6.6 6 11a6 6 0 0 1-12 0c0-4.4 6-11 6-11Z" /><path d="M9.3 14.3h1.6l.9-1.7 1.4 3 1-1.3h1.5" /></>),
  pharmacy: (<><rect x="4" y="5" width="16" height="14" rx="2.5" /><path d="M9.5 5c.6-1.2 1.5-1.8 2.5-1.8S13.9 3.8 14.5 5" /><path d="M12 9v6M9 12h6" /></>),
  pin: (<><path d="M12 21s-6.5-5.3-6.5-10.2A6.5 6.5 0 0 1 12 4a6.5 6.5 0 0 1 6.5 6.8C18.5 15.7 12 21 12 21Z" /><circle cx="12" cy="10.6" r="2.3" /></>),
  clock: (<><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></>),
  phone: (<><path d="M6.8 4h2.7l1 4-2 1.4a12.5 12.5 0 0 0 4.1 4.1l1.4-2 4 1v2.7c0 .8-.6 1.5-1.4 1.6C10.6 16.9 7.1 13.4 6.2 5.4A1.6 1.6 0 0 1 6.8 4Z" /></>),
  shield: (<><path d="M12 3.5 5.5 6v5c0 4.5 2.8 7.7 6.5 9.5 3.7-1.8 6.5-5 6.5-9.5V6L12 3.5Z" /><path d="m9 11.8 2.1 2.1 4-4.2" /></>),
  truck: (<><path d="M3.5 7h11v9h-11z" /><path d="M14.5 10.5h3.6l2.4 2.8V16h-6" /><circle cx="7" cy="17.8" r="1.9" /><circle cx="17" cy="17.8" r="1.9" /></>),
  heart: (<><path d="M12 20.5S4 15.6 4 9.9C4 6.9 6.2 5 8.6 5c1.4 0 2.7.7 3.4 1.8C12.7 5.7 14 5 15.4 5 17.8 5 20 6.9 20 9.9c0 5.7-8 10.6-8 10.6Z" /><path d="M6.5 12h3l1.5-3 2 5 1.5-2h3" /></>),
  grid: (<><rect x="4" y="4" width="7" height="7" rx="1.8" /><rect x="13" y="4" width="7" height="7" rx="1.8" /><rect x="4" y="13" width="7" height="7" rx="1.8" /><rect x="13" y="13" width="7" height="7" rx="1.8" /></>),
  signin: (<><circle cx="10" cy="8" r="3.6" /><path d="M4.5 20c.8-3.2 2.9-4.8 5.5-4.8 1.5 0 2.8.5 3.8 1.4" /><path d="M15.5 17.5h5M18 15l2.5 2.5L18 20" /></>),
  calendar: (<><rect x="4" y="5.5" width="16" height="15" rx="2.5" /><path d="M4 10h16" /><path d="M8.5 3.5v4M15.5 3.5v4" /><path d="m9 15.4 2 2 4-4.4" /></>),
  cart: (<><path d="M4 5.5h2l2.2 10.2a1.6 1.6 0 0 0 1.6 1.3h7.3a1.6 1.6 0 0 0 1.6-1.3L20 8.5H6.5" /><circle cx="10" cy="20.6" r="1.3" /><circle cx="17" cy="20.6" r="1.3" /></>),
  star: (<><path d="m12 4 2.3 4.9 5.3.6-3.9 3.6 1 5.3L12 15.8l-4.7 2.6 1-5.3L4.4 9.5l5.3-.6L12 4Z" /></>),
  quote: (<><path d="M5 17.5c-1 0-1.7-.7-1.7-1.8V9.4c0-2 1.5-3.4 3.6-3.7l.3 1.8c-1 .2-1.7 1-1.8 1.9h1.7v6.4H5Zm8.7 0c-1 0-1.8-.7-1.8-1.8V9.4c0-2 1.6-3.4 3.7-3.7l.3 1.8c-1 .2-1.7 1-1.9 1.9h1.7v6.4h-2Z" /></>),
  chevron: (<><path d="m6 9.5 6 6 6-6" /></>),
  check: (<><path d="m4.5 12.5 5 5L19.5 7" /></>),
  spark: (<><path d="M12 3.5 13.8 10l6.7 2-6.7 2L12 20.5 10.2 14 3.5 12l6.7-2L12 3.5Z" /><path d="M18.8 4.5h.01M5 18.5h.01" /></>),
  users: (<><circle cx="9" cy="8.5" r="3.4" /><path d="M3.5 20c.8-3.4 2.8-5 5.5-5s4.7 1.6 5.5 5" /><path d="M15.8 5.6a3.4 3.4 0 0 1 0 5.8M17.8 15.4c1.5.7 2.4 2.2 2.8 4.2" /></>),
  stethoscope: (<><path d="M5.5 4v5a4 4 0 0 0 8 0V4" /><path d="M5.5 4H4M9.5 4h4" /><path d="M9.5 13v2.5a4.5 4.5 0 0 0 9 0V14" /><circle cx="18.5" cy="11.5" r="2.3" /></>),
  mail: (<><rect x="3.5" y="5.5" width="17" height="13" rx="2.5" /><path d="m4.5 7.5 7.5 6 7.5-6" /></>),
  /* ---- Design-system core: arrows, actions, theme ---- */
  arrowRight: (<><path d="M4 12h15" /><path d="m13.5 6.5 5.5 5.5-5.5 5.5" /></>),
  arrowLeft: (<><path d="M20 12H5" /><path d="m10.5 6.5-5.5 5.5 5.5 5.5" /></>),
  arrowUp: (<><path d="M12 20V5" /><path d="m6.5 10.5 5.5-5.5 5.5 5.5" /></>),
  chevronRight: (<><path d="m9.5 6 6 6-6 6" /></>),
  chevronLeft: (<><path d="m14.5 6-6 6 6 6" /></>),
  x: (<><path d="M6 6l12 12M18 6 6 18" /></>),
  plus: (<><path d="M12 5v14M5 12h14" /></>),
  minus: (<><path d="M5 12h14" /></>),
  menu: (<><path d="M4 7h16M4 12h16M4 17h16" /></>),
  search: (<><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4.5 4.5" /></>),
  moon: (<><path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5Z" /></>),
  sun: (<><circle cx="12" cy="12" r="4" /><path d="M12 3.5v2M12 18.5v2M3.5 12h2M18.5 12h2M6 6l1.4 1.4M16.6 16.6 18 18M18 6l-1.4 1.4M7.4 16.6 6 18" /></>),
  bolt: (<><path d="M13 3.5 5.5 13.5H11L10 20.5l7.5-10H12l1-7Z" /></>),
  heartOutline: (<><path d="M12 20.5S4 15.6 4 9.9C4 6.9 6.2 5 8.6 5c1.4 0 2.7.7 3.4 1.8C12.7 5.7 14 5 15.4 5 17.8 5 20 6.9 20 9.9c0 5.7-8 10.6-8 10.6Z" /></>),
  user: (<><circle cx="12" cy="8" r="3.8" /><path d="M5 20c.9-3.6 3.4-5.4 7-5.4s6.1 1.8 7 5.4" /></>),
  logout: (<><path d="M14 4H6.5A1.5 1.5 0 0 0 5 5.5v13A1.5 1.5 0 0 0 6.5 20H14" /><path d="M10 12h10M17.5 8.5 21 12l-3.5 3.5" /></>),
  package: (<><path d="m12 3.5 8 4v9l-8 4-8-4v-9l8-4Z" /><path d="M4.5 7.5 12 11.5l7.5-4" /><path d="M12 11.5V20" /></>),
  pill: (<><rect x="3.5" y="9" width="17" height="7" rx="3.5" transform="rotate(-35 12 12.5)" /><path d="m9.8 15.6 4.4-4.4" /></>),
  filter: (<><path d="M4 6h16" /><path d="M7 12h10" /><path d="M10 18h4" /></>),
  bell: (<><path d="M6 10a6 6 0 0 1 12 0c0 4 1.5 5.5 1.5 5.5h-15S6 14 6 10" /><path d="M10 19.5a2.2 2.2 0 0 0 4 0" /></>),
  eye: (<><path d="M3.5 12S6 6 12 6s8.5 6 8.5 6-2.5 6-8.5 6S3.5 12 3.5 12Z" /><circle cx="12" cy="12" r="2.6" /></>),
  info: (<><circle cx="12" cy="12" r="8.5" /><path d="M12 11v5" /><path d="M12 8h.01" /></>),
  alert: (<><path d="M12 4 3.5 19.5h17L12 4Z" /><path d="M12 10v4" /><path d="M12 17.5h.01" /></>),
  rx: (<><rect x="4" y="4" width="16" height="16" rx="3" /><path d="M9 16V8.5h2.6a2.4 2.4 0 0 1 0 4.8H9" /><path d="m11.4 13.2 2.3 2.8" /><path d="m16.5 9.5-1 1.5 1 1.5" /></>),
  truckFast: (<><path d="M3.5 7h11v9h-11z" /><path d="M14.5 10.5h3.6l2.4 2.8V16h-6" /><circle cx="7" cy="17.8" r="1.9" /><circle cx="17" cy="17.8" r="1.9" /><path d="M1.5 9.5h2M2.5 13h2" /></>),
  card: (<><rect x="3.5" y="6" width="17" height="12.5" rx="2.5" /><path d="M3.5 10h17" /><path d="M7 14.5h4" /></>),
  cash: (<><rect x="3" y="7" width="18" height="10.5" rx="2.5" /><circle cx="12" cy="12.2" r="2.6" /><path d="M6.5 10h.01M17.5 14.5h.01" /></>),
};

export type SectionIconName = keyof typeof P;

export function SectionIcon({ name, size = 24 }: { name: SectionIconName; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      {P[name]}
    </svg>
  );
}

export const FACILITY_STYLE: Record<string, { icon: SectionIconName; label: string; from: string; to: string; soft: string }> = {
  HOSPITAL: { icon: 'hospital', label: 'Hospital', from: '#0284c7', to: '#38bdf8', soft: '#e8f5fd' },
  CLINIC: { icon: 'clinic', label: 'Clinic', from: '#0f766e', to: '#2dd4bf', soft: '#e7f8f5' },
  LAB: { icon: 'lab', label: 'Lab', from: '#7c3aed', to: '#c084fc', soft: '#f3eefe' },
  BLOOD_BANK: { icon: 'blood', label: 'Blood Bank', from: '#e11d48', to: '#fb7185', soft: '#fdeef1' },
  PHARMACY: { icon: 'pharmacy', label: 'Pharmacy', from: '#059669', to: '#34d399', soft: '#e9f8f1' },
};

export const FACILITY_FALLBACK = { icon: 'pin' as SectionIconName, label: 'Care facility', from: '#166a91', to: '#38a3c8', soft: '#eef6f9' };
