import { useId } from 'react';

type Variant = {
  presentation: 'female' | 'male';
  hijab?: boolean;
  beard?: boolean;
  glasses?: boolean;
  skin: string;
  hair: string;
  hijabColor?: string;
  shirt: string;
  bgFrom: string;
  bgTo: string;
};

const VARIANTS: Record<string, Variant> = {
  'ahmed khan':    { presentation: 'male', beard: false, glasses: true, skin: '#b07a4f', hair: '#1f2430', shirt: '#166a91', bgFrom: '#fde8ec', bgTo: '#fbd3dd' },
  'fatima noor':   { presentation: 'female', hijab: true, skin: '#c98d5e', hair: '#2b2118', hijabColor: '#7c5cbf', shirt: '#f59e0b', bgFrom: '#fff4d6', bgTo: '#fde9b8' },
  'bilal hussain': { presentation: 'male', beard: true, skin: '#8a5a33', hair: '#171a21', shirt: '#0ea5e9', bgFrom: '#e0f2fe', bgTo: '#bae6fd' },
  'ayesha siddiqui': { presentation: 'female', hijab: false, skin: '#d9a066', hair: '#2d1a12', shirt: '#db2777', bgFrom: '#fce7f3', bgTo: '#fbcfe8' },
  'maryam tariq':  { presentation: 'female', hijab: true, skin: '#a06a3f', hair: '#241a12', hijabColor: '#0f766e', shirt: '#9333ea', bgFrom: '#ede9fe', bgTo: '#ddd6fe' },
  'imran sheikh':  { presentation: 'male', beard: true, glasses: true, skin: '#b07a4f', hair: '#3a3f4a', shirt: '#2563eb', bgFrom: '#dbeafe', bgTo: '#bfdbfe' },
  'sarah ahmed':   { presentation: 'female', hijab: false, glasses: true, skin: '#e8b07d', hair: '#4a2c17', shirt: '#0891b2', bgFrom: '#cffafe', bgTo: '#a5f3fc' },
  'hassan raza':   { presentation: 'male', beard: false, skin: '#c98d5e', hair: '#1f2430', shirt: '#0f766e', bgFrom: '#ccfbf1', bgTo: '#99f6e4' },
  'zainab ali':    { presentation: 'female', hijab: true, glasses: true, skin: '#8a5a33', hair: '#1c1410', hijabColor: '#be5a83', shirt: '#ea580c', bgFrom: '#ffedd5', bgTo: '#fed7aa' },
  'omar farooq':   { presentation: 'male', beard: true, glasses: true, skin: '#d9a066', hair: '#555c6b', shirt: '#4f46e5', bgFrom: '#e0e7ff', bgTo: '#c7d2fe' },
  'hira shah':     { presentation: 'female', hijab: false, skin: '#a06a3f', hair: '#171310', shirt: '#7c3aed', bgFrom: '#ede9fe', bgTo: '#e9d5ff' },
  'ali nawaz':     { presentation: 'male', beard: true, skin: '#e8b07d', hair: '#2b2118', shirt: '#65a30d', bgFrom: '#ecfccb', bgTo: '#d9f99d' },
};

const FALLBACKS: Variant[] = [
  { presentation: 'male', beard: true, skin: '#b07a4f', hair: '#1f2430', shirt: '#166a91', bgFrom: '#eaf4f8', bgTo: '#cfe6ef' },
  { presentation: 'female', hijab: true, skin: '#c98d5e', hair: '#2b2118', hijabColor: '#166a91', shirt: '#f59e0b', bgFrom: '#fff4d6', bgTo: '#fde9b8' },
  { presentation: 'female', hijab: false, glasses: true, skin: '#d9a066', hair: '#2d1a12', shirt: '#db2777', bgFrom: '#fce7f3', bgTo: '#fbcfe8' },
  { presentation: 'male', beard: false, glasses: true, skin: '#8a5a33', hair: '#3a3f4a', shirt: '#2563eb', bgFrom: '#dbeafe', bgTo: '#bfdbfe' },
];

function cleanName(name: string | null | undefined) {
  return (name ?? 'Doctor').replace(/^Dr\.\s*/i, '').trim().toLowerCase();
}

function variantFor(name: string | null | undefined): Variant {
  const key = cleanName(name);
  if (VARIANTS[key]) return VARIANTS[key];
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  return FALLBACKS[hash % FALLBACKS.length];
}

/**
 * Professional flat-illustration doctor portrait.
 * No external images — a deterministic illustrated bust (white coat + stethoscope)
 * varied by doctor: presentation, hijab, beard, glasses, skin tone and palette.
 */
export default function DoctorAvatar({
  name,
  size = 64,
  className,
}: {
  name: string | null | undefined;
  size?: number;
  className?: string;
}) {
  const v = variantFor(name);
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const bgId = `dbg-${uid}`;
  const clipId = `dclip-${uid}`;
  const label = name ? `Illustrated portrait of ${name}` : 'Illustrated doctor portrait';
  const female = v.presentation === 'female';

  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 96 96"
      role="img"
      aria-label={label}
      style={{ display: 'block', flex: '0 0 auto', borderRadius: Math.max(12, Math.round(size * 0.28)) }}
    >
      <defs>
        <linearGradient id={bgId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={v.bgFrom} />
          <stop offset="100%" stopColor={v.bgTo} />
        </linearGradient>
        <clipPath id={clipId}>
          <rect x="0" y="0" width="96" height="96" rx="26" />
        </clipPath>
      </defs>

      <g clipPath={`url(#${clipId})`}>
        <rect x="0" y="0" width="96" height="96" fill={`url(#${bgId})`} />
        {/* soft backdrop circles */}
        <circle cx="82" cy="12" r="18" fill="#ffffff" opacity="0.35" />
        <circle cx="8" cy="30" r="10" fill="#ffffff" opacity="0.25" />

        {/* neck */}
        <rect x="42" y="52" width="12" height="14" rx="5" fill={v.skin} />
        <path d="M42 58h12v6c-4 2-8 2-12 0z" fill="#00000018" />

        {/* torso: white coat over shirt */}
        <path d="M14 96c2-18 12-28 24-30l10 8 10-8c12 2 22 12 24 30z" fill="#ffffff" />
        <path d="M38 66l10 8 10-8-3 30H41z" fill={v.shirt} />
        <path d="M38 66l10 8-4 22h-6z" fill="#f1f5f9" />
        <path d="M58 66l-10 8 4 22h6z" fill="#f1f5f9" />
        <circle cx="48" cy="86" r="1.6" fill="#cbd5e1" />

        {/* stethoscope */}
        <path d="M36 68c0 10 5 16 12 16s12-6 12-16" fill="none" stroke="#334155" strokeWidth="2.6" strokeLinecap="round" />
        <circle cx="60" cy="66" r="2.2" fill="#334155" />
        <circle cx="63" cy="84" r="4.6" fill="#f7b928" stroke="#334155" strokeWidth="2" />
        <path d="M60 68v8c0 3 1 6 3 8" fill="none" stroke="#334155" strokeWidth="2.4" strokeLinecap="round" />

        {/* long hair behind shoulders (non-hijab female) */}
        {female && !v.hijab ? (
          <path d="M30 30c0-12 8-20 18-20s18 8 18 20c0 10-2 22-5 30H35c-3-8-5-20-5-30z" fill={v.hair} />
        ) : null}

        {/* head */}
        <ellipse cx="48" cy="38" rx="16" ry="18" fill={v.skin} />
        {/* ears */}
        <circle cx="32" cy="40" r="3.4" fill={v.skin} />
        <circle cx="64" cy="40" r="3.4" fill={v.skin} />

        {v.hijab ? (
          <>
            {/* hijab drape */}
            <path d="M48 12c13 0 20 9 20 22 0 8-2 14-4 18l4 14c1 4-2 6-6 6H34c-4 0-7-2-6-6l4-14c-2-4-4-10-4-18 0-13 7-22 20-22z" fill={v.hijabColor ?? '#166a91'} />
            <ellipse cx="48" cy="38" rx="13.5" ry="15.5" fill={v.skin} />
            <path d="M34.5 36c0-9 6-15 13.5-15S61.5 27 61.5 36c0-12-5-19-13.5-19S34.5 24 34.5 36z" fill={v.hijabColor ?? '#166a91'} opacity="0.92" />
          </>
        ) : female ? (
          <>
            {/* hair top + side sweep */}
            <path d="M32 38c-1-14 6-24 16-24s17 10 16 24c-1-8-3-13-6-16-6 3-14 3-19-1-3 3-6 9-7 17z" fill={v.hair} />
          </>
        ) : (
          <>
            {/* short hair */}
            <path d="M32 36c0-12 7-20 16-20s16 8 16 20c-1-7-3-11-5-14-7 3-15 2-20-2-3 3-6 8-7 16z" fill={v.hair} />
          </>
        )}

        {/* brows + eyes */}
        <path d="M39 36.5c2-1.4 4.5-1.4 6.5 0" stroke="#3a2a1c" strokeWidth="1.7" fill="none" strokeLinecap="round" />
        <path d="M50.5 36.5c2-1.4 4.5-1.4 6.5 0" stroke="#3a2a1c" strokeWidth="1.7" fill="none" strokeLinecap="round" />
        <circle cx="42.2" cy="41" r="1.9" fill="#2b2118" />
        <circle cx="53.8" cy="41" r="1.9" fill="#2b2118" />

        {/* nose + smile */}
        <path d="M48 42v5c0 1.2 1 2 2.4 2" stroke="#0000002b" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        <path d="M42.5 52.5c3.2 2.4 7.8 2.4 11 0" stroke="#8a4b2a" strokeWidth="1.9" fill="none" strokeLinecap="round" />

        {/* beard */}
        {v.beard ? (
          <path d="M36 44c1 9 5 15 12 15s11-6 12-15c-1 3-2 5-4 6-2 8-14 8-16 0-2-1-3-3-4-6z" fill={v.hair} opacity="0.96" />
        ) : null}

        {/* glasses */}
        {v.glasses ? (
          <g stroke="#334155" strokeWidth="1.8" fill="#ffffff22">
            <circle cx="42" cy="41" r="6.4" />
            <circle cx="54" cy="41" r="6.4" />
            <path d="M48.4 41h-.8M35.6 40l-3-1.4M60.4 40l3-1.4" fill="none" strokeLinecap="round" />
          </g>
        ) : null}

        {/* blush for friendly warmth */}
        <ellipse cx="37" cy="48" rx="3.2" ry="2" fill="#e88a7a" opacity="0.35" />
        <ellipse cx="59" cy="48" rx="3.2" ry="2" fill="#e88a7a" opacity="0.35" />
      </g>
    </svg>
  );
}
