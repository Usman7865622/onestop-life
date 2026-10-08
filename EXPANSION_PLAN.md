# OneStop Life — Professional Super-App Expansion Plan
Owner: Muhammad Usman (Usman7865622) | Repo: onestop-life | Date: 2026-10-08
Vision: One trusted app for health + daily life in Pakistan — "Everyday care, made easier."

## 1. Where you are today (Phase 1A — done & live)
- Auth: Phone-OTP + email, JWT with rotating refresh tokens
- Roles already in DB: CUSTOMER, DOCTOR, VET, BLOOD_BANK_STAFF, PHARMACY, SELLER, DELIVERY_AGENT, ADMIN
- Verification queue: DOCTOR / VET / PHARMACY / BLOOD_BANK / SELLER (PMDC licence etc.)
- Shop: 36 products, 10 categories, cart, checkout, COD, discounts, refunds
- AI shopping assistant (Gemini)
- Web: Home, /products, /cart — professional header/footer

Gap: Doctors can be *verified* but cannot be *booked*. No facilities, appointments, labs, prescriptions, or records yet.

## 2. The professional promise
- Verified only: every doctor shows PMDC number + Verified badge. No badge = not bookable.
- Urdu + English everywhere (Locale en/ur already in schema)
- Pakistan-first payments: COD, JazzCash, Easypaisa, card
- Family-first: one account books for parents, kids, and pets
- Trust design: real photos, fees upfront, ratings after a completed visit, no hidden charges

## 3. Healthcare — build this first (your differentiator)

### 3.1 Doctors & Facilities (Phase 1B)
Models: Facility, DoctorProfile, Speciality
- Facility: name, type (HOSPITAL / CLINIC / LAB / BLOOD_BANK / PHARMACY), address, city, location (PostGIS), phone, timings, emergency?
- DoctorProfile: userId, speciality, qualifications, experience years, feeMin/f feeMax, languages, about, facility links
- Pages: /doctors (search by speciality/city/fee), /doctors/[id], /facilities, /hospitals

### 3.2 Appointments (Phase 1B — the feature you asked for)
Models: AvailabilitySlot, Appointment
- Doctor sets weekly availability → slots generated
- Booking: IN_PERSON or VIDEO, reason, patient (self/family member), slot hold 10 min
- Flow: PENDING → CONFIRMED → COMPLETED / CANCELLED / NO_SHOW
- Reminders: SMS + in-app 24h and 1h before. Reschedule/cancel rules.
- Fee payment: pay at clinic (COD-style) or pre-pay

### 3.3 After the visit (Phase 1C)
- Prescription: doctor issues digital prescription → patient can order medicines from it in 1 tap
- Consultation notes, follow-up booking
- Ratings & reviews (only after COMPLETED appointment)

### 3.4 Labs, Blood, Pharmacy (Phase 1D)
- Labs: LabTest catalogue, home sample collection, report PDF in app
- Blood: BloodRequest (group, units, hospital, urgency), donor alerts by city — uses BLOOD_BANK_STAFF role you already have
- Pharmacy: prescription upload, pharmacist verification, delivery — extends current shop

### 3.5 Vet & Home Care (Phase 1E)
- Vet appointments (VET role exists), pet profiles
- Home nursing / physiotherapy visits

## 4. Daily Life — one app for every day (Phase 2)
Do not build all at once. Add by what your same user needs weekly:
- Family Profiles: family members, pets, health records vault (reports, vaccines, allergies)
- Reminders: medicine refills, vaccine due, appointment due
- Shop expansion: groceries & home essentials (you already have cart/checkout — reuse it)
- Emergency: SOS, nearest hospital/ambulance, blood request broadcast
- Subscriptions: monthly essentials box, chronic medicine auto-refill

## 5. Professional polish (applies to everything)
- Design system: one colour/type/spacing system, Verified badge, trust bar
- Dashboards: Patient dashboard, Doctor dashboard (today's appointments, earnings), Admin dashboard
- Notifications centre, order/appointment tracking timeline
- SEO pages per city/speciality: "Best cardiologist in Lahore" etc.

## 6. Data model additions (summary)
Facility, DoctorProfile, DoctorFacility, AvailabilitySlot, Appointment,
FamilyMember, PetProfile, Prescription, PrescriptionItem, LabTest, LabBooking,
BloodRequest, Review, Notification

## 7. Recommended build order
1. Phase 1B: Facilities + Doctor profiles + Appointment booking (API + web) ← START HERE
2. Phase 1C: Doctor dashboard + prescriptions + reviews
3. Phase 1D: Labs + Blood + Pharmacy prescription flow
4. Phase 2: Family profiles, records vault, daily-life shop expansion

## 8. What not to do yet
- Own video-calling infrastructure (use a provider link first)
- Own ambulance fleet (partner listing + call button first)
- Native mobile apps before the web flow is proven
