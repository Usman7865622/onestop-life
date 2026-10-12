import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { AppointmentStatus, RoleKey } from '@prisma/client';
import { AuthUser } from '../../common/types/auth-user';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAvailabilitySlotDto } from './dto/availability.dto';

export type SlotStatus = 'free' | 'booked';

export interface DaySlot {
  startsAt: string; // ISO UTC
  endsAt: string; // ISO UTC
  status: SlotStatus;
}

// Asia/Karachi is a fixed UTC+05:00 offset (no daylight saving), so a constant offset
// is exact for all wall-clock conversions.
const KARACHI_OFFSET_MS = 5 * 60 * 60 * 1000;

/** 'YYYY-MM-DD' wall-date in Asia/Karachi for a moment in time. */
export function karachiDateKey(moment: Date): string {
  return new Date(moment.getTime() + KARACHI_OFFSET_MS).toISOString().slice(0, 10);
}

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;

const toMinutes = (hhmm: string): number => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

const toHHMM = (minutes: number): string =>
  `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;

interface ScheduleEntry {
  startTime: string;
  endTime: string;
  slotMinutes: number;
}

interface BookingWindow {
  startsAt: Date;
  endsAt: Date;
}

@Injectable()
export class AvailabilityService {
  constructor(private readonly prisma: PrismaService) {}

  private async requireDoctor(doctorProfileId: string) {
    const doctor = await this.prisma.doctorProfile.findUnique({ where: { id: doctorProfileId } });
    if (!doctor) throw new NotFoundException('Doctor not found');
    return doctor;
  }

  // ---------- schedule management ----------

  async create(user: AuthUser, dto: CreateAvailabilitySlotDto) {
    const startMin = toMinutes(dto.startTime);
    const endMin = toMinutes(dto.endTime);
    if (startMin >= endMin) {
      throw new BadRequestException('startTime must be before endTime');
    }

    const isAdmin = user.roles.includes(RoleKey.ADMIN);
    const ownProfile = await this.prisma.doctorProfile.findUnique({ where: { userId: user.id } });
    let doctorProfileId: string;
    if (isAdmin) {
      if (!dto.doctorProfileId) throw new BadRequestException('doctorProfileId is required');
      await this.requireDoctor(dto.doctorProfileId);
      doctorProfileId = dto.doctorProfileId;
    } else {
      // Doctors can only create schedule entries for their own profile.
      if (!ownProfile) throw new ForbiddenException('You need a doctor profile to manage availability');
      if (dto.doctorProfileId && dto.doctorProfileId !== ownProfile.id) {
        throw new ForbiddenException('You can only manage your own availability');
      }
      doctorProfileId = ownProfile.id;
    }

    if (dto.facilityId) {
      const facility = await this.prisma.facility.findUnique({ where: { id: dto.facilityId } });
      if (!facility) throw new NotFoundException('Facility not found');
    }

    return this.prisma.availabilitySlot.create({
      data: {
        doctorProfileId,
        facilityId: dto.facilityId ?? null,
        weekday: dto.weekday,
        startTime: dto.startTime,
        endTime: dto.endTime,
        slotMinutes: dto.slotMinutes ?? 30,
      },
      include: { facility: true },
    });
  }

  async my(user: AuthUser) {
    const profile = await this.prisma.doctorProfile.findUnique({ where: { userId: user.id } });
    if (!profile) return [];
    return this.prisma.availabilitySlot.findMany({
      where: { doctorProfileId: profile.id },
      include: { facility: true },
      orderBy: [{ weekday: 'asc' }, { startTime: 'asc' }],
    });
  }

  async remove(id: string, user: AuthUser) {
    const slot = await this.prisma.availabilitySlot.findUnique({ where: { id } });
    if (!slot) throw new NotFoundException('Availability slot not found');
    const isAdmin = user.roles.includes(RoleKey.ADMIN);
    if (!isAdmin) {
      const profile = await this.prisma.doctorProfile.findUnique({ where: { userId: user.id } });
      if (!profile || slot.doctorProfileId !== profile.id) {
        throw new ForbiddenException('You can only manage your own availability');
      }
    }
    return this.prisma.availabilitySlot.delete({ where: { id } });
  }

  async hasActiveSchedule(doctorProfileId: string): Promise<boolean> {
    const count = await this.prisma.availabilitySlot.count({
      where: { doctorProfileId, isActive: true },
    });
    return count > 0;
  }

  // ---------- public day-slot computation (shared with appointments) ----------

  /**
   * Build the concrete time slots for one Karachi calendar date from the doctor's
   * weekly schedule, marking each as free/booked against live appointments and
   * excluding slots that already started. All returned times are ISO UTC.
   */
  async computeDaySlots(doctorProfileId: string, dateStr: string): Promise<DaySlot[]> {
    if (!DATE_PATTERN.test(dateStr)) throw new BadRequestException('date must be YYYY-MM-DD');
    const doctor = await this.requireDoctor(doctorProfileId);
    if (!doctor.isBookable) return [];

    const dayStartUtc = new Date(`${dateStr}T00:00:00+05:00`);
    if (Number.isNaN(dayStartUtc.getTime())) throw new BadRequestException('Invalid date');
    const dayEndUtc = new Date(dayStartUtc.getTime() + 24 * 60 * 60 * 1000);
    // Midnight Karachi (00:00+05:00) is 19:00 UTC the previous calendar day, so
    // getUTCDay() reads one weekday early. Shift forward to the true Karachi weekday.
    const weekday = (dayStartUtc.getUTCDay() + 1) % 7; // 0=Sunday..6=Saturday, Asia/Karachi

    const entries = await this.prisma.availabilitySlot.findMany({
      where: {
        doctorProfileId,
        weekday,
        isActive: true,
        AND: [
          { OR: [{ validFrom: null }, { validFrom: { lte: dayEndUtc } }] },
          { OR: [{ validUntil: null }, { validUntil: { gte: dayStartUtc } }] },
        ],
      },
      orderBy: { startTime: 'asc' },
    });

    // Same overlap predicate as appointments.service.ts: only live bookings block slots.
    const bookings = await this.prisma.appointment.findMany({
      where: {
        doctorProfileId,
        status: { in: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED] },
        startsAt: { lt: dayEndUtc },
        endsAt: { gt: dayStartUtc },
      },
      select: { startsAt: true, endsAt: true },
    });

    return this.generateSlots(entries, bookings, dateStr, new Date());
  }

  /**
   * Return the Karachi calendar dates (next 60 days, or days of `month` from today)
   * on which the doctor has at least one free bookable slot.
   */
  async computeAvailableDates(doctorProfileId: string, month?: string): Promise<Array<{ date: string }>> {
    if (month && !MONTH_PATTERN.test(month)) throw new BadRequestException('month must be YYYY-MM');
    const doctor = await this.requireDoctor(doctorProfileId);
    if (!doctor.isBookable) return [];

    const todayKey = karachiDateKey(new Date());
    const dateKeys: string[] = [];
    if (month) {
      const [y, m] = month.split('-').map(Number);
      const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
      for (let d = 1; d <= daysInMonth; d++) {
        const key = `${month}-${String(d).padStart(2, '0')}`;
        if (key >= todayKey) dateKeys.push(key);
      }
    } else {
      const base = new Date(`${todayKey}T00:00:00+05:00`);
      for (let i = 0; i < 60; i++) {
        dateKeys.push(karachiDateKey(new Date(base.getTime() + i * 24 * 60 * 60 * 1000)));
      }
    }
    if (!dateKeys.length) return [];

    const rangeStart = new Date(`${dateKeys[0]}T00:00:00+05:00`);
    const rangeEnd = new Date(`${dateKeys[dateKeys.length - 1]}T00:00:00+05:00`).getTime() + 24 * 60 * 60 * 1000;

    // One bounded fetch each (60 days max), then pure in-memory computation per day.
    const entries = await this.prisma.availabilitySlot.findMany({
      where: { doctorProfileId, isActive: true },
      orderBy: [{ weekday: 'asc' }, { startTime: 'asc' }],
    });
    const bookings = await this.prisma.appointment.findMany({
      where: {
        doctorProfileId,
        status: { in: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED] },
        startsAt: { lt: new Date(rangeEnd) },
        endsAt: { gt: rangeStart },
      },
      select: { startsAt: true, endsAt: true },
    });

    const now = new Date();
    const result: Array<{ date: string }> = [];
    for (const dateKey of dateKeys) {
      const dayStartUtc = new Date(`${dateKey}T00:00:00+05:00`);
      const dayEndUtc = new Date(dayStartUtc.getTime() + 24 * 60 * 60 * 1000);
      // Same +1 shift as computeDaySlots: midnight Karachi is the previous UTC day.
      const weekday = (dayStartUtc.getUTCDay() + 1) % 7;
      const dayEntries = entries.filter(
        (e) =>
          e.weekday === weekday &&
          (!e.validFrom || e.validFrom <= dayEndUtc) &&
          (!e.validUntil || e.validUntil >= dayStartUtc),
      );
      if (!dayEntries.length) continue;
      const dayBookings = bookings.filter((b) => b.startsAt < dayEndUtc && b.endsAt > dayStartUtc);
      const slots = this.generateSlots(dayEntries, dayBookings, dateKey, now);
      if (slots.some((s) => s.status === 'free')) result.push({ date: dateKey });
    }
    return result;
  }

  /**
   * Walk each schedule entry in `slotMinutes` increments. Slots whose start is not
   * in the future are skipped; a slot is 'booked' when it overlaps any live
   * appointment (mirrors the overlap check in appointments.service.ts).
   */
  private generateSlots(
    entries: ScheduleEntry[],
    bookings: BookingWindow[],
    dateStr: string,
    now: Date,
  ): DaySlot[] {
    const slots: DaySlot[] = [];
    for (const entry of entries) {
      const startMin = toMinutes(entry.startTime);
      const endMin = toMinutes(entry.endTime);
      if (startMin >= endMin || entry.slotMinutes <= 0) continue;
      let cursor = startMin;
      while (cursor + entry.slotMinutes <= endMin) {
        const slotStart = new Date(`${dateStr}T${toHHMM(cursor)}+05:00`);
        const slotEnd = new Date(slotStart.getTime() + entry.slotMinutes * 60 * 1000);
        cursor += entry.slotMinutes;
        if (slotStart <= now) continue; // past slots are never offered
        const booked = bookings.some((b) => b.startsAt < slotEnd && b.endsAt > slotStart);
        slots.push({ startsAt: slotStart.toISOString(), endsAt: slotEnd.toISOString(), status: booked ? 'booked' : 'free' });
      }
    }
    slots.sort((a, b) => (a.startsAt < b.startsAt ? -1 : a.startsAt > b.startsAt ? 1 : 0));
    return slots;
  }
}
