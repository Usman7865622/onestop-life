import MyAppointmentsClient from './MyAppointmentsClient';
import Breadcrumbs from '../../components/layout/Breadcrumbs';
import styles from './page.module.css';

export default function AppointmentsPage() {
  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <Breadcrumbs items={[{ name: 'My appointments', path: '/appointments' }]} />
        <header className={styles.header}>
          <div>
            <p className={styles.kicker}>Your healthcare</p>
            <h1>My appointments</h1>
            <p className={styles.subtitle}>Your upcoming and past doctor visits, all in one place.</p>
          </div>
        </header>
        <MyAppointmentsClient />
      </div>
    </main>
  );
}

import type { Metadata } from "next";
import { pageMetadata } from "../../lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "My appointments",
  description: "View, reschedule or cancel your doctor appointments on OneStop Life.",
  path: "/appointments",
  noIndex: true,
});
