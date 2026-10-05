import { ConflictException, Injectable } from '@nestjs/common';
import { Prisma, RoleKey, VerificationStatus, VerificationType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateVerificationDto, ListVerificationQueryDto } from './dto/verification.dto';

/** Which role a successful verification grants. */
export const ROLE_FOR_TYPE: Record<VerificationType, RoleKey> = {
  DOCTOR: RoleKey.DOCTOR,
  VET: RoleKey.VET,
  PHARMACY: RoleKey.PHARMACY,
  BLOOD_BANK: RoleKey.BLOOD_BANK_STAFF,
  SELLER: RoleKey.SELLER,
};

@Injectable()
export class VerificationService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateVerificationDto) {
    const role = ROLE_FOR_TYPE[dto.type];

    const hasRole = await this.prisma.userRole.findUnique({ where: { userId_role: { userId, role } } });
    if (hasRole) throw new ConflictException('You already hold this role');

    const pending = await this.prisma.verificationRequest.findFirst({
      where: { userId, type: dto.type, status: VerificationStatus.PENDING },
    });
    if (pending) throw new ConflictException('You already have a pending request of this type');

    try {
      return await this.prisma.$transaction(async (tx) => {
        const created = await tx.verificationRequest.create({
          data: {
            userId,
            type: dto.type,
            licenseNumber: dto.licenseNumber,
            licenseAuthority: dto.licenseAuthority,
            documentKey: dto.documentKey,
            notes: dto.notes,
          },
        });
        await tx.auditLog.create({
          data: {
            actorId: userId,
            action: 'verification.submitted',
            entity: 'VerificationRequest',
            entityId: created.id,
            meta: { type: dto.type },
          },
        });
        return created;
      });
    } catch (e) {
      // Backstop for the partial unique index (see README) when two submissions race.
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new ConflictException('You already have a pending request of this type');
      }
      throw e;
    }
  }

  listMine(userId: string) {
    return this.prisma.verificationRequest.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async listAll(q: ListVerificationQueryDto) {
    const where: Prisma.VerificationRequestWhereInput = q.status ? { status: q.status } : {};
    const [items, total] = await this.prisma.$transaction([
      this.prisma.verificationRequest.findMany({
        where,
        orderBy: { createdAt: 'asc' }, // oldest first: a review queue should be first-in, first-out
        skip: (q.page - 1) * q.pageSize,
        take: q.pageSize,
        include: { user: { select: { id: true, phone: true, name: true } } },
      }),
      this.prisma.verificationRequest.count({ where }),
    ]);
    return { items, total, page: q.page, pageSize: q.pageSize };
  }

  async approve(id: string, adminId: string, note?: string) {
    return this.prisma.$transaction(async (tx) => {
      // Only a PENDING request can be approved. updateMany makes the check-and-set atomic,
      // so two admins clicking at once cannot both succeed.
      const updated = await tx.verificationRequest.updateMany({
        where: { id, status: VerificationStatus.PENDING },
        data: {
          status: VerificationStatus.APPROVED,
          reviewedById: adminId,
          reviewNote: note ?? null,
          reviewedAt: new Date(),
        },
      });
      if (updated.count !== 1) throw new ConflictException('Request not found or already reviewed');

      const request = await tx.verificationRequest.findUniqueOrThrow({ where: { id } });
      const role = ROLE_FOR_TYPE[request.type];

      await tx.userRole.upsert({
        where: { userId_role: { userId: request.userId, role } },
        update: {},
        create: { userId: request.userId, role },
      });
      await tx.auditLog.create({
        data: {
          actorId: adminId,
          action: 'verification.approved',
          entity: 'VerificationRequest',
          entityId: id,
          meta: { type: request.type, grantedRole: role, applicantId: request.userId },
        },
      });
      return request;
    });
  }

  async reject(id: string, adminId: string, note: string) {
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.verificationRequest.updateMany({
        where: { id, status: VerificationStatus.PENDING },
        data: {
          status: VerificationStatus.REJECTED,
          reviewedById: adminId,
          reviewNote: note,
          reviewedAt: new Date(),
        },
      });
      if (updated.count !== 1) throw new ConflictException('Request not found or already reviewed');

      const request = await tx.verificationRequest.findUniqueOrThrow({ where: { id } });
      await tx.auditLog.create({
        data: {
          actorId: adminId,
          action: 'verification.rejected',
          entity: 'VerificationRequest',
          entityId: id,
          meta: { type: request.type, applicantId: request.userId },
        },
      });
      return request;
    });
  }
}
