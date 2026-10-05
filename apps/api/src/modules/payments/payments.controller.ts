import { Controller, Get } from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';
import { PaymentsService } from './payments.service';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  /** The checkout page asks which methods are enabled. */
  @Public()
  @Get('methods')
  methods() {
    return { methods: this.payments.availableMethods() };
  }
}
