import { BadRequestException, Injectable } from '@nestjs/common';
import {
  CreatePaymentInput,
  CreatePaymentResult,
  PaymentMethod,
  PaymentProvider,
  WebhookEvent,
} from './payment-provider.interface';

/** Cash on delivery: nothing is charged now. The payment is marked PAID when the courier confirms collection. */
@Injectable()
export class CodProvider implements PaymentProvider {
  readonly method: PaymentMethod = 'COD';

  async createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult> {
    if (!Number.isInteger(input.amountMinor) || input.amountMinor <= 0) {
      throw new BadRequestException('amountMinor must be a positive integer (paisa)');
    }
    return { providerReference: `cod_${input.orderId}`, status: 'PENDING' };
  }

  parseWebhook(): WebhookEvent | null {
    return null; // COD has no gateway callbacks
  }
}
