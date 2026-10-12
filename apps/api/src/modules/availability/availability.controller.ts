import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { RoleKey } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { AuthUser } from '../../common/types/auth-user';
import { AvailabilityService } from './availability.service';
import { CreateAvailabilitySlotDto } from './dto/availability.dto';

@Controller('availability')
export class AvailabilityController {
  constructor(private readonly availability: AvailabilityService) {}

  @Post()
  @Roles(RoleKey.DOCTOR, RoleKey.ADMIN)
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateAvailabilitySlotDto) {
    return this.availability.create(user, dto);
  }

  @Get('my')
  @Roles(RoleKey.DOCTOR)
  my(@CurrentUser() user: AuthUser) {
    return this.availability.my(user);
  }

  @Delete(':id')
  @Roles(RoleKey.DOCTOR, RoleKey.ADMIN)
  remove(@Param('id', new ParseUUIDPipe()) id: string, @CurrentUser() user: AuthUser) {
    return this.availability.remove(id, user);
  }
}
