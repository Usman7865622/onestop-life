import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { AppointmentStatus, RoleKey } from '@prisma/client';
import { AuthUser } from '../../common/types/auth-user';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePrescriptionDto } from './dto/prescription.dto';

const prescriptionInclude = {
  items: {
    include: {
      product: {
        select: { id: true, nameEn: true, priceMinor: true, imageUrl: true, unit: true, requiresRx: true, inStock: true, packSize: true },
      },
    },
  },
  appointment: { select: { id: true, startsAt: true, endsAt: true, type: true, status: true, patientName: true } },
  doctorProfile: { select: { id: true, speciality: true, userId: true, user: { select: { id: true, name: true } } } },
  patient: { select: { id: true, name: true } },
} as const;

/**
 * Authorization rule for reading a prescription: the patient it was issued to,
 * the doctor who issued it, or an admin. Anyone else gets a 404 so prescription
 * ids cannot be probed.
 */
function assertCanRead(
  user: AuthUser,
  row: { patientId: string; doctorProfile: { userId: string } },
) {
  const allowed =
    row.patientId === user.id ||
    row.doctorProfile.userId === user.id ||
    user.roles.includes(RoleKey.ADMIN);
  if (!allowed) throw new NotFoundException('Prescription not found');
}

@Injectable()
export class PrescriptionsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(doctorUser: AuthUser, dto: CreatePrescriptionDto) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: dto.appointmentId },
      include: { doctorProfile: { select: { id: true, userId: true } } },
    });
    if (!appointment) throw new NotFoundException('Appointment not found');
    if (appointment.doctorProfile.userId !== doctorUser.id && !doctorUser.roles.includes(RoleKey.ADMIN)) {
      throw new ForbiddenException('Only the treating doctor can issue this prescription');
    }
    if (appointment.status !== AppointmentStatus.COMPLETED) {
      throw new BadRequestException('A prescription can only be issued after the appointment is completed');
    }
    const existing = await this.prisma.prescription.findUnique({ where: { appointmentId: appointment.id } });
    if (existing) throw new ConflictException('A prescription has already been issued for this appointment');

    // Every catalogue-linked item must point at a real product.
    const linkedIds = dto.items.map((item) => item.productId).filter((id): id is string => Boolean(id));
    if (linkedIds.length) {
      const found = await this.prisma.product.findMany({ where: { id: { in: linkedIds } }, select: { id: true } });
      if (found.length !== new Set(linkedIds).size) {
        throw new BadRequestException('One of the selected medicines was not found in the catalogue');
      }
    }

    try {
      return await this.prisma.prescription.create({
        data: {
          appointmentId: appointment.id,
          patientId: appointment.patientId,
          doctorProfileId: appointment.doctorProfileId,
          diagnosis: dto.diagnosis || undefined,
          notes: dto.notes || undefined,
          items: {
            create: dto.items.map((item) => ({
              productId: item.productId ?? null,
              name: item.name,
              dosage: item.dosage || undefined,
              frequency: item.frequency || undefined,
              durationDays: item.durationDays,
              qty: item.qty ?? 1,
              notes: item.notes || undefined,
            })),
          },
        },
        include: prescriptionInclude,
      });
    } catch (e) {
      // Racing double-issue: the unique appointmentId constraint wins.
      if (typeof e === 'object' && e !== null && (e as { code?: string }).code === 'P2002') {
        throw new ConflictException('A prescription has already been issued for this appointment');
      }
      throw e;
    }
  }

  listMine(patient: AuthUser) {
    return this.prisma.prescription.findMany({
      where: { patientId: patient.id },
      include: prescriptionInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  async listDoctorMine(doctorUser: AuthUser) {
    const profile = await this.prisma.doctorProfile.findUnique({ where: { userId: doctorUser.id } });
    const where = doctorUser.roles.includes(RoleKey.ADMIN) && !profile
      ? {}
      : { doctorProfileId: profile?.id ?? '__none__' };
    return this.prisma.prescription.findMany({
      where,
      include: prescriptionInclude,
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async getById(id: string, user: AuthUser) {
    const row = await this.prisma.prescription.findUnique({
      where: { id },
      include: prescriptionInclude,
    });
    if (!row) throw new NotFoundException('Prescription not found');
    assertCanRead(user, row);
    return row;
  }

  async getByAppointmentId(appointmentId: string, user: AuthUser) {
    const row = await this.prisma.prescription.findUnique({
      where: { appointmentId },
      include: prescriptionInclude,
    });
    if (!row) throw new NotFoundException('No prescription has been issued for this appointment');
    assertCanRead(user, row);
    return row;
  }
}
