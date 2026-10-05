import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { CreatePaymentInput, CreatePaymentResult, PaymentMethod, PaymentProvider, WebhookEvent } from './payment-provider.interface';

/**
 * Local card adapter. Replace this provider with a gateway adapter such as Stripe or Safepay
 * before enabling card charges in production; this adapter never sends money to a bank.
 */
@Injectable()
export class CardProvider implements PaymentProvider {
  readonly method: PaymentMethod = 'CARD';

  async createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult> {
    if (process.env.NODE_ENV === 'production') {
      throw new ServiceUnavailableException('Card payments are not configured for this deployment');
    }

    return {
      providerReference: `card_test_${input.orderId}`,
      status: 'PAID',
    };
  }

  parseWebhook(_headers: Record<string, string | string[] | undefined>, _rawBody: Buffer): WebhookEvent | null {
    return null;
  }
}
