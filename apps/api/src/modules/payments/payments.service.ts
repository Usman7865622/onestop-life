import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthUser } from '../../common/types/auth-user';
import { PAYMENT_PROVIDERS, PaymentMethod, PaymentProvider } from './payment-provider.interface';
import { PaypalProvider, paypalConfig, pkrMinorToUsd } from './paypal.provider';

@Injectable()
export class PaymentsService {
  private readonly providers: Map<PaymentMethod, PaymentProvider>;

  constructor(
    @Inject(PAYMENT_PROVIDERS) providers: PaymentProvider[],
    private readonly prisma: PrismaService,
    private readonly paypal: PaypalProvider,
  ) {
    this.providers = new Map(providers.map((p) => [p.method, p]));
  }

  /** USD-per-PKR conversion rate when PayPal is configured, else null. */
  paypalUsdRate(): number | null {
    return paypalConfig()?.usdRate ?? null;
  }

  /**
   * Confirm a PayPal payment after the customer returns from PayPal.
   * Captures the approved order, verifies PayPal captured exactly the
   * order total (converted at the configured rate), then marks the
   * payment PAID and the order PAID — unless the order is Rx-gated, in
   * which case it keeps the pharmacist hold, exactly like a card payment.
   */
  async capturePaypal(user: AuthUser, paypalOrderId: string) {
    const record = await this.prisma.paymentRecord.findUnique({
      where: { providerReference: paypalOrderId },
      include: { order: true },
    });
    if (!record || record.method !== 'PAYPAL' || record.order.userId !== user.id) {
      throw new NotFoundException('PayPal payment not found');
    }
    if (record.status === 'PAID') return { status: 'PAID', orderId: record.orderId };
    const cfg = paypalConfig();
    if (!cfg) throw new BadRequestException('PayPal is not configured on this server');
    const result = await this.paypal.captureOrder(paypalOrderId);
    const expected = pkrMinorToUsd(record.order.totalMinor, cfg.usdRate);
    if (result.status !== 'COMPLETED' || result.currency !== 'USD' || result.value !== expected) {
      await this.prisma.paymentRecord.update({ where: { id: record.id }, data: { status: 'FAILED' } });
      throw new BadRequestException('PayPal payment could not be verified');
    }
    await this.prisma.paymentRecord.update({ where: { id: record.id }, data: { status: 'PAID' } });
    if (!record.order.requiresRx) {
      await this.prisma.order.update({ where: { id: record.orderId }, data: { status: OrderStatus.PAID } });
    }
    return { status: 'PAID', orderId: record.orderId };
  }

  get(method: PaymentMethod): PaymentProvider {
    const provider = this.providers.get(method);
    if (!provider) throw new BadRequestException(`Payment method ${method} is not available`);
    return provider;
  }

  availableMethods(): PaymentMethod[] {
    return [...this.providers.keys()];
  }
}
