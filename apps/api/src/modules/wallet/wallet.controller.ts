import { Body, Controller, Get, Post } from '@nestjs/common';
import { IsInt, Min } from 'class-validator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthUser } from '../../common/types/auth-user';
import { WalletService } from './wallet.service';

class TopupDto {
  @IsInt() @Min(1) amountMinor!: number;
}

@Controller('wallet')
export class WalletController {
  constructor(private readonly wallet: WalletService) {}

  @Get() balance(@CurrentUser() user: AuthUser) { return this.wallet.balance(user); }

  @Get('transactions') history(@CurrentUser() user: AuthUser) { return this.wallet.transactions(user); }

  @Post('topup') topup(@CurrentUser() user: AuthUser, @Body() dto: TopupDto) { return this.wallet.topup(user, dto.amountMinor); }
}
