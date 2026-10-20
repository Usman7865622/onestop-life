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

/**
 * Symptom guide: everyday symptom *language* ("my knee hurts", "burning after
 * meals", "can't sleep") mapped to the speciality that usually assesses it.
 * This is routing guidance only — the assistant never diagnoses, and the
 * reply always says so. Every target speciality exists in the live catalogue.
 */
const SYMPTOM_GUIDE_MAP: Array<{ speciality: string; label: string; patterns: RegExp[] }> = [
  { speciality: 'Orthopedics', label: 'joint, bone or muscle pain', patterns: [/\b(knee|shoulder|elbow|ankle|wrist|hip|neck|heel|finger)s?\b[^.]{0,30}\b(hurt|hurts|hurting|ache|aches|aching|pain|pains|painful|stiff|stiffness|swollen|swelling|sprain|sprained)\b/, /\b(back|spine|joint|muscle)s?\b[^.]{0,20}\b(hurt|hurts|ache|aches|pain|pains|painful|stiff|stiffness)\b/, /\b(joint pain|muscle pain|neck pain|shoulder pain|ankle pain|heel pain|sprain|arthritis|frozen shoulder|sports injury)\b/, /\bpain in (my |the )?(knee|shoulder|elbow|ankle|wrist|hip|neck|back|joints?|bones?|heel)\b/] },
  { speciality: 'Gastroenterology', label: 'stomach and digestion problems', patterns: [/\b(heartburn|acid reflux|bloating|indigestion)\b/, /\b(burning|burns|pain|ache|cramp|cramps|upset)\b[^.]{0,25}\b(stomach|abdomen|belly|chest after (eating|meals?))\b/, /\b(stomach|tummy|belly)\b[^.]{0,20}\b(burning|burns|hurt|hurts|ache|aches|pain|upset|gas)\b/, /\b(loose motions?|vomiting|nausea|feeling sick to (my|the) stomach)\b/, /\bgas (problem|trouble)\b/, /\bconstipated\b/] },
  { speciality: 'Dermatology', label: 'skin, hair and nail problems', patterns: [/\b(itchy|itching|itch)\b[^.]{0,20}\b(skin|scalp|body|hands?|feet|foot)\b/, /\bskin\b[^.]{0,20}\b(itchy|itching|dry|peeling|spots?|patches|allergy)\b/, /\b(pimples|dandruff|hair ?fall|hair loss|thinning hair|fungal infection|ringworm|moles?|warts?|boils?)\b/, /\bnails?\b[^.]{0,15}\b(fungal|infection|breaking|yellow)\b/] },
  { speciality: 'Neurology', label: 'headaches and nerve problems', patterns: [/\bheadaches?\b[^.]{0,30}\b(keep|keeps|coming back|recurring|every day|daily|frequent|again and again)\b/, /\b(head|migraine)\b[^.]{0,15}\b(keeps|recurring)\b/, /\b(numbness|tingling|pins and needles)\b/, /\b(dizzy|dizziness|vertigo|fainting|memory loss|forgetfulness|tremors?|shaking hands)\b/, /\bepilepsy\b/] },
  { speciality: 'Psychiatry', label: 'stress, mood and sleep problems', patterns: [/\b(can'?t|cannot|trouble|difficulty) (sleep|sleeping|falling asleep)\b/, /\b(feel|feeling) (low|down|sad|hopeless|anxious|stressed|overwhelmed|burnt out|burned out)\b/, /\b(panic attacks?|overthinking|mind (racing|won'?t stop)|no motivation|lost interest)\b/, /\bsleep (problem|issues?|trouble)\b/, /\bmood swings?\b/] },
  { speciality: 'ENT', label: 'ear, nose and throat problems', patterns: [/\b(ear|ears)\b[^.]{0,20}\b(hurt|hurts|ache|pain|blocked|ringing|wax|infection)\b/, /\b(sore throat|throat (pain|infection)|runny nose|blocked nose|nose ?bleeds?|sneezing a lot|loss of smell|hoarse|voice (loss|gone))\b/, /\b(earache|tinnitus|hearing (loss|problem))\b/] },
  { speciality: 'Ophthalmology', label: 'eye and vision problems', patterns: [/\b(eyes?|vision)\b[^.]{0,20}\b(blurry|blurred|dry|watery|red|itching|hurt|hurts|pain|strain|weak|getting weak)\b/, /\b(blurry vision|blurred vision|double vision|eye strain|weak eyesight|need glasses|spectacles)\b/] },
  { speciality: 'Dentistry', label: 'tooth and gum problems', patterns: [/\b(tooth|teeth|gum|gums)\b[^.]{0,20}\b(hurt|hurts|ache|pain|sensitive|sensitivity|bleeding|swollen|swelling)\b/, /\b(bad breath|mouth ulcers?|jaw (pain|ache)|wisdom tooth)\b/] },
  { speciality: 'Gynecology', label: "women's health concerns", patterns: [/\b(irregular|missed|late|heavy|painful) periods?\b/, /\b(period pain|menstrual|pcos|pregnancy (test|care|check)|trying to conceive|fertility)\b/] },
  { speciality: 'Pediatrics', label: "children's health concerns", patterns: [/\b(my|our) (child|kid|son|daughter|baby|toddler|infant)\b[^.]{0,40}\b(fever|sick|ill|cough|cold|vomit|vomiting|rash|not eating|diarrh|pain|weak|vaccin)/, /\b(baby|child|kid|toddler)\b[^.]{0,15}\b(has )?(a )?(fever|high temperature)\b/, /\bvaccination(s)? for (my )?(child|kid|baby)\b/] },
  { speciality: 'Cardiology', label: 'heart and blood-pressure concerns', patterns: [/\bheart\b[^.]{0,20}\b(beat|beats|beating|racing|flutter|skips|fast|slow)\b/, /\b(bp|blood pressure)\b[^.]{0,20}\b(high|low|shoot|shoots|rising|uncontrolled)\b/, /\b(breathless|short of breath)\b[^.]{0,25}\b(walk|climb|stairs|exert)/] },
  { speciality: 'General Physician', label: 'general illness and check-ups', patterns: [/\b(fever|temperature)\b[^.]{0,25}\b(since|for (the )?(last|past)|days?|won'?t go|keeps coming)\b/, /\b(burning|pain|hurts?)\b[^.]{0,25}\b(urinat\w*|urine|pass urine|pee)\b/, /\b(frequent urination|urine (infection|problem))\b/, /\b(body aches?|feeling weak|weakness|tired all the time|fatigue|weight (loss|gain)|no appetite|breathless|wheezing|asthma (check|flare))\b/, /\b(full body|general|routine) check[ -]?up\b/] },
];

export function detectSymptomGuide(query: string): { speciality: string; label: string } | null {
  const lower = query.toLowerCase();
  const match = SYMPTOM_GUIDE_MAP.find(({ patterns }) => patterns.some((pattern) => pattern.test(lower)));
  return match ? { speciality: match.speciality, label: match.label } : null;
}

/** Phrases that mean "I want to describe a symptom" before the symptom itself is named. */
export const SYMPTOM_INTRO_PATTERN = /\b(describe|tell you|share) (my |a )?symptoms?\b|\bwhich doctor (should|shall|to) (i|we) (see|visit|consult)\b|\bwhat (kind of |type of )?doctor (should|for)\b|\bi (have|am having|feel|am feeling|suffer from|am suffering)\b[^.]{0,60}\b(pain|ache|problem|issue|burning|itching|trouble)\b|\bnot feeling (well|good|right)\b/i;

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
