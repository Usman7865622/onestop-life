import Link from 'next/link';
import DoctorDetailClient from './DoctorDetailClient';
import styles from './detail.module.css';
import type { Doctor } from '../../../lib/doctors/types';

const API_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'https://api-production-7a91a.up.railway.app';

async function getDoctor(id: string): Promise<Doctor | null> {
  try {
    const response = await fetch(`${API_URL}/doctors/${id}`, { cache: 'no-store' });
    if (!response.ok) return null;
    return (await response.json()) as Doctor;
  } catch {
    return null;
  }
}

export default async function DoctorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const doctor = await getDoctor(id);

  if (!doctor) {
    return (
      <main className={styles.page}><div className={styles.shell}>
        <section className={styles.emptyState}><h2>Doctor not found</h2><p>This doctor profile is unavailable or may have been moved.</p><Link className={styles.textLink} href="/doctors">Browse all doctors</Link></section>
      </div></main>
    );
  }

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <Link className={styles.backLink} href="/doctors">← Back to all doctors</Link>
        <DoctorDetailClient doctor={doctor} />
      </div>
    </main>
  );
}
