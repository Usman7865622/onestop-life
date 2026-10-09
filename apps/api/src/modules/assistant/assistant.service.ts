import { ConfigService } from '@nestjs/config';
import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ProductsService } from '../products/products.service';
import { AssistantMessageDto } from './dto/assistant-chat.dto';
import {
  AssistantCard,
  LegacyProduct,
  MEDICINE_FILLER_TERMS,
  MEDICINE_TERMS,
  PlatformResult,
  buildProductResult,
  detectCity,
  detectMedicineClass,
  detectSpeciality,
  extractBudget,
  extractNamedItemAvailability,
  fieldTokens,
  formatRs,
  isShoppingQuestion,
  normalize,
  queryMentionsPhrase,
  searchTerms,
  titleCase,
} from './assistant.helpers';

@Injectable()
export class AssistantService {
  constructor(
    private readonly products: ProductsService,
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async chat(messages: AssistantMessageDto[]) {
    const lastMessage = messages.at(-1);
    if (lastMessage?.role !== 'user') {
      throw new UnprocessableEntityException('The last chat message must be from the customer.');
    }

    const query = lastMessage.content.trim();
    const lower = query.toLowerCase();
    const city = detectCity(query);
    const speciality = detectSpeciality(query);
    const budget = extractBudget(query);

    const intent = this.detectIntent(lower, speciality);
    if (intent === 'blood') return this.bloodResult(city);
    if (intent === 'labs') return this.labResult(query, city);
    if (intent === 'doctors') return this.doctorResult(query, speciality, city);
    if (intent === 'medicines') return this.medicineResult(query, budget);
    if (intent === 'facilities') return this.facilityResult(query, city);

    const productMatches = await this.products.searchForAssistant(query, null, budget) as LegacyProduct[];

    // Named-item availability questions ("Do you sell Xanax?", "Is X available?")
    // reach this point only when no medicine/doctor/lab match was found. The legacy
    // product search matches loosely, so keep only products whose name/generic/
    // brand genuinely contain the item term — and answer honestly when none do,
    // instead of padding the reply with unrelated "matches".
    const availabilityItem = extractNamedItemAvailability(query);
    if (availabilityItem) {
      const verifiedMatches = await this.filterToNamedItem(productMatches, availabilityItem.terms);
      if (!verifiedMatches.length) {
        return {
          reply: `I couldn't find “${availabilityItem.label}” in the live OneStop catalogue right now. Check the spelling, try the generic name if it has one, or ask me for alternatives by category — for example, “mental health medicines” or “pain relief”.`,
          products: [],
          cards: [],
          suggestions: ['Find medicines', 'Trending products', 'Products under Rs. 1,000', 'Find a doctor'],
          source: 'live_catalog',
        } satisfies PlatformResult;
      }
      return buildProductResult(verifiedMatches, budget);
    }

    if (productMatches.length && (intent === 'products' || isShoppingQuestion(query) || !query.includes('?'))) {
      return buildProductResult(productMatches, budget);
    }

    if (intent === 'products') {
      return {
        reply: 'I could not find a live in-stock product match for that yet. Try a product name, category, or budget—for example, “vitamins under Rs. 1,000”.',
        products: [],
        cards: [],
        suggestions: ['Trending products', 'Products under Rs. 1,000', 'Find medicines', 'Find a doctor'],
        source: 'live_catalog',
      } satisfies PlatformResult;
    }

    return this.fallback(messages, query);
  }

  private detectIntent(lower: string, speciality: string | null): 'blood' | 'labs' | 'doctors' | 'medicines' | 'facilities' | 'products' | 'general' {
    const isBloodTest = /\b(blood test|test blood|blood report|cbc|hba1c|blood sugar test)\b/.test(lower);
    if (!isBloodTest && /\b(blood|donor|donate|transfusion)\b/.test(lower) && !/\b(medicine|medication|tablet|pressure)\b/.test(lower)) {
      return 'blood';
    }

    if (/\b(lab|test|report|cbc|hba1c|lipid profile|liver function|kidney function|vitamin d test|thyroid test|dengue|malaria test|urine test)\b/.test(lower)) {
      return 'labs';
    }

    if (MEDICINE_TERMS.test(lower) || detectMedicineClass(lower)) return 'medicines';

    const hasDoctorContext = /\b(doctor|doctors|dr\.?|appointment|consult|consultation|specialist|physician|cardiologist|dermatologist|dentist|pediatrician|paediatrician|ophthalmologist|gynaecologist|gynecologist|psychiatrist|gastroenterologist|orthopedic|orthopaedic)\b/.test(lower);
    const hasSymptom = /\b(pain|ache|fever|rash|problem|issue|infection|swelling|vomiting|diarrh(o)?ea|anxiety|depression|stress|insomnia|toothache|vision|sick|ill|pregnan(?:cy|t)|periods?)\b/.test(lower);
    if (hasDoctorContext || (speciality && hasSymptom)) return 'doctors';

    if (/\b(hospital|hospitals|clinic|clinics|facility|facilities|near me|nearby|emergency department)\b/.test(lower)) return 'facilities';
    if (/\b(product|products|shop|shopping|buy|trending|deal|deals|cart)\b/.test(lower)) return 'products';
    return 'general';
  }

  private async doctorResult(query: string, speciality: string | null, city: string | null): Promise<PlatformResult> {
    const doctors = await this.prisma.doctorProfile.findMany({
      where: { isBookable: true },
      include: {
        user: { select: { name: true } },
        facilities: {
          include: { facility: { select: { name: true, city: true } } },
        },
      },
      orderBy: [{ experienceYears: 'desc' }, { feeMinor: 'asc' }],
      take: 100,
    });

    const normalizedQuery = normalize(query);
    const ranked = doctors
      .map((doctor) => {
        const doctorName = normalize(doctor.user.name ?? '');
        const locations = doctor.facilities.map(({ facility }) => facility);
        let score = doctor.experienceYears;
        if (doctorName && normalizedQuery.includes(doctorName)) score += 1_000;
        for (const part of doctorName.split(' ').filter((part) => part.length > 2 && !['dr', 'doctor'].includes(part))) {
          if (new RegExp(`\\b${part}\\b`).test(normalizedQuery)) score += 30;
        }
        if (speciality && doctor.speciality.toLowerCase() === speciality.toLowerCase()) score += 300;
        if (city && locations.some((facility) => facility.city.toLowerCase() === city.toLowerCase())) score += 200;
        return { doctor, locations, score };
      })
      .filter(({ doctor, locations, score }) => {
        if (speciality && doctor.speciality.toLowerCase() !== speciality.toLowerCase()) return false;
        if (city && !locations.some((facility) => facility.city.toLowerCase() === city.toLowerCase())) return false;
        return score > 0;
      })
      .sort((a, b) => b.score - a.score || b.doctor.experienceYears - a.doctor.experienceYears)
      .slice(0, 3);

    const cards: AssistantCard[] = ranked.map(({ doctor, locations }) => {
      const location = (city
        ? locations.find((facility) => facility.city.toLowerCase() === city.toLowerCase())
        : undefined) ?? locations[0];
      const title = doctor.user.name ?? `${doctor.speciality} specialist`;
      return {
        type: 'doctor',
        id: doctor.id,
        title,
        subtitle: [doctor.speciality, doctor.qualifications].filter(Boolean).join(' · '),
        meta: [
          `${doctor.experienceYears} years experience`,
          location ? `${location.name}, ${location.city}` : null,
          doctor.languages.length ? doctor.languages.join(', ') : null,
        ].filter(Boolean).join(' · '),
        priceMinor: doctor.feeMinor,
        badge: 'Bookable',
        href: `/doctors/${doctor.id}`,
        avatarName: title,
      };
    });

    const emergency = /\b(chest pain|chest pressure|difficulty breathing|trouble breathing|stroke|unconscious|severe bleeding|suicidal|suicide)\b/i.test(query);
    const symptomLed = /\b(pain|ache|fever|rash|problem|issue|infection|swelling|vomiting|diarrh(o)?ea|anxiety|depression|stress|insomnia|toothache|vision)\b/i.test(query)
      && !/\b(find|book|appointment|doctor|specialist)\b/i.test(query);
    const focus = speciality ?? 'doctor';
    const locationText = city ? ` in ${city}` : '';

    let reply: string;
    if (emergency) {
      reply = `This can be an emergency—please seek urgent medical care or call your local emergency service now. I have also listed bookable ${focus} doctors below if follow-up care is needed.`;
    } else if (symptomLed && speciality) {
      reply = `I can’t diagnose symptoms, but a ${speciality} specialist can assess this properly. ${cards.length ? `Here ${cards.length === 1 ? 'is a bookable option' : 'are bookable options'}${locationText}:` : `I could not find a bookable ${speciality} doctor${locationText} in the current listings.`}`;
    } else if (cards.length) {
      reply = `I found ${cards.length} bookable ${focus}${cards.length === 1 ? '' : 's'}${locationText}. Fees are shown on each card, and you can open one to choose an appointment time.`;
    } else {
      reply = `I could not find a bookable ${focus}${locationText} in the live listings right now. You can browse all doctors or try another city.`;
    }

    const firstDoctor = cards[0];
    return {
      reply,
      products: [],
      cards,
      suggestions: [
        ...(firstDoctor ? [`Book ${firstDoctor.title}`] : []),
        ...(city ? [`Show ${focus} doctors in ${city === 'Lahore' ? 'Karachi' : 'Lahore'}`] : ['Find a cardiologist in Lahore']),
        'Book a lab test',
        'Find a medicine',
      ].slice(0, 4),
      source: 'live_platform',
    };
  }

  private async medicineResult(query: string, budget: number | null): Promise<PlatformResult> {
    const medicineClass = detectMedicineClass(query);
    const normalizedQuery = normalize(query);
    // Require at least 3 characters and drop conversational filler, so weak
    // substring hits (e.g. "do" inside "domperidone") can never rank as matches.
    const terms = searchTerms(query).filter((term) => (
      term.length >= 3 && !MEDICINE_FILLER_TERMS.has(term) && !/^\d+(?:\.\d+)?$/.test(term)
    ));
    const wantsNoRx = /\b(no prescription|without prescription|non[ -]?prescription|over[ -]?the[ -]?counter|otc)\b/i.test(query);
    const wantsRx = /\b(prescription medicines?|rx medicines?|prescription required)\b/i.test(query) && !wantsNoRx;

    const medicines = await this.prisma.product.findMany({
      where: {
        inStock: true,
        therapeuticClass: { not: null },
        ...(budget !== null ? { priceMinor: { lte: Math.floor(budget * 100) } } : {}),
        ...(wantsNoRx ? { requiresRx: false } : {}),
        ...(wantsRx ? { requiresRx: true } : {}),
      },
      orderBy: [{ nameEn: 'asc' }],
      take: 300,
    });

    const scored = medicines.map((medicine) => {
      const brandTokens = fieldTokens(medicine.brandName);
      const genericTokens = fieldTokens(medicine.genericName);
      const nameTokens = fieldTokens(medicine.nameEn);
      const searchable = normalize([
        medicine.nameEn,
        medicine.genericName ?? '',
        medicine.brandName ?? '',
        medicine.therapeuticClass ?? '',
      ].join(' '));

      let score = 0;
      let named = false;
      let brandExact = false;
      let genericExact = false;

      // Exact phrase mentions rank first: brand name, then full name, then generic.
      if (queryMentionsPhrase(normalizedQuery, medicine.brandName)) {
        score += 1000;
        brandExact = true;
        named = true;
      }
      if (queryMentionsPhrase(normalizedQuery, medicine.nameEn)) {
        score += 950;
        named = true;
      }
      if (queryMentionsPhrase(normalizedQuery, medicine.genericName)) {
        score += 900;
        genericExact = true;
        named = true;
      }

      // Token matches: the query term must equal (or be a real prefix of) a
      // brand/generic/product token — never a stray substring inside a word.
      const allNameTokens = [...brandTokens, ...genericTokens, ...nameTokens];
      for (const term of terms) {
        if (brandTokens.includes(term)) {
          score += 800;
          named = true;
        } else if (genericTokens.includes(term)) {
          score += 780;
          named = true;
        } else if (nameTokens.includes(term)) {
          score += 700;
          named = true;
        } else if (term.length >= 4 && allNameTokens.some((token) => token.startsWith(term))) {
          score += 300;
          named = true;
        }
      }

      // Class relevance only matters when no specific medicine was named.
      if (medicineClass && medicine.therapeuticClass === medicineClass) score += 100;
      if (!terms.length && !medicineClass && budget !== null) score += 1;
      if (!terms.length && !medicineClass && /\bparacetamol\b/.test(searchable)) score += 5;

      return { medicine, score, named, brandExact, genericExact };
    });

    // If the user named a specific medicine, show only genuine name matches —
    // never pad the answer with weak token-only filler results.
    const namedMatches = scored.filter(({ named: isNamed, score }) => isNamed && score >= 300);
    const ranked = (namedMatches.length
      ? namedMatches.sort((a, b) => (
        Number(b.brandExact) - Number(a.brandExact)
        || Number(b.genericExact) - Number(a.genericExact)
        || b.score - a.score
        || a.medicine.priceMinor - b.medicine.priceMinor
      ))
      : scored
        .filter(({ score }) => score > 0)
        .sort((a, b) => b.score - a.score || a.medicine.priceMinor - b.medicine.priceMinor)
    ).slice(0, 4);

    const cards: AssistantCard[] = ranked.map(({ medicine }) => ({
      type: 'medicine',
      id: medicine.id,
      title: medicine.nameEn,
      subtitle: [medicine.genericName, medicine.brandName ? `Brand: ${medicine.brandName}` : null].filter(Boolean).join(' · '),
      meta: [medicine.strength, medicine.form, medicine.packSize, medicine.therapeuticClass].filter(Boolean).join(' · '),
      priceMinor: medicine.priceMinor,
      badge: medicine.requiresRx ? 'Rx required' : 'No Rx needed',
      href: `/products?q=${encodeURIComponent(medicine.nameEn)}`,
      imageUrl: medicine.imageUrl ?? undefined,
    }));

    // The Rx note may only name medicines actually matched and shown above.
    const rxNames = ranked.filter(({ medicine }) => medicine.requiresRx).map(({ medicine }) => medicine.nameEn);
    const budgetText = budget !== null ? ` under ${formatRs(budget * 100)}` : '';
    let reply: string;
    if (cards.length) {
      reply = `I found ${cards.length} live medicine match${cards.length === 1 ? '' : 'es'}${budgetText}. Prices and pack details are shown on each card.`;
    } else if (terms.length && !medicineClass) {
      // The user named a specific medicine that is not in the catalogue — say so
      // honestly instead of substituting unrelated medicines.
      const namedMedicine = [...terms].sort((a, b) => b.length - a.length)[0];
      reply = `I couldn't find “${titleCase(namedMedicine)}” in the live OneStop pharmacy catalogue yet. If you know its generic name, try that instead — or browse the Pharmacy page to see everything currently stocked.`;
    } else {
      reply = 'I could not find a matching medicine in the live pharmacy catalogue. Try the generic name, brand name, or a condition such as “pain relief”.';
    }
    if (rxNames.length) {
      reply += ` Prescription required for ${rxNames.join(', ')}—OneStop will ask for a valid prescription during checkout, and a pharmacist must verify it before dispatch.`;
    }

    return {
      reply,
      products: [],
      cards,
      suggestions: [
        ...(medicineClass ? [`Show more ${medicineClass} medicines`] : ['Show pain relief medicines']),
        'Medicines under Rs. 500',
        wantsNoRx ? 'Show prescription medicines' : 'No-prescription medicines',
        'Find a doctor',
      ],
      source: 'live_platform',
    };
  }

  private async labResult(query: string, city: string | null): Promise<PlatformResult> {
    const tests = await this.prisma.labTest.findMany({
      where: { isActive: true },
      include: { facility: { select: { name: true, city: true } } },
      orderBy: [{ name: 'asc' }],
      take: 200,
    });

    const terms = searchTerms(query).filter((term) => !['book', 'booking', 'home', 'collection'].includes(term));
    const ranked = tests
      .map((test) => {
        const searchable = normalize(`${test.name} ${test.code} ${test.sampleType} ${test.facility.name} ${test.facility.city}`);
        let score = 0;
        for (const term of terms) {
          if (normalize(test.code) === term) score += 60;
          else if (normalize(test.name).includes(term)) score += 30;
          else if (searchable.includes(term)) score += 8;
        }
        if (!terms.length) score += 1;
        if (city && test.facility.city.toLowerCase() !== city.toLowerCase()) score = -1;
        return { test, score };
      })
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score || a.test.priceMinor - b.test.priceMinor)
      .slice(0, 4);

    const cards: AssistantCard[] = ranked.map(({ test }) => ({
      type: 'lab',
      id: test.id,
      title: test.name,
      subtitle: `${test.facility.name} · ${test.facility.city}`,
      meta: `${titleCase(test.sampleType)} sample · Report in ${test.reportHours} hours`,
      priceMinor: test.priceMinor,
      badge: 'Home collection',
      href: '/labs',
    }));

    return {
      reply: cards.length
        ? `I found ${cards.length} live lab test option${cards.length === 1 ? '' : 's'}${city ? ` in ${city}` : ''}. Report time and price are shown on each card; open Labs to book home collection.`
        : `I could not find that lab test${city ? ` in ${city}` : ''} in the current listings. You can browse all available tests on the Labs page.`,
      products: [],
      cards,
      suggestions: [
        ...(cards[0] ? [`Book a ${cards[0].title} test`] : []),
        'Lab tests in Lahore',
        'Find a doctor',
        'Find medicines',
      ].slice(0, 4),
      source: 'live_platform',
    };
  }

  private async facilityResult(query: string, city: string | null): Promise<PlatformResult> {
    const type = /\bblood bank\b/i.test(query)
      ? 'BLOOD_BANK'
      : /\bhospitals?\b/i.test(query)
        ? 'HOSPITAL'
        : /\bclinics?\b/i.test(query)
          ? 'CLINIC'
          : /\blabs?\b/i.test(query)
            ? 'LAB'
            : /\bpharmacy\b/i.test(query)
              ? 'PHARMACY'
              : null;

    const facilities = await this.prisma.facility.findMany({
      where: {
        ...(city ? { city: { equals: city, mode: 'insensitive' } } : {}),
        ...(type ? { type: type as never } : {}),
      },
      orderBy: [{ isEmergency: 'desc' }, { name: 'asc' }],
      take: 3,
    });

    const cards: AssistantCard[] = facilities.map((facility) => ({
      type: 'facility',
      id: facility.id,
      title: facility.name,
      subtitle: `${titleCase(facility.type.replaceAll('_', ' '))} · ${facility.city}`,
      meta: [facility.address, facility.timings, facility.phone].filter(Boolean).join(' · '),
      badge: facility.isEmergency ? 'Emergency' : undefined,
      href: '/facilities',
    }));

    return {
      reply: cards.length
        ? `Here ${cards.length === 1 ? 'is a live facility' : 'are live facilities'}${city ? ` in ${city}` : ''}. Open Facilities to compare locations, timings, and contact details.`
        : `I could not find a matching facility${city ? ` in ${city}` : ''} in the live directory. Try Lahore, Karachi, or Islamabad, or browse all facilities.`,
      products: [],
      cards,
      suggestions: ['Hospitals in Lahore', 'Find a doctor', 'Blood banks near me', 'Book a lab test'],
      source: 'live_platform',
    };
  }

  private async bloodResult(city: string | null): Promise<PlatformResult> {
    const banks = await this.prisma.facility.findMany({
      where: {
        type: 'BLOOD_BANK',
        ...(city ? { city: { equals: city, mode: 'insensitive' } } : {}),
      },
      orderBy: [{ isEmergency: 'desc' }, { name: 'asc' }],
      take: 2,
    });

    const cards: AssistantCard[] = banks.map((facility) => ({
      type: 'facility',
      id: facility.id,
      title: facility.name,
      subtitle: `Blood bank · ${facility.city}`,
      meta: [facility.address, facility.timings, facility.phone].filter(Boolean).join(' · '),
      badge: facility.isEmergency ? 'Emergency' : 'Blood bank',
      href: '/blood',
    }));

    return {
      reply: `For urgent blood, open OneStop Blood to post a request and contact a listed blood bank${city ? ` in ${city}` : ''}. ${cards.length ? 'I found these live blood banks:' : 'I could not find a blood bank in that city in the current listings, but the Blood page can still help you post the request.'} If someone’s condition is critical, seek emergency medical care immediately.`,
      products: [],
      cards,
      suggestions: ['Open the blood request board', 'Find a hospital', 'Find a doctor', 'Hospitals in Lahore'],
      source: 'live_platform',
    };
  }

  // Narrows legacy product-search hits to products whose name, generic name, or
  // brand actually contain one of the named item's terms (case-insensitive).
  // Generic/brand live on Product but are not selected by the legacy search, so
  // they are resolved here for just the candidate ids.
  private async filterToNamedItem(products: LegacyProduct[], terms: string[]): Promise<LegacyProduct[]> {
    if (!products.length) return products;

    const ids = products.map((product) => product.id).filter((id): id is string => typeof id === 'string' && id.length > 0);
    const details = ids.length
      ? await this.prisma.product.findMany({
        where: { id: { in: ids } },
        select: { id: true, genericName: true, brandName: true },
      })
      : [];
    const detailById = new Map(details.map((detail) => [detail.id, detail]));

    return products.filter((product) => {
      const detail = product.id ? detailById.get(product.id) : undefined;
      const searchable = normalize([
        product.nameEn,
        detail?.genericName ?? product.genericName ?? '',
        detail?.brandName ?? product.brandName ?? '',
      ].join(' '));
      return terms.some((term) => searchable.includes(term));
    });
  }
  private async fallback(messages: AssistantMessageDto[], query: string): Promise<PlatformResult> {
    const menuReply = 'I’m OneStop Assistant. I can search live doctors, medicines, lab tests, hospitals and clinics, blood banks, and everyday products across OneStop Life. Tell me what you need—or tap a suggestion below.';
    const suggestions = [
      'Find a cardiologist in Lahore',
      'I need paracetamol',
      'Book a CBC test',
      'Blood needed urgently',
      'Trending products',
    ];

    const apiKey = this.config.get<string>('GEMINI_API_KEY')
      ?? this.config.get<string>('Gemini API Key 2');
    if (!apiKey) {
      return { reply: menuReply, products: [], cards: [], suggestions, source: 'assistant_menu' };
    }

    try {
      const model = this.config.get<string>('GEMINI_MODEL', 'gemini-3.6-flash');
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
        method: 'POST',
        headers: {
          'x-goog-api-key': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{
              text: [
                'You are OneStop Assistant for OneStop Life, a Pakistan healthcare and everyday-care platform.',
                'Answer directly and concisely in friendly language. Use Rs. formatting when discussing prices.',
                'No live OneStop records were returned for this request, so do not invent doctors, medicines, tests, stock, prices, locations, or availability.',
                'You can explain that you can search doctors, pharmacy medicines, lab tests, facilities, blood banks, and products, and invite the user to name a city, specialist, medicine, or test.',
                'Never claim you booked, ordered, contacted, or completed anything.',
                'For medical topics, give general information only. Do not diagnose or prescribe. For personal or serious symptoms, advise assessment by a qualified clinician; for emergency symptoms, advise urgent care immediately.',
                `User request for context: ${query}`,
              ].join('\n'),
            }],
          },
          contents: messages.map(({ role, content }) => ({
            role: role === 'assistant' ? 'model' : 'user',
            parts: [{ text: content }],
          })),
          generationConfig: {
            temperature: 0.4,
            maxOutputTokens: 900,
          },
        }),
        signal: AbortSignal.timeout(20_000),
      });

      if (!response.ok) throw new Error(`Gemini request failed with status ${response.status}`);

      const payload = await response.json() as {
        candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
      };
      const reply = payload.candidates?.[0]?.content?.parts
        ?.map((part) => part.text ?? '')
        .join('')
        .trim();
      if (!reply) throw new Error('Gemini returned an empty assistant response');

      return { reply, products: [], cards: [], suggestions, source: 'gemini' };
    } catch {
      return {
        reply: `I could not reach the general-answer service just now, but I can still search OneStop’s live platform. ${menuReply}`,
        products: [],
        cards: [],
        suggestions,
        source: 'assistant_menu',
      };
    }
  }
}
