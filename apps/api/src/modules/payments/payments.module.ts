import { Module } from '@nestjs/common';
import { CodProvider } from './cod.provider';
import { CardProvider } from './card.provider';
import { JazzcashProvider } from './jazzcash.provider';
import { EasypaisaProvider } from './easypaisa.provider';
import { WalletProvider } from './wallet.provider';
import { PaypalProvider, paypalConfig } from './paypal.provider';
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
    PaypalProvider,
    // To add a gateway: create an adapter class and add it to this list.
    // PayPal joins the list only when its merchant credentials are set.
    { provide: PAYMENT_PROVIDERS, inject: [CodProvider, CardProvider, JazzcashProvider, EasypaisaProvider, WalletProvider, PaypalProvider], useFactory: (cod: CodProvider, card: CardProvider, jazzcash: JazzcashProvider, easypaisa: EasypaisaProvider, wallet: WalletProvider, paypal: PaypalProvider) => (paypalConfig() ? [cod, card, jazzcash, easypaisa, wallet, paypal] : [cod, card, jazzcash, easypaisa, wallet]) },
    PaymentsService,
  ],
  exports: [PaymentsService],
})
export class PaymentsModule {}
