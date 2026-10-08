import MyAppointmentsClient from './MyAppointmentsClient';
import styles from './page.module.css';

export default function AppointmentsPage() {
  return (
    <main className={styles.page}>
      <div className={styles.shell}>
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
