export const PAYMENT_METHODS = ['COD', 'JAZZCASH', 'EASYPAISA', 'CARD', 'RAAST'] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export type PaymentStatus = 'PENDING' | 'REQUIRES_ACTION' | 'PAID' | 'FAILED' | 'CANCELLED';

export interface CreatePaymentInput {
  orderId: string;
  /** Integer amount in paisa (1 PKR = 100 paisa). Never a float. */
  amountMinor: number;
  currency: 'PKR';
  customerPhone: string;
  customerEmail?: string;
  returnUrl?: string;
  /** Sent to the gateway so a retried request cannot create a second charge. */
  idempotencyKey: string;
}

export interface CreatePaymentResult {
  providerReference: string;
  status: PaymentStatus;
  /** Where to send the customer to complete payment (wallet or card page), if the gateway needs it. */
  redirectUrl?: string;
}

export interface WebhookEvent {
  providerReference: string;
  status: PaymentStatus;
  amountMinor?: number;
  raw: unknown;
}

/**
 * Every gateway (JazzCash, Easypaisa, PayFast, Safepay, ...) is one adapter implementing this.
 * Order code only ever talks to this interface.
 */
export interface PaymentProvider {
  readonly method: PaymentMethod;
  createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult>;
  /**
   * Verifies the gateway's signature over the RAW body and maps it to a WebhookEvent.
   * Returns null when the signature is invalid or the provider has no webhooks.
   */
  parseWebhook(headers: Record<string, string | string[] | undefined>, rawBody: Buffer): WebhookEvent | null;
}

export const PAYMENT_PROVIDERS = Symbol('PAYMENT_PROVIDERS');
