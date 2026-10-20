import type { Metadata } from 'next';
import Link from 'next/link';
import Breadcrumbs from '../../components/layout/Breadcrumbs';
import { pageMetadata } from '../../lib/seo';
import styles from './verify.module.css';

export const metadata: Metadata = pageMetadata({
  title: 'How We Verify',
  description: 'How OneStop Life verifies doctors (PMDC), prescription medicines (pharmacist checks), facilities, reviews and blood-request contacts.',
  path: '/how-we-verify',
});

const SECTIONS = [
  {
    icon: '🩺',
    title: 'Doctors: PMDC-checked, then approved by a human',
    steps: [
      'A doctor creates a professional account and submits their PMDC registration number and practice details.',
      'The application waits in an admin verification queue — it is reviewed before the profile becomes public.',
      'Only verified doctors can publish availability slots and receive bookings. Their profile shows the PMDC number and a verified shield.',
      'Doctors set their own schedules and fees; patients book real published slots, never open-ended requests.',
    ],
  },
  {
    icon: '💊',
    title: 'Medicines: a pharmacist checks every prescription order',
    steps: [
      'Prescription (Rx) medicines cannot be checked out without a prescription — either a file you provide, or a digital prescription your treating doctor issued on OneStop Life after your completed visit.',
      'Rx orders are held as "Pending pharmacist verification" — nothing is dispatched at checkout.',
      'A pharmacist reviews the prescription against the order. For digital prescriptions they can see the issuing doctor and the recorded diagnosis.',
      'If the prescription does not cover the order, the order is rejected before dispatch and you are told why — never silently substituted.',
    ],
  },
  {
    icon: '⭐',
    title: 'Reviews: only from completed visits',
    steps: [
      'A patient can review a doctor only after their appointment is marked completed.',
      'Doctor cards show the average rating and the number of verified reviews behind it — the count matters as much as the score.',
      'The newest verified reviews are published on the homepage, exactly as patients wrote them.',
    ],
  },
  {
    icon: '🏥',
    title: 'Facilities, labs and blood banks',
    steps: [
      'Facilities are listed with their city, type and services so you can compare before you book.',
      'Lab tests offer home sample collection; the laboratory named on your booking performs the test and issues the report.',
      'Blood requests are a public board, but phone numbers are never shown publicly — contact details are revealed only to signed-in members handling a request.',
    ],
  },
  {
    icon: '💳',
    title: 'Payments and refunds: rules published in advance',
    steps: [
      'Prices are in Pakistani Rupees, shown before you pay. Cash on delivery is available, and delivery is free over Rs. 3,000.',
      'Discount codes carry published limits — a maximum number of uses and an expiry date — enforced automatically at checkout.',
      'Refunds follow the written Refund Policy and are reviewed by the admin team, typically processed within 5–7 working days of approval.',
    ],
  },
];

export default function HowWeVerifyPage() {
  return (
    <main className={styles.page}>
      <Breadcrumbs items={[{ name: 'How We Verify', path: '/how-we-verify' }]} />
      <header className={styles.hero}>
        <span className={styles.eyebrow}>Trust &amp; safety</span>
        <h1 className={styles.title}>How we verify — in plain sight.</h1>
        <p className={styles.lead}>
          A healthcare platform is only worth using if its claims can be checked. These are the exact controls
          running on OneStop Life today — the same ones described in our{' '}
          <Link href="/terms">Terms</Link> and <Link href="/refunds">Refund Policy</Link>.
        </p>
      </header>

      {SECTIONS.map((section) => (
        <section key={section.title} className={styles.section} aria-label={section.title}>
          <div className={styles.sectionHead}>
            <span className={styles.icon} aria-hidden="true">{section.icon}</span>
            <h2>{section.title}</h2>
          </div>
          <ol className={styles.steps}>
            {section.steps.map((step, i) => (
              <li key={i}>
                <span className={styles.stepNum} aria-hidden="true">{i + 1}</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </section>
      ))}

      <section className={styles.closing}>
        <h2>Something doesn&rsquo;t look right?</h2>
        <p>
          Tell us. Reports about a doctor, a medicine, or an order are read by the admin team —{' '}
          <Link href="/contact">contact us</Link> or email{' '}
          <a href="mailto:support@onestop.life">support@onestop.life</a>.
          In an emergency, always call <a href="tel:15">15</a> or Rescue <a href="tel:1122">1122</a> first.
        </p>
      </section>
    </main>
  );
}
