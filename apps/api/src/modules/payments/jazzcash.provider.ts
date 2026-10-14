import { BadRequestException, Injectable } from '@nestjs/common';
import {
  CreatePaymentInput,
  CreatePaymentResult,
  PaymentMethod,
  PaymentProvider,
  WebhookEvent,
} from './payment-provider.interface';

/**
 * JazzCash mobile-wallet adapter (test mode). The customer approves the
 * charge from their JazzCash app; this adapter simulates that handshake
 * and never moves real money.
 */
@Injectable()
export class JazzcashProvider implements PaymentProvider {
  readonly method: PaymentMethod = 'JAZZCASH';

  async createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult> {
    if (!Number.isInteger(input.amountMinor) || input.amountMinor <= 0) {
      throw new BadRequestException('amountMinor must be a positive integer (paisa)');
    }
    return { providerReference: `jazzcash_test_${input.orderId}`, status: 'PENDING' };
  }

  parseWebhook(): WebhookEvent | null {
    return null; // no gateway callbacks in test mode
  }
}
