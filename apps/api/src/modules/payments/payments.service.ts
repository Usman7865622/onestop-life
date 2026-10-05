import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { PAYMENT_PROVIDERS, PaymentMethod, PaymentProvider } from './payment-provider.interface';

@Injectable()
export class PaymentsService {
  private readonly providers: Map<PaymentMethod, PaymentProvider>;

  constructor(@Inject(PAYMENT_PROVIDERS) providers: PaymentProvider[]) {
    this.providers = new Map(providers.map((p) => [p.method, p]));
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
