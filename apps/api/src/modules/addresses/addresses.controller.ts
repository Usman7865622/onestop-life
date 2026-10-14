import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthUser } from '../../common/types/auth-user';
import { AddressesService } from './addresses.service';
import { CreateAddressDto, UpdateAddressDto } from './dto/address.dto';

@Controller('addresses')
export class AddressesController {
  constructor(private readonly addresses: AddressesService) {}

  @Get() list(@CurrentUser() user: AuthUser) { return this.addresses.list(user); }
  @Post() create(@CurrentUser() user: AuthUser, @Body() dto: CreateAddressDto) { return this.addresses.create(user, dto); }
  @Patch(':id') update(@CurrentUser() user: AuthUser, @Param('id', new ParseUUIDPipe()) id: string, @Body() dto: UpdateAddressDto) { return this.addresses.update(user, id, dto); }
  @Delete(':id') remove(@CurrentUser() user: AuthUser, @Param('id', new ParseUUIDPipe()) id: string) { return this.addresses.remove(user, id); }
}
