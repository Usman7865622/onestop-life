import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { BloodRequestStatus, FacilityType, Prisma, RoleKey } from '@prisma/client';
import { AuthUser } from '../../common/types/auth-user';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateBloodRequestDto, ListBloodBanksQueryDto, ListBloodRequestsQueryDto } from './dto/blood.dto';

@Injectable()
export class BloodService {
  constructor(private readonly prisma: PrismaService) {}

  listBloodBanks(query: ListBloodBanksQueryDto) {
    return this.prisma.facility.findMany({
      where: {
        type: FacilityType.BLOOD_BANK,
        ...(query.city ? { city: { contains: query.city, mode: 'insensitive' } } : {}),
      },
      orderBy: { name: 'asc' },
    });
  }

  /** Public board: never expose the requester's contact number. */
  async listPublicRequests(query: ListBloodRequestsQueryDto) {
    const where: Prisma.BloodRequestWhereInput = { status: BloodRequestStatus.OPEN };
    if (query.bloodGroup) where.bloodGroup = query.bloodGroup;
    if (query.city) where.city = { contains: query.city, mode: 'insensitive' };
    const items = await this.prisma.bloodRequest.findMany({
      where,
      select: {
        id: true,
        bloodGroup: true,
        units: true,
        city: true,
        hospitalName: true,
        urgency: true,
        status: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return { items };
  }

  createRequest(user: AuthUser, dto: CreateBloodRequestDto) {
    return this.prisma.bloodRequest.create({
      data: {
        userId: user.id,
        bloodGroup: dto.bloodGroup,
        units: dto.units,
        city: dto.city.trim(),
        hospitalName: dto.hospitalName?.trim() || undefined,
        urgency: dto.urgency ?? 'NORMAL',
        contactPhone: dto.contactPhone.trim(),
      },
    });
  }

  listMine(user: AuthUser) {
    return this.prisma.bloodRequest.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });
  }

  async cancel(id: string, user: AuthUser) {
    const request = await this.prisma.bloodRequest.findUnique({ where: { id } });
    if (!request) throw new NotFoundException('Blood request not found');
    if (request.userId !== user.id && !user.roles.includes(RoleKey.ADMIN)) {
      throw new ForbiddenException('You cannot cancel this blood request');
    }
    if (request.status !== BloodRequestStatus.OPEN) {
      throw new BadRequestException('Only open blood requests can be cancelled');
    }
    return this.prisma.bloodRequest.update({
      where: { id },
      data: { status: BloodRequestStatus.CANCELLED },
    });
  }
}
