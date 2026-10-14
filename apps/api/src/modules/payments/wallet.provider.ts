import { BadRequestException, Injectable } from '@nestjs/common';
import { WalletService } from '../wallet/wallet.service';
import {
  CreatePaymentInput,
  CreatePaymentResult,
  PaymentMethod,
  PaymentProvider,
  WebhookEvent,
} from './payment-provider.interface';

/** Store-wallet payments: deducted from the user's OneStop wallet balance. */
@Injectable()
export class WalletProvider implements PaymentProvider {
  readonly method: PaymentMethod = 'WALLET';

  constructor(private readonly wallet: WalletService) {}

  async createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult> {
    if (!Number.isInteger(input.amountMinor) || input.amountMinor <= 0) {
      throw new BadRequestException('amountMinor must be a positive integer (paisa)');
    }
    if (!input.customerId) throw new BadRequestException('Wallet payments require a signed-in user');
    await this.wallet.deduct(input.customerId, input.amountMinor, `order_${input.orderId}`);
    return { providerReference: `wallet_${input.orderId}`, status: 'PAID' };
  }

  parseWebhook(): WebhookEvent | null {
    return null; // wallet has no gateway callbacks
  }
}
