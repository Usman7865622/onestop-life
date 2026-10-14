import type { Metadata } from 'next';
import ContactClient from './ContactClient';
import { pageMetadata } from '../../lib/seo';

export const metadata: Metadata = pageMetadata({
  title: 'Contact us',
  description: 'Contact the OneStop Life team about bookings, orders, or becoming a verified doctor or pharmacy.',
  path: '/contact',
});

export default function ContactPage() {
  return <ContactClient />;
}
