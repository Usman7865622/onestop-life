// Plain-JS seed so production never depends on ts-node/tsconfig (fixes TS5109 in Docker).
const { PrismaClient, RoleKey } = require('@prisma/client');

function normalizePkMobile(input) {
  if (typeof input !== 'string') return null;
  let digits = input.replace(/[\s\-().]/g, '');
  if (digits.startsWith('+')) digits = digits.slice(1);
  if (!/^\d+$/.test(digits)) return null;
  if (digits.startsWith('0092')) digits = digits.slice(2);
  else if (digits.startsWith('92')) {}
  else if (digits.startsWith('0')) digits = '92' + digits.slice(1);
  else if (digits.startsWith('3')) digits = '92' + digits;
  return /^923\d{9}$/.test(digits) ? `+${digits}` : null;
}

const prisma = new PrismaClient();


async function main() {
  const raw = process.env.ADMIN_PHONE;
  if (!raw) {
    console.log('ADMIN_PHONE not set; skipping admin seed.');
    return;
  }
  const phone = normalizePkMobile(raw);
  if (!phone) throw new Error('ADMIN_PHONE is not a valid Pakistani mobile number');

  const user = await prisma.user.upsert({
    where: { phone },
    update: {},
    create: { phone, name: 'Platform Admin', phoneVerifiedAt: new Date() },
  });

  for (const role of [RoleKey.CUSTOMER, RoleKey.ADMIN]) {
    await prisma.userRole.upsert({
      where: { userId_role: { userId: user.id, role } },
      update: {},
      create: { userId: user.id, role },
    });
  }

  const starterProducts = [
    { nameEn: 'Smart Fitness Band', priceMinor: 499900, unit: 'item', category: 'Trending essentials', imageUrl: 'https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?auto=format&fit=crop&w=900&q=80' },
    { nameEn: 'Electric Toothbrush', priceMinor: 349900, unit: 'item', category: 'Trending essentials', imageUrl: 'https://images.unsplash.com/photo-1607613009820-a29f7bb81c04?auto=format&fit=crop&w=900&q=80' },
    { nameEn: 'Vitamin D3 5000 IU', priceMinor: 145000, unit: 'bottle', category: 'Trending essentials', imageUrl: 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?auto=format&fit=crop&w=900&q=80' },
    { nameEn: 'Collagen Powder', priceMinor: 385000, unit: 'tub', category: 'Trending essentials', imageUrl: 'https://images.unsplash.com/photo-1593095948071-474c5cc2989d?auto=format&fit=crop&w=900&q=80' },
    { nameEn: 'Whey Protein 1kg', priceMinor: 850000, unit: 'tub', category: 'Trending essentials', imageUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=900&q=80' },
    { nameEn: 'Mini Air Purifier', priceMinor: 999000, unit: 'item', category: 'Trending essentials', imageUrl: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?auto=format&fit=crop&w=900&q=80' },
    { nameEn: 'Massage Gun', priceMinor: 749000, unit: 'item', category: 'Trending essentials', imageUrl: 'https://images.unsplash.com/photo-1620188467120-5042ed1eb5da?auto=format&fit=crop&w=900&q=80' },
    { nameEn: 'Sunscreen SPF 50', priceMinor: 125000, unit: 'tube', category: 'Trending essentials', imageUrl: 'https://images.unsplash.com/photo-1556229010-6c3f2c9ca5f8?auto=format&fit=crop&w=900&q=80' },
    { nameEn: 'Electrolyte Sachets (ORS+)', priceMinor: 95000, unit: 'box', category: 'Trending essentials', imageUrl: 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=900&q=80' },
    { nameEn: 'Posture Corrector', priceMinor: 185000, unit: 'item', category: 'Trending essentials', imageUrl: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=900&q=80' },
    { nameEn: 'Baby Diapers (Pack of 60)', priceMinor: 245000, unit: 'pack', category: 'Trending essentials', imageUrl: 'https://images.unsplash.com/photo-1519689680058-324335c77eba?auto=format&fit=crop&w=900&q=80' },
    { nameEn: 'Herbal Green Tea', priceMinor: 78000, unit: 'box', category: 'Trending essentials', imageUrl: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=900&q=80' },
    { nameEn: 'Paracetamol 500mg', priceMinor: 12000, unit: 'pack', category: 'Medicines', imageUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=900&q=80' },
    { nameEn: 'Cough Relief Syrup', priceMinor: 28000, unit: 'bottle', category: 'Medicines', imageUrl: 'https://images.unsplash.com/photo-1603398938378-e54eab446ade?auto=format&fit=crop&w=900&q=80' },
    { nameEn: 'Antiseptic Cream', priceMinor: 18000, unit: 'tube', category: 'Medicines', imageUrl: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=900&q=80' },
    { nameEn: 'Digital Thermometer', priceMinor: 85000, unit: 'item', category: 'Medical devices', imageUrl: 'https://images.unsplash.com/photo-1584634731339-252c581abfc5?auto=format&fit=crop&w=900&q=80' },
    { nameEn: 'Blood Pressure Monitor', priceMinor: 285000, unit: 'item', category: 'Medical devices', imageUrl: 'https://images.unsplash.com/photo-1559757175-0eb30cd8c063?auto=format&fit=crop&w=900&q=80' },
    { nameEn: 'Vitamin C Tablets', priceMinor: 45000, unit: 'bottle', category: 'Wellness', imageUrl: 'https://images.unsplash.com/photo-1550572017-edd951aa8ca1?auto=format&fit=crop&w=900&q=80' },
    { nameEn: 'First Aid Kit', priceMinor: 125000, unit: 'kit', category: 'Health essentials', imageUrl: 'https://images.unsplash.com/photo-1603398938378-e54eab446ade?auto=format&fit=crop&w=900&q=80' },
    { nameEn: 'Moisturizing Lotion', priceMinor: 65000, unit: 'bottle', category: 'Personal care', imageUrl: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?auto=format&fit=crop&w=900&q=80' },
    { nameEn: 'Baby Gentle Wash', priceMinor: 72000, unit: 'bottle', category: 'Baby care', imageUrl: 'https://images.unsplash.com/photo-1519689680058-324335c77eba?auto=format&fit=crop&w=900&q=80' },
    { nameEn: 'Organic Honey', priceMinor: 95000, unit: 'jar', category: 'Nutrition', imageUrl: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=900&q=80' },
    { nameEn: 'Pet Care Shampoo', priceMinor: 88000, unit: 'bottle', category: 'Pet care', imageUrl: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&w=900&q=80' },
    { nameEn: 'Reusable Face Masks', priceMinor: 35000, unit: 'pack', category: 'Health essentials', imageUrl: 'https://images.unsplash.com/photo-1584634731339-252c581abfc5?auto=format&fit=crop&w=900&q=80' },
    { nameEn: 'Pulse Oximeter', priceMinor: 220000, unit: 'item', category: 'Medical devices', imageUrl: 'https://images.unsplash.com/photo-1631815588090-d4bfec5b1ccb?auto=format&fit=crop&w=900&q=80' },
    { nameEn: 'Digital Glucometer Kit', priceMinor: 195000, unit: 'kit', category: 'Medical devices', imageUrl: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=900&q=80' },
    { nameEn: 'Portable Nebulizer', priceMinor: 420000, unit: 'item', category: 'Medical devices', imageUrl: 'https://images.unsplash.com/photo-1584982751601-97dcc096659c?auto=format&fit=crop&w=900&q=80' },
    { nameEn: 'Electric Heating Pad', priceMinor: 275000, unit: 'item', category: 'Home health', imageUrl: 'https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?auto=format&fit=crop&w=900&q=80' },
    { nameEn: 'Surgical Gloves', priceMinor: 55000, unit: 'box', category: 'Health essentials', imageUrl: 'https://images.unsplash.com/photo-1584483766114-2cea6facdf57?auto=format&fit=crop&w=900&q=80' },
    { nameEn: 'Antibacterial Hand Wash', priceMinor: 39000, unit: 'bottle', category: 'Personal care', imageUrl: 'https://images.unsplash.com/photo-1584744982491-665216d95f8b?auto=format&fit=crop&w=900&q=80' },
    { nameEn: 'Baby Diaper Pack', priceMinor: 185000, unit: 'pack', category: 'Baby care', imageUrl: 'https://images.unsplash.com/photo-1519689680058-324335c77eba?auto=format&fit=crop&w=900&q=80' },
    { nameEn: 'Baby Moisturizing Cream', priceMinor: 98000, unit: 'jar', category: 'Baby care', imageUrl: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?auto=format&fit=crop&w=900&q=80' },
    { nameEn: 'Electrolyte Drink Mix', priceMinor: 75000, unit: 'box', category: 'Nutrition', imageUrl: 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=900&q=80' },
    { nameEn: 'Protein Nutrition Powder', priceMinor: 285000, unit: 'tub', category: 'Nutrition', imageUrl: 'https://images.unsplash.com/photo-1593095948071-474c5cc2989d?auto=format&fit=crop&w=900&q=80' },
    { nameEn: 'Omega 3 Softgels', priceMinor: 160000, unit: 'bottle', category: 'Wellness', imageUrl: 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?auto=format&fit=crop&w=900&q=80' },
    { nameEn: 'Herbal Sleep Tea', priceMinor: 68000, unit: 'box', category: 'Wellness', imageUrl: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=900&q=80' },
    { nameEn: 'Flea & Tick Pet Shampoo', priceMinor: 115000, unit: 'bottle', category: 'Pet care', imageUrl: 'https://images.unsplash.com/photo-1558788353-f76d92427f16?auto=format&fit=crop&w=900&q=80' },
    { nameEn: 'Pet Joint Support Chews', priceMinor: 145000, unit: 'pack', category: 'Pet care', imageUrl: 'https://images.unsplash.com/photo-1530281700549-e82e7bf110d6?auto=format&fit=crop&w=900&q=80' },
    { nameEn: 'Pet Dental Care Kit', priceMinor: 92000, unit: 'kit', category: 'Pet care', imageUrl: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?auto=format&fit=crop&w=900&q=80' },
    { nameEn: 'Cat Litter Tray', priceMinor: 240000, unit: 'item', category: 'Pet care', imageUrl: 'https://images.unsplash.com/photo-1574158622682-e40e69881006?auto=format&fit=crop&w=900&q=80' },
    { nameEn: 'Reusable Ice Pack', priceMinor: 85000, unit: 'item', category: 'Home health', imageUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=900&q=80' },
    { nameEn: 'Medicine Organizer Box', priceMinor: 110000, unit: 'item', category: 'Home health', imageUrl: 'https://images.unsplash.com/photo-1585435557343-3b092031a831?auto=format&fit=crop&w=900&q=80' },
    { nameEn: 'Smart Health Watch', priceMinor: 649000, unit: 'item', category: 'Electronics & appliances', imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=80' },
    { nameEn: 'Digital Body Scale', priceMinor: 385000, unit: 'item', category: 'Electronics & appliances', imageUrl: 'https://images.unsplash.com/photo-1556817411-31ae72fa3ea0?auto=format&fit=crop&w=900&q=80' },
    { nameEn: 'Compact Air Purifier', priceMinor: 1290000, unit: 'item', category: 'Electronics & appliances', imageUrl: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?auto=format&fit=crop&w=900&q=80' },
    { nameEn: 'Portable USB Blender', priceMinor: 295000, unit: 'item', category: 'Electronics & appliances', imageUrl: 'https://images.unsplash.com/photo-1570222094114-d054a817e56b?auto=format&fit=crop&w=900&q=80' },
    { nameEn: 'Rechargeable Neck Massager', priceMinor: 520000, unit: 'item', category: 'Electronics & appliances', imageUrl: 'https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?auto=format&fit=crop&w=900&q=80' },
  ];

  for (const product of starterProducts) {
    const existing = await prisma.product.findFirst({ where: { nameEn: product.nameEn } });
    if (existing) {
      await prisma.product.update({ where: { id: existing.id }, data: product });
    } else {
      await prisma.product.create({ data: product });
    }
  }

  await prisma.discountCode.upsert({
    where: { code: 'WELCOME10' },
    update: { type: 'PERCENT', value: 10, active: true, maxUses: null },
    create: { code: 'WELCOME10', type: 'PERCENT', value: 10, maxUses: null },
  });

  await prisma.discountCode.upsert({
    where: { code: 'CARE500' },
    update: { type: 'FIXED', value: 50000, active: true, maxUses: null },
    create: { code: 'CARE500', type: 'FIXED', value: 50000, maxUses: null },
  });

  // ---- Demo healthcare seed (Phase 1B) ----
  const demoFacilities = [
    { name: 'OneStop Care Clinic — Gulberg', type: 'CLINIC', address: 'Main Boulevard, Gulberg III', city: 'Lahore', phone: '+924235778899', timings: 'Mon–Sat 9am–9pm', isEmergency: false },
    { name: 'City General Hospital', type: 'HOSPITAL', address: 'Jail Road', city: 'Lahore', phone: '+924299231100', timings: '24/7', isEmergency: true },
    { name: 'OneStop Diagnostics Lab', type: 'LAB', address: 'MM Alam Road', city: 'Lahore', phone: '+924235771122', timings: 'Mon–Sun 7am–11pm', isEmergency: false },
    { name: 'Karachi Care Clinic', type: 'CLINIC', address: 'Clifton Block 5, Boat Basin', city: 'Karachi', phone: '+922135895500', timings: 'Mon–Sat 10am–10pm', isEmergency: false },
    { name: 'Islamabad Medical Complex', type: 'HOSPITAL', address: 'Sector G-8, Ibn-e-Sina Road', city: 'Islamabad', phone: '+92519106600', timings: '24/7', isEmergency: true },
    { name: 'Lahore Blood Bank — Model Town', type: 'BLOOD_BANK', address: 'Model Town Link Road', city: 'Lahore', phone: '+924235887766', timings: '24/7', isEmergency: true },
    { name: 'Karachi Blood Services', type: 'BLOOD_BANK', address: 'Shahrah-e-Faisal, PECHS', city: 'Karachi', phone: '+922134567788', timings: '24/7', isEmergency: true },
    { name: 'OneStop Pharmacy — Gulberg', type: 'PHARMACY', address: 'MM Alam Road, Gulberg III', city: 'Lahore', phone: '+924235779900', timings: 'Mon–Sun 8am–12am', isEmergency: false },
  ];
  const facilities = [];
  for (const f of demoFacilities) {
    const existing = await prisma.facility.findFirst({ where: { name: f.name } });
    facilities.push(existing ?? (await prisma.facility.create({ data: f })));
  }

  const demoDoctors = [
    { email: 'dr.ahmed@onestop.demo', name: 'Dr. Ahmed Khan', speciality: 'Cardiology', qualifications: 'MBBS, FCPS (Cardiology)', experienceYears: 12, feeMinor: 250000, languages: ['English', 'Urdu'], about: 'Consultant cardiologist focused on preventive heart care, hypertension and chest pain evaluation.', facilityName: 'City General Hospital' },
    { email: 'dr.fatima@onestop.demo', name: 'Dr. Fatima Noor', speciality: 'Pediatrics', qualifications: 'MBBS, FCPS (Pediatrics)', experienceYears: 9, feeMinor: 180000, languages: ['English', 'Urdu'], about: 'Child specialist for newborns, vaccination, growth tracking and developmental care.', facilityName: 'OneStop Care Clinic — Gulberg' },
    { email: 'dr.bilal@onestop.demo', name: 'Dr. Bilal Hussain', speciality: 'General Physician', qualifications: 'MBBS', experienceYears: 7, feeMinor: 120000, languages: ['Urdu', 'English', 'Punjabi'], about: 'Family physician for everyday health, diabetes screening, fever and general check-ups.', facilityName: 'OneStop Care Clinic — Gulberg' },
    { email: 'dr.ayesha@onestop.demo', name: 'Dr. Ayesha Siddiqui', speciality: 'Dermatology', qualifications: 'MBBS, FCPS (Dermatology)', experienceYears: 10, feeMinor: 200000, languages: ['Urdu', 'English', 'Sindhi'], about: 'Skin, hair and nail specialist for acne, eczema, psoriasis and cosmetic dermatology.', facilityName: 'Karachi Care Clinic' },
    { email: 'dr.maryam@onestop.demo', name: 'Dr. Maryam Tariq', speciality: 'Gynecology', qualifications: 'MBBS, FCPS (Obstetrics & Gynecology)', experienceYears: 14, feeMinor: 220000, languages: ['English', 'Urdu', 'Punjabi'], about: 'Consultant gynecologist for pregnancy care, PCOS, fertility counselling and women’s health.', facilityName: 'Islamabad Medical Complex' },
    { email: 'dr.imran@onestop.demo', name: 'Dr. Imran Sheikh', speciality: 'Orthopedics', qualifications: 'MBBS, MS (Orthopedic Surgery)', experienceYears: 15, feeMinor: 280000, languages: ['Urdu', 'English'], about: 'Orthopedic surgeon for joint pain, fractures, sports injuries and arthritis care.', facilityName: 'City General Hospital' },
    { email: 'dr.sarah@onestop.demo', name: 'Dr. Sarah Ahmed', speciality: 'Dentistry', qualifications: 'BDS, MDS (Operative Dentistry)', experienceYears: 8, feeMinor: 150000, languages: ['English', 'Urdu', 'Sindhi'], about: 'Dentist for painless root canals, implants, braces consultations and cosmetic dentistry.', facilityName: 'Karachi Care Clinic' },
    { email: 'dr.hassan@onestop.demo', name: 'Dr. Hassan Raza', speciality: 'Ophthalmology', qualifications: 'MBBS, FCPS (Ophthalmology)', experienceYears: 11, feeMinor: 240000, languages: ['Urdu', 'English', 'Punjabi'], about: 'Eye specialist for vision testing, cataract evaluation, glaucoma and diabetic eye care.', facilityName: 'Islamabad Medical Complex' },
    { email: 'dr.zainab@onestop.demo', name: 'Dr. Zainab Ali', speciality: 'ENT', qualifications: 'MBBS, FCPS (ENT)', experienceYears: 9, feeMinor: 180000, languages: ['Urdu', 'English'], about: 'ENT specialist for ear pain, sinus issues, tonsils, hearing loss and allergy care.', facilityName: 'OneStop Care Clinic — Gulberg' },
    { email: 'dr.omar@onestop.demo', name: 'Dr. Omar Farooq', speciality: 'Neurology', qualifications: 'MBBS, MD (Neurology)', experienceYears: 16, feeMinor: 350000, languages: ['English', 'Urdu'], about: 'Neurologist for migraine, epilepsy, stroke follow-up, numbness and sleep disorders.', facilityName: 'Islamabad Medical Complex' },
    { email: 'dr.hira@onestop.demo', name: 'Dr. Hira Shah', speciality: 'Psychiatry', qualifications: 'MBBS, FCPS (Psychiatry)', experienceYears: 7, feeMinor: 250000, languages: ['Urdu', 'English', 'Sindhi'], about: 'Psychiatrist for anxiety, depression, stress, sleep problems and confidential counselling.', facilityName: 'Karachi Care Clinic' },
    { email: 'dr.ali@onestop.demo', name: 'Dr. Ali Nawaz', speciality: 'Gastroenterology', qualifications: 'MBBS, FCPS (Gastroenterology)', experienceYears: 13, feeMinor: 300000, languages: ['Urdu', 'English', 'Pashto'], about: 'Gastroenterologist for acidity, IBS, liver care, endoscopy advice and digestive health.', facilityName: 'Islamabad Medical Complex' },
  ];
  for (const d of demoDoctors) {
    const docUser = await prisma.user.upsert({
      where: { email: d.email },
      update: { name: d.name },
      create: { email: d.email, name: d.name },
    });
    for (const role of [RoleKey.CUSTOMER, RoleKey.DOCTOR]) {
      await prisma.userRole.upsert({
        where: { userId_role: { userId: docUser.id, role } },
        update: {},
        create: { userId: docUser.id, role },
      });
    }
    const profile = await prisma.doctorProfile.upsert({
      where: { userId: docUser.id },
      update: { speciality: d.speciality, qualifications: d.qualifications, experienceYears: d.experienceYears, feeMinor: d.feeMinor, languages: d.languages, about: d.about, isBookable: true },
      create: { userId: docUser.id, speciality: d.speciality, qualifications: d.qualifications, experienceYears: d.experienceYears, feeMinor: d.feeMinor, languages: d.languages, about: d.about, isBookable: true },
    });
    const facility = facilities.find((f) => f.name === d.facilityName) ?? facilities[0];
    await prisma.doctorFacility.upsert({
      where: { doctorProfileId_facilityId: { doctorProfileId: profile.id, facilityId: facility.id } },
      update: {},
      create: { doctorProfileId: profile.id, facilityId: facility.id },
    });
  }

  // ---- Demo lab tests & blood banks (Phase 1D) ----
  const labFacility = facilities.find((f) => f.name === 'OneStop Diagnostics Lab') ?? facilities[0];
  const demoLabTests = [
    { code: 'CBC', name: 'Complete Blood Count (CBC)', priceMinor: 60000, sampleType: 'Blood', reportHours: 12 },
    { code: 'HBA1C', name: 'HbA1c (Diabetes Control)', priceMinor: 120000, sampleType: 'Blood', reportHours: 24 },
    { code: 'LIPID', name: 'Lipid Profile (Cholesterol)', priceMinor: 180000, sampleType: 'Blood', reportHours: 24 },
    { code: 'LFT', name: 'Liver Function Test (LFT)', priceMinor: 140000, sampleType: 'Blood', reportHours: 24 },
    { code: 'RFT', name: 'Kidney Function Test (RFT)', priceMinor: 150000, sampleType: 'Blood', reportHours: 24 },
    { code: 'VITD', name: 'Vitamin D Total', priceMinor: 350000, sampleType: 'Blood', reportHours: 48 },
    { code: 'TSH', name: 'Thyroid Stimulating Hormone (TSH)', priceMinor: 110000, sampleType: 'Blood', reportHours: 24 },
    { code: 'DENGUE-NS1', name: 'Dengue NS1 Antigen', priceMinor: 220000, sampleType: 'Blood', reportHours: 12 },
    { code: 'MALARIA-MP', name: 'Malaria Parasite (MP)', priceMinor: 90000, sampleType: 'Blood', reportHours: 6 },
    { code: 'URINE-COMP', name: 'Urine Complete Examination', priceMinor: 50000, sampleType: 'Urine', reportHours: 12 },
    { code: 'BSF', name: 'Blood Sugar Fasting', priceMinor: 30000, sampleType: 'Blood', reportHours: 6 },
  ];
  for (const t of demoLabTests) {
    const existing = await prisma.labTest.findFirst({ where: { code: t.code } });
    if (existing) {
      await prisma.labTest.update({
        where: { id: existing.id },
        data: { name: t.name, priceMinor: t.priceMinor, sampleType: t.sampleType, reportHours: t.reportHours, facilityId: labFacility.id, isActive: true },
      });
    } else {
      await prisma.labTest.create({ data: { ...t, facilityId: labFacility.id } });
    }
  }


  // ---- Pharmacy medicines catalogue ----
  // Catalogue data only (names, strengths, pack sizes, prices). No dosage or usage information.
  const MEDICINE_FORM_IMAGES = {
    Tablet: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=900&q=80',
    Capsule: 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?auto=format&fit=crop&w=900&q=80',
    Syrup: 'https://images.unsplash.com/photo-1603398938378-e54eab446ade?auto=format&fit=crop&w=900&q=80',
    Cream: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=900&q=80',
    Drops: 'https://images.unsplash.com/photo-1585435557343-3b092031a831?auto=format&fit=crop&w=900&q=80',
    Inhaler: 'https://images.unsplash.com/photo-1585435557343-3b092031a831?auto=format&fit=crop&w=900&q=80',
    Injection: 'https://images.unsplash.com/photo-1585435557343-3b092031a831?auto=format&fit=crop&w=900&q=80',
    Sachet: 'https://images.unsplash.com/photo-1585435557343-3b092031a831?auto=format&fit=crop&w=900&q=80',
  };
  const medicines = [
    { nameEn: 'Paracetamol 500mg Tablets', genericName: 'Paracetamol', brandName: 'Panadol', strength: '500mg', form: 'Tablet', packSize: 'Strip of 20 tablets', therapeuticClass: 'Pain Relief', requiresRx: false, priceMinor: 4000 },
    { nameEn: 'Paracetamol 650mg Tablets', genericName: 'Paracetamol', brandName: 'Panadol', strength: '650mg', form: 'Tablet', packSize: 'Strip of 20 tablets', therapeuticClass: 'Pain Relief', requiresRx: false, priceMinor: 6000 },
    { nameEn: 'Paracetamol 120mg/5ml Syrup', genericName: 'Paracetamol', brandName: 'Panadol', strength: '120mg/5ml', form: 'Syrup', packSize: '90ml bottle', therapeuticClass: 'Pain Relief', requiresRx: false, priceMinor: 8500 },
    { nameEn: 'Paracetamol 80mg/ml Drops', genericName: 'Paracetamol', brandName: 'Panadol Infant Drops', strength: '80mg/ml', form: 'Drops', packSize: '20ml bottle', therapeuticClass: 'Pain Relief', requiresRx: false, priceMinor: 9500 },
    { nameEn: 'Paracetamol + Caffeine 500mg/65mg Tablets', genericName: 'Paracetamol + Caffeine', brandName: 'Panadol Extra', strength: '500mg/65mg', form: 'Tablet', packSize: 'Strip of 24 tablets', therapeuticClass: 'Pain Relief', requiresRx: false, priceMinor: 11000 },
    { nameEn: 'Ibuprofen 200mg Tablets', genericName: 'Ibuprofen', brandName: 'Brufen', strength: '200mg', form: 'Tablet', packSize: 'Pack of 30 tablets', therapeuticClass: 'Pain Relief', requiresRx: false, priceMinor: 15000 },
    { nameEn: 'Ibuprofen 400mg Tablets', genericName: 'Ibuprofen', brandName: 'Brufen', strength: '400mg', form: 'Tablet', packSize: 'Pack of 30 tablets', therapeuticClass: 'Pain Relief', requiresRx: false, priceMinor: 23000 },
    { nameEn: 'Ibuprofen 100mg/5ml Syrup', genericName: 'Ibuprofen', brandName: 'Brufen', strength: '100mg/5ml', form: 'Syrup', packSize: '90ml bottle', therapeuticClass: 'Pain Relief', requiresRx: false, priceMinor: 12000 },
    { nameEn: 'Diclofenac Sodium 50mg Tablets', genericName: 'Diclofenac Sodium', brandName: 'Voltaren', strength: '50mg', form: 'Tablet', packSize: 'Pack of 20 tablets', therapeuticClass: 'Pain Relief', requiresRx: true, priceMinor: 19000 },
    { nameEn: 'Diclofenac 1% Gel', genericName: 'Diclofenac Diethylamine', brandName: 'Voltaren Emulgel', strength: '1%', form: 'Cream', packSize: '20g tube', therapeuticClass: 'Pain Relief', requiresRx: false, priceMinor: 29000 },
    { nameEn: 'Diclofenac 75mg Injection', genericName: 'Diclofenac Sodium', brandName: null, strength: '75mg/3ml', form: 'Injection', packSize: 'Pack of 5 ampoules', therapeuticClass: 'Pain Relief', requiresRx: true, priceMinor: 22000 },
    { nameEn: 'Naproxen 250mg Tablets', genericName: 'Naproxen', brandName: 'Synflex', strength: '250mg', form: 'Tablet', packSize: 'Pack of 20 tablets', therapeuticClass: 'Pain Relief', requiresRx: true, priceMinor: 27000 },
    { nameEn: 'Naproxen 500mg Tablets', genericName: 'Naproxen', brandName: 'Synflex', strength: '500mg', form: 'Tablet', packSize: 'Pack of 20 tablets', therapeuticClass: 'Pain Relief', requiresRx: true, priceMinor: 43000 },
    { nameEn: 'Mefenamic Acid 250mg Capsules', genericName: 'Mefenamic Acid', brandName: 'Ponstan', strength: '250mg', form: 'Capsule', packSize: 'Pack of 20 capsules', therapeuticClass: 'Pain Relief', requiresRx: false, priceMinor: 17000 },
    { nameEn: 'Aspirin 75mg Tablets', genericName: 'Acetylsalicylic Acid', brandName: 'Loprin', strength: '75mg', form: 'Tablet', packSize: 'Pack of 100 tablets', therapeuticClass: 'Pain Relief', requiresRx: false, priceMinor: 9500 },
    { nameEn: 'Aspirin 300mg Tablets', genericName: 'Acetylsalicylic Acid', brandName: 'Disprin', strength: '300mg', form: 'Tablet', packSize: 'Pack of 100 tablets', therapeuticClass: 'Pain Relief', requiresRx: false, priceMinor: 13000 },
    { nameEn: 'Tramadol 50mg Capsules', genericName: 'Tramadol HCl', brandName: 'Tramal', strength: '50mg', form: 'Capsule', packSize: 'Pack of 20 capsules', therapeuticClass: 'Pain Relief', requiresRx: true, priceMinor: 46000 },
    { nameEn: 'Celecoxib 100mg Capsules', genericName: 'Celecoxib', brandName: 'Celbexx', strength: '100mg', form: 'Capsule', packSize: 'Pack of 20 capsules', therapeuticClass: 'Pain Relief', requiresRx: true, priceMinor: 39000 },
    { nameEn: 'Amoxicillin 250mg Capsules', genericName: 'Amoxicillin', brandName: 'Amoxil', strength: '250mg', form: 'Capsule', packSize: 'Pack of 100 capsules', therapeuticClass: 'Antibiotics', requiresRx: true, priceMinor: 33000 },
    { nameEn: 'Amoxicillin 500mg Capsules', genericName: 'Amoxicillin', brandName: 'Amoxil', strength: '500mg', form: 'Capsule', packSize: 'Pack of 100 capsules', therapeuticClass: 'Antibiotics', requiresRx: true, priceMinor: 53000 },
    { nameEn: 'Amoxicillin 125mg/5ml Syrup', genericName: 'Amoxicillin', brandName: 'Amoxil', strength: '125mg/5ml', form: 'Syrup', packSize: '90ml bottle', therapeuticClass: 'Antibiotics', requiresRx: true, priceMinor: 19000 },
    { nameEn: 'Co-Amoxiclav 625mg Tablets', genericName: 'Amoxicillin + Clavulanic Acid', brandName: 'Augmentin', strength: '625mg', form: 'Tablet', packSize: 'Pack of 6 tablets', therapeuticClass: 'Antibiotics', requiresRx: true, priceMinor: 36000 },
    { nameEn: 'Co-Amoxiclav 375mg Tablets', genericName: 'Amoxicillin + Clavulanic Acid', brandName: 'Augmentin', strength: '375mg', form: 'Tablet', packSize: 'Pack of 6 tablets', therapeuticClass: 'Antibiotics', requiresRx: true, priceMinor: 26000 },
    { nameEn: 'Co-Amoxiclav 156.25mg/5ml Syrup', genericName: 'Amoxicillin + Clavulanic Acid', brandName: 'Augmentin', strength: '156.25mg/5ml', form: 'Syrup', packSize: '90ml bottle', therapeuticClass: 'Antibiotics', requiresRx: true, priceMinor: 43000 },
    { nameEn: 'Azithromycin 250mg Tablets', genericName: 'Azithromycin', brandName: 'Zetro', strength: '250mg', form: 'Tablet', packSize: 'Pack of 6 tablets', therapeuticClass: 'Antibiotics', requiresRx: true, priceMinor: 39000 },
    { nameEn: 'Azithromycin 500mg Tablets', genericName: 'Azithromycin', brandName: 'Zetro', strength: '500mg', form: 'Tablet', packSize: 'Pack of 6 tablets', therapeuticClass: 'Antibiotics', requiresRx: true, priceMinor: 56000 },
    { nameEn: 'Azithromycin 200mg/5ml Syrup', genericName: 'Azithromycin', brandName: 'Zetro', strength: '200mg/5ml', form: 'Syrup', packSize: '15ml bottle', therapeuticClass: 'Antibiotics', requiresRx: true, priceMinor: 39000 },
    { nameEn: 'Ciprofloxacin 250mg Tablets', genericName: 'Ciprofloxacin', brandName: 'Ciproxin', strength: '250mg', form: 'Tablet', packSize: 'Pack of 10 tablets', therapeuticClass: 'Antibiotics', requiresRx: true, priceMinor: 27000 },
    { nameEn: 'Ciprofloxacin 500mg Tablets', genericName: 'Ciprofloxacin', brandName: 'Ciproxin', strength: '500mg', form: 'Tablet', packSize: 'Pack of 10 tablets', therapeuticClass: 'Antibiotics', requiresRx: true, priceMinor: 39000 },
    { nameEn: 'Levofloxacin 250mg Tablets', genericName: 'Levofloxacin', brandName: 'Tavanic', strength: '250mg', form: 'Tablet', packSize: 'Pack of 10 tablets', therapeuticClass: 'Antibiotics', requiresRx: true, priceMinor: 46000 },
    { nameEn: 'Levofloxacin 500mg Tablets', genericName: 'Levofloxacin', brandName: 'Tavanic', strength: '500mg', form: 'Tablet', packSize: 'Pack of 10 tablets', therapeuticClass: 'Antibiotics', requiresRx: true, priceMinor: 66000 },
    { nameEn: 'Cefixime 400mg Capsules', genericName: 'Cefixime', brandName: 'Cefspan', strength: '400mg', form: 'Capsule', packSize: 'Pack of 5 capsules', therapeuticClass: 'Antibiotics', requiresRx: true, priceMinor: 66000 },
    { nameEn: 'Cefixime 200mg Capsules', genericName: 'Cefixime', brandName: 'Cefspan', strength: '200mg', form: 'Capsule', packSize: 'Pack of 10 capsules', therapeuticClass: 'Antibiotics', requiresRx: true, priceMinor: 71000 },
    { nameEn: 'Cefixime 100mg/5ml Syrup', genericName: 'Cefixime', brandName: 'Cefspan', strength: '100mg/5ml', form: 'Syrup', packSize: '30ml bottle', therapeuticClass: 'Antibiotics', requiresRx: true, priceMinor: 49000 },
    { nameEn: 'Cefuroxime 250mg Tablets', genericName: 'Cefuroxime Axetil', brandName: 'Zinnat', strength: '250mg', form: 'Tablet', packSize: 'Pack of 10 tablets', therapeuticClass: 'Antibiotics', requiresRx: true, priceMinor: 73000 },
    { nameEn: 'Cefuroxime 500mg Tablets', genericName: 'Cefuroxime Axetil', brandName: 'Zinnat', strength: '500mg', form: 'Tablet', packSize: 'Pack of 10 tablets', therapeuticClass: 'Antibiotics', requiresRx: true, priceMinor: 116000 },
    { nameEn: 'Cephalexin 250mg Capsules', genericName: 'Cephalexin', brandName: 'Keflex', strength: '250mg', form: 'Capsule', packSize: 'Pack of 12 capsules', therapeuticClass: 'Antibiotics', requiresRx: true, priceMinor: 29000 },
    { nameEn: 'Cephalexin 500mg Capsules', genericName: 'Cephalexin', brandName: 'Keflex', strength: '500mg', form: 'Capsule', packSize: 'Pack of 12 capsules', therapeuticClass: 'Antibiotics', requiresRx: true, priceMinor: 47000 },
    { nameEn: 'Doxycycline 100mg Capsules', genericName: 'Doxycycline', brandName: 'Vibramycin', strength: '100mg', form: 'Capsule', packSize: 'Pack of 50 capsules', therapeuticClass: 'Antibiotics', requiresRx: true, priceMinor: 51000 },
    { nameEn: 'Metronidazole 400mg Tablets', genericName: 'Metronidazole', brandName: 'Flagyl', strength: '400mg', form: 'Tablet', packSize: 'Pack of 50 tablets', therapeuticClass: 'Antibiotics', requiresRx: true, priceMinor: 29000 },
    { nameEn: 'Metformin 500mg Tablets', genericName: 'Metformin HCl', brandName: 'Glucophage', strength: '500mg', form: 'Tablet', packSize: 'Pack of 50 tablets', therapeuticClass: 'Diabetes Care', requiresRx: false, priceMinor: 14500 },
    { nameEn: 'Metformin 850mg Tablets', genericName: 'Metformin HCl', brandName: 'Glucophage', strength: '850mg', form: 'Tablet', packSize: 'Pack of 50 tablets', therapeuticClass: 'Diabetes Care', requiresRx: false, priceMinor: 22500 },
    { nameEn: 'Metformin 1000mg Tablets', genericName: 'Metformin HCl', brandName: 'Glucophage', strength: '1000mg', form: 'Tablet', packSize: 'Pack of 50 tablets', therapeuticClass: 'Diabetes Care', requiresRx: false, priceMinor: 28500 },
    { nameEn: 'Glimepiride 1mg Tablets', genericName: 'Glimepiride', brandName: 'Amaryl', strength: '1mg', form: 'Tablet', packSize: 'Pack of 20 tablets', therapeuticClass: 'Diabetes Care', requiresRx: false, priceMinor: 20500 },
    { nameEn: 'Glimepiride 2mg Tablets', genericName: 'Glimepiride', brandName: 'Amaryl', strength: '2mg', form: 'Tablet', packSize: 'Pack of 20 tablets', therapeuticClass: 'Diabetes Care', requiresRx: false, priceMinor: 26500 },
    { nameEn: 'Glimepiride 3mg Tablets', genericName: 'Glimepiride', brandName: 'Amaryl', strength: '3mg', form: 'Tablet', packSize: 'Pack of 20 tablets', therapeuticClass: 'Diabetes Care', requiresRx: false, priceMinor: 32500 },
    { nameEn: 'Glimepiride 4mg Tablets', genericName: 'Glimepiride', brandName: 'Amaryl', strength: '4mg', form: 'Tablet', packSize: 'Pack of 20 tablets', therapeuticClass: 'Diabetes Care', requiresRx: false, priceMinor: 38500 },
    { nameEn: 'Gliclazide 80mg Tablets', genericName: 'Gliclazide', brandName: 'Diamicron', strength: '80mg', form: 'Tablet', packSize: 'Pack of 20 tablets', therapeuticClass: 'Diabetes Care', requiresRx: false, priceMinor: 24500 },
    { nameEn: 'Gliclazide MR 30mg Tablets', genericName: 'Gliclazide MR', brandName: 'Diamicron MR', strength: '30mg', form: 'Tablet', packSize: 'Pack of 30 tablets', therapeuticClass: 'Diabetes Care', requiresRx: false, priceMinor: 30500 },
    { nameEn: 'Gliclazide MR 60mg Tablets', genericName: 'Gliclazide MR', brandName: 'Diamicron MR', strength: '60mg', form: 'Tablet', packSize: 'Pack of 30 tablets', therapeuticClass: 'Diabetes Care', requiresRx: false, priceMinor: 45500 },
    { nameEn: 'Sitagliptin 50mg Tablets', genericName: 'Sitagliptin', brandName: 'Januvia', strength: '50mg', form: 'Tablet', packSize: 'Pack of 14 tablets', therapeuticClass: 'Diabetes Care', requiresRx: true, priceMinor: 96000 },
    { nameEn: 'Sitagliptin 100mg Tablets', genericName: 'Sitagliptin', brandName: 'Januvia', strength: '100mg', form: 'Tablet', packSize: 'Pack of 14 tablets', therapeuticClass: 'Diabetes Care', requiresRx: true, priceMinor: 141000 },
    { nameEn: 'Sitagliptin + Metformin 50mg/1000mg Tablets', genericName: 'Sitagliptin + Metformin', brandName: 'Janumet', strength: '50mg/1000mg', form: 'Tablet', packSize: 'Pack of 28 tablets', therapeuticClass: 'Diabetes Care', requiresRx: true, priceMinor: 181000 },
    { nameEn: 'Vildagliptin 50mg Tablets', genericName: 'Vildagliptin', brandName: 'Galvus', strength: '50mg', form: 'Tablet', packSize: 'Pack of 28 tablets', therapeuticClass: 'Diabetes Care', requiresRx: true, priceMinor: 111000 },
    { nameEn: 'Linagliptin 5mg Tablets', genericName: 'Linagliptin', brandName: 'Trajenta', strength: '5mg', form: 'Tablet', packSize: 'Pack of 30 tablets', therapeuticClass: 'Diabetes Care', requiresRx: true, priceMinor: 161000 },
    { nameEn: 'Empagliflozin 10mg Tablets', genericName: 'Empagliflozin', brandName: 'Jardiance', strength: '10mg', form: 'Tablet', packSize: 'Pack of 30 tablets', therapeuticClass: 'Diabetes Care', requiresRx: true, priceMinor: 221000 },
    { nameEn: 'Amlodipine 5mg Tablets', genericName: 'Amlodipine', brandName: 'Norvasc', strength: '5mg', form: 'Tablet', packSize: 'Pack of 20 tablets', therapeuticClass: 'Heart & BP', requiresRx: false, priceMinor: 12500 },
    { nameEn: 'Amlodipine 10mg Tablets', genericName: 'Amlodipine', brandName: 'Norvasc', strength: '10mg', form: 'Tablet', packSize: 'Pack of 20 tablets', therapeuticClass: 'Heart & BP', requiresRx: false, priceMinor: 19500 },
    { nameEn: 'Losartan 50mg Tablets', genericName: 'Losartan Potassium', brandName: 'Cozaar', strength: '50mg', form: 'Tablet', packSize: 'Pack of 20 tablets', therapeuticClass: 'Heart & BP', requiresRx: false, priceMinor: 22500 },
    { nameEn: 'Losartan 100mg Tablets', genericName: 'Losartan Potassium', brandName: 'Cozaar', strength: '100mg', form: 'Tablet', packSize: 'Pack of 20 tablets', therapeuticClass: 'Heart & BP', requiresRx: false, priceMinor: 32500 },
    { nameEn: 'Losartan + HCTZ 50mg/12.5mg Tablets', genericName: 'Losartan + Hydrochlorothiazide', brandName: 'Hyzaar', strength: '50mg/12.5mg', form: 'Tablet', packSize: 'Pack of 20 tablets', therapeuticClass: 'Heart & BP', requiresRx: false, priceMinor: 30500 },
    { nameEn: 'Valsartan 80mg Tablets', genericName: 'Valsartan', brandName: 'Diovan', strength: '80mg', form: 'Tablet', packSize: 'Pack of 28 tablets', therapeuticClass: 'Heart & BP', requiresRx: false, priceMinor: 45500 },
    { nameEn: 'Valsartan 160mg Tablets', genericName: 'Valsartan', brandName: 'Diovan', strength: '160mg', form: 'Tablet', packSize: 'Pack of 28 tablets', therapeuticClass: 'Heart & BP', requiresRx: false, priceMinor: 62500 },
    { nameEn: 'Valsartan + Amlodipine 5mg/80mg Tablets', genericName: 'Valsartan + Amlodipine', brandName: 'Exforge', strength: '5mg/80mg', form: 'Tablet', packSize: 'Pack of 28 tablets', therapeuticClass: 'Heart & BP', requiresRx: false, priceMinor: 75500 },
    { nameEn: 'Telmisartan 40mg Tablets', genericName: 'Telmisartan', brandName: 'Micardis', strength: '40mg', form: 'Tablet', packSize: 'Pack of 28 tablets', therapeuticClass: 'Heart & BP', requiresRx: false, priceMinor: 48500 },
    { nameEn: 'Telmisartan 80mg Tablets', genericName: 'Telmisartan', brandName: 'Micardis', strength: '80mg', form: 'Tablet', packSize: 'Pack of 28 tablets', therapeuticClass: 'Heart & BP', requiresRx: false, priceMinor: 62500 },
    { nameEn: 'Atenolol 50mg Tablets', genericName: 'Atenolol', brandName: 'Tenormin', strength: '50mg', form: 'Tablet', packSize: 'Pack of 28 tablets', therapeuticClass: 'Heart & BP', requiresRx: false, priceMinor: 11500 },
    { nameEn: 'Atenolol 100mg Tablets', genericName: 'Atenolol', brandName: 'Tenormin', strength: '100mg', form: 'Tablet', packSize: 'Pack of 28 tablets', therapeuticClass: 'Heart & BP', requiresRx: false, priceMinor: 17500 },
    { nameEn: 'Bisoprolol 2.5mg Tablets', genericName: 'Bisoprolol', brandName: 'Concor', strength: '2.5mg', form: 'Tablet', packSize: 'Pack of 30 tablets', therapeuticClass: 'Heart & BP', requiresRx: false, priceMinor: 26500 },
    { nameEn: 'Bisoprolol 5mg Tablets', genericName: 'Bisoprolol', brandName: 'Concor', strength: '5mg', form: 'Tablet', packSize: 'Pack of 30 tablets', therapeuticClass: 'Heart & BP', requiresRx: false, priceMinor: 32500 },
    { nameEn: 'Bisoprolol 10mg Tablets', genericName: 'Bisoprolol', brandName: 'Concor', strength: '10mg', form: 'Tablet', packSize: 'Pack of 30 tablets', therapeuticClass: 'Heart & BP', requiresRx: false, priceMinor: 42500 },
    { nameEn: 'Metoprolol Succinate ER 50mg Tablets', genericName: 'Metoprolol Succinate', brandName: 'Betaloc ZOK', strength: '50mg', form: 'Tablet', packSize: 'Pack of 30 tablets', therapeuticClass: 'Heart & BP', requiresRx: false, priceMinor: 35500 },
    { nameEn: 'Nebivolol 5mg Tablets', genericName: 'Nebivolol', brandName: 'Nebilet', strength: '5mg', form: 'Tablet', packSize: 'Pack of 30 tablets', therapeuticClass: 'Heart & BP', requiresRx: false, priceMinor: 48500 },
    { nameEn: 'Carvedilol 6.25mg Tablets', genericName: 'Carvedilol', brandName: 'Dilatrend', strength: '6.25mg', form: 'Tablet', packSize: 'Pack of 30 tablets', therapeuticClass: 'Heart & BP', requiresRx: false, priceMinor: 28500 },
    { nameEn: 'Carvedilol 25mg Tablets', genericName: 'Carvedilol', brandName: 'Dilatrend', strength: '25mg', form: 'Tablet', packSize: 'Pack of 30 tablets', therapeuticClass: 'Heart & BP', requiresRx: false, priceMinor: 42500 },
    { nameEn: 'Furosemide 40mg Tablets', genericName: 'Furosemide', brandName: 'Lasix', strength: '40mg', form: 'Tablet', packSize: 'Pack of 50 tablets', therapeuticClass: 'Heart & BP', requiresRx: false, priceMinor: 9500 },
    { nameEn: 'Spironolactone 25mg Tablets', genericName: 'Spironolactone', brandName: 'Aldactone', strength: '25mg', form: 'Tablet', packSize: 'Pack of 50 tablets', therapeuticClass: 'Heart & BP', requiresRx: false, priceMinor: 35500 },
    { nameEn: 'Spironolactone 100mg Tablets', genericName: 'Spironolactone', brandName: 'Aldactone', strength: '100mg', form: 'Tablet', packSize: 'Pack of 50 tablets', therapeuticClass: 'Heart & BP', requiresRx: false, priceMinor: 75500 },
    { nameEn: 'Hydrochlorothiazide 25mg Tablets', genericName: 'Hydrochlorothiazide', brandName: 'Esidrix', strength: '25mg', form: 'Tablet', packSize: 'Pack of 30 tablets', therapeuticClass: 'Heart & BP', requiresRx: false, priceMinor: 8500 },
    { nameEn: 'Indapamide SR 1.5mg Tablets', genericName: 'Indapamide', brandName: 'Natrilix SR', strength: '1.5mg', form: 'Tablet', packSize: 'Pack of 30 tablets', therapeuticClass: 'Heart & BP', requiresRx: false, priceMinor: 38500 },
    { nameEn: 'Ramipril 2.5mg Tablets', genericName: 'Ramipril', brandName: 'Tritace', strength: '2.5mg', form: 'Tablet', packSize: 'Pack of 28 tablets', therapeuticClass: 'Heart & BP', requiresRx: false, priceMinor: 22500 },
    { nameEn: 'Ramipril 5mg Tablets', genericName: 'Ramipril', brandName: 'Tritace', strength: '5mg', form: 'Tablet', packSize: 'Pack of 28 tablets', therapeuticClass: 'Heart & BP', requiresRx: false, priceMinor: 32500 },
    { nameEn: 'Lisinopril 10mg Tablets', genericName: 'Lisinopril', brandName: 'Zestril', strength: '10mg', form: 'Tablet', packSize: 'Pack of 28 tablets', therapeuticClass: 'Heart & BP', requiresRx: false, priceMinor: 26500 },
    { nameEn: 'Enalapril 10mg Tablets', genericName: 'Enalapril', brandName: 'Renitec', strength: '10mg', form: 'Tablet', packSize: 'Pack of 20 tablets', therapeuticClass: 'Heart & BP', requiresRx: false, priceMinor: 18500 },
    { nameEn: 'Omeprazole 20mg Capsules', genericName: 'Omeprazole', brandName: 'Risek', strength: '20mg', form: 'Capsule', packSize: 'Pack of 14 capsules', therapeuticClass: 'Stomach & Digestion', requiresRx: false, priceMinor: 18500 },
    { nameEn: 'Omeprazole 40mg Capsules', genericName: 'Omeprazole', brandName: 'Risek', strength: '40mg', form: 'Capsule', packSize: 'Pack of 14 capsules', therapeuticClass: 'Stomach & Digestion', requiresRx: false, priceMinor: 30500 },
    { nameEn: 'Esomeprazole 20mg Tablets', genericName: 'Esomeprazole', brandName: 'Nexum', strength: '20mg', form: 'Tablet', packSize: 'Pack of 14 tablets', therapeuticClass: 'Stomach & Digestion', requiresRx: false, priceMinor: 32500 },
    { nameEn: 'Esomeprazole 40mg Tablets', genericName: 'Esomeprazole', brandName: 'Nexum', strength: '40mg', form: 'Tablet', packSize: 'Pack of 14 tablets', therapeuticClass: 'Stomach & Digestion', requiresRx: false, priceMinor: 45500 },
    { nameEn: 'Pantoprazole 40mg Tablets', genericName: 'Pantoprazole', brandName: 'Protium', strength: '40mg', form: 'Tablet', packSize: 'Pack of 14 tablets', therapeuticClass: 'Stomach & Digestion', requiresRx: false, priceMinor: 38500 },
    { nameEn: 'Lansoprazole 30mg Capsules', genericName: 'Lansoprazole', brandName: 'Lanzol', strength: '30mg', form: 'Capsule', packSize: 'Pack of 14 capsules', therapeuticClass: 'Stomach & Digestion', requiresRx: false, priceMinor: 35500 },
    { nameEn: 'Rabeprazole 20mg Tablets', genericName: 'Rabeprazole', brandName: 'Pariet', strength: '20mg', form: 'Tablet', packSize: 'Pack of 14 tablets', therapeuticClass: 'Stomach & Digestion', requiresRx: false, priceMinor: 32500 },
    { nameEn: 'Famotidine 20mg Tablets', genericName: 'Famotidine', brandName: 'Pepcid', strength: '20mg', form: 'Tablet', packSize: 'Pack of 30 tablets', therapeuticClass: 'Stomach & Digestion', requiresRx: false, priceMinor: 12500 },
    { nameEn: 'Famotidine 40mg Tablets', genericName: 'Famotidine', brandName: 'Pepcid', strength: '40mg', form: 'Tablet', packSize: 'Pack of 30 tablets', therapeuticClass: 'Stomach & Digestion', requiresRx: false, priceMinor: 20500 },
    { nameEn: 'Gaviscon Peppermint Liquid 200ml', genericName: 'Sodium Alginate + Potassium Bicarbonate', brandName: 'Gaviscon', strength: '500mg/267mg per 10ml', form: 'Syrup', packSize: '200ml bottle', therapeuticClass: 'Stomach & Digestion', requiresRx: false, priceMinor: 45500 },
    { nameEn: 'Domperidone 10mg Tablets', genericName: 'Domperidone', brandName: 'Motilium', strength: '10mg', form: 'Tablet', packSize: 'Pack of 50 tablets', therapeuticClass: 'Stomach & Digestion', requiresRx: false, priceMinor: 18500 },
    { nameEn: 'Domperidone 1mg/ml Syrup', genericName: 'Domperidone', brandName: 'Motilium', strength: '1mg/ml', form: 'Syrup', packSize: '60ml bottle', therapeuticClass: 'Stomach & Digestion', requiresRx: false, priceMinor: 12500 },
    { nameEn: 'Metoclopramide 10mg Tablets', genericName: 'Metoclopramide', brandName: 'Maxolon', strength: '10mg', form: 'Tablet', packSize: 'Pack of 50 tablets', therapeuticClass: 'Stomach & Digestion', requiresRx: false, priceMinor: 11500 },
    { nameEn: 'Ondansetron 4mg Tablets', genericName: 'Ondansetron', brandName: 'Zofran', strength: '4mg', form: 'Tablet', packSize: 'Pack of 10 tablets', therapeuticClass: 'Stomach & Digestion', requiresRx: true, priceMinor: 35500 },
    { nameEn: 'Ondansetron 8mg Tablets', genericName: 'Ondansetron', brandName: 'Zofran', strength: '8mg', form: 'Tablet', packSize: 'Pack of 10 tablets', therapeuticClass: 'Stomach & Digestion', requiresRx: true, priceMinor: 55500 },
    { nameEn: 'Mebeverine 135mg Tablets', genericName: 'Mebeverine', brandName: 'Colofac', strength: '135mg', form: 'Tablet', packSize: 'Pack of 50 tablets', therapeuticClass: 'Stomach & Digestion', requiresRx: false, priceMinor: 65500 },
    { nameEn: 'Itopride 50mg Tablets', genericName: 'Itopride', brandName: 'Ganaton', strength: '50mg', form: 'Tablet', packSize: 'Pack of 30 tablets', therapeuticClass: 'Stomach & Digestion', requiresRx: false, priceMinor: 55500 },
    { nameEn: 'Lactulose 3.35g/5ml Syrup', genericName: 'Lactulose', brandName: 'Duphalac', strength: '3.35g/5ml', form: 'Syrup', packSize: '120ml bottle', therapeuticClass: 'Stomach & Digestion', requiresRx: false, priceMinor: 32500 },
    { nameEn: 'Cetirizine 10mg Tablets', genericName: 'Cetirizine', brandName: 'Zyrtec', strength: '10mg', form: 'Tablet', packSize: 'Pack of 10 tablets', therapeuticClass: 'Allergy & Asthma', requiresRx: false, priceMinor: 7500 },
    { nameEn: 'Cetirizine 1mg/ml Syrup', genericName: 'Cetirizine', brandName: 'Zyrtec', strength: '1mg/ml', form: 'Syrup', packSize: '60ml bottle', therapeuticClass: 'Allergy & Asthma', requiresRx: false, priceMinor: 13500 },
    { nameEn: 'Levocetirizine 5mg Tablets', genericName: 'Levocetirizine', brandName: 'Xyzal', strength: '5mg', form: 'Tablet', packSize: 'Pack of 10 tablets', therapeuticClass: 'Allergy & Asthma', requiresRx: false, priceMinor: 11500 },
    { nameEn: 'Loratadine 10mg Tablets', genericName: 'Loratadine', brandName: 'Clarityn', strength: '10mg', form: 'Tablet', packSize: 'Pack of 10 tablets', therapeuticClass: 'Allergy & Asthma', requiresRx: false, priceMinor: 12500 },
    { nameEn: 'Desloratadine 5mg Tablets', genericName: 'Desloratadine', brandName: null, strength: '5mg', form: 'Tablet', packSize: 'Pack of 10 tablets', therapeuticClass: 'Allergy & Asthma', requiresRx: false, priceMinor: 16500 },
    { nameEn: 'Fexofenadine 120mg Tablets', genericName: 'Fexofenadine', brandName: 'Telfast', strength: '120mg', form: 'Tablet', packSize: 'Pack of 10 tablets', therapeuticClass: 'Allergy & Asthma', requiresRx: false, priceMinor: 28500 },
    { nameEn: 'Fexofenadine 180mg Tablets', genericName: 'Fexofenadine', brandName: 'Telfast', strength: '180mg', form: 'Tablet', packSize: 'Pack of 10 tablets', therapeuticClass: 'Allergy & Asthma', requiresRx: false, priceMinor: 35500 },
    { nameEn: 'Hydroxyzine 25mg Tablets', genericName: 'Hydroxyzine', brandName: 'Atarax', strength: '25mg', form: 'Tablet', packSize: 'Pack of 30 tablets', therapeuticClass: 'Allergy & Asthma', requiresRx: false, priceMinor: 15500 },
    { nameEn: 'Ketotifen 1mg Tablets', genericName: 'Ketotifen', brandName: 'Zaditen', strength: '1mg', form: 'Tablet', packSize: 'Pack of 30 tablets', therapeuticClass: 'Allergy & Asthma', requiresRx: false, priceMinor: 25500 },
    { nameEn: 'Montelukast 4mg Chewable Tablets', genericName: 'Montelukast', brandName: 'Singulair', strength: '4mg', form: 'Tablet', packSize: 'Pack of 28 tablets', therapeuticClass: 'Allergy & Asthma', requiresRx: false, priceMinor: 75500 },
    { nameEn: 'Montelukast 5mg Chewable Tablets', genericName: 'Montelukast', brandName: 'Singulair', strength: '5mg', form: 'Tablet', packSize: 'Pack of 28 tablets', therapeuticClass: 'Allergy & Asthma', requiresRx: false, priceMinor: 85500 },
    { nameEn: 'Montelukast 10mg Tablets', genericName: 'Montelukast', brandName: 'Singulair', strength: '10mg', form: 'Tablet', packSize: 'Pack of 28 tablets', therapeuticClass: 'Allergy & Asthma', requiresRx: false, priceMinor: 95500 },
    { nameEn: 'Salbutamol 100mcg Inhaler', genericName: 'Salbutamol', brandName: 'Ventolin', strength: '100mcg', form: 'Inhaler', packSize: '200-dose inhaler', therapeuticClass: 'Allergy & Asthma', requiresRx: false, priceMinor: 65500 },
    { nameEn: 'Salbutamol 2mg Tablets', genericName: 'Salbutamol', brandName: 'Ventolin', strength: '2mg', form: 'Tablet', packSize: 'Pack of 30 tablets', therapeuticClass: 'Allergy & Asthma', requiresRx: false, priceMinor: 9500 },
    { nameEn: 'Salbutamol 2.5mg Nebules', genericName: 'Salbutamol', brandName: 'Ventolin Nebules', strength: '2.5mg', form: 'Inhaler', packSize: 'Pack of 20 nebules', therapeuticClass: 'Allergy & Asthma', requiresRx: false, priceMinor: 55500 },
    { nameEn: 'Fluticasone 50mcg Nasal Spray', genericName: 'Fluticasone Propionate', brandName: 'Flixonase', strength: '50mcg', form: 'Drops', packSize: '120-spray bottle', therapeuticClass: 'Allergy & Asthma', requiresRx: false, priceMinor: 86000 },
    { nameEn: 'Beclomethasone 100mcg Inhaler', genericName: 'Beclomethasone', brandName: 'Beclate', strength: '100mcg', form: 'Inhaler', packSize: '200-dose inhaler', therapeuticClass: 'Allergy & Asthma', requiresRx: true, priceMinor: 76000 },
    { nameEn: 'Budesonide 200mcg Inhaler', genericName: 'Budesonide', brandName: 'Pulmicort', strength: '200mcg', form: 'Inhaler', packSize: '100-dose inhaler', therapeuticClass: 'Allergy & Asthma', requiresRx: true, priceMinor: 96000 },
    { nameEn: 'Paracetamol + Pseudoephedrine Tablets', genericName: 'Paracetamol + Pseudoephedrine', brandName: 'Panadol Cold & Flu', strength: '500mg/30mg', form: 'Tablet', packSize: 'Pack of 24 tablets', therapeuticClass: 'Cold, Cough & Flu', requiresRx: false, priceMinor: 22500 },
    { nameEn: 'Chlorpheniramine 4mg Tablets', genericName: 'Chlorpheniramine', brandName: 'Piriton', strength: '4mg', form: 'Tablet', packSize: 'Pack of 30 tablets', therapeuticClass: 'Cold, Cough & Flu', requiresRx: false, priceMinor: 8500 },
    { nameEn: 'Diphenhydramine 25mg Capsules', genericName: 'Diphenhydramine', brandName: 'Benadryl', strength: '25mg', form: 'Capsule', packSize: 'Pack of 30 capsules', therapeuticClass: 'Cold, Cough & Flu', requiresRx: false, priceMinor: 15500 },
    { nameEn: 'Hydryllin DM Syrup', genericName: 'Dextromethorphan + Diphenhydramine', brandName: 'Hydryllin', strength: 'per 5ml', form: 'Syrup', packSize: '120ml bottle', therapeuticClass: 'Cold, Cough & Flu', requiresRx: false, priceMinor: 18500 },
    { nameEn: 'Guaifenesin 100mg/5ml Syrup', genericName: 'Guaifenesin', brandName: 'Robitussin', strength: '100mg/5ml', form: 'Syrup', packSize: '120ml bottle', therapeuticClass: 'Cold, Cough & Flu', requiresRx: false, priceMinor: 20500 },
    { nameEn: 'Ambroxol 30mg Tablets', genericName: 'Ambroxol', brandName: 'Mucosolvan', strength: '30mg', form: 'Tablet', packSize: 'Pack of 20 tablets', therapeuticClass: 'Cold, Cough & Flu', requiresRx: false, priceMinor: 22500 },
    { nameEn: 'Ambroxol 15mg/5ml Syrup', genericName: 'Ambroxol', brandName: 'Mucosolvan', strength: '15mg/5ml', form: 'Syrup', packSize: '60ml bottle', therapeuticClass: 'Cold, Cough & Flu', requiresRx: false, priceMinor: 16500 },
    { nameEn: 'Bromhexine 8mg Tablets', genericName: 'Bromhexine', brandName: 'Bisolvon', strength: '8mg', form: 'Tablet', packSize: 'Pack of 20 tablets', therapeuticClass: 'Cold, Cough & Flu', requiresRx: false, priceMinor: 18500 },
    { nameEn: 'Acetylcysteine 200mg Sachets', genericName: 'Acetylcysteine', brandName: 'Mucolator', strength: '200mg', form: 'Sachet', packSize: 'Pack of 30 sachets', therapeuticClass: 'Cold, Cough & Flu', requiresRx: false, priceMinor: 65500 },
    { nameEn: 'Acetylcysteine 600mg Effervescent Tablets', genericName: 'Acetylcysteine', brandName: 'Mucolator', strength: '600mg', form: 'Tablet', packSize: 'Pack of 10 tablets', therapeuticClass: 'Cold, Cough & Flu', requiresRx: false, priceMinor: 55500 },
    { nameEn: 'Xylometazoline 0.1% Nasal Drops', genericName: 'Xylometazoline', brandName: 'Otrivin', strength: '0.1%', form: 'Drops', packSize: '10ml bottle', therapeuticClass: 'Cold, Cough & Flu', requiresRx: false, priceMinor: 28500 },
    { nameEn: 'Oxymetazoline 0.05% Nasal Drops', genericName: 'Oxymetazoline', brandName: null, strength: '0.05%', form: 'Drops', packSize: '15ml bottle', therapeuticClass: 'Cold, Cough & Flu', requiresRx: false, priceMinor: 22500 },
    { nameEn: 'Strepsils Honey & Lemon Lozenges', genericName: 'Amylmetacresol + Dichlorobenzyl Alcohol', brandName: 'Strepsils', strength: '', form: 'Tablet', packSize: 'Pack of 24 lozenges', therapeuticClass: 'Cold, Cough & Flu', requiresRx: false, priceMinor: 30500 },
    { nameEn: 'Ammonium Chloride Expectorant Syrup', genericName: 'Ammonium Chloride + Diphenhydramine', brandName: null, strength: 'per 5ml', form: 'Syrup', packSize: '120ml bottle', therapeuticClass: 'Cold, Cough & Flu', requiresRx: false, priceMinor: 14500 },
    { nameEn: 'Sodium Chloride 0.9% Nasal Spray', genericName: 'Sodium Chloride', brandName: null, strength: '0.9%', form: 'Drops', packSize: '20ml spray bottle', therapeuticClass: 'Cold, Cough & Flu', requiresRx: false, priceMinor: 18500 },
    { nameEn: 'Multivitamin Tablets', genericName: 'Multivitamins & Minerals', brandName: 'Theragran-M', strength: '', form: 'Tablet', packSize: 'Pack of 30 tablets', therapeuticClass: 'Vitamins & Supplements', requiresRx: false, priceMinor: 85500 },
    { nameEn: 'Multivitamin + Zinc Tablets', genericName: 'Multivitamins + Zinc', brandName: 'Surbex-Z', strength: '', form: 'Tablet', packSize: 'Pack of 30 tablets', therapeuticClass: 'Vitamins & Supplements', requiresRx: false, priceMinor: 95500 },
    { nameEn: 'Vitamin C 500mg Chewable Tablets', genericName: 'Ascorbic Acid', brandName: 'Cecon', strength: '500mg', form: 'Tablet', packSize: 'Pack of 20 tablets', therapeuticClass: 'Vitamins & Supplements', requiresRx: false, priceMinor: 25500 },
    { nameEn: 'Calcium + Vitamin C Effervescent Tablets', genericName: 'Calcium + Vitamin C + D3 + B6', brandName: 'CaC-1000 Plus', strength: '', form: 'Tablet', packSize: 'Tube of 10 tablets', therapeuticClass: 'Vitamins & Supplements', requiresRx: false, priceMinor: 45500 },
    { nameEn: 'Vitamin D3 1000 IU Tablets', genericName: 'Cholecalciferol', brandName: null, strength: '1000 IU', form: 'Tablet', packSize: 'Pack of 30 tablets', therapeuticClass: 'Vitamins & Supplements', requiresRx: false, priceMinor: 45500 },
    { nameEn: 'Vitamin D3 5000 IU Capsules', genericName: 'Cholecalciferol', brandName: null, strength: '5000 IU', form: 'Capsule', packSize: 'Pack of 30 capsules', therapeuticClass: 'Vitamins & Supplements', requiresRx: false, priceMinor: 75500 },
    { nameEn: 'Cholecalciferol 200000 IU Injection', genericName: 'Cholecalciferol', brandName: null, strength: '200000 IU', form: 'Injection', packSize: '1 ampoule', therapeuticClass: 'Vitamins & Supplements', requiresRx: false, priceMinor: 35500 },
    { nameEn: 'Vitamin B1 + B6 + B12 Tablets', genericName: 'Vitamin B1 + B6 + B12', brandName: 'Neurolin', strength: '', form: 'Tablet', packSize: 'Pack of 30 tablets', therapeuticClass: 'Vitamins & Supplements', requiresRx: false, priceMinor: 55500 },
    { nameEn: 'Vitamin B12 1000mcg Tablets', genericName: 'Cyanocobalamin', brandName: null, strength: '1000mcg', form: 'Tablet', packSize: 'Pack of 30 tablets', therapeuticClass: 'Vitamins & Supplements', requiresRx: false, priceMinor: 55500 },
    { nameEn: 'Folic Acid 5mg Tablets', genericName: 'Folic Acid', brandName: null, strength: '5mg', form: 'Tablet', packSize: 'Pack of 30 tablets', therapeuticClass: 'Vitamins & Supplements', requiresRx: false, priceMinor: 9500 },
    { nameEn: 'Iron + Folic Acid Capsules', genericName: 'Ferrous Fumarate + Folic Acid', brandName: 'Fefol', strength: '', form: 'Capsule', packSize: 'Pack of 30 capsules', therapeuticClass: 'Vitamins & Supplements', requiresRx: false, priceMinor: 28500 },
    { nameEn: 'Ferrous Gluconate Syrup', genericName: 'Ferrous Gluconate', brandName: null, strength: 'per 5ml', form: 'Syrup', packSize: '120ml bottle', therapeuticClass: 'Vitamins & Supplements', requiresRx: false, priceMinor: 22500 },
    { nameEn: 'Calcium + Vitamin D3 Tablets', genericName: 'Calcium + Vitamin D3', brandName: 'Osnate-D', strength: '', form: 'Tablet', packSize: 'Pack of 20 tablets', therapeuticClass: 'Vitamins & Supplements', requiresRx: false, priceMinor: 38500 },
    { nameEn: 'Omega-3 Fish Oil 1000mg Capsules', genericName: 'Omega-3 Fish Oil', brandName: null, strength: '1000mg', form: 'Capsule', packSize: 'Pack of 30 capsules', therapeuticClass: 'Vitamins & Supplements', requiresRx: false, priceMinor: 85500 },
    { nameEn: 'Magnesium 250mg Tablets', genericName: 'Magnesium Oxide', brandName: null, strength: '250mg', form: 'Tablet', packSize: 'Pack of 30 tablets', therapeuticClass: 'Vitamins & Supplements', requiresRx: false, priceMinor: 65500 },
    { nameEn: 'Zinc 20mg Tablets', genericName: 'Zinc Sulfate', brandName: null, strength: '20mg', form: 'Tablet', packSize: 'Pack of 30 tablets', therapeuticClass: 'Vitamins & Supplements', requiresRx: false, priceMinor: 35500 },
    { nameEn: 'Biotin 2500mcg Tablets', genericName: 'Biotin', brandName: null, strength: '2500mcg', form: 'Tablet', packSize: 'Pack of 30 tablets', therapeuticClass: 'Vitamins & Supplements', requiresRx: false, priceMinor: 95500 },
    { nameEn: 'Hydrocortisone 1% Cream', genericName: 'Hydrocortisone', brandName: null, strength: '1%', form: 'Cream', packSize: '15g tube', therapeuticClass: 'Skin Care', requiresRx: false, priceMinor: 18500 },
    { nameEn: 'Betamethasone 0.1% Cream', genericName: 'Betamethasone Valerate', brandName: 'Betnovate', strength: '0.1%', form: 'Cream', packSize: '15g tube', therapeuticClass: 'Skin Care', requiresRx: true, priceMinor: 22500 },
    { nameEn: 'Clobetasol 0.05% Cream', genericName: 'Clobetasol Propionate', brandName: 'Dermovate', strength: '0.05%', form: 'Cream', packSize: '15g tube', therapeuticClass: 'Skin Care', requiresRx: true, priceMinor: 32500 },
    { nameEn: 'Mupirocin 2% Cream', genericName: 'Mupirocin', brandName: 'Bactroban', strength: '2%', form: 'Cream', packSize: '15g tube', therapeuticClass: 'Skin Care', requiresRx: false, priceMinor: 45500 },
    { nameEn: 'Fusidic Acid 2% Cream', genericName: 'Fusidic Acid', brandName: 'Fucidin', strength: '2%', form: 'Cream', packSize: '15g tube', therapeuticClass: 'Skin Care', requiresRx: true, priceMinor: 48500 },
    { nameEn: 'Clotrimazole 1% Cream', genericName: 'Clotrimazole', brandName: 'Canesten', strength: '1%', form: 'Cream', packSize: '20g tube', therapeuticClass: 'Skin Care', requiresRx: false, priceMinor: 28500 },
    { nameEn: 'Miconazole 2% Cream', genericName: 'Miconazole', brandName: 'Daktarin', strength: '2%', form: 'Cream', packSize: '20g tube', therapeuticClass: 'Skin Care', requiresRx: false, priceMinor: 30500 },
    { nameEn: 'Terbinafine 1% Cream', genericName: 'Terbinafine', brandName: 'Lamisil', strength: '1%', form: 'Cream', packSize: '15g tube', therapeuticClass: 'Skin Care', requiresRx: false, priceMinor: 42500 },
    { nameEn: 'Ketoconazole 2% Cream', genericName: 'Ketoconazole', brandName: null, strength: '2%', form: 'Cream', packSize: '15g tube', therapeuticClass: 'Skin Care', requiresRx: false, priceMinor: 32500 },
    { nameEn: 'Permethrin 5% Cream', genericName: 'Permethrin', brandName: null, strength: '5%', form: 'Cream', packSize: '30g tube', therapeuticClass: 'Skin Care', requiresRx: false, priceMinor: 35500 },
    { nameEn: 'Benzoyl Peroxide 5% Gel', genericName: 'Benzoyl Peroxide', brandName: null, strength: '5%', form: 'Cream', packSize: '20g tube', therapeuticClass: 'Skin Care', requiresRx: false, priceMinor: 38500 },
    { nameEn: 'Adapalene 0.1% Gel', genericName: 'Adapalene', brandName: 'Differin', strength: '0.1%', form: 'Cream', packSize: '15g tube', therapeuticClass: 'Skin Care', requiresRx: false, priceMinor: 65500 },
    { nameEn: 'Tretinoin 0.05% Cream', genericName: 'Tretinoin', brandName: null, strength: '0.05%', form: 'Cream', packSize: '20g tube', therapeuticClass: 'Skin Care', requiresRx: true, priceMinor: 55500 },
    { nameEn: 'Salicylic Acid 6% Cream', genericName: 'Salicylic Acid', brandName: null, strength: '6%', form: 'Cream', packSize: '20g tube', therapeuticClass: 'Skin Care', requiresRx: false, priceMinor: 25500 },
    { nameEn: 'Calamine Lotion 100ml', genericName: 'Calamine + Zinc Oxide', brandName: 'Calamine Lotion', strength: '', form: 'Cream', packSize: '100ml bottle', therapeuticClass: 'Skin Care', requiresRx: false, priceMinor: 15500 },
    { nameEn: 'Sunscreen SPF 50+ Cream', genericName: 'Octocrylene + Avobenzone', brandName: null, strength: 'SPF 50+', form: 'Cream', packSize: '50g tube', therapeuticClass: 'Skin Care', requiresRx: false, priceMinor: 85500 },
    { nameEn: 'Cetaphil Moisturizing Cream 100g', genericName: 'Moisturizing Cream', brandName: 'Cetaphil', strength: '', form: 'Cream', packSize: '100g jar', therapeuticClass: 'Skin Care', requiresRx: false, priceMinor: 95500 },
    { nameEn: 'Chloramphenicol 0.5% Eye Drops', genericName: 'Chloramphenicol', brandName: null, strength: '0.5%', form: 'Drops', packSize: '10ml bottle', therapeuticClass: 'Eye & Ear', requiresRx: true, priceMinor: 12500 },
    { nameEn: 'Tobramycin 0.3% Eye Drops', genericName: 'Tobramycin', brandName: 'Tobrex', strength: '0.3%', form: 'Drops', packSize: '5ml bottle', therapeuticClass: 'Eye & Ear', requiresRx: true, priceMinor: 38500 },
    { nameEn: 'Tobramycin + Dexamethasone Eye Drops', genericName: 'Tobramycin + Dexamethasone', brandName: 'Tobradex', strength: '', form: 'Drops', packSize: '5ml bottle', therapeuticClass: 'Eye & Ear', requiresRx: true, priceMinor: 45500 },
    { nameEn: 'Moxifloxacin 0.5% Eye Drops', genericName: 'Moxifloxacin', brandName: 'Vigamox', strength: '0.5%', form: 'Drops', packSize: '5ml bottle', therapeuticClass: 'Eye & Ear', requiresRx: true, priceMinor: 55500 },
    { nameEn: 'Ciprofloxacin 0.3% Eye Drops', genericName: 'Ciprofloxacin', brandName: null, strength: '0.3%', form: 'Drops', packSize: '5ml bottle', therapeuticClass: 'Eye & Ear', requiresRx: true, priceMinor: 18500 },
    { nameEn: 'Gentamicin 0.3% Eye Drops', genericName: 'Gentamicin', brandName: null, strength: '0.3%', form: 'Drops', packSize: '10ml bottle', therapeuticClass: 'Eye & Ear', requiresRx: true, priceMinor: 14500 },
    { nameEn: 'Dexamethasone 0.1% Eye Drops', genericName: 'Dexamethasone', brandName: null, strength: '0.1%', form: 'Drops', packSize: '5ml bottle', therapeuticClass: 'Eye & Ear', requiresRx: true, priceMinor: 15500 },
    { nameEn: 'Olopatadine 0.1% Eye Drops', genericName: 'Olopatadine', brandName: 'Patanol', strength: '0.1%', form: 'Drops', packSize: '5ml bottle', therapeuticClass: 'Eye & Ear', requiresRx: false, priceMinor: 65500 },
    { nameEn: 'Ketotifen 0.025% Eye Drops', genericName: 'Ketotifen', brandName: 'Zaditor', strength: '0.025%', form: 'Drops', packSize: '5ml bottle', therapeuticClass: 'Eye & Ear', requiresRx: false, priceMinor: 55500 },
    { nameEn: 'Artificial Tears Eye Drops', genericName: 'Carboxymethylcellulose', brandName: 'Tears Naturale', strength: '', form: 'Drops', packSize: '15ml bottle', therapeuticClass: 'Eye & Ear', requiresRx: false, priceMinor: 35500 },
    { nameEn: 'Hypromellose 0.3% Eye Drops', genericName: 'Hypromellose', brandName: null, strength: '0.3%', form: 'Drops', packSize: '10ml bottle', therapeuticClass: 'Eye & Ear', requiresRx: false, priceMinor: 22500 },
    { nameEn: 'Ofloxacin 0.3% Ear Drops', genericName: 'Ofloxacin', brandName: null, strength: '0.3%', form: 'Drops', packSize: '5ml bottle', therapeuticClass: 'Eye & Ear', requiresRx: true, priceMinor: 20500 },
    { nameEn: 'Ciprofloxacin + Dexamethasone Ear Drops', genericName: 'Ciprofloxacin + Dexamethasone', brandName: 'Ciprodex', strength: '', form: 'Drops', packSize: '7.5ml bottle', therapeuticClass: 'Eye & Ear', requiresRx: true, priceMinor: 48500 },
    { nameEn: 'Sertraline 50mg Tablets', genericName: 'Sertraline', brandName: 'Zoloft', strength: '50mg', form: 'Tablet', packSize: 'Pack of 20 tablets', therapeuticClass: 'Mental Health', requiresRx: true, priceMinor: 45500 },
    { nameEn: 'Sertraline 100mg Tablets', genericName: 'Sertraline', brandName: 'Zoloft', strength: '100mg', form: 'Tablet', packSize: 'Pack of 20 tablets', therapeuticClass: 'Mental Health', requiresRx: true, priceMinor: 65500 },
    { nameEn: 'Escitalopram 10mg Tablets', genericName: 'Escitalopram', brandName: 'Cipralex', strength: '10mg', form: 'Tablet', packSize: 'Pack of 14 tablets', therapeuticClass: 'Mental Health', requiresRx: true, priceMinor: 42500 },
    { nameEn: 'Escitalopram 20mg Tablets', genericName: 'Escitalopram', brandName: 'Cipralex', strength: '20mg', form: 'Tablet', packSize: 'Pack of 14 tablets', therapeuticClass: 'Mental Health', requiresRx: true, priceMinor: 58500 },
    { nameEn: 'Fluoxetine 20mg Capsules', genericName: 'Fluoxetine', brandName: 'Prozac', strength: '20mg', form: 'Capsule', packSize: 'Pack of 30 capsules', therapeuticClass: 'Mental Health', requiresRx: true, priceMinor: 38500 },
    { nameEn: 'Paroxetine 20mg Tablets', genericName: 'Paroxetine', brandName: 'Seroxat', strength: '20mg', form: 'Tablet', packSize: 'Pack of 30 tablets', therapeuticClass: 'Mental Health', requiresRx: true, priceMinor: 65500 },
    { nameEn: 'Venlafaxine XR 75mg Capsules', genericName: 'Venlafaxine XR', brandName: 'Effexor XR', strength: '75mg', form: 'Capsule', packSize: 'Pack of 14 capsules', therapeuticClass: 'Mental Health', requiresRx: true, priceMinor: 85500 },
    { nameEn: 'Duloxetine 30mg Capsules', genericName: 'Duloxetine', brandName: 'Cymbalta', strength: '30mg', form: 'Capsule', packSize: 'Pack of 28 capsules', therapeuticClass: 'Mental Health', requiresRx: true, priceMinor: 95500 },
    { nameEn: 'Amitriptyline 25mg Tablets', genericName: 'Amitriptyline', brandName: 'Tryptanol', strength: '25mg', form: 'Tablet', packSize: 'Pack of 30 tablets', therapeuticClass: 'Mental Health', requiresRx: true, priceMinor: 18500 },
    { nameEn: 'Alprazolam 0.5mg Tablets', genericName: 'Alprazolam', brandName: 'Xanax', strength: '0.5mg', form: 'Tablet', packSize: 'Pack of 30 tablets', therapeuticClass: 'Mental Health', requiresRx: true, priceMinor: 25500 },
    { nameEn: 'Clonazepam 0.5mg Tablets', genericName: 'Clonazepam', brandName: 'Rivotril', strength: '0.5mg', form: 'Tablet', packSize: 'Pack of 30 tablets', therapeuticClass: 'Mental Health', requiresRx: true, priceMinor: 22500 },
    { nameEn: 'Clonazepam 2mg Tablets', genericName: 'Clonazepam', brandName: 'Rivotril', strength: '2mg', form: 'Tablet', packSize: 'Pack of 30 tablets', therapeuticClass: 'Mental Health', requiresRx: true, priceMinor: 32500 },
    { nameEn: 'Zolpidem 10mg Tablets', genericName: 'Zolpidem', brandName: 'Stilnox', strength: '10mg', form: 'Tablet', packSize: 'Pack of 20 tablets', therapeuticClass: 'Mental Health', requiresRx: true, priceMinor: 45500 },
    { nameEn: 'Risperidone 1mg Tablets', genericName: 'Risperidone', brandName: 'Risperdal', strength: '1mg', form: 'Tablet', packSize: 'Pack of 20 tablets', therapeuticClass: 'Mental Health', requiresRx: true, priceMinor: 38500 },
    { nameEn: 'Risperidone 2mg Tablets', genericName: 'Risperidone', brandName: 'Risperdal', strength: '2mg', form: 'Tablet', packSize: 'Pack of 20 tablets', therapeuticClass: 'Mental Health', requiresRx: true, priceMinor: 55500 },
    { nameEn: 'Olanzapine 5mg Tablets', genericName: 'Olanzapine', brandName: 'Zyprexa', strength: '5mg', form: 'Tablet', packSize: 'Pack of 28 tablets', therapeuticClass: 'Mental Health', requiresRx: true, priceMinor: 75500 },
    { nameEn: 'Prenatal Multivitamin Tablets', genericName: 'Prenatal Vitamins + Folic Acid + Iron', brandName: null, strength: '', form: 'Tablet', packSize: 'Pack of 30 tablets', therapeuticClass: 'Women\'s Health', requiresRx: false, priceMinor: 95500 },
    { nameEn: 'Folic Acid 400mcg Tablets', genericName: 'Folic Acid', brandName: null, strength: '400mcg', form: 'Tablet', packSize: 'Pack of 30 tablets', therapeuticClass: 'Women\'s Health', requiresRx: false, priceMinor: 15500 },
    { nameEn: 'Ferrous Fumarate 200mg Tablets', genericName: 'Ferrous Fumarate', brandName: null, strength: '200mg', form: 'Tablet', packSize: 'Pack of 30 tablets', therapeuticClass: 'Women\'s Health', requiresRx: false, priceMinor: 20500 },
    { nameEn: 'Calcium Citrate 500mg Tablets', genericName: 'Calcium Citrate', brandName: null, strength: '500mg', form: 'Tablet', packSize: 'Pack of 30 tablets', therapeuticClass: 'Women\'s Health', requiresRx: false, priceMinor: 55500 },
    { nameEn: 'Clotrimazole 1% Vaginal Cream', genericName: 'Clotrimazole', brandName: 'Canesten', strength: '1%', form: 'Cream', packSize: '20g tube + applicator', therapeuticClass: 'Women\'s Health', requiresRx: false, priceMinor: 32500 },
    { nameEn: 'Clotrimazole 100mg Vaginal Tablets', genericName: 'Clotrimazole', brandName: 'Canesten', strength: '100mg', form: 'Tablet', packSize: 'Pack of 6 tablets', therapeuticClass: 'Women\'s Health', requiresRx: false, priceMinor: 28500 },
    { nameEn: 'Norethisterone 5mg Tablets', genericName: 'Norethisterone', brandName: 'Primolut N', strength: '5mg', form: 'Tablet', packSize: 'Pack of 30 tablets', therapeuticClass: 'Women\'s Health', requiresRx: true, priceMinor: 35500 },
    { nameEn: 'Medroxyprogesterone 10mg Tablets', genericName: 'Medroxyprogesterone', brandName: 'Provera', strength: '10mg', form: 'Tablet', packSize: 'Pack of 10 tablets', therapeuticClass: 'Women\'s Health', requiresRx: true, priceMinor: 30500 },
    { nameEn: 'Famila 28 Contraceptive Tablets', genericName: 'Ethinylestradiol + Levonorgestrel', brandName: 'Famila 28', strength: '0.03mg/0.15mg', form: 'Tablet', packSize: 'Pack of 28 tablets', therapeuticClass: 'Women\'s Health', requiresRx: true, priceMinor: 25500 },
    { nameEn: 'Yasmin Contraceptive Tablets', genericName: 'Drospirenone + Ethinylestradiol', brandName: 'Yasmin', strength: '3mg/0.03mg', form: 'Tablet', packSize: 'Pack of 21 tablets', therapeuticClass: 'Women\'s Health', requiresRx: true, priceMinor: 145500 },
    { nameEn: 'Tranexamic Acid 500mg Capsules', genericName: 'Tranexamic Acid', brandName: null, strength: '500mg', form: 'Capsule', packSize: 'Pack of 10 capsules', therapeuticClass: 'Women\'s Health', requiresRx: true, priceMinor: 45500 },
    { nameEn: 'Evening Primrose Oil 1000mg Capsules', genericName: 'Evening Primrose Oil', brandName: null, strength: '1000mg', form: 'Capsule', packSize: 'Pack of 30 capsules', therapeuticClass: 'Women\'s Health', requiresRx: false, priceMinor: 85500 },
    { nameEn: 'Calcium Carbonate + Vitamin D3 Chewable Tablets', genericName: 'Calcium Carbonate + Vitamin D3', brandName: null, strength: '500mg/400 IU', form: 'Tablet', packSize: 'Pack of 30 tablets', therapeuticClass: 'Bone & Joint', requiresRx: false, priceMinor: 45500 },
    { nameEn: 'Vitamin D3 50000 IU Capsules', genericName: 'Cholecalciferol', brandName: null, strength: '50000 IU', form: 'Capsule', packSize: 'Pack of 12 capsules', therapeuticClass: 'Bone & Joint', requiresRx: false, priceMinor: 85500 },
    { nameEn: 'Alendronate 70mg Tablets', genericName: 'Alendronate', brandName: 'Fosamax', strength: '70mg', form: 'Tablet', packSize: 'Pack of 4 tablets', therapeuticClass: 'Bone & Joint', requiresRx: true, priceMinor: 85500 },
    { nameEn: 'Risedronate 35mg Tablets', genericName: 'Risedronate', brandName: 'Actonel', strength: '35mg', form: 'Tablet', packSize: 'Pack of 4 tablets', therapeuticClass: 'Bone & Joint', requiresRx: true, priceMinor: 95500 },
    { nameEn: 'Ibandronate 150mg Tablets', genericName: 'Ibandronic Acid', brandName: 'Bonviva', strength: '150mg', form: 'Tablet', packSize: '1 tablet', therapeuticClass: 'Bone & Joint', requiresRx: true, priceMinor: 125500 },
    { nameEn: 'Glucosamine 500mg Tablets', genericName: 'Glucosamine Sulfate', brandName: null, strength: '500mg', form: 'Tablet', packSize: 'Pack of 30 tablets', therapeuticClass: 'Bone & Joint', requiresRx: false, priceMinor: 85500 },
    { nameEn: 'Glucosamine + Chondroitin Capsules', genericName: 'Glucosamine + Chondroitin', brandName: null, strength: '500mg/400mg', form: 'Capsule', packSize: 'Pack of 30 capsules', therapeuticClass: 'Bone & Joint', requiresRx: false, priceMinor: 125500 },
    { nameEn: 'Diacerein 50mg Capsules', genericName: 'Diacerein', brandName: null, strength: '50mg', form: 'Capsule', packSize: 'Pack of 30 capsules', therapeuticClass: 'Bone & Joint', requiresRx: false, priceMinor: 95500 },
    { nameEn: 'Methyl Salicylate Pain Relief Cream', genericName: 'Methyl Salicylate + Menthol', brandName: null, strength: '', form: 'Cream', packSize: '30g tube', therapeuticClass: 'Bone & Joint', requiresRx: false, priceMinor: 20500 },
    { nameEn: 'Capsaicin 0.075% Cream', genericName: 'Capsaicin', brandName: null, strength: '0.075%', form: 'Cream', packSize: '30g tube', therapeuticClass: 'Bone & Joint', requiresRx: false, priceMinor: 38500 },
    { nameEn: 'Calcitonin 200 IU Nasal Spray', genericName: 'Calcitonin', brandName: 'Miacalcic', strength: '200 IU', form: 'Drops', packSize: '14-dose spray', therapeuticClass: 'Bone & Joint', requiresRx: true, priceMinor: 245500 },
    { nameEn: 'Collagen Type II 40mg Capsules', genericName: 'Undenatured Collagen Type II', brandName: null, strength: '40mg', form: 'Capsule', packSize: 'Pack of 30 capsules', therapeuticClass: 'Bone & Joint', requiresRx: false, priceMinor: 145500 },
  ];
  for (const med of medicines) {
    const data = {
      nameEn: med.nameEn,
      genericName: med.genericName,
      brandName: med.brandName,
      strength: med.strength,
      form: med.form,
      therapeuticClass: med.therapeuticClass,
      requiresRx: med.requiresRx,
      packSize: med.packSize,
      priceMinor: med.priceMinor,
      unit: med.packSize,
      category: 'Medicines',
      imageUrl: MEDICINE_FORM_IMAGES[med.form] ?? MEDICINE_FORM_IMAGES.Tablet,
      inStock: true,
    };
    const existing = await prisma.product.findFirst({ where: { nameEn: med.nameEn } });
    if (existing) {
      await prisma.product.update({ where: { id: existing.id }, data });
    } else {
      await prisma.product.create({ data });
    }
  }
  console.log(`Pharmacy medicines ready: ${medicines.length} medicines`);

  console.log(`Admin ready: ${phone}`);
  console.log('Demo doctors & facilities ready');
  console.log(`Demo lab tests ready: ${demoLabTests.length} tests at ${labFacility.name}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
