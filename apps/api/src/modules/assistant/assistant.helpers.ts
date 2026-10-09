export type AssistantCardType = 'doctor' | 'medicine' | 'lab' | 'facility' | 'product';

export type AssistantCard = {
  type: AssistantCardType;
  id: string;
  title: string;
  subtitle: string;
  meta: string;
  priceMinor?: number;
  badge?: string;
  href: string;
  imageUrl?: string;
  avatarName?: string;
};

export type LegacyProduct = {
  id?: string;
  nameEn: string;
  category: string | null;
  priceMinor: number;
  unit: string;
  imageUrl?: string | null;
  genericName?: string | null;
  brandName?: string | null;
};

export type PlatformResult = {
  reply: string;
  cards: AssistantCard[];
  suggestions: string[];
  products?: LegacyProduct[];
  source: string;
};

const CITY_NAMES = ['Lahore', 'Karachi', 'Islamabad'] as const;

const SPECIALITY_MAP: Array<{ speciality: string; patterns: RegExp[] }> = [
  { speciality: 'Cardiology', patterns: [/\bcardiologist\b/, /\bheart\b/, /\bcardiac\b/, /\bchest pain\b/, /\bpalpitations?\b/, /\bblood pressure\b/, /\bhypertension\b/] },
  { speciality: 'Dermatology', patterns: [/\bdermatologist\b/, /\bskin\b/, /\brash\b/, /\bacne\b/, /\beczema\b/, /\bhair fall\b/] },
  { speciality: 'Pediatrics', patterns: [/\bp(a)?ediatrician\b/, /\bchild doctor\b/, /\bkids? doctor\b/, /\bbaby doctor\b/, /\bchild specialist\b/, /\bchildren'?s doctor\b/, /\bchild\b/, /\bkids?\b/, /\bbaby\b/, /\binfant\b/] },
  { speciality: 'Dentistry', patterns: [/\bdentist\b/, /\bdental\b/, /\bteeth\b/, /\btooth\b/, /\btoothache\b/] },
  { speciality: 'Ophthalmology', patterns: [/\bophthalmologist\b/, /\beye doctor\b/, /\beye specialist\b/, /\beye\b/, /\bvision\b/, /\beyesight\b/] },
  { speciality: 'Orthopedics', patterns: [/\borthop(a)?edic\b/, /\bbone\b/, /\bjoint\b/, /\bback pain\b/, /\bknee pain\b/, /\bfracture\b/] },
  { speciality: 'Gynecology', patterns: [/\bgyn(a)?ecologist\b/, /\bwomen'?s doctor\b/, /\bpregnan(?:cy|t)\b/, /\bperiods?\b/, /\bpregnancy\b/] },
  { speciality: 'Psychiatry', patterns: [/\bpsychiatrist\b/, /\bmental health\b/, /\banxiety\b/, /\bdepression\b/, /\bstress\b/, /\binsomnia\b/] },
  { speciality: 'Gastroenterology', patterns: [/\bgastroenterologist\b/, /\bstomach\b/, /\bdigestive\b/, /\bdiarrh(o)?ea\b/, /\bconstipation\b/, /\bacidity\b/] },
  { speciality: 'ENT', patterns: [/\bent\b/, /\bear\b/, /\bnose\b/, /\bthroat\b/, /\btonsils?\b/, /\bsinus\b/] },
  { speciality: 'Neurology', patterns: [/\bneurologist\b/, /\bmigraine\b/, /\bnerves?\b/, /\bseizures?\b/] },
  { speciality: 'General Physician', patterns: [/\bgeneral physician\b/, /\bfamily doctor\b/, /\bfever\b/, /\bflu\b/, /\bcough\b/, /\bcold\b/, /\bcheck[ -]?up\b/] },
];

const MEDICINE_CLASS_MAP: Array<{ name: string; patterns: RegExp[] }> = [
  { name: 'Pain Relief', patterns: [/\bpain relief\b/, /\bpainkillers?\b/, /\bheadache\b/, /\bbody pain\b/] },
  { name: 'Antibiotics', patterns: [/\bantibiotics?\b/, /\binfection medicine\b/] },
  { name: 'Diabetes Care', patterns: [/\bdiabetes\b/, /\bdiabetic\b/, /\bblood sugar medicine\b/, /\binsulin\b/, /\bmetformin\b/] },
  { name: 'Heart & BP', patterns: [/\bheart (?:medicine|medication)\b/, /\bblood pressure (?:medicine|medication)\b/, /\bbp medicine\b/, /\bcholesterol medicine\b/] },
  { name: 'Stomach & Digestion', patterns: [/\bstomach (?:medicine|medication)\b/, /\bacidity medicine\b/, /\bdigestion\b/, /\bdigestive medicine\b/, /\bconstipation medicine\b/] },
  { name: 'Allergy & Asthma', patterns: [/\ballergy\b/, /\basthma\b/, /\binhaler\b/] },
  { name: 'Cold, Cough & Flu', patterns: [/\bcold (?:medicine|medication)\b/, /\bcough (?:medicine|syrup)\b/, /\bflu medicine\b/, /\bfever medicine\b/] },
  { name: 'Vitamins & Supplements', patterns: [/\bvitamins?\b/, /\bsupplements?\b/, /\bmultivitamins?\b/, /\bomega\b/] },
  { name: 'Skin Care', patterns: [/\bskin (?:cream|ointment|medicine|care)\b/, /\beczema cream\b/, /\bacne cream\b/] },
  { name: 'Eye & Ear', patterns: [/\beye drops?\b/, /\bear drops?\b/, /\beye (?:medicine|medication)\b/, /\bear (?:medicine|medication)\b/] },
  { name: 'Mental Health', patterns: [/\bmental health (?:medicine|medication)\b/, /\banxiety (?:medicine|medication)\b/, /\bsleep (?:medicine|tablets?)\b/] },
  { name: "Women's Health", patterns: [/\bwomen'?s health\b/, /\bpregnancy (?:medicine|vitamins?)\b/, /\bprenatal\b/] },
  { name: 'Bone & Joint', patterns: [/\bbone (?:medicine|health)\b/, /\bjoint (?:medicine|pain relief)\b/, /\bcalcium (?:tablets?|supplements?)\b/] },
];

export const MEDICINE_TERMS = /\b(medicine|medicines|medication|medications|pharmacy|pharmaceutical|prescription|antibiotic|antibiotics|tablet|tablets|capsule|capsules|syrup|inhaler|ointment|paracetamol|panadol|ibuprofen|brufen|cetirizine|omeprazole|metformin|amoxicillin|augmentin|azithromycin|insulin|vitamin|supplement)\b/i;
// Conversational filler that must never drive a medicine match on its own
// (e.g. the "do" in "Do you sell Augmentin?" previously matched Domperidone).
export const MEDICINE_FILLER_TERMS = new Set([
  'pharmacy', 'rx', 'prescription', 'sell', 'sells', 'selling', 'sold', 'needed', 'need', 'needs',
  'available', 'availability', 'stock', 'store', 'shop', 'buy', 'buys', 'please', 'show', 'find',
  'give', 'want', 'wants', 'looking', 'search', 'with', 'without', 'you', 'your', 'have', 'has',
  'any', 'some', 'what', 'which', 'there', 'this', 'that', 'medicine', 'medicines', 'medication',
]);
const SEARCH_STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'book', 'buy', 'can', 'cost', 'doctor', 'doctors', 'find', 'for', 'from', 'get',
  'give', 'have', 'help', 'i', 'in', 'is', 'it', 'lab', 'labs', 'me', 'medicine', 'medicines', 'my', 'need',
  'of', 'on', 'or', 'please', 'price', 'product', 'products', 'show', 'some', 'test', 'tests', 'the', 'to',
  'under', 'want', 'with', 'you',
]);

export function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9+./-]+/g, ' ').replace(/\s+/g, ' ').trim();
}

export function fieldTokens(value: string | null | undefined): string[] {
  return normalize(value ?? '').split(' ').filter((token) => token.length > 1 && token !== '+');
}

export function queryMentionsPhrase(normalizedQuery: string, phrase: string | null | undefined): boolean {
  const normalizedPhrase = normalize(phrase ?? '');
  return normalizedPhrase.length >= 3 && normalizedQuery.includes(normalizedPhrase);
}

export function searchTerms(query: string) {
  return [...new Set(normalize(query).split(' ').filter((term) => term.length > 1 && !SEARCH_STOP_WORDS.has(term)))];
}

// Glue words around a named-item availability question ("Do you sell Xanax?",
// "Is X available?") that must never count as the item being asked about.
const AVAILABILITY_FILLER_TERMS = new Set([
  'also', 'available', 'availability', 'carry', 'carries', 'currently', 'do', 'does', 'got',
  'has', 'have', 'now', 'sell', 'sells', 'selling', 'sold', 'stock', 'stocked', 'today', 'you', 'your',
]);
// Generic browsing words, not a named item (e.g. "Do you have trending products?").
const AVAILABILITY_BROWSE_PHRASE = /\b(trending|deals?|offers?|products?|recommendations?|bestsellers?|categories|items|stuff|things|brands)\b/i;
// Other platform domains that are routed before the product fallback anyway.
const AVAILABILITY_OTHER_DOMAIN = /\b(doctors?|appointments?|consult(?:ation)?|labs?|tests?|blood|hospitals?|clinics?|delivery|order status)\b/i;

// Detects "Do you sell/have/stock <item>?" / "Is <item> available?" questions and
// returns the named item plus its content terms. Returns null for browsing-style
// questions so normal shopping queries behave exactly as before.
export function extractNamedItemAvailability(query: string) {
  const cleaned = query.trim().replace(/\s+/g, ' ');
  const match =
    cleaned.match(/\bdo(?:es)?\s+you\s+(?:also\s+)?(?:sell|have|stock|carry)\s+(.+?)[?.!]*$/i)
    ?? cleaned.match(/\bhave\s+you\s+got\s+(.+?)[?.!]*$/i)
    ?? cleaned.match(/\bis\s+(.+?)\s+(?:available|in\s+stock)[?.!]*$/i);
  if (!match) return null;

  const label = (match[1] ?? '')
    .trim()
    .replace(/^(?:a|an|the|any|some)\s+/i, '')
    .replace(/\s+(?:please|here|right now|in stock|available)$/i, '')
    .trim();
  if (!label || AVAILABILITY_BROWSE_PHRASE.test(label) || AVAILABILITY_OTHER_DOMAIN.test(label)) return null;

  const terms = searchTerms(label).filter((term) => term.length >= 3 && !AVAILABILITY_FILLER_TERMS.has(term));
  return terms.length ? { label, terms } : null;
}

export function extractBudget(query: string): number | null {
  const underBudget = query.match(/\b(?:under|below|less than|max(?:imum)?|within|budget(?: of)?)\s*(?:(?:rs\.?|pkr|rupees)\s*)?([\d,]+(?:\.\d+)?)/i);
  const currencyAmount = query.match(/\b(?:rs\.?|pkr|rupees)\s*([\d,]+(?:\.\d+)?)/i);
  const rawAmount = underBudget?.[1] ?? currencyAmount?.[1];
  if (!rawAmount) return null;

  const amount = Number(rawAmount.replaceAll(',', ''));
  return Number.isFinite(amount) && amount > 0 ? Math.min(amount, 10_000_000) : null;
}

export function formatRs(priceMinor: number) {
  const rupees = priceMinor / 100;
  return `Rs. ${rupees.toLocaleString('en-PK', {
    minimumFractionDigits: Number.isInteger(rupees) ? 0 : 2,
    maximumFractionDigits: Number.isInteger(rupees) ? 0 : 2,
  })}`;
}

export function detectCity(query: string) {
  return CITY_NAMES.find((city) => new RegExp(`\\b${city}\\b`, 'i').test(query)) ?? null;
}

export function detectSpeciality(query: string) {
  const lower = query.toLowerCase();
  return SPECIALITY_MAP.find(({ patterns }) => patterns.some((pattern) => pattern.test(lower)))?.speciality ?? null;
}

export function detectMedicineClass(query: string) {
  const lower = query.toLowerCase();
  return MEDICINE_CLASS_MAP.find(({ patterns }) => patterns.some((pattern) => pattern.test(lower)))?.name ?? null;
}

export function isShoppingQuestion(query: string) {
  return /\b(buy|cart|cost|find|looking for|need|price|product|products|recommend|shop|shopping|show|stock|trending|under|available|sell)\b/i.test(query);
}

export function titleCase(value: string) {
  return value.replace(/\w\S*/g, (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());
}

export function buildProductResult(productMatches: LegacyProduct[], budget: number | null): PlatformResult {
  const products = productMatches.map((product) => ({
    nameEn: product.nameEn,
    category: product.category,
    priceMinor: product.priceMinor,
    unit: product.unit,
  }));

  const cards: AssistantCard[] = productMatches.slice(0, 4).map((product, index) => ({
    type: 'product',
    id: product.id ?? `product-${index}`,
    title: product.nameEn,
    subtitle: product.category ?? 'OneStop product',
    meta: `Sold by ${product.unit}`,
    priceMinor: product.priceMinor,
    badge: 'In stock',
    href: `/products?q=${encodeURIComponent(product.nameEn)}`,
    imageUrl: product.imageUrl ?? undefined,
  }));

  return {
    reply: `I found ${cards.length} live in-stock product match${cards.length === 1 ? '' : 'es'}${budget !== null ? ` within ${formatRs(budget * 100)}` : ''}. Prices are taken directly from the current catalogue.`,
    products,
    cards,
    suggestions: ['Trending products', 'Products under Rs. 1,000', 'Find medicines', 'Book a doctor'],
    source: 'live_catalog',
  };
}
