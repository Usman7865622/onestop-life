import type { Metadata } from 'next';
import Breadcrumbs from '../../components/layout/Breadcrumbs';
import { pageMetadata } from '../../lib/seo';

export const metadata: Metadata = pageMetadata({
  title: 'Privacy Policy',
  description: 'How OneStop Life collects, uses and protects your personal and health information.',
  path: '/privacy',
});

const sections: { h: string; p: string[] }[] = [
  {
    h: 'What we collect',
    p: [
      'Account details you provide: name, phone number, email and role (patient, doctor, pharmacy or admin).',
      'Booking details: appointments, lab bookings, blood requests and orders you place through the platform.',
      'Health information you choose to share: prescriptions you upload, lab reports and consultation notes, used only to deliver the services you request.',
      'Technical data: device type, app version and anonymised usage analytics that help us improve the service.',
    ],
  },
  {
    h: 'How we use it',
    p: [
      'To create and secure your account, process bookings and orders, and send reminders about appointments and deliveries.',
      'To verify doctors, pharmacies and facilities so patients only see trusted, licensed providers.',
      'To improve our services through aggregated, anonymised statistics. We never sell your personal data.',
    ],
  },
  {
    h: 'Who sees your data',
    p: [
      'Doctors see the booking details of their own patients. Pharmacies see orders placed with them. Nobody else does.',
      'Blood request phone numbers are never shown publicly; contact is revealed only to signed-in members handling a request.',
      'We share data with authorities only when required by Pakistani law, such as a lawful court order.',
    ],
  },
  {
    h: 'Your rights',
    p: [
      'You can view, correct or delete your account data at any time from your dashboard, or by writing to support@onestop.life.',
      'You can withdraw consent for marketing messages without affecting your care services.',
    ],
  },
  {
    h: 'Security',
    p: [
      'Accounts are protected with phone-OTP sign-in and rotating session tokens. Health documents are stored with restricted access and are never used for advertising.',
    ],
  },
  {
    h: 'Contact',
    p: [
      'Questions about this policy? Email support@onestop.life or call +92 300 1234567. This policy was last updated on 14 October 2026.',
    ],
  },
];

export default function PrivacyPage() {
  return (
    <main style={{ maxWidth: 760, margin: '0 auto', padding: '40px 24px 72px' }}>
      <Breadcrumbs items={[{ name: 'Privacy Policy', path: '/privacy' }]} />
      <h1>Privacy Policy</h1>
      <p style={{ opacity: 0.75, lineHeight: 1.7 }}>
        OneStop Life (&quot;we&quot;, &quot;our&quot;) provides healthcare booking, laboratory, blood bank and
        pharmacy services in Pakistan. This policy explains what data we collect and how we protect it.
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
