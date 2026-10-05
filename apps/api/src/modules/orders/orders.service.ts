import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DiscountType, OrderStatus } from '@prisma/client';
import { AuthUser } from '../../common/types/auth-user';
import { PrismaService } from '../../prisma/prisma.service';
import { PaymentsService } from '../payments/payments.service';
import { CreateOrderDto } from './dto/create-order.dto';

const SHIPPING_MINOR = 15000;
const FREE_SHIPPING_THRESHOLD = 300000;

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly payments: PaymentsService,
  ) {}

  async create(user: AuthUser, dto: CreateOrderDto) {
    if (!dto.items?.length) throw new BadRequestException('Add at least one product to your cart');

    const requested = new Map<string, number>();
    for (const item of dto.items) {
      requested.set(item.productId, (requested.get(item.productId) ?? 0) + item.quantity);
    }

    const products = await this.prisma.product.findMany({ where: { id: { in: [...requested.keys()] } } });
    if (products.length !== requested.size) throw new NotFoundException('One or more products are no longer available');
    if (products.some((product) => !product.inStock)) throw new BadRequestException('One or more products are out of stock');

    const items = products.map((product) => ({
      product,
      quantity: requested.get(product.id) ?? 0,
    }));
    const subtotalMinor = items.reduce((total, item) => total + item.product.priceMinor * item.quantity, 0);
    const discount = await this.getDiscount(dto.discountCode, subtotalMinor);
    const shippingMinor = subtotalMinor >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_MINOR;
    const totalMinor = subtotalMinor - discount.amountMinor + shippingMinor;

    const order = await this.prisma.order.create({
      data: {
        userId: user.id,
        status: dto.paymentMethod === 'COD' ? OrderStatus.PROCESSING : OrderStatus.PENDING_PAYMENT,
        subtotalMinor,
        discountMinor: discount.amountMinor,
        shippingMinor,
        totalMinor,
        discountCode: discount.code,
        shippingName: dto.shippingName.trim(),
        shippingPhone: dto.shippingPhone.trim(),
        shippingAddress: dto.shippingAddress.trim(),
        items: {
          create: items.map(({ product, quantity }) => ({
            productId: product.id,
            productName: product.nameEn,
            priceMinor: product.priceMinor,
            quantity,
          })),
        },
      },
      include: { items: true },
    });

    const payment = await this.payments.get(dto.paymentMethod).createPayment({
      orderId: order.id,
      amountMinor: totalMinor,
      currency: 'PKR',
      customerPhone: dto.shippingPhone,
      idempotencyKey: order.id,
    });

    const savedPayment = await this.prisma.paymentRecord.create({
      data: {
        orderId: order.id,
        method: dto.paymentMethod,
        status: payment.status,
        amountMinor: totalMinor,
        providerReference: payment.providerReference,
      },
    });

    if (discount.code) {
      await this.prisma.discountCode.update({ where: { code: discount.code }, data: { usedCount: { increment: 1 } } });
    }

    if (payment.status === 'PAID') {
      await this.prisma.order.update({ where: { id: order.id }, data: { status: OrderStatus.PAID } });
    }

    return {
      order: { ...order, totalMinor, discountMinor: discount.amountMinor, shippingMinor },
      payment: { ...savedPayment, redirectUrl: payment.redirectUrl },
    };
  }

  listMine(user: AuthUser) {
    return this.prisma.order.findMany({
      where: { userId: user.id },
      include: { items: true, payments: true, refunds: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async refund(orderId: string, amountMinor?: number, reason?: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { payments: { orderBy: { createdAt: 'desc' }, take: 1 } },
    });
    if (!order) throw new NotFoundException('Order not found');
    if (!order.payments[0] || order.payments[0].status !== 'PAID') {
      throw new BadRequestException('Only paid orders can be refunded');
    }

    const refundAmount = amountMinor ?? order.totalMinor;
    if (!Number.isInteger(refundAmount) || refundAmount <= 0 || refundAmount > order.totalMinor) {
      throw new BadRequestException('Refund amount must be a positive amount up to the order total');
    }

    const refund = await this.prisma.refund.create({
      data: {
        orderId,
        paymentId: order.payments[0].id,
        amountMinor: refundAmount,
        reason: reason?.trim() || undefined,
        status: 'COMPLETED',
        providerReference: `refund_${orderId}`,
      },
    });

    await this.prisma.paymentRecord.update({ where: { id: order.payments[0].id }, data: { status: 'REFUNDED' } });
    await this.prisma.order.update({ where: { id: orderId }, data: { status: 'REFUNDED' } });
    return refund;
  }

  private async getDiscount(rawCode: string | undefined, subtotalMinor: number) {
    if (!rawCode?.trim()) return { code: null, amountMinor: 0 };

    const code = rawCode.trim().toUpperCase();
    const discount = await this.prisma.discountCode.findUnique({ where: { code } });
    const now = new Date();
    if (!discount || !discount.active || (discount.startsAt && discount.startsAt > now) || (discount.endsAt && discount.endsAt < now)) {
      throw new BadRequestException('This discount code is invalid or expired');
    }
    if (discount.maxUses !== null && discount.usedCount >= discount.maxUses) {
      throw new BadRequestException('This discount code has reached its usage limit');
    }

    const amountMinor = discount.type === DiscountType.PERCENT
      ? Math.min(subtotalMinor, Math.floor(subtotalMinor * discount.value / 100))
      : Math.min(subtotalMinor, discount.value);
    return { code, amountMinor };
  }
}
