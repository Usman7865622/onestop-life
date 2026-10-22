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
  const underBudget = query.match(/\b(?:under|below|less than|max(?:imum)?|within|budget(?: of)?)\s*(?:(?:rs\.?|pkr|rupees|rupay|روپے)\s*)?([\d,]+(?:\.\d+)?)/i);
  const currencyAmount = query.match(/(?:\b(?:rs\.?|pkr|rupees|rupay)\s*|روپے\s*)([\d,]+(?:\.\d+)?)/i);
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

/* ------------------------------------------------------------------ */
/* Urdu support: script (Nastaliq) and Roman Urdu.                     */
/* Detection runs on the raw message (normalize() strips Urdu script), */
/* routing reuses the English pipeline on a translated query, and      */
/* replies are rendered from per-language templates. Live card data    */
/* (doctor names, product names, prices) stays exactly as listed.      */
/* ------------------------------------------------------------------ */

export type AssistantLang = 'en' | 'ur' | 'roman-ur';

const URDU_SCRIPT_PATTERN = /[\u0600-\u06FF]/;

// Strong Roman-Urdu markers: ordinary English sentences essentially never
// contain these, so one or two hits are enough to switch language.
const ROMAN_URDU_STRONG = /\b(mujhe|mujhay|chahiye|chahye|bukhar|bukhaar|khansi|dawai|ghutna|ghutne|tezabiyat|peshab|mahwari|bachon|haspatal|kharish|soojan|chakkar|kamzori|thakawat|qabz|maida|maiday|jild|daant|aankh|kaan|khoon|shugar|neend|ghabrahat)\b/i;
const ROMAN_URDU_WEAK = /\b(hai|hain|mera|meri|mere|ka|ki|ke|mein|dard|dawa|goli|sharbat|talash|karein|dikha|dikhaen|batao|chahye|wala|wali|bohat|bohut|takleef|ilaaj|qareeb|aurat|khawateen|dharkan)\b/gi;

export function detectAssistantLanguage(query: string): AssistantLang {
  if (URDU_SCRIPT_PATTERN.test(query)) return 'ur';
  const lower = query.toLowerCase();
  const weakHits = (lower.match(ROMAN_URDU_WEAK) ?? []).length;
  if (ROMAN_URDU_STRONG.test(lower) && weakHits >= 1) return 'roman-ur';
  if (weakHits >= 3) return 'roman-ur';
  return 'en';
}

// Phrase-level translations run first (longest match wins), then word level.
// The output only feeds the English detectors/search — never shown to users.
const URDU_PHRASE_MAP: Array<[string, string]> = [
  ['اسلام آباد', 'Islamabad'],
  ['بخار کی دوا', 'fever medicine'], ['کھانسی کا شربت', 'cough syrup'], ['درد کی گولی', 'pain relief tablet'], ['درد کی دوا', 'pain relief medicine'],
  ['سر میں درد', 'headache'], ['جلد کی کریم', 'skin cream'], ['آنکھ کے قطرے', 'eye drops'], ['کان کے قطرے', 'ear drops'],
  ['قبض کی دوا', 'constipation medicine'], ['معدے کی دوا', 'acidity medicine'], ['تیزابیت کی دوا', 'acidity medicine'], ['شوگر کی دوا', 'diabetes medicine'],
  ['خون کا ٹیسٹ', 'CBC blood test'], ['شوگر ٹیسٹ', 'blood sugar test'], ['پیشاب کا ٹیسٹ', 'urine test'], ['بلڈ پریشر', 'blood pressure'],
  ['دل کا ڈاکٹر', 'cardiologist'], ['بچوں کا ڈاکٹر', 'pediatrician'], ['دانتوں کا ڈاکٹر', 'dentist'], ['آنکھوں کا ڈاکٹر', 'eye doctor'],
  ['بغیر نسخے کی دوا', 'medicine without prescription'], ['بغیر نسخے', 'without prescription'],
  ['جلد کا ڈاکٹر', 'dermatologist'], ['ہڈیوں کا ڈاکٹر', 'orthopedic doctor'], ['خون چاہیے', 'blood needed urgently'], ['خون کی ضرورت', 'blood needed urgently'],
  ['سر درد', 'headache'],
];
const URDU_WORD_MAP: Record<string, string> = {
  'بخار': 'fever', 'کھانسی': 'cough', 'دوا': 'medicine', 'دوائی': 'medicine', 'گولی': 'tablet', 'شربت': 'syrup', 'کریم': 'cream',
  'قطرے': 'drops', 'درد': 'pain', 'جلن': 'burning', 'خارش': 'itching', 'سوجن': 'swelling', 'چکر': 'dizziness', 'کمزوری': 'weakness',
  'تھکاوٹ': 'fatigue', 'قبض': 'constipation', 'تیزابیت': 'acidity', 'شوگر': 'diabetes', 'خون': 'blood', 'ہسپتال': 'hospital',
  'لیب': 'lab', 'ٹیسٹ': 'test', 'ڈاکٹر': 'doctor', 'لاہور': 'Lahore', 'کراچی': 'Karachi', 'قریب': 'near', 'چاہیے': 'need',
  'اپائنٹمنٹ': 'appointment', 'بک': 'book', 'نیند': 'sleep', 'بچہ': 'child', 'مریض': 'patient',
};

const ROMAN_PHRASE_MAP: Array<[string, string]> = [
  ['bukhar ki dawa', 'fever medicine'], ['khansi ka sharbat', 'cough syrup'], ['dard ki goli', 'pain relief tablet'], ['dard ki dawa', 'pain relief medicine'],
  ['sar mein dard', 'headache'], ['sar dard', 'headache'], ['jild ki cream', 'skin cream'], ['aankh ke qatray', 'eye drops'], ['kaan ke qatray', 'ear drops'],
  ['qabz ki dawa', 'constipation medicine'], ['maiday ki dawa', 'acidity medicine'], ['tezabiyat ki dawa', 'acidity medicine'], ['sugar ki dawa', 'diabetes medicine'],
  ['sugar ka test', 'blood sugar test'], ['khoon ka test', 'CBC blood test'], ['peshab ka test', 'urine test'],
  ['dil ka doctor', 'cardiologist'], ['bachon ka doctor', 'pediatrician'], ['danton ka doctor', 'dentist'], ['aankhon ka doctor', 'eye doctor'],
  ['baghair nuskhe ki dawa', 'medicine without prescription'], ['baghair prescription', 'without prescription'], ['baghair nuskhe', 'without prescription'],
  ['jild ka doctor', 'dermatologist'], ['haddiyon ka doctor', 'orthopedic doctor'], ['khoon chahiye', 'blood needed urgently'],
];
const ROMAN_WORD_MAP: Record<string, string> = {
  bukhar: 'fever', bukhaar: 'fever', khansi: 'cough', dawa: 'medicine', dawai: 'medicine', goli: 'tablet', sharbat: 'syrup',
  qatray: 'drops', dard: 'pain', jalan: 'burning', kharish: 'itching', soojan: 'swelling', chakkar: 'dizziness', kamzori: 'weakness',
  thakawat: 'fatigue', qabz: 'constipation', tezabiyat: 'acidity', sugar: 'diabetes', khoon: 'blood', haspatal: 'hospital',
  ilaaj: 'treatment', chahiye: 'need', chahye: 'need', qareeb: 'near', talash: 'find', neend: 'sleep', peshab: 'urine',
};

export function translateUrduQuery(query: string, lang: AssistantLang): string {
  if (lang === 'en') return query;
  let out = ` ${query} `;
  const phrases = lang === 'ur' ? URDU_PHRASE_MAP : ROMAN_PHRASE_MAP;
  for (const [from, to] of [...phrases].sort((a, b) => b[0].length - a[0].length)) {
    out = out.split(from).join(` ${to} `);
  }
  const words = lang === 'ur' ? URDU_WORD_MAP : ROMAN_WORD_MAP;
  out = out.split(/\s+/).map((token) => {
    const clean = token.replace(/[۔،؟!.,?]/g, '');
    return words[clean.toLowerCase()] ?? token;
  }).join(' ');
  return out.replace(/\s+/g, ' ').trim();
}

// Direct speciality asks in Urdu ("دل کے ڈاکٹر", "haddiyon ka doctor") —
// checked on the original message before/alongside translation.
const URDU_SPECIALITY_PATTERNS: Array<{ speciality: string; patterns: RegExp[] }> = [
  { speciality: 'Cardiology', patterns: [/دل (کا|کے|کی) ڈاکٹر/, /ماہر(ِ| )قلب/, /\bdil (ka|ke|kay) doctor\b/i, /\bheart (ka|ke) doctor\b/i] },
  { speciality: 'Dermatology', patterns: [/جلد (کا|کے|کی) ڈاکٹر/, /\bjild (ka|ke|kay) doctor\b/i, /\bskin (ka|ke) doctor\b/i] },
  { speciality: 'Pediatrics', patterns: [/بچوں (کا|کے|کی) ڈاکٹر/, /\bbachon (ka|ke|kay) doctor\b/i, /\bbaby doctor\b/i] },
  { speciality: 'Dentistry', patterns: [/دانتوں (کا|کے|کی) ڈاکٹر/, /ڈینٹسٹ/, /\bdanton (ka|ke|kay) doctor\b/i, /\bdentist\b/i] },
  { speciality: 'Ophthalmology', patterns: [/آنکھوں (کا|کے|کی) ڈاکٹر/, /\baankhon (ka|ke|kay) doctor\b/i, /\beye (ka|ke) doctor\b/i] },
  { speciality: 'Orthopedics', patterns: [/ہڈیوں (کا|کے|کی) ڈاکٹر/, /\bhaddiyon (ka|ke|kay) doctor\b/i, /\bbone (ka|ke) doctor\b/i] },
  { speciality: 'Gynecology', patterns: [/خواتین (کا|کے|کی) ڈاکٹر/, /گائنی/, /\bkhawateen (ka|ke|kay) doctor\b/i, /\bgynae\b/i] },
  { speciality: 'Psychiatry', patterns: [/نفسیاتی ڈاکٹر/, /ذہنی (امراض )?(کا|کے) ڈاکٹر/, /\bnafsiyati doctor\b/i, /\bzehni doctor\b/i] },
  { speciality: 'Gastroenterology', patterns: [/معدے (کا|کے|کی) ڈاکٹر/, /\bmaiday (ka|ke|kay) doctor\b/i] },
  { speciality: 'ENT', patterns: [/کان ناک گلے (کا|کے|کی) ڈاکٹر/, /\bkaan naak galay (ka|ke|kay) doctor\b/i, /\bent (ka|ke) doctor\b/i] },
  { speciality: 'Neurology', patterns: [/اعصاب (کا|کے|کی) ڈاکٹر/, /دماغ (کا|کے|کی) ڈاکٹر/, /\basab (ka|ke|kay) doctor\b/i, /\bdimagh (ka|ke|kay) doctor\b/i] },
];

export function detectUrduSpeciality(query: string): string | null {
  return URDU_SPECIALITY_PATTERNS.find(({ patterns }) => patterns.some((p) => p.test(query)))?.speciality ?? null;
}

// Symptom language in Urdu script and Roman Urdu, mirroring the English
// guide: routing guidance only, never a diagnosis.
const URDU_SYMPTOM_PATTERNS: Array<{ speciality: string; patterns: RegExp[] }> = [
  { speciality: 'Orthopedics', patterns: [/(گھٹن|جوڑ|کمر|کندھ|گردن|ایڑی|کہنی|کلائی)[^.۔]{0,20}(درد|تکلیف|سوجن|اکڑ)/, /(درد)[^.۔]{0,15}(گھٹن|جوڑ|کمر|کندھ|ہڈی)/, /\b(ghutn\w*|joron|kamar|kandh\w*|gardan)\b[^.]{0,25}\b(dard|takleef|soojan)\b/i, /\bdard\b[^.]{0,20}\b(ghutn\w*|kamar|kandh\w*|haddi)\b/i] },
  { speciality: 'Gastroenterology', patterns: [/(معد|پیٹ)[^.۔]{0,18}(جلن|درد|خراب|گیس|بھاری)/, /کھانے کے بعد[^.۔]{0,20}جلن/, /(جلن)[^.۔]{0,15}(معد|پیٹ|سینے)/, /\b(maida|maiday|pait|paitt)\b[^.]{0,20}\b(jalan|dard|kharab|gas)\b/i, /\bkhane ke baad\b[^.]{0,20}\bjala?n\b/i, /\btezabiyat\b/i, /\bqabz\b/i] },
  { speciality: 'Dermatology', patterns: [/(جلد|خارش|دانے|دھبے|چہرے)[^.۔]{0,18}(خارش|خشک|سرخ|دانے|دھبے)/, /خارش/, /بال (جھڑ|گر)/, /\b(jild|kharish|daanay|chehra)\b[^.]{0,20}\b(kharish|khushk|surkh|daanay)\b/i, /\bkharish\b/i, /\bbaal (jhar|gir)\w*\b/i] },
  { speciality: 'Neurology', patterns: [/سر (میں|کا) درد/, /چکر (آ|ا)/, /(ہاتھ|پیر|بازو)[^.۔]{0,12}(سن|جھنجھنا)/, /\bsar (mein|ka) dard\b/i, /\bchakkar (aa|a)\w*\b/i, /\bhaath\b[^.]{0,15}\bsunn\b/i] },
  { speciality: 'Psychiatry', patterns: [/نیند (نہیں|کا مسئلہ|نہ آ)/, /ذہنی دباؤ/, /گھبراہٹ/, /(دل )?(اداس|بے چین)/, /\bneend (nahi|nahin|ka masla|na aa)\w*\b/i, /\bzehni dabao\b/i, /\bghabrahat\b/i, /\budaas\b/i, /\bbechain\w*\b/i] },
  { speciality: 'ENT', patterns: [/(کان)[^.۔]{0,15}(درد|بند|بج|بہر)/, /(گلے|گلا)[^.۔]{0,12}(درد|خراب|سوجن)/, /(ناک)[^.۔]{0,12}(بند|بہ|خون)/, /\bkaan\b[^.]{0,18}\b(dard|band|baj)\w*\b/i, /\bgal(a|ay)\b[^.]{0,15}\b(dard|kharab|soojan)\b/i, /\bnaak\b[^.]{0,15}\b(band|beh|xoon)\w*\b/i] },
  { speciality: 'Ophthalmology', patterns: [/(آنکھ)[^.۔]{0,15}(درد|سرخ|خارش|دھندل|پانی)/, /نظر[^.۔]{0,12}(کمزور|دھندل)/, /\baankh\b[^.]{0,18}\b(dard|surkh|kharish|dhundl\w*|paani)\b/i, /\bnazar\b[^.]{0,15}\b(kamzor|dhundl\w*)\b/i] },
  { speciality: 'Dentistry', patterns: [/(دانت|مسوڑھ)[^.۔]{0,15}(درد|خون|سوجن|حساس)/, /\bdaant\b[^.]{0,18}\b(dard|xoon|soojan)\b/i, /\bmasoorh\w*\b[^.]{0,15}\b(dard|xoon|soojan)\b/i] },
  { speciality: 'Gynecology', patterns: [/(ماہواری|پیریڈ)[^.۔]{0,18}(بے قاعد|درد|تاخیر|بند)/, /حمل/, /\b(mahwari|periods?)\b[^.]{0,20}\b(beqaida|dard|takheer|band)\b/i, /\bhamal\b/i] },
  { speciality: 'Pediatrics', patterns: [/(بچ|بیٹ|بیٹی)[^.۔]{0,25}(بخار|کھانسی|بیمار|الٹی)/, /\b(bacha|bacha|beta|beti|bachay)\b[^.]{0,25}\b(bukhar|khansi|bemaar|ulti)\b/i] },
  { speciality: 'Cardiology', patterns: [/دل کی دھڑکن[^.۔]{0,15}(تیز|بے ترتیب|تیزی)/, /بلڈ پریشر[^.۔]{0,15}(ہائی|زیادہ|کم|بڑھ)/, /(سانس)[^.۔]{0,18}(پھول|مشکل|چڑھ)/, /\bdil ki dharkan\b[^.]{0,18}\b(tez|betarteeb)\b/i, /\bblood pressure\b[^.]{0,18}\b(high|zyada|kam)\b/i, /\bsaans (phool|charh)\w*\b/i] },
  { speciality: 'General Physician', patterns: [/(بخار)[^.۔]{0,20}(دن|سے|نہیں اتر|چڑھا)/, /(دن|ہفتے|مہینے) سے[^.۔]{0,12}بخار/, /(پیشاب)[^.۔]{0,15}(جلن|درد|بار بار)/, /(کمزوری|تھکاوٹ|چیک اپ)/, /\bbukhar\b[^.]{0,25}\b(din|se|nahi utar|nahin utar)\b/i, /\b(din|hafte|mahine) se\b[^.]{0,16}\bbukhar\b/i, /\bpeshab\b[^.]{0,18}\b(jalan|dard|baar baar)\b/i, /\b(kamzori|thakawat|check ?up)\b/i] },
];

export function detectUrduSymptomGuide(query: string): string | null {
  return URDU_SYMPTOM_PATTERNS.find(({ patterns }) => patterns.some((p) => p.test(query)))?.speciality ?? null;
}

export const URDU_EMERGENCY_PATTERN = /(سینے|چھاتی)[^.۔]{0,14}درد|سانس[^.۔]{0,20}(مشکل|نہیں آ|رک)|بے ہوش|بہت زیادہ خون بہ|\b(seene|seenay|chaati)\b[^.]{0,16}\bdard\b|\bsaans\b[^.]{0,22}\b(mushkil|nahi aa|nahin aa|ruk)\b|\bbehosh\b/i;

export const GUIDE_LABELS: Record<AssistantLang, Record<string, string>> = {
  en: {
    Orthopedics: 'joint, bone or muscle pain', Gastroenterology: 'stomach and digestion problems', Dermatology: 'skin, hair and nail problems',
    Neurology: 'headaches and nerve problems', Psychiatry: 'stress, mood and sleep problems', ENT: 'ear, nose and throat problems',
    Ophthalmology: 'eye and vision problems', Dentistry: 'tooth and gum problems', Gynecology: "women's health concerns",
    Pediatrics: "children's health concerns", Cardiology: 'heart and blood-pressure concerns', 'General Physician': 'general illness and check-ups',
  },
  ur: {
    Orthopedics: 'جوڑوں، ہڈیوں یا پٹھوں کے درد', Gastroenterology: 'معدے اور نظامِ ہاضمہ کے مسائل', Dermatology: 'جلد، بال اور ناخن کے مسائل',
    Neurology: 'سر درد اور اعصابی مسائل', Psychiatry: 'ذہنی دباؤ، مزاج اور نیند کے مسائل', ENT: 'کان، ناک اور گلے کے مسائل',
    Ophthalmology: 'آنکھ اور بینائی کے مسائل', Dentistry: 'دانت اور مسوڑھوں کے مسائل', Gynecology: 'خواتین کی صحت کے معاملات',
    Pediatrics: 'بچوں کی صحت کے معاملات', Cardiology: 'دل اور بلڈ پریشر کے معاملات', 'General Physician': 'عام بیماری اور چیک اپ',
  },
  'roman-ur': {
    Orthopedics: 'joron, haddiyon ya pathon ke dard', Gastroenterology: 'maiday aur hazmay ke masail', Dermatology: 'jild, baal aur nakhun ke masail',
    Neurology: 'sar dard aur asabi masail', Psychiatry: 'zehni dabao, mood aur neend ke masail', ENT: 'kaan, naak aur galay ke masail',
    Ophthalmology: 'aankh aur nazar ke masail', Dentistry: 'daant aur masoorhon ke masail', Gynecology: 'khawateen ki sehat ke mamlaat',
    Pediatrics: 'bachon ki sehat ke mamlaat', Cardiology: 'dil aur blood pressure ke mamlaat', 'General Physician': 'aam bemari aur check-up',
  },
};

type AssistantStrings = {
  cityText: (city: string) => string;
  symptomIntro: string;
  symptomIntroSuggestions: string[];
  guideFound: (label: string, speciality: string, count: number, cityText: string) => string;
  guideNone: (label: string, speciality: string, cityText: string) => string;
  symptomLedFound: (speciality: string, count: number, cityText: string) => string;
  symptomLedNone: (speciality: string, cityText: string) => string;
  doctorFound: (focus: string, count: number, cityText: string) => string;
  doctorNone: (focus: string, cityText: string) => string;
  emergency: (focus: string) => string;
  doctorSuggestions: (firstTitle: string | null, focus: string, city: string | null) => string[];
  medicineFound: (count: number, budgetText: string) => string;
  medicineBudgetText: (formatted: string) => string;
  medicineNamedMissing: (name: string) => string;
  medicineGenericMissing: string;
  rxNote: (names: string) => string;
  medicineSuggestions: (medicineClass: string | null, wantsNoRx: boolean) => string[];
  labFound: (count: number, cityText: string) => string;
  labNone: (cityText: string) => string;
  labSuggestions: (firstTitle: string | null) => string[];
  facilityFound: (count: number, cityText: string) => string;
  facilityNone: (cityText: string) => string;
  facilitySuggestions: string[];
  bloodReply: (hasCards: boolean, cityText: string) => string;
  bloodSuggestions: string[];
  productFound: (count: number, budgetText: string) => string;
  productBudgetText: (formatted: string) => string;
  productSuggestions: string[];
  availabilityMissing: (label: string) => string;
  availabilitySuggestions: string[];
  productsMissing: string;
  productsMissingSuggestions: string[];
  menuReply: string;
  menuSuggestions: string[];
  offlinePrefix: string;
};

export const ASSISTANT_STRINGS: Record<AssistantLang, AssistantStrings> = {
  en: {
    cityText: (city) => ` in ${city}`,
    symptomIntro: 'Of course — tell me what\'s bothering you, in your own words: where it is, what it feels like, and since when. For example, "my knee hurts when I climb stairs" or "burning in my stomach after meals". I\'ll point you to the right kind of specialist and show you who is bookable. One honest note: I can\'t diagnose — only a doctor can do that.',
    symptomIntroSuggestions: ['My knee hurts on stairs', 'Burning in my stomach after meals', 'Itchy skin rash', "I can't sleep well"],
    guideFound: (label, speciality, count, cityText) => `I can't diagnose — only a doctor can. For ${label}, people usually see ${/^[AEIOU]/i.test(speciality) ? 'an' : 'a'} ${speciality} specialist. Here ${count === 1 ? 'is a bookable option' : 'are bookable options'}${cityText} — open a card to pick a time:`,
    guideNone: (label, speciality, cityText) => `I can't diagnose — only a doctor can. For ${label}, people usually see ${/^[AEIOU]/i.test(speciality) ? 'an' : 'a'} ${speciality} specialist, but I could not find a bookable one${cityText} in the current listings.`,
    symptomLedFound: (speciality, count, cityText) => `I can’t diagnose symptoms, but ${/^[AEIOU]/i.test(speciality) ? 'an' : 'a'} ${speciality} specialist can assess this properly. Here ${count === 1 ? 'is a bookable option' : 'are bookable options'}${cityText}:`,
    symptomLedNone: (speciality, cityText) => `I can’t diagnose symptoms, but ${/^[AEIOU]/i.test(speciality) ? 'an' : 'a'} ${speciality} specialist can assess this properly. I could not find a bookable ${speciality} doctor${cityText} in the current listings.`,
    doctorFound: (focus, count, cityText) => `I found ${count} bookable ${focus}${count === 1 ? '' : 's'}${cityText}. Fees are shown on each card, and you can open one to choose an appointment time.`,
    doctorNone: (focus, cityText) => `I could not find a bookable ${focus}${cityText} in the live listings right now. You can browse all doctors or try another city.`,
    emergency: (focus) => `This can be an emergency—please seek urgent medical care or call your local emergency service now. I have also listed bookable ${focus} doctors below if follow-up care is needed.`,
    doctorSuggestions: (firstTitle, focus, city) => [
      ...(firstTitle ? [`Book ${firstTitle}`] : []),
      ...(city ? [`Show ${focus} doctors in ${city === 'Lahore' ? 'Karachi' : 'Lahore'}`] : ['Find a cardiologist in Lahore']),
      'Book a lab test',
      'Find a medicine',
    ],
    medicineFound: (count, budgetText) => `I found ${count} live medicine match${count === 1 ? '' : 'es'}${budgetText}. Prices and pack details are shown on each card.`,
    medicineBudgetText: (formatted) => ` under ${formatted}`,
    medicineNamedMissing: (name) => `I couldn't find “${name}” in the live OneStop pharmacy catalogue yet. If you know its generic name, try that instead — or browse the Pharmacy page to see everything currently stocked.`,
    medicineGenericMissing: 'I could not find a matching medicine in the live pharmacy catalogue. Try the generic name, brand name, or a condition such as “pain relief”.',
    rxNote: (names) => ` Prescription required for ${names}—OneStop will ask for a valid prescription during checkout, and a pharmacist must verify it before dispatch.`,
    medicineSuggestions: (medicineClass, wantsNoRx) => [
      ...(medicineClass ? [`Show more ${medicineClass} medicines`] : ['Show pain relief medicines']),
      'Medicines under Rs. 500',
      wantsNoRx ? 'Show prescription medicines' : 'No-prescription medicines',
      'Find a doctor',
    ],
    labFound: (count, cityText) => `I found ${count} live lab test option${count === 1 ? '' : 's'}${cityText}. Report time and price are shown on each card; open Labs to book home collection.`,
    labNone: (cityText) => `I could not find that lab test${cityText} in the current listings. You can browse all available tests on the Labs page.`,
    labSuggestions: (firstTitle) => [
      ...(firstTitle ? [`Book a ${firstTitle} test`] : []),
      'Lab tests in Lahore',
      'Find a doctor',
      'Find medicines',
    ],
    facilityFound: (count, cityText) => `Here ${count === 1 ? 'is a live facility' : 'are live facilities'}${cityText}. Open Facilities to compare locations, timings, and contact details.`,
    facilityNone: (cityText) => `I could not find a matching facility${cityText} in the live directory. Try Lahore, Karachi, or Islamabad, or browse all facilities.`,
    facilitySuggestions: ['Hospitals in Lahore', 'Find a doctor', 'Blood banks near me', 'Book a lab test'],
    bloodReply: (hasCards, cityText) => `For urgent blood, open OneStop Blood to post a request and contact a listed blood bank${cityText}. ${hasCards ? 'I found these live blood banks:' : 'I could not find a blood bank in that city in the current listings, but the Blood page can still help you post the request.'} If someone’s condition is critical, seek emergency medical care immediately.`,
    bloodSuggestions: ['Open the blood request board', 'Find a hospital', 'Find a doctor', 'Hospitals in Lahore'],
    productFound: (count, budgetText) => `I found ${count} live in-stock product match${count === 1 ? '' : 'es'}${budgetText}. Prices are taken directly from the current catalogue.`,
    productBudgetText: (formatted) => ` within ${formatted}`,
    productSuggestions: ['Trending products', 'Products under Rs. 1,000', 'Find medicines', 'Book a doctor'],
    availabilityMissing: (label) => `I couldn't find “${label}” in the live OneStop catalogue right now. Check the spelling, try the generic name if it has one, or ask me for alternatives by category — for example, “mental health medicines” or “pain relief”.`,
    availabilitySuggestions: ['Find medicines', 'Trending products', 'Products under Rs. 1,000', 'Find a doctor'],
    productsMissing: 'I could not find a live in-stock product match for that yet. Try a product name, category, or budget—for example, “vitamins under Rs. 1,000”.',
    productsMissingSuggestions: ['Trending products', 'Products under Rs. 1,000', 'Find medicines', 'Find a doctor'],
    menuReply: 'I’m OneStop Assistant. I can search live doctors, medicines, lab tests, hospitals and clinics, blood banks, and everyday products across OneStop Life. Tell me what you need—or tap a suggestion below.',
    menuSuggestions: ['Find a cardiologist in Lahore', 'I need paracetamol', 'Book a CBC test', 'Blood needed urgently', 'Trending products'],
    offlinePrefix: 'I could not reach the general-answer service just now, but I can still search OneStop’s live platform. ',
  },
  ur: {
    cityText: (city) => ` ${city} میں`,
    symptomIntro: 'بالکل — اپنے الفاظ میں بتائیں کہ تکلیف کیا ہے: کہاں ہے، کیسی محسوس ہوتی ہے، اور کب سے ہے۔ مثال: ”میرے گھٹنے میں سیڑھیاں چڑھتے ہوئے درد ہوتا ہے“ یا ”کھانے کے بعد معدے میں جلن ہوتی ہے“۔ میں آپ کو درست ماہر کی طرف رہنمائی کروں گا اور قابلِ بکنگ ڈاکٹر دکھاؤں گا۔ ایک دیانت دار نوٹ: میں تشخیص نہیں کر سکتا — یہ صرف ڈاکٹر ہی کر سکتا ہے۔',
    symptomIntroSuggestions: ['میرے گھٹنے میں درد ہے', 'کھانے کے بعد معدے میں جلن ہوتی ہے', 'جلد پر خارش ہے', 'مجھے نیند نہیں آتی'],
    guideFound: (label, speciality, count, cityText) => `میں تشخیص نہیں کر سکتا — یہ صرف ڈاکٹر ہی کر سکتا ہے۔ ${label} کے لیے عام طور پر ${speciality} کے ماہر سے رجوع کیا جاتا ہے۔ یہ ${count === 1 ? 'رہا ایک قابلِ بکنگ ڈاکٹر' : 'رہے قابلِ بکنگ ڈاکٹر'}${cityText} — کارڈ کھول کر اپائنٹمنٹ کا وقت منتخب کریں:`,
    guideNone: (label, speciality, cityText) => `میں تشخیص نہیں کر سکتا — یہ صرف ڈاکٹر ہی کر سکتا ہے۔ ${label} کے لیے عام طور پر ${speciality} کے ماہر سے رجوع کیا جاتا ہے، لیکن فی الحال${cityText} کوئی قابلِ بکنگ ڈاکٹر فہرست میں نہیں ملا۔`,
    symptomLedFound: (speciality, _count, cityText) => `میں علامات کی تشخیص نہیں کر سکتا، لیکن ${speciality} کے ماہر اس کا صحیح جائزہ لے سکتے ہیں۔ یہ رہے قابلِ بکنگ ڈاکٹر${cityText}:`,
    symptomLedNone: (speciality, cityText) => `میں علامات کی تشخیص نہیں کر سکتا، لیکن ${speciality} کے ماہر اس کا صحیح جائزہ لے سکتے ہیں۔ فی الحال ${speciality} کا کوئی ڈاکٹر${cityText} فہرست میں دستیاب نہیں۔`,
    doctorFound: (focus, count, cityText) => `مجھے ${count} قابلِ بکنگ ${focus === 'doctor' ? 'ڈاکٹر' : `${focus} کے ڈاکٹر`}${cityText} ملے ہیں۔ فیس ہر کارڈ پر درج ہے — کارڈ کھول کر اپائنٹمنٹ کا وقت منتخب کریں۔`,
    doctorNone: (focus, cityText) => `فی الحال ${focus === 'doctor' ? 'کوئی ڈاکٹر' : `${focus} کا ڈاکٹر`}${cityText} لائیو فہرست میں دستیاب نہیں۔ آپ تمام ڈاکٹر دیکھ سکتے ہیں یا دوسرا شہر آزما سکتے ہیں۔`,
    emergency: (focus) => `یہ ہنگامی صورتحال ہو سکتی ہے — براہ کرم فوراً قریبی ہسپتال جائیں یا مقامی ایمرجنسی سروس کو کال کریں۔ فالو اپ کے لیے نیچے ${focus === 'doctor' ? '' : `${focus} کے `}ڈاکٹر بھی درج ہیں۔`,
    doctorSuggestions: (firstTitle, focus, city) => [
      ...(firstTitle ? [`${firstTitle} سے اپائنٹمنٹ بک کریں`] : []),
      ...(city ? [`${city === 'Lahore' ? 'Karachi' : 'Lahore'} میں ${focus === 'doctor' ? 'ڈاکٹر' : `${focus} کے ڈاکٹر`} دکھائیں`] : ['لاہور میں دل کے ڈاکٹر تلاش کریں']),
      'لیب ٹیسٹ بک کریں',
      'دوا تلاش کریں',
    ],
    medicineFound: (count, budgetText) => `مجھے ${count} ادویات${budgetText} ملی ہیں۔ قیمتیں اور تفصیل ہر کارڈ پر درج ہے۔`,
    medicineBudgetText: (formatted) => ` (${formatted} سے کم قیمت میں)`,
    medicineNamedMissing: (name) => `مجھے ”${name}“ فی الحال OneStop فارمیسی کیٹلاگ میں نہیں ملی۔ اگر اس کا جنرک نام معلوم ہے تو وہ آزمائیں — یا فارمیسی صفحے پر تمام دستیاب ادویات دیکھیں۔`,
    medicineGenericMissing: 'مجھے کوئی مماثل دوا نہیں ملی۔ جنرک نام، برانڈ نام، یا مرض جیسے ”درد کی دوا“ لکھ کر آزمائیں۔',
    rxNote: (names) => ` ${names} کے لیے نسخہ (پریسکرپشن) درکار ہے — چیک آؤٹ پر درست نسخہ دینا ہوگا اور فارماسسٹ کی تصدیق کے بعد ہی دوا بھیجی جائے گی۔`,
    medicineSuggestions: (medicineClass, wantsNoRx) => [
      ...(medicineClass ? [`${medicineClass} کی مزید ادویات دکھائیں`] : ['درد کی ادویات دکھائیں']),
      '500 روپے سے کم ادویات',
      wantsNoRx ? 'نسخے والی ادویات دکھائیں' : 'بغیر نسخے کی ادویات دکھائیں',
      'ڈاکٹر تلاش کریں',
    ],
    labFound: (count, cityText) => `مجھے ${count} لیب ٹیسٹ${cityText} ملے ہیں۔ رپورٹ کا وقت اور قیمت ہر کارڈ پر درج ہے؛ گھر پر سیمپل کلیکشن کے لیے Labs کھولیں۔`,
    labNone: (cityText) => `یہ لیب ٹیسٹ${cityText} فی الحال فہرست میں نہیں ملا۔ Labs صفحے پر تمام دستیاب ٹیسٹ دیکھے جا سکتے ہیں۔`,
    labSuggestions: (firstTitle) => [
      ...(firstTitle ? [`${firstTitle} ٹیسٹ بک کریں`] : []),
      'لاہور میں لیب ٹیسٹ',
      'ڈاکٹر تلاش کریں',
      'دوا تلاش کریں',
    ],
    facilityFound: (_count, cityText) => `یہ رہے دستیاب مراکز${cityText}۔ مقامات، اوقات کار اور رابطے کی تفصیل کے لیے Facilities کھولیں۔`,
    facilityNone: (cityText) => `کوئی مماثل مرکز${cityText} لائیو ڈائریکٹری میں نہیں ملا۔ لاہور، کراچی یا اسلام آباد آزمائیں، یا تمام مراکز دیکھیں۔`,
    facilitySuggestions: ['لاہور میں ہسپتال', 'ڈاکٹر تلاش کریں', 'قریبی بلڈ بینک', 'لیب ٹیسٹ بک کریں'],
    bloodReply: (hasCards, cityText) => `فوری خون کے لیے OneStop Blood کھول کر درخواست پوسٹ کریں اور درج شدہ بلڈ بینک سے رابطہ کریں۔ ${hasCards ? `یہ رہے دستیاب بلڈ بینک${cityText}:` : 'اس شہر میں بلڈ بینک فہرست میں نہیں ملا، لیکن Blood صفحہ درخواست پوسٹ کرنے میں پھر بھی مدد کرے گا۔'} اگر مریض کی حالت نازک ہے تو فوراً ہنگامی طبی امداد حاصل کریں۔`,
    bloodSuggestions: ['خون کی درخواست کا بورڈ کھولیں', 'ہسپتال تلاش کریں', 'ڈاکٹر تلاش کریں', 'لاہور میں ہسپتال'],
    productFound: (count, budgetText) => `مجھے ${count} دستیاب مصنوعات${budgetText} ملی ہیں۔ قیمتیں موجودہ کیٹلاگ سے براہِ راست لی گئی ہیں۔`,
    productBudgetText: (formatted) => ` (${formatted} کے اندر)`,
    productSuggestions: ['مقبول مصنوعات', '1,000 روپے سے کم مصنوعات', 'ادویات تلاش کریں', 'ڈاکٹر بک کریں'],
    availabilityMissing: (label) => `مجھے ”${label}“ فی الحال OneStop کیٹلاگ میں نہیں ملی۔ ہجے جانچیں، جنرک نام آزمائیں، یا زمرے کے حساب سے متبادل مانگیں — جیسے ”ذہنی صحت کی ادویات“ یا ”درد کی دوا“۔`,
    availabilitySuggestions: ['ادویات تلاش کریں', 'مقبول مصنوعات', '1,000 روپے سے کم مصنوعات', 'ڈاکٹر تلاش کریں'],
    productsMissing: 'مجھے اس کے لیے کوئی دستیاب پروڈکٹ نہیں ملی۔ پروڈکٹ کا نام، زمرہ یا بجٹ آزمائیں — جیسے ”1,000 روپے سے کم وٹامن“۔',
    productsMissingSuggestions: ['مقبول مصنوعات', '1,000 روپے سے کم مصنوعات', 'ادویات تلاش کریں', 'ڈاکٹر تلاش کریں'],
    menuReply: 'میں OneStop اسسٹنٹ ہوں۔ میں لائیو ڈاکٹر، ادویات، لیب ٹیسٹ، ہسپتال و کلینک، بلڈ بینک اور روزمرہ مصنوعات تلاش کر سکتا ہوں۔ بتائیں آپ کو کیا چاہیے — یا نیچے دی گئی تجاویز میں سے چنیں۔',
    menuSuggestions: ['لاہور میں دل کے ڈاکٹر تلاش کریں', 'مجھے پیراسیٹامول چاہیے', 'CBC ٹیسٹ بک کریں', 'فوری خون چاہیے', 'مقبول مصنوعات'],
    offlinePrefix: 'عام جوابات کی سروس فی الحال نہیں مل سکی، لیکن میں OneStop کے لائیو پلیٹ فارم میں تلاش کر سکتا ہوں۔ ',
  },
  'roman-ur': {
    cityText: (city) => ` ${city} mein`,
    symptomIntro: 'Bilkul — apne alfaaz mein batayein ke takleef kya hai: kahan hai, kaisi mehsoos hoti hai, aur kab se hai. Misal: "mere ghutne mein seedhiyan charhte hue dard hota hai" ya "khane ke baad maiday mein jalan hoti hai". Main aap ko sahi specialist ki taraf guide karunga aur bookable doctors dikhaunga. Ek imandari wala note: main tashkhees nahi kar sakta — yeh sirf doctor hi kar sakta hai.',
    symptomIntroSuggestions: ['Mere ghutne mein dard hai', 'Khane ke baad maiday mein jalan hoti hai', 'Jild par kharish hai', 'Mujhe neend nahi aati'],
    guideFound: (label, speciality, count, cityText) => `Main tashkhees nahi kar sakta — yeh sirf doctor hi kar sakta hai. ${label} ke liye aam tor par ${speciality} specialist se rabta kiya jata hai. Yeh ${count === 1 ? 'raha ek bookable doctor' : 'rahe bookable doctors'}${cityText} — card khol kar appointment ka waqt muntakhib karein:`,
    guideNone: (label, speciality, cityText) => `Main tashkhees nahi kar sakta — yeh sirf doctor hi kar sakta hai. ${label} ke liye aam tor par ${speciality} specialist se rabta kiya jata hai, lekin filhal${cityText} koi bookable doctor fehrist mein nahi mila.`,
    symptomLedFound: (speciality, _count, cityText) => `Main alamat ki tashkhees nahi kar sakta, lekin ${speciality} specialist is ka sahi jaiza le sakte hain. Yeh rahe bookable doctors${cityText}:`,
    symptomLedNone: (speciality, cityText) => `Main alamat ki tashkhees nahi kar sakta, lekin ${speciality} specialist is ka sahi jaiza le sakte hain. Filhal ${speciality} ka koi doctor${cityText} fehrist mein dastiyab nahi.`,
    doctorFound: (focus, count, cityText) => `Mujhe ${count} bookable ${focus === 'doctor' ? 'doctors' : `${focus} doctors`}${cityText} mile hain. Fees har card par darj hai — card khol kar appointment ka waqt muntakhib karein.`,
    doctorNone: (focus, cityText) => `Filhal ${focus === 'doctor' ? 'koi doctor' : `${focus} ka doctor`}${cityText} live fehrist mein dastiyab nahi. Aap tamam doctors dekh sakte hain ya doosra sheher try karein.`,
    emergency: (focus) => `Yeh emergency surat-e-haal ho sakti hai — barah-e-karam fori tor par qareebi hospital jayen ya local emergency service ko call karein. Follow-up ke liye neeche ${focus === 'doctor' ? '' : `${focus} `}doctors bhi diye gaye hain.`,
    doctorSuggestions: (firstTitle, focus, city) => [
      ...(firstTitle ? [`${firstTitle} se appointment book karein`] : []),
      ...(city ? [`${city === 'Lahore' ? 'Karachi' : 'Lahore'} mein ${focus === 'doctor' ? 'doctors' : `${focus} doctors`} dikhayein`] : ['Lahore mein cardiologist talash karein']),
      'Lab test book karein',
      'Dawa talash karein',
    ],
    medicineFound: (count, budgetText) => `Mujhe ${count} dawaen${budgetText} mili hain. Qeematein aur tafseel har card par darj hai.`,
    medicineBudgetText: (formatted) => ` (${formatted} se kam qeemat mein)`,
    medicineNamedMissing: (name) => `Mujhe "${name}" filhal OneStop pharmacy catalogue mein nahi mili. Agar is ka generic name maloom hai to woh try karein — ya Pharmacy page par tamam dastiyab dawaen dekhein.`,
    medicineGenericMissing: 'Mujhe koi matching dawa nahi mili. Generic name, brand name, ya bemari jaisay "dard ki dawa" likh kar try karein.',
    rxNote: (names) => ` ${names} ke liye prescription zaroori hai — checkout par valid prescription dena hoga aur pharmacist ki tasdeeq ke baad hi dawa bheji jayegi.`,
    medicineSuggestions: (medicineClass, wantsNoRx) => [
      ...(medicineClass ? [`${medicineClass} ki mazeed dawaen dikhayein`] : ['Dard ki dawaen dikhayein']),
      'Rs. 500 se kam dawaen',
      wantsNoRx ? 'Prescription wali dawaen dikhayein' : 'Baghair prescription ki dawaen',
      'Doctor talash karein',
    ],
    labFound: (count, cityText) => `Mujhe ${count} lab tests${cityText} mile hain. Report ka waqt aur qeemat har card par darj hai; ghar par sample collection ke liye Labs kholain.`,
    labNone: (cityText) => `Yeh lab test${cityText} filhal fehrist mein nahi mila. Labs page par tamam dastiyab tests dekhe ja sakte hain.`,
    labSuggestions: (firstTitle) => [
      ...(firstTitle ? [`${firstTitle} test book karein`] : []),
      'Lahore mein lab tests',
      'Doctor talash karein',
      'Dawa talash karein',
    ],
    facilityFound: (_count, cityText) => `Yeh rahe dastiyab marakiz${cityText}. Muqamat, awqat aur rabte ki tafseel ke liye Facilities kholain.`,
    facilityNone: (cityText) => `Koi matching markaz${cityText} live directory mein nahi mila. Lahore, Karachi ya Islamabad try karein, ya tamam marakiz dekhein.`,
    facilitySuggestions: ['Lahore mein hospitals', 'Doctor talash karein', 'Qareebi blood banks', 'Lab test book karein'],
    bloodReply: (hasCards, cityText) => `Fori khoon ke liye OneStop Blood khol kar darkhwast post karein aur darj blood bank se rabta karein. ${hasCards ? `Yeh rahe dastiyab blood banks${cityText}:` : 'Is sheher mein blood bank fehrist mein nahi mila, lekin Blood page darkhwast post karne mein phir bhi madad karega.'} Agar mareez ki halat nazuk hai to fori emergency madad hasil karein.`,
    bloodSuggestions: ['Khoon ki darkhwast board kholain', 'Hospital talash karein', 'Doctor talash karein', 'Lahore mein hospitals'],
    productFound: (count, budgetText) => `Mujhe ${count} dastiyab products${budgetText} mili hain. Qeematein mojooda catalogue se barah-e-raast li gayi hain.`,
    productBudgetText: (formatted) => ` (${formatted} ke andar)`,
    productSuggestions: ['Trending products', 'Rs. 1,000 se kam products', 'Dawa talash karein', 'Doctor book karein'],
    availabilityMissing: (label) => `Mujhe "${label}" filhal OneStop catalogue mein nahi mili. Spelling check karein, generic name try karein, ya category ke hisab se mutabadil mangein — jaisay "zehni sehat ki dawaen" ya "dard ki dawa".`,
    availabilitySuggestions: ['Dawa talash karein', 'Trending products', 'Rs. 1,000 se kam products', 'Doctor talash karein'],
    productsMissing: 'Mujhe is ke liye koi dastiyab product nahi mili. Product ka naam, category ya budget try karein — jaisay "Rs. 1,000 se kam vitamins".',
    productsMissingSuggestions: ['Trending products', 'Rs. 1,000 se kam products', 'Dawa talash karein', 'Doctor talash karein'],
    menuReply: 'Main OneStop Assistant hoon. Main live doctors, dawaen, lab tests, hospitals aur clinics, blood banks, aur rozmarra products talash kar sakta hoon. Batayein aap ko kya chahiye — ya neeche di gayi suggestions mein se chunein.',
    menuSuggestions: ['Lahore mein cardiologist talash karein', 'Mujhe paracetamol chahiye', 'CBC test book karein', 'Khoon ki fori zaroorat hai', 'Trending products'],
    offlinePrefix: 'Aam jawabon ki service filhal nahi mil saki, lekin main OneStop ke live platform mein talash kar sakta hoon. ',
  },
};

export function buildProductResult(productMatches: LegacyProduct[], budget: number | null, lang: AssistantLang = 'en'): PlatformResult {
  const S = ASSISTANT_STRINGS[lang];
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
    reply: S.productFound(cards.length, budget !== null ? S.productBudgetText(formatRs(budget * 100)) : ''),
    products,
    cards,
    suggestions: S.productSuggestions,
    source: 'live_catalog',
  };
}
