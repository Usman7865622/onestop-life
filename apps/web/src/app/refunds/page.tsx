import type { Metadata } from 'next';
import Breadcrumbs from '../../components/layout/Breadcrumbs';
import { pageMetadata } from '../../lib/seo';

export const metadata: Metadata = pageMetadata({
  title: 'Refund Policy',
  description: 'When and how OneStop Life refunds medicines, products, appointments and lab tests — and how to request one.',
  path: '/refunds',
});

const sections: { h: string; p: string[] }[] = [
  {
    h: 'Products from the store',
    p: [
      'Unused products in their original, unopened packaging can be returned within 7 days of delivery for a full refund.',
      'If an item arrives damaged, defective, expired or different from what you ordered, tell us within 48 hours of delivery and we will replace it or refund it in full — your choice. Keep the item for collection.',
    ],
  },
  {
    h: 'Medicines',
    p: [
      'For patient safety, a medicine that has left the pharmacy cannot be restocked or given to another patient, so dispensed medicines are not refundable — unless we sent the wrong item, a damaged item, or an item that has expired.',
      'Every prescription order is verified by a pharmacist before dispatch, precisely so the wrong medicine never leaves. If verification fails — for example, the prescription does not cover what you ordered — nothing is charged or shipped, and we contact you first.',
      'Sealed over-the-counter medicines follow the same 7-day rule as store products.',
    ],
  },
  {
    h: 'Doctor appointments',
    p: [
      'Cancel from your dashboard before your appointment slot, and any amount paid is refunded in full, automatically.',
      'If the doctor cancels or does not attend, you choose: a full refund, or rebooking with the same doctor at the next available slot at no extra charge.',
      'If you do not attend a slot you kept, the consultation fee is not refunded — the doctor reserved that time for you.',
    ],
  },
  {
    h: 'Lab tests',
    p: [
      'Cancel before the sample is collected for a full refund. Once the sample has been taken, the full testing fee applies because the work begins immediately.',
      'If we or the laboratory fail to deliver your report, you are refunded in full.',
    ],
  },
  {
    h: 'How refunds are paid',
    p: [
      'Approved refunds are reviewed by the OneStop Life admin team and processed within 5–7 working days of approval.',
      'Cash-on-delivery orders are refunded by bank transfer or mobile wallet. Card payments return to the original card. You will receive a confirmation when your refund is processed.',
    ],
  },
  {
    h: 'How to request a refund',
    p: [
      'Open the order or appointment in your dashboard and use the refund or support option, or email support@onestop.life with your order number.',
      'For damaged or wrong items, a photo of what arrived helps us resolve it in one round.',
    ],
  },
];

export default function RefundsPage() {
  return (
    <main style={{ maxWidth: 760, margin: '0 auto', padding: '40px 24px 72px' }}>
      <Breadcrumbs items={[{ name: 'Refund Policy', path: '/refunds' }]} />
      <h1>Refund Policy</h1>
      <p style={{ opacity: 0.75, lineHeight: 1.7 }}>
        Clear rules, no fine print games. If something goes wrong with an order, appointment or test,
        this page tells you exactly where you stand. Last updated 20 October 2026.
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
