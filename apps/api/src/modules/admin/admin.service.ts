import { Injectable } from '@nestjs/common';
import { OrderStatus, PrescriptionStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export type MonthlyPoint = {
  month: string; // YYYY-MM
  registrations: number;
  orders: number;
  revenueMinor: number;
};

/** Bucket users/orders into the last `months` calendar months ending at `now`. Pure — unit-tested. */
export function buildMonthlySeries(
  userDates: Date[],
  orderRows: Array<{ createdAt: Date; totalMinor: number }>,
  now: Date,
  months = 6,
): MonthlyPoint[] {
  const points: MonthlyPoint[] = [];
  const index = new Map<string, MonthlyPoint>();
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
    const point = { month: key, registrations: 0, orders: 0, revenueMinor: 0 };
    points.push(point);
    index.set(key, point);
  }
  const keyOf = (d: Date) => `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
  for (const d of userDates) {
    const p = index.get(keyOf(d));
    if (p) p.registrations += 1;
  }
  for (const o of orderRows) {
    const p = index.get(keyOf(o.createdAt));
    if (p) {
      p.orders += 1;
      p.revenueMinor += o.totalMinor;
    }
  }
  return points;
}

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async overview() {
    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);
    const weekAgo = new Date(now.getTime() - 7 * 86_400_000);
    const sixMonthsStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 5, 1));

    const [
      usersTotal, usersToday, usersWeek, roleRows, recentRegistrations,
      verificationRows, ordersTotal, ordersToday, revenueAgg, orderStatusRows, rxPending,
      productsTotal, productsInStock, outOfStock, medicinesCount, rxMedicinesCount, categoryRows, categoryStockRows,
      doctorsTotal, facilitiesTotal, appointmentsToday,
      userDates, orderRows,
      familyProfilesTotal, familySelfProfiles, familyAccountRows,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { createdAt: { gte: startOfToday } } }),
      this.prisma.user.count({ where: { createdAt: { gte: weekAgo } } }),
      this.prisma.userRole.groupBy({ by: ['role'], _count: { _all: true } }),
      this.prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true, name: true, phone: true, email: true, createdAt: true,
          roles: { select: { role: true } },
        },
      }),
      this.prisma.verificationRequest.groupBy({ by: ['status'], _count: { _all: true } }),
      this.prisma.order.count(),
      this.prisma.order.count({ where: { createdAt: { gte: startOfToday } } }),
      this.prisma.order.aggregate({
        _sum: { totalMinor: true },
        where: { status: { notIn: [OrderStatus.CANCELLED, OrderStatus.REFUNDED] } },
      }),
      this.prisma.order.groupBy({ by: ['status'], _count: { _all: true } }),
      this.prisma.order.count({ where: { prescriptionStatus: PrescriptionStatus.PENDING } }),
      this.prisma.product.count(),
      this.prisma.product.count({ where: { inStock: true } }),
      this.prisma.product.findMany({
        where: { inStock: false },
        orderBy: { nameEn: 'asc' },
        take: 10,
        select: { id: true, nameEn: true, category: true },
      }),
      this.prisma.product.count({ where: { therapeuticClass: { not: null } } }),
      this.prisma.product.count({ where: { requiresRx: true } }),
      this.prisma.product.groupBy({ by: ['category'], _count: { _all: true } }),
      this.prisma.product.groupBy({ by: ['category'], where: { inStock: true }, _count: { _all: true } }),
      this.prisma.doctorProfile.count(),
      this.prisma.facility.count(),
      this.prisma.appointment.count({
        where: { startsAt: { gte: startOfToday, lt: new Date(startOfToday.getTime() + 86_400_000) } },
      }),
      this.prisma.user.findMany({ where: { createdAt: { gte: sixMonthsStart } }, select: { createdAt: true } }),
      this.prisma.order.findMany({
        where: { createdAt: { gte: sixMonthsStart }, status: { notIn: [OrderStatus.CANCELLED, OrderStatus.REFUNDED] } },
        select: { createdAt: true, totalMinor: true },
      }),
      this.prisma.familyMember.count({ where: { deletedAt: null } }),
      this.prisma.familyMember.count({ where: { deletedAt: null, isSelf: true } }),
      this.prisma.familyMember.groupBy({ by: ['userId'], where: { deletedAt: null } }),
    ]);

    const byKey = <T extends string>(rows: Array<{ _count: { _all: number } } & Record<string, unknown>>, field: string) => {
      const out: Record<string, number> = {};
      for (const row of rows) out[String(row[field] as T)] = row._count._all;
      return out;
    };

    const inStockByCategory = new Map(categoryStockRows.map((r) => [r.category ?? 'Other', r._count._all]));
    const byCategory = categoryRows
      .map((r) => {
        const category = r.category ?? 'Other';
        return { category, total: r._count._all, inStock: inStockByCategory.get(category) ?? 0 };
      })
      .sort((a, b) => b.total - a.total);

    return {
      users: {
        total: usersTotal,
        newToday: usersToday,
        newThisWeek: usersWeek,
        byRole: byKey(roleRows, 'role'),
        recent: recentRegistrations.map((u) => ({
          id: u.id,
          name: u.name,
          phone: u.phone,
          email: u.email,
          roles: u.roles.map((r) => r.role),
          createdAt: u.createdAt,
        })),
      },
      verification: {
        byStatus: byKey(verificationRows, 'status'),
      },
      orders: {
        total: ordersTotal,
        today: ordersToday,
        revenueMinor: revenueAgg._sum.totalMinor ?? 0,
        byStatus: byKey(orderStatusRows, 'status'),
        rxPending,
      },
      catalogue: {
        total: productsTotal,
        inStock: productsInStock,
        outOfStock: productsTotal - productsInStock,
        outOfStockItems: outOfStock,
        medicines: medicinesCount,
        rxMedicines: rxMedicinesCount,
        byCategory,
      },
      platform: {
        doctors: doctorsTotal,
        facilities: facilitiesTotal,
        appointmentsToday,
      },
      family: {
        profiles: familyProfilesTotal,
        selfProfiles: familySelfProfiles,
        membersAdded: familyProfilesTotal - familySelfProfiles,
        accountsWithProfiles: familyAccountRows.length,
      },
      monthly: buildMonthlySeries(userDates.map((u) => u.createdAt), orderRows, now),
    };
  }
}
