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
    { nameEn: 'Sunscreen SPF 50', priceMinor: 125000, unit: 'tube', category: 'Personal care', imageUrl: 'https://images.unsplash.com/photo-1556229010-6c3f2c9ca5f8?auto=format&fit=crop&w=900&q=80' },
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
  ];
  const facilities = [];
  for (const f of demoFacilities) {
    const existing = await prisma.facility.findFirst({ where: { name: f.name } });
    facilities.push(existing ?? (await prisma.facility.create({ data: f })));
  }

  const demoDoctors = [
    { email: 'dr.ahmed@onestop.demo', name: 'Dr. Ahmed Khan', speciality: 'Cardiology', qualifications: 'MBBS, FCPS (Cardiology)', experienceYears: 12, feeMinor: 250000, languages: ['English', 'Urdu'], about: 'Consultant cardiologist focused on preventive heart care and hypertension.' },
    { email: 'dr.fatima@onestop.demo', name: 'Dr. Fatima Noor', speciality: 'Pediatrics', qualifications: 'MBBS, FCPS (Pediatrics)', experienceYears: 9, feeMinor: 180000, languages: ['English', 'Urdu'], about: 'Child specialist for newborns, vaccination and developmental care.' },
    { email: 'dr.bilal@onestop.demo', name: 'Dr. Bilal Hussain', speciality: 'General Physician', qualifications: 'MBBS', experienceYears: 7, feeMinor: 120000, languages: ['Urdu', 'English', 'Punjabi'], about: 'Family physician for everyday health, diabetes and general check-ups.' },
  ];
  for (const [idx, d] of demoDoctors.entries()) {
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
    const facility = facilities[idx % facilities.length];
    await prisma.doctorFacility.upsert({
      where: { doctorProfileId_facilityId: { doctorProfileId: profile.id, facilityId: facility.id } },
      update: {},
      create: { doctorProfileId: profile.id, facilityId: facility.id },
    });
  }

  console.log(`Admin ready: ${phone}`);
  console.log('Demo doctors & facilities ready');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
