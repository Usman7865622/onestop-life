import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { RoleKey } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { AuthUser } from '../../common/types/auth-user';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrdersService } from './orders.service';

@Controller('orders')
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateOrderDto) {
    return this.orders.create(user, dto);
  }

  @Get('mine')
  mine(@CurrentUser() user: AuthUser) {
    return this.orders.listMine(user);
  }

  @Post(':id/refund')
  @Roles(RoleKey.ADMIN)
  refund(@Param('id') id: string, @Body() body: { amountMinor?: number; reason?: string }) {
    return this.orders.refund(id, body.amountMinor, body.reason);
  }
}
