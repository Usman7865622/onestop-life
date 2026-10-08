import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateFacilityDto, ListFacilitiesQueryDto } from './dto/create-facility.dto';

@Injectable()
export class FacilitiesService {
  constructor(private readonly prisma: PrismaService) {}

  list(query: ListFacilitiesQueryDto) {
    return this.prisma.facility.findMany({
      where: {
        ...(query.type ? { type: query.type } : {}),
        ...(query.city ? { city: { contains: query.city, mode: 'insensitive' } } : {}),
      },
      include: { doctors: { include: { doctorProfile: { include: { user: { select: { id: true, name: true } } } } } } },
      orderBy: { name: 'asc' },
    });
  }

  async getById(id: string) {
    const facility = await this.prisma.facility.findUnique({
      where: { id },
      include: { doctors: { include: { doctorProfile: { include: { user: { select: { id: true, name: true } } } } } } },
    });
    if (!facility) throw new NotFoundException('Facility not found');
    return facility;
  }

  create(dto: CreateFacilityDto) {
    return this.prisma.facility.create({ data: { ...dto, isEmergency: dto.isEmergency ?? false } });
  }
}
