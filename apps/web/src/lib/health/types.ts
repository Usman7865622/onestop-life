import type { Facility } from '../doctors/types';

export type LabFacilityRef = Pick<Facility, 'id' | 'name' | 'city' | 'address'> & {
  phone?: string | null;
  timings?: string | null;
};

export type LabTest = {
  id: string;
  name: string;
  code: string;
  priceMinor: number;
  sampleType: string;
  reportHours: number;
  facilityId: string;
  isActive: boolean;
  facility: LabFacilityRef;
};

export type LabBookingStatus = 'BOOKED' | 'SAMPLE_COLLECTED' | 'REPORT_READY' | 'DELIVERED' | 'CANCELLED';

export type LabBooking = {
  id: string;
  scheduledAt: string;
  address: string;
  patientName: string;
  phone: string;
  status: LabBookingStatus;
  createdAt: string;
  test: LabTest;
  facility: LabFacilityRef;
};

export type BloodGroupCode = 'A_POS' | 'A_NEG' | 'B_POS' | 'B_NEG' | 'AB_POS' | 'AB_NEG' | 'O_POS' | 'O_NEG';

export const BLOOD_GROUP_LABELS: Record<BloodGroupCode, string> = {
  A_POS: 'A+',
  A_NEG: 'A−',
  B_POS: 'B+',
  B_NEG: 'B−',
  AB_POS: 'AB+',
  AB_NEG: 'AB−',
  O_POS: 'O+',
  O_NEG: 'O−',
};

export type BloodRequestStatus = 'OPEN' | 'FULFILLED' | 'CANCELLED';

export type PublicBloodRequest = {
  id: string;
  bloodGroup: BloodGroupCode;
  units: number;
  city: string;
  hospitalName?: string | null;
  urgency: string;
  status: BloodRequestStatus;
  createdAt: string;
};

export type MyBloodRequest = PublicBloodRequest & {
  contactPhone: string;
};

export function reportTimeLabel(hours: number) {
  if (hours < 24) return `Report in ${hours} hrs`;
  const days = hours / 24;
  return `Report in ${days} ${days === 1 ? 'day' : 'days'}`;
}

export function formatWhen(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString('en-PK', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  });
}
