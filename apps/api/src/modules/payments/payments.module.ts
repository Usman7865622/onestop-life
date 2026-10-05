import { Module } from '@nestjs/common';
import { CodProvider } from './cod.provider';
import { CardProvider } from './card.provider';
import { PAYMENT_PROVIDERS } from './payment-provider.interface';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';

@Module({
  controllers: [PaymentsController],
  providers: [
    CodProvider,
    CardProvider,
    // To add a gateway: create an adapter class and add it to this list.
    { provide: PAYMENT_PROVIDERS, inject: [CodProvider, CardProvider], useFactory: (cod: CodProvider, card: CardProvider) => [cod, card] },
    PaymentsService,
  ],
  exports: [PaymentsService],
})
export class PaymentsModule {}
