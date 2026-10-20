import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { AppointmentStatus, OrderStatus, RoleKey } from '@prisma/client';
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

  /**
   * Refill autopilot: for every catalogue medicine on the patient's
   * prescriptions, work out where they are in the course. Supply is estimated
   * from the prescribed duration, scaled by how much of it was actually
   * ordered (two packs of a 10-day course last ~20 days). Statuses:
   * NOT_ORDERED (prescribed but never bought), ON_TRACK, DUE_SOON (<=5 days
   * of supply left), DUE (supply exhausted). Courses that ran out more than
   * 30 days ago are dropped so the list never nags forever.
   */
  async refillsMine(patient: AuthUser) {
    const prescriptions = await this.prisma.prescription.findMany({
      where: { patientId: patient.id },
      include: prescriptionInclude,
      orderBy: { createdAt: 'desc' },
    });
    if (!prescriptions.length) return { items: [] };

    const orders = await this.prisma.order.findMany({
      where: {
        userId: patient.id,
        prescriptionId: { in: prescriptions.map((p) => p.id) },
        status: { notIn: [OrderStatus.CANCELLED, OrderStatus.REFUNDED] },
      },
      include: { items: { select: { productId: true, quantity: true } } },
      orderBy: { createdAt: 'desc' },
    });

    // Latest order per (prescription, product) — orders are newest-first.
    const latest = new Map<string, { orderedAt: Date; quantity: number }>();
    for (const order of orders) {
      for (const line of order.items) {
        const key = `${order.prescriptionId}:${line.productId}`;
        if (!latest.has(key)) latest.set(key, { orderedAt: order.createdAt, quantity: line.quantity });
      }
    }

    const DAY_MS = 86_400_000;
    const now = Date.now();
    type RefillItem = {
      prescriptionId: string;
      doctorName: string | null;
      product: { id: string; nameEn: string; priceMinor: number; imageUrl: string | null; unit: string; requiresRx: boolean; inStock: boolean };
      prescribedQty: number;
      dosage: string | null;
      frequency: string | null;
      status: 'DUE' | 'DUE_SOON' | 'ON_TRACK' | 'NOT_ORDERED';
      daysLeft: number | null;
      runOutDate: string | null;
      lastOrderedAt: string | null;
    };
    const items: RefillItem[] = [];

    for (const prescription of prescriptions) {
      for (const item of prescription.items) {
        if (!item.product) continue; // free-text rows have nothing to reorder
        const base = {
          prescriptionId: prescription.id,
          doctorName: prescription.doctorProfile.user.name,
          product: {
            id: item.product.id,
            nameEn: item.product.nameEn,
            priceMinor: item.product.priceMinor,
            imageUrl: item.product.imageUrl,
            unit: item.product.unit,
            requiresRx: item.product.requiresRx,
            inStock: item.product.inStock,
          },
          prescribedQty: item.qty,
          dosage: item.dosage,
          frequency: item.frequency,
        };
        const ordered = latest.get(`${prescription.id}:${item.product.id}`);
        if (!ordered) {
          items.push({ ...base, status: 'NOT_ORDERED', daysLeft: null, runOutDate: null, lastOrderedAt: null });
          continue;
        }
        if (!item.durationDays || item.durationDays <= 0) continue; // no course length, no honest estimate
        const ratio = item.qty > 0 ? ordered.quantity / item.qty : 1;
        const daysSupply = Math.max(1, Math.round(item.durationDays * ratio));
        const runOutMs = ordered.orderedAt.getTime() + daysSupply * DAY_MS;
        const daysLeft = Math.ceil((runOutMs - now) / DAY_MS);
        if (daysLeft < -30) continue;
        items.push({
          ...base,
          status: daysLeft <= 0 ? 'DUE' : daysLeft <= 5 ? 'DUE_SOON' : 'ON_TRACK',
          daysLeft,
          runOutDate: new Date(runOutMs).toISOString(),
          lastOrderedAt: ordered.orderedAt.toISOString(),
        });
      }
    }

    const rank = { DUE: 0, DUE_SOON: 1, NOT_ORDERED: 2, ON_TRACK: 3 } as const;
    items.sort((a, b) => rank[a.status] - rank[b.status] || (a.daysLeft ?? 0) - (b.daysLeft ?? 0));
    return { items };
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
