import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import { RoleKey } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { AuthUser } from '../../common/types/auth-user';
import { CreateOrderDto } from './dto/create-order.dto';
import { ReviewPrescriptionDto } from './dto/review-prescription.dto';
import { OrdersService } from './orders.service';

@Controller('orders')
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Post(':id/return')
  requestReturn(
    @CurrentUser() user: AuthUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() body: { reason: string },
  ) {
    return this.orders.requestReturn(user, id, body?.reason ?? '');
  }

  @Public()
  @Post('validate-discount')
  validateDiscount(@Body() body: { code?: string; subtotalMinor?: number }) {
    return this.orders.validateDiscount(body.code, Number(body.subtotalMinor) || 0);
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateOrderDto) {
    return this.orders.create(user, dto);
  }

  @Get('mine')
  mine(@CurrentUser() user: AuthUser) {
    return this.orders.listMine(user);
  }

  @Get('rx-queue')
  @Roles(RoleKey.PHARMACY, RoleKey.ADMIN)
  rxQueue() {
    return this.orders.listRxQueue();
  }

  @Patch(':id/prescription')
  @Roles(RoleKey.PHARMACY, RoleKey.ADMIN)
  reviewPrescription(@Param('id') id: string, @Body() dto: ReviewPrescriptionDto) {
    return this.orders.reviewPrescription(id, dto.decision, dto.notes);
  }

  @Post(':id/refund')
  @Roles(RoleKey.ADMIN)
  refund(@Param('id') id: string, @Body() body: { amountMinor?: number; reason?: string }) {
    return this.orders.refund(id, body.amountMinor, body.reason);
  }
}
