export type Facility = {
  id: string;
  name: string;
  type: string;
  address: string;
  city: string;
  phone?: string | null;
  timings?: string | null;
  isEmergency?: boolean;
};

export type DoctorFacilityLink = { facility: Facility };

export type Doctor = {
  id: string;
  speciality: string;
  qualifications?: string | null;
  experienceYears: number;
  feeMinor: number;
  languages: string[];
  about?: string | null;
  isBookable: boolean;
  pmdcNumber?: string | null;
  consultationCount?: number | null;
  avgRating: number;
  reviewCount: number;
  user: { id: string; name: string | null; phone?: string | null; email?: string | null };
  facilities: DoctorFacilityLink[];
};

export type Review = {
  id: string;
  appointmentId: string;
  doctorProfileId: string;
  userId: string;
  rating: number;
  title?: string | null;
  text: string;
  createdAt: string;
  user: { id: string; name: string | null };
};

export type ReviewEligibility = {
  canReview: boolean;
  reason: 'ELIGIBLE' | 'NOT_YOURS' | 'NOT_COMPLETED' | 'ALREADY_REVIEWED';
};

export function patientFirstName(name: string | null | undefined): string {
  const clean = (name ?? 'Patient').replace(/^Dr\.\s*/i, '').trim();
  const first = clean.split(/\s+/).filter(Boolean)[0] ?? 'Patient';
  return first.length > 12 ? `${first.slice(0, 11)}…` : first;
}

export type Appointment = {
  id: string;
  startsAt: string;
  endsAt: string;
  type: 'IN_PERSON' | 'VIDEO';
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
  feeMinor: number;
  reason?: string | null;
  patientName: string;
  patientPhone: string;
  doctorProfile: Doctor;
  facility?: Facility | null;
};

export function money(minor: number) {
  return `Rs. ${(minor / 100).toLocaleString('en-PK', { maximumFractionDigits: 0 })}`;
}

export function doctorInitials(name: string | null | undefined) {
  const clean = (name ?? 'Doctor').replace(/^Dr\.\s*/i, '').trim();
  const parts = clean.split(/\s+/).filter(Boolean);
  const initials = parts.slice(0, 2).map((part) => part[0]?.toUpperCase() ?? '').join('');
  return initials || 'DR';
}

export function doctorAvatarStyle(speciality: string) {
  const palette: Record<string, string> = {
    Cardiology: '#e11d48',
    Pediatrics: '#f59e0b',
    'General Physician': '#0ea5e9',
    Dermatology: '#db2777',
    Gynecology: '#9333ea',
    Orthopedics: '#2563eb',
    Dentistry: '#0891b2',
    Ophthalmology: '#0f766e',
    ENT: '#ea580c',
    Neurology: '#4f46e5',
    Psychiatry: '#7c3aed',
    Gastroenterology: '#65a30d',
  };
  return { backgroundColor: palette[speciality] ?? '#172337' };
}
