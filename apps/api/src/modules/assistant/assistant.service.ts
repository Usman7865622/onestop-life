import { ConfigService } from '@nestjs/config';
import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ProductsService } from '../products/products.service';
import { AssistantMessageDto } from './dto/assistant-chat.dto';
import {
  ASSISTANT_STRINGS,
  AssistantCard,
  AssistantLang,
  GUIDE_LABELS,
  LegacyProduct,
  MEDICINE_FILLER_TERMS,
  MEDICINE_TERMS,
  PlatformResult,
  SYMPTOM_INTRO_PATTERN,
  URDU_EMERGENCY_PATTERN,
  buildProductResult,
  detectAssistantLanguage,
  detectCity,
  detectMedicineClass,
  detectSpeciality,
  detectSymptomGuide,
  detectUrduSpeciality,
  detectUrduSymptomGuide,
  extractBudget,
  extractNamedItemAvailability,
  fieldTokens,
  formatRs,
  isShoppingQuestion,
  normalize,
  queryMentionsPhrase,
  searchTerms,
  titleCase,
  translateUrduQuery,
} from './assistant.helpers';

const URDU_INTRO_PATTERN = /(کون سا|کونسا|کس) ڈاکٹر (دیکھوں|دیکھوں؟|سے ملوں|کے پاس جاؤں|چاہیے)|\bkonsa doctor\b|\bkaun ?sa doctor\b|\bkis doctor (ke paas|ko|se)\b/i;

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
    // Urdu (script or Roman) is detected on the raw message; routing then runs
    // on an English translation so every existing detector/search is reused,
    // while replies are rendered in the user's own language and script.
    const lang = detectAssistantLanguage(query);
    const routing = lang === 'en' ? query : translateUrduQuery(query, lang);
    const lower = routing.toLowerCase();
    const city = detectCity(routing);
    const speciality = detectUrduSpeciality(query) ?? detectSpeciality(routing);
    const budget = extractBudget(query);
    const S = ASSISTANT_STRINGS[lang];

    // Symptom guide: everyday symptom language routes to the speciality that
    // usually assesses it (never a diagnosis). Skipped when the person is
    // clearly shopping for a product ("cream for itchy skin" stays a product).
    const productSeeking = /\b(cream|ointment|lotion|shampoo|soap|medicine|medication|tablets?|capsules?|syrup|drops|spray|gel|balm|buy|price|cost|order)\b/i.test(routing);
    const urduGuide = lang === 'en' || productSeeking ? null : detectUrduSymptomGuide(query);
    let guide = productSeeking ? null : detectSymptomGuide(routing);
    if (urduGuide) guide = { speciality: urduGuide, label: GUIDE_LABELS[lang][urduGuide] ?? urduGuide };
    else if (guide && lang !== 'en') guide = { speciality: guide.speciality, label: GUIDE_LABELS[lang][guide.speciality] ?? guide.label };
    if (guide) return this.doctorResult(routing, guide.speciality, city, guide.label, lang, query);

    // "Which doctor should I see?" / "I want to describe a symptom" before any
    // concrete symptom is named: invite the description, in their own words.
    if ((SYMPTOM_INTRO_PATTERN.test(routing) || URDU_INTRO_PATTERN.test(query)) && !speciality) {
      return {
        reply: S.symptomIntro,
        products: [],
        cards: [],
        suggestions: S.symptomIntroSuggestions,
        source: 'live_platform',
      } satisfies PlatformResult;
    }

    const intent = this.detectIntent(lower, speciality);
    if (intent === 'blood') return this.bloodResult(city, lang);
    if (intent === 'labs') return this.labResult(routing, city, lang);
    if (intent === 'doctors') return this.doctorResult(routing, speciality, city, undefined, lang, query);
    if (intent === 'medicines') return this.medicineResult(routing, budget, lang);
    if (intent === 'facilities') return this.facilityResult(routing, city, lang);

    const productMatches = await this.products.searchForAssistant(routing, null, budget) as LegacyProduct[];

    // Named-item availability questions ("Do you sell Xanax?", "Is X available?")
    // reach this point only when no medicine/doctor/lab match was found. The legacy
    // product search matches loosely, so keep only products whose name/generic/
    // brand genuinely contain the item term — and answer honestly when none do,
    // instead of padding the reply with unrelated "matches".
    const availabilityItem = extractNamedItemAvailability(routing);
    if (availabilityItem) {
      const verifiedMatches = await this.filterToNamedItem(productMatches, availabilityItem.terms);
      if (!verifiedMatches.length) {
        return {
          reply: S.availabilityMissing(availabilityItem.label),
          products: [],
          cards: [],
          suggestions: S.availabilitySuggestions,
          source: 'live_catalog',
        } satisfies PlatformResult;
      }
      return buildProductResult(verifiedMatches, budget, lang);
    }

    if (productMatches.length && (intent === 'products' || isShoppingQuestion(routing) || !routing.includes('?'))) {
      return buildProductResult(productMatches, budget, lang);
    }

    if (intent === 'products') {
      return {
        reply: S.productsMissing,
        products: [],
        cards: [],
        suggestions: S.productsMissingSuggestions,
        source: 'live_catalog',
      } satisfies PlatformResult;
    }

    return this.fallback(messages, query, lang);
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

  private async doctorResult(query: string, speciality: string | null, city: string | null, guideLabel?: string, lang: AssistantLang = 'en', originalQuery: string = query): Promise<PlatformResult> {
    const S = ASSISTANT_STRINGS[lang];
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

    const emergency = /\b(chest pain|chest pressure|difficulty breathing|trouble breathing|stroke|unconscious|severe bleeding|suicidal|suicide)\b/i.test(query)
      || URDU_EMERGENCY_PATTERN.test(originalQuery);
    const symptomLed = /\b(pain|ache|fever|rash|problem|issue|infection|swelling|vomiting|diarrh(o)?ea|anxiety|depression|stress|insomnia|toothache|vision)\b/i.test(query)
      && !/\b(find|book|appointment|doctor|specialist)\b/i.test(query);
    const focus = speciality ?? 'doctor';
    const cityText = city ? S.cityText(city) : '';

    let reply: string;
    if (emergency) {
      reply = S.emergency(focus);
    } else if (guideLabel && speciality) {
      reply = cards.length
        ? S.guideFound(guideLabel, speciality, cards.length, cityText)
        : S.guideNone(guideLabel, speciality, cityText);
    } else if (symptomLed && speciality) {
      reply = cards.length
        ? S.symptomLedFound(speciality, cards.length, cityText)
        : S.symptomLedNone(speciality, cityText);
    } else if (cards.length) {
      reply = S.doctorFound(focus, cards.length, cityText);
    } else {
      reply = S.doctorNone(focus, cityText);
    }

    const firstDoctor = cards[0];
    return {
      reply,
      products: [],
      cards,
      suggestions: S.doctorSuggestions(firstDoctor ? firstDoctor.title : null, focus, city).slice(0, 4),
      source: 'live_platform',
    };
  }

  private async medicineResult(query: string, budget: number | null, lang: AssistantLang = 'en'): Promise<PlatformResult> {
    const S = ASSISTANT_STRINGS[lang];
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
      form: medicine.form ?? undefined,
      therapeuticClass: medicine.therapeuticClass ?? undefined,
    }));

    // The Rx note may only name medicines actually matched and shown above.
    const rxNames = ranked.filter(({ medicine }) => medicine.requiresRx).map(({ medicine }) => medicine.nameEn);
    const budgetText = budget !== null ? S.medicineBudgetText(formatRs(budget * 100)) : '';
    let reply: string;
    if (cards.length) {
      reply = S.medicineFound(cards.length, budgetText);
    } else if (terms.length && !medicineClass) {
      // The user named a specific medicine that is not in the catalogue — say so
      // honestly instead of substituting unrelated medicines.
      const namedMedicine = [...terms].sort((a, b) => b.length - a.length)[0];
      reply = S.medicineNamedMissing(titleCase(namedMedicine));
    } else {
      reply = S.medicineGenericMissing;
    }
    if (rxNames.length) {
      reply += S.rxNote(rxNames.join(', '));
    }

    return {
      reply,
      products: [],
      cards,
      suggestions: S.medicineSuggestions(medicineClass, wantsNoRx),
      source: 'live_platform',
    };
  }

  private async labResult(query: string, city: string | null, lang: AssistantLang = 'en'): Promise<PlatformResult> {
    const S = ASSISTANT_STRINGS[lang];
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
        ? S.labFound(cards.length, city ? S.cityText(city) : '')
        : S.labNone(city ? S.cityText(city) : ''),
      products: [],
      cards,
      suggestions: S.labSuggestions(cards[0] ? cards[0].title : null).slice(0, 4),
      source: 'live_platform',
    };
  }

  private async facilityResult(query: string, city: string | null, lang: AssistantLang = 'en'): Promise<PlatformResult> {
    const S = ASSISTANT_STRINGS[lang];
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
        ? S.facilityFound(cards.length, city ? S.cityText(city) : '')
        : S.facilityNone(city ? S.cityText(city) : ''),
      products: [],
      cards,
      suggestions: S.facilitySuggestions,
      source: 'live_platform',
    };
  }

  private async bloodResult(city: string | null, lang: AssistantLang = 'en'): Promise<PlatformResult> {
    const S = ASSISTANT_STRINGS[lang];
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
      reply: S.bloodReply(cards.length > 0, city ? S.cityText(city) : ''),
      products: [],
      cards,
      suggestions: S.bloodSuggestions,
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
  private async fallback(messages: AssistantMessageDto[], query: string, lang: AssistantLang = 'en'): Promise<PlatformResult> {
    const S = ASSISTANT_STRINGS[lang];
    const menuReply = S.menuReply;
    const suggestions = S.menuSuggestions;

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
                ...(lang === 'ur' ? ['The user is writing in Urdu script — reply in Urdu script.'] : []),
                ...(lang === 'roman-ur' ? ['The user is writing in Roman Urdu — reply in Roman Urdu.'] : []),
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
        reply: `${S.offlinePrefix}${menuReply}`,
        products: [],
        cards: [],
        suggestions,
        source: 'assistant_menu',
      };
    }
  }
}
