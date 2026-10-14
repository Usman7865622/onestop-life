import { Module } from '@nestjs/common';
import { CodProvider } from './cod.provider';
import { CardProvider } from './card.provider';
import { JazzcashProvider } from './jazzcash.provider';
import { EasypaisaProvider } from './easypaisa.provider';
import { WalletProvider } from './wallet.provider';
import { WalletModule } from '../wallet/wallet.module';
import { PAYMENT_PROVIDERS } from './payment-provider.interface';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';

@Module({
  imports: [WalletModule],
  controllers: [PaymentsController],
  providers: [
    CodProvider,
    CardProvider,
    JazzcashProvider,
    EasypaisaProvider,
    WalletProvider,
    // To add a gateway: create an adapter class and add it to this list.
    { provide: PAYMENT_PROVIDERS, inject: [CodProvider, CardProvider, JazzcashProvider, EasypaisaProvider, WalletProvider], useFactory: (cod: CodProvider, card: CardProvider, jazzcash: JazzcashProvider, easypaisa: EasypaisaProvider, wallet: WalletProvider) => [cod, card, jazzcash, easypaisa, wallet] },
    PaymentsService,
  ],
  exports: [PaymentsService],
})
export class PaymentsModule {}
