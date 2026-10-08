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
  user: { id: string; name: string | null; phone?: string | null; email?: string | null };
  facilities: DoctorFacilityLink[];
};

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
