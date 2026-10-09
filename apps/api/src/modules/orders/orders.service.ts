import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DiscountType, OrderStatus, PrescriptionStatus } from '@prisma/client';
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

    // Rx gating: orders containing prescription medicines must carry a
    // prescription document key and wait for pharmacist verification before
    // dispatch (DRAP requires Rx medicines, incl. antibiotics, to be sold
    // only against a registered doctor's prescription).
    const rxItems = products.filter((product) => product.requiresRx);
    const prescriptionKey = dto.prescriptionKey?.trim();
    if (rxItems.length && (!prescriptionKey || prescriptionKey.length < 3)) {
      const names = rxItems.map((product) => product.nameEn).join(', ');
      throw new BadRequestException(
        `This order contains prescription medicines (${names}). Please attach your prescription so our pharmacist can verify it before dispatch.`,
      );
    }
    const gated = rxItems.length > 0;

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
        // Gated (Rx) orders stay PENDING_PAYMENT while prescriptionStatus is
        // PENDING — here PENDING_PAYMENT means "awaiting pharmacist
        // verification", not dispatched. Approval moves them to PROCESSING.
        status: gated ? OrderStatus.PENDING_PAYMENT : dto.paymentMethod === 'COD' ? OrderStatus.PROCESSING : OrderStatus.PENDING_PAYMENT,
        requiresRx: gated,
        prescriptionKey: gated ? prescriptionKey : undefined,
        prescriptionStatus: gated ? PrescriptionStatus.PENDING : undefined,
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

    // Gated orders keep their PENDING_PAYMENT hold until the pharmacist
    // approves (the payment record itself still shows PAID).
    if (payment.status === 'PAID' && !gated) {
      await this.prisma.order.update({ where: { id: order.id }, data: { status: OrderStatus.PAID } });
    }

    return {
      order: { ...order, totalMinor, discountMinor: discount.amountMinor, shippingMinor },
      payment: { ...savedPayment, redirectUrl: payment.redirectUrl },
    };
  }

  listMine(user: AuthUser) {
    // Full order rows are returned, so requiresRx / prescriptionStatus /
    // prescriptionNotes ride along and patients can see review progress.
    return this.prisma.order.findMany({
      where: { userId: user.id },
      include: { items: true, payments: true, refunds: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Pharmacist/admin queue: Rx orders still awaiting prescription review. */
  listRxQueue() {
    return this.prisma.order.findMany({
      where: { requiresRx: true, prescriptionStatus: PrescriptionStatus.PENDING },
      include: {
        items: true,
        user: { select: { id: true, name: true, phone: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async reviewPrescription(orderId: string, decision: 'APPROVED' | 'REJECTED', notes?: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Order not found');
    if (!order.requiresRx) throw new BadRequestException('This order does not contain prescription medicines');
    if (order.prescriptionStatus !== PrescriptionStatus.PENDING) {
      throw new BadRequestException('This prescription has already been reviewed');
    }

    const cleanNotes = notes?.trim() || undefined;
    return this.prisma.order.update({
      where: { id: orderId },
      data: {
        prescriptionStatus: decision === 'APPROVED' ? PrescriptionStatus.APPROVED : PrescriptionStatus.REJECTED,
        prescriptionNotes: cleanNotes,
        prescriptionReviewedAt: new Date(),
        // Approved orders are cleared for dispatch; rejected orders are cancelled.
        status: decision === 'APPROVED' ? OrderStatus.PROCESSING : OrderStatus.CANCELLED,
      },
      include: { items: true },
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
