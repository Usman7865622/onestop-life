import { Body, Controller, Get, Post } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { AuthUser } from '../../common/types/auth-user';
import { PaymentsService } from './payments.service';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  /** The checkout page asks which methods are enabled. */
  @Public()
  @Get('methods')
  methods() {
    return { methods: this.payments.availableMethods(), paypalUsdRate: this.payments.paypalUsdRate() };
  }

  /** The checkout return page confirms a PayPal payment after approval. */
  @Post('paypal/capture')
  capturePaypal(@CurrentUser() user: AuthUser, @Body() body: { paypalOrderId: string }) {
    return this.payments.capturePaypal(user, body.paypalOrderId);
  }
}
