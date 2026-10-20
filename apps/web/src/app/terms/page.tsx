import type { Metadata } from 'next';
import Breadcrumbs from '../../components/layout/Breadcrumbs';
import { pageMetadata } from '../../lib/seo';

export const metadata: Metadata = pageMetadata({
  title: 'Terms of Service',
  description: 'The rules for using OneStop Life: appointments, orders, payments, refunds and your responsibilities.',
  path: '/terms',
});

const sections: { h: string; p: string[] }[] = [
  {
    h: 'The service',
    p: [
      'OneStop Life is a platform that connects patients with healthcare services in Pakistan: verified doctors, hospitals, clinics, laboratories, blood banks and pharmacies, plus an everyday-care store.',
      'We operate the marketplace and the booking, ordering and payment flows. Medical advice, diagnoses and prescriptions come from the licensed doctors and pharmacists you interact with — not from the platform.',
    ],
  },
  {
    h: 'Your account',
    p: [
      'You sign in with your phone number (one-time code), email and password, or Google. You are responsible for keeping your device and account secure.',
      'Professional roles are reviewed before activation: doctors submit their PMDC registration and identity for verification, and businesses are reviewed before they can list products or services. Listing is not approval of medical competence — it means credentials were checked at onboarding.',
      'You must provide accurate information and keep your contact details up to date so we can reach you about appointments and orders.',
    ],
  },
  {
    h: 'Doctor appointments',
    p: [
      'Doctors publish real availability slots. Booking a slot creates a reservation that the doctor honours; you can view, reschedule or cancel from your dashboard.',
      'Consultation fees are set by the doctor and shown before you confirm. Cancelling before your slot starts entitles you to a full refund of any amount paid, or a free rebooking — see our Refund Policy.',
      'After a completed visit, your treating doctor may issue a digital prescription. You may order the prescribed medicines in one tap; every prescription order is still verified by a pharmacist before dispatch.',
      'In an emergency, call 15 or Rescue 1122 first. OneStop Life is not an emergency service.',
    ],
  },
  {
    h: 'Orders, medicines and payments',
    p: [
      'All prices are in Pakistani Rupees. Cash on delivery is available; card payments are processed by our payment provider.',
      'Discount codes are subject to the limits published with them — for example, a maximum number of redemptions or an expiry date. Codes may be withdrawn at any time.',
      'Prescription (Rx) medicines can only be dispensed against a valid prescription. At checkout we accept either a prescription file or a digital prescription issued through the platform by your treating doctor after a completed visit. No order for Rx medicines is dispatched until a pharmacist has verified it.',
      'Delivery times shown at checkout are estimates. Risk of damage in transit is covered by our Refund Policy.',
    ],
  },
  {
    h: 'Lab tests and blood requests',
    p: [
      'Lab tests can be booked with home sample collection. Cancelling before the sample is collected gives a full refund; once the sample is taken, the fee covers the test and report.',
      'The blood-request board is a community service. Phone numbers are never shown publicly; contact details are revealed only to signed-in members handling a request.',
    ],
  },
  {
    h: 'Reviews',
    p: [
      'Reviews can only be written after a completed visit, so the ratings you see come from real patients — not from browsing.',
    ],
  },
  {
    h: 'Acceptable use',
    p: [
      'You must not misuse the platform: no false bookings, no fraudulent payment claims, no harassment of doctors, staff or donors, and no attempts to bypass prescription or verification controls.',
      'Accounts found violating these rules — including reselling dispensed medicines — may be suspended without refund.',
    ],
  },
  {
    h: 'Our liability',
    p: [
      'We work to keep the platform accurate and available, but we do not guarantee uninterrupted service or that every listed slot, product or service is always available.',
      'Clinical decisions remain with the licensed professionals who provide your care. To the extent allowed by Pakistani law, our liability is limited to the value of the service or order in question.',
    ],
  },
  {
    h: 'Changes and governing law',
    p: [
      'We may update these terms as the platform grows; the current version is always published here. Continued use after changes means you accept them.',
      'These terms are governed by the laws of Pakistan.',
    ],
  },
];

export default function TermsPage() {
  return (
    <main style={{ maxWidth: 760, margin: '0 auto', padding: '40px 24px 72px' }}>
      <Breadcrumbs items={[{ name: 'Terms of Service', path: '/terms' }]} />
      <h1>Terms of Service</h1>
      <p style={{ opacity: 0.75, lineHeight: 1.7 }}>
        The rules of the road for using OneStop Life — written to be read, not skipped.
        Last updated 20 October 2026.
      </p>
      {sections.map((s) => (
        <section key={s.h} style={{ marginTop: 32 }}>
          <h2 style={{ fontSize: 20 }}>{s.h}</h2>
          <ul style={{ lineHeight: 1.8, opacity: 0.85 }}>
            {s.p.map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ul>
        </section>
      ))}
    </main>
  );
}
