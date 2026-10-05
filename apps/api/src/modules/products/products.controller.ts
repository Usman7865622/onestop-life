import { Body, Controller, Get, Post } from '@nestjs/common';
import { RoleKey } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { AuthUser } from '../../common/types/auth-user';
import { CreateProductDto } from './dto/create-product.dto';
import { Public } from '../../common/decorators/public.decorator';
import { ProductsService } from './products.service';

@Controller('products')
export class ProductsController {
  constructor(private readonly products: ProductsService) {}

  @Get()
  @Public()
  list() {
    return this.products.list();
  }

  @Get('mine')
  @Roles(RoleKey.SELLER, RoleKey.ADMIN)
  mine(@CurrentUser() user: AuthUser) {
    return this.products.listMine(user.id);
  }

  @Post()
  @Roles(RoleKey.SELLER, RoleKey.ADMIN)
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateProductDto) {
    return this.products.create(user.id, dto);
  }
}