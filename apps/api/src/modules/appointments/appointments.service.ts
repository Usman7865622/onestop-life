import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { AppointmentStatus, RoleKey } from '@prisma/client';
import { AuthUser } from '../../common/types/auth-user';
import { PrismaService } from '../../prisma/prisma.service';
import { AvailabilityService, karachiDateKey } from '../availability/availability.service';
import { CreateAppointmentDto } from './dto/appointment.dto';

const appointmentInclude = {
  doctorProfile: { include: { user: { select: { id: true, name: true } }, facilities: { include: { facility: true } } } },
  facility: true,
  patient: { select: { id: true, name: true, phone: true } },
} as const;

@Injectable()
export class AppointmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly availability: AvailabilityService,
  ) {}

  async create(patient: AuthUser, dto: CreateAppointmentDto) {
    const doctor = await this.prisma.doctorProfile.findUnique({ where: { id: dto.doctorProfileId } });
    if (!doctor) throw new NotFoundException('Doctor not found');
    if (!doctor.isBookable) throw new BadRequestException('This doctor is not currently bookable');

    if (dto.facilityId) {
      const facility = await this.prisma.facility.findUnique({ where: { id: dto.facilityId } });
      if (!facility) throw new NotFoundException('Facility not found');
    }

    let startsAt: Date;
    let endsAt: Date;

    if (dto.slotStart) {
      // --- Slot-based booking (real availability) ---
      // The requested slot must exactly match a currently FREE slot on the doctor's
      // schedule. The appointment window is taken from the schedule slot itself, so
      // clients cannot invent times outside the doctor's working hours.
      const slotStartIso = new Date(dto.slotStart);
      if (Number.isNaN(slotStartIso.getTime())) throw new BadRequestException('slotStart must be a valid ISO date');
      const dateStr = karachiDateKey(slotStartIso);
      const daySlots = await this.availability.computeDaySlots(dto.doctorProfileId, dateStr);
      const match = daySlots.find((s) => s.status === 'free' && s.startsAt === slotStartIso.toISOString());
      if (!match) throw new BadRequestException('This slot is no longer available');
      startsAt = new Date(match.startsAt);
      endsAt = new Date(match.endsAt);
    } else {
      // --- Legacy free-form booking ---
      // Once a doctor publishes a real schedule, patients must pick one of the
      // generated slots instead of typing arbitrary times.
      if (await this.availability.hasActiveSchedule(dto.doctorProfileId)) {
        throw new BadRequestException('Please choose an available slot to book this doctor.');
      }
      startsAt = new Date(dto.startsAt);
      endsAt = new Date(dto.endsAt);
      if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime()) || endsAt <= startsAt) {
        throw new BadRequestException('endsAt must be after startsAt');
      }
    }

    // Final guard against double-booking races (same predicate as slot computation).
    const overlap = await this.prisma.appointment.findFirst({
      where: {
        doctorProfileId: dto.doctorProfileId,
        status: { in: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED] },
        startsAt: { lt: endsAt },
        endsAt: { gt: startsAt },
      },
    });
    if (overlap) throw new BadRequestException('This time slot is already booked for this doctor');

    return this.prisma.appointment.create({
      data: {
        patientId: patient.id,
        doctorProfileId: dto.doctorProfileId,
        facilityId: dto.facilityId,
        startsAt,
        endsAt,
        type: dto.type ?? 'IN_PERSON',
        feeMinor: doctor.feeMinor,
        reason: dto.reason?.trim() || undefined,
        patientName: dto.patientName.trim(),
        patientPhone: dto.patientPhone.trim(),
      },
      include: appointmentInclude,
    });
  }

  listMine(patient: AuthUser) {
    return this.prisma.appointment.findMany({
      where: { patientId: patient.id },
      include: appointmentInclude,
      orderBy: { startsAt: 'desc' },
    });
  }

  async listDoctorMine(doctorUser: AuthUser) {
    const profile = await this.prisma.doctorProfile.findUnique({ where: { userId: doctorUser.id } });
    if (!profile) return [];
    return this.prisma.appointment.findMany({
      where: { doctorProfileId: profile.id },
      include: appointmentInclude,
      orderBy: { startsAt: 'asc' },
    });
  }

  async cancel(id: string, user: AuthUser) {
    const appt = await this.prisma.appointment.findUnique({
      where: { id },
      include: { doctorProfile: { select: { userId: true } } },
    });
    if (!appt) throw new NotFoundException('Appointment not found');
    const isPatient = appt.patientId === user.id;
    const isDoctor = appt.doctorProfile.userId === user.id;
    const isAdmin = user.roles.includes(RoleKey.ADMIN);
    if (!isPatient && !isDoctor && !isAdmin) throw new ForbiddenException('You cannot cancel this appointment');
    if (appt.status === AppointmentStatus.CANCELLED || appt.status === AppointmentStatus.COMPLETED) {
      throw new BadRequestException('Appointment cannot be cancelled');
    }
    return this.prisma.appointment.update({
      where: { id },
      data: { status: AppointmentStatus.CANCELLED },
      include: appointmentInclude,
    });
  }

  async updateStatus(id: string, doctorUser: AuthUser, status: AppointmentStatus) {
    const allowed: AppointmentStatus[] = [AppointmentStatus.CONFIRMED, AppointmentStatus.COMPLETED, AppointmentStatus.NO_SHOW, AppointmentStatus.CANCELLED];
    if (!allowed.includes(status)) {
      throw new BadRequestException('Invalid status transition');
    }
    const appt = await this.prisma.appointment.findUnique({
      where: { id },
      include: { doctorProfile: { select: { userId: true } } },
    });
    if (!appt) throw new NotFoundException('Appointment not found');
    if (appt.doctorProfile.userId !== doctorUser.id && !doctorUser.roles.includes(RoleKey.ADMIN)) {
      throw new ForbiddenException('Only the doctor can update this appointment');
    }
    return this.prisma.appointment.update({
      where: { id },
      data: { status },
      include: appointmentInclude,
    });
  }
}
