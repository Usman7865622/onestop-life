import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ListDoctorsQueryDto, UpsertDoctorProfileDto } from './dto/doctor.dto';

const doctorInclude = {
  user: { select: { id: true, name: true, phone: true, email: true } },
  facilities: { include: { facility: true } },
} satisfies Prisma.DoctorProfileInclude;

@Injectable()
export class DoctorsService {
  constructor(private readonly prisma: PrismaService) {}

  private async ratingSummaries(doctorIds: string[]) {
    if (!doctorIds.length) return new Map<string, { avgRating: number; reviewCount: number }>();
    const groups = await this.prisma.review.groupBy({
      by: ['doctorProfileId'],
      where: { doctorProfileId: { in: doctorIds } },
      _avg: { rating: true },
      _count: { rating: true },
    });
    const map = new Map<string, { avgRating: number; reviewCount: number }>();
    for (const group of groups) {
      map.set(group.doctorProfileId, {
        avgRating: Math.round((group._avg.rating ?? 0) * 10) / 10,
        reviewCount: group._count.rating,
      });
    }
    return map;
  }

  private withRatings<T extends { id: string }>(items: T[], summaries: Map<string, { avgRating: number; reviewCount: number }>) {
    return items.map((item) => ({
      ...item,
      ...(summaries.get(item.id) ?? { avgRating: 0, reviewCount: 0 }),
    }));
  }

  async list(query: ListDoctorsQueryDto) {
    const where: Prisma.DoctorProfileWhereInput = { isBookable: true };
    if (query.speciality) where.speciality = { contains: query.speciality, mode: 'insensitive' };
    if (query.city) {
      where.facilities = { some: { facility: { city: { contains: query.city, mode: 'insensitive' } } } };
    }
    if (query.q) {
      where.OR = [
        { speciality: { contains: query.q, mode: 'insensitive' } },
        { user: { name: { contains: query.q, mode: 'insensitive' } } },
        { about: { contains: query.q, mode: 'insensitive' } },
      ];
    }
    const items = await this.prisma.doctorProfile.findMany({
      where,
      include: doctorInclude,
      orderBy: { createdAt: 'desc' },
    });
    const summaries = await this.ratingSummaries(items.map((item) => item.id));
    return { items: this.withRatings(items, summaries) };
  }

  async getById(id: string) {
    const doctor = await this.prisma.doctorProfile.findUnique({ where: { id }, include: doctorInclude });
    if (!doctor) throw new NotFoundException('Doctor not found');
    const summaries = await this.ratingSummaries([doctor.id]);
    return { ...doctor, ...(summaries.get(doctor.id) ?? { avgRating: 0, reviewCount: 0 }) };
  }

  async upsertMine(userId: string, dto: UpsertDoctorProfileDto) {
    const { facilityIds, ...data } = dto;
    const profile = await this.prisma.doctorProfile.upsert({
      where: { userId },
      update: { ...data, experienceYears: data.experienceYears ?? 0, languages: data.languages ?? [] },
      create: { userId, ...data, experienceYears: data.experienceYears ?? 0, languages: data.languages ?? [], isBookable: data.isBookable ?? true },
    });
    if (facilityIds) {
      await this.prisma.doctorFacility.deleteMany({ where: { doctorProfileId: profile.id } });
      if (facilityIds.length) {
        await this.prisma.doctorFacility.createMany({
          data: facilityIds.map((facilityId) => ({ doctorProfileId: profile.id, facilityId })),
          skipDuplicates: true,
        });
      }
    }
    return this.getById(profile.id);
  }
}
