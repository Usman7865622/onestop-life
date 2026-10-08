import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { LabBookingStatus, Prisma, RoleKey } from '@prisma/client';
import { AuthUser } from '../../common/types/auth-user';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateLabBookingDto, ListLabTestsQueryDto } from './dto/lab.dto';

const labTestInclude = {
  facility: { select: { id: true, name: true, city: true, address: true, phone: true, timings: true } },
} satisfies Prisma.LabTestInclude;

const labBookingInclude = {
  test: true,
  facility: { select: { id: true, name: true, city: true, address: true, phone: true, timings: true } },
} satisfies Prisma.LabBookingInclude;

@Injectable()
export class LabsService {
  constructor(private readonly prisma: PrismaService) {}

  async listTests(query: ListLabTestsQueryDto) {
    const where: Prisma.LabTestWhereInput = { isActive: true };
    if (query.facilityId) where.facilityId = query.facilityId;
    if (query.q) {
      where.OR = [
        { name: { contains: query.q, mode: 'insensitive' } },
        { code: { contains: query.q, mode: 'insensitive' } },
        { sampleType: { contains: query.q, mode: 'insensitive' } },
      ];
    }
    const items = await this.prisma.labTest.findMany({
      where,
      include: labTestInclude,
      orderBy: { name: 'asc' },
    });
    return { items };
  }

  async getTest(id: string) {
    const test = await this.prisma.labTest.findUnique({ where: { id }, include: labTestInclude });
    if (!test) throw new NotFoundException('Lab test not found');
    return test;
  }

  async createBooking(user: AuthUser, dto: CreateLabBookingDto) {
    const scheduledAt = new Date(dto.scheduledAt);
    if (Number.isNaN(scheduledAt.getTime()) || scheduledAt.getTime() <= Date.now()) {
      throw new BadRequestException('scheduledAt must be in the future');
    }

    const test = await this.prisma.labTest.findUnique({ where: { id: dto.testId } });
    if (!test) throw new NotFoundException('Lab test not found');
    if (!test.isActive) throw new BadRequestException('This lab test is not currently available');

    return this.prisma.labBooking.create({
      data: {
        userId: user.id,
        testId: test.id,
        facilityId: test.facilityId,
        scheduledAt,
        address: dto.address.trim(),
        patientName: dto.patientName.trim(),
        phone: dto.phone.trim(),
      },
      include: labBookingInclude,
    });
  }

  listMine(user: AuthUser) {
    return this.prisma.labBooking.findMany({
      where: { userId: user.id },
      include: labBookingInclude,
      orderBy: { scheduledAt: 'desc' },
    });
  }

  async cancel(id: string, user: AuthUser) {
    const booking = await this.prisma.labBooking.findUnique({ where: { id } });
    if (!booking) throw new NotFoundException('Lab booking not found');
    if (booking.userId !== user.id && !user.roles.includes(RoleKey.ADMIN)) {
      throw new ForbiddenException('You cannot cancel this lab booking');
    }
    if (
      booking.status === LabBookingStatus.REPORT_READY ||
      booking.status === LabBookingStatus.DELIVERED ||
      booking.status === LabBookingStatus.CANCELLED
    ) {
      throw new BadRequestException('This lab booking can no longer be cancelled');
    }
    return this.prisma.labBooking.update({
      where: { id },
      data: { status: LabBookingStatus.CANCELLED },
      include: labBookingInclude,
    });
  }
}
