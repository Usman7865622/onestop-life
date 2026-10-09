import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ListMedicinesQueryDto } from './dto/list-medicines.dto';

@Injectable()
export class PharmacyService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: ListMedicinesQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 24;

    const where: Prisma.ProductWhereInput = {
      therapeuticClass: { not: null },
    };

    if (query.class) {
      where.therapeuticClass = { equals: query.class, mode: 'insensitive' };
    }
    if (query.rx === 'true') where.requiresRx = true;
    if (query.rx === 'false') where.requiresRx = false;
    if (query.q) {
      where.OR = [
        { nameEn: { contains: query.q, mode: 'insensitive' } },
        { genericName: { contains: query.q, mode: 'insensitive' } },
        { brandName: { contains: query.q, mode: 'insensitive' } },
      ];
    }

    const [total, items] = await this.prisma.$transaction([
      this.prisma.product.count({ where }),
      this.prisma.product.findMany({
        where,
        orderBy: [{ therapeuticClass: 'asc' }, { nameEn: 'asc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return { items, total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
  }

  async classes() {
    const grouped = await this.prisma.product.groupBy({
      by: ['therapeuticClass'],
      where: { therapeuticClass: { not: null } },
      _count: { _all: true },
      orderBy: { therapeuticClass: 'asc' },
    });

    return {
      items: grouped
        .filter((row) => row.therapeuticClass)
        .map((row) => ({ name: row.therapeuticClass as string, count: row._count._all })),
    };
  }

  async getById(id: string) {
    const medicine = await this.prisma.product.findUnique({ where: { id } });
    if (!medicine) throw new NotFoundException('Medicine not found');
    return medicine;
  }
}
