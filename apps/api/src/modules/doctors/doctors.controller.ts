import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { RoleKey } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { AuthUser } from '../../common/types/auth-user';
import { ListDoctorsQueryDto, UpsertDoctorProfileDto } from './dto/doctor.dto';
import { DoctorsService } from './doctors.service';

@Controller('doctors')
export class DoctorsController {
  constructor(private readonly doctors: DoctorsService) {}

  @Get()
  @Public()
  list(@Query() query: ListDoctorsQueryDto) {
    return this.doctors.list(query);
  }

  @Get(':id')
  @Public()
  getById(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.doctors.getById(id);
  }

  @Post('me/profile')
  @Roles(RoleKey.DOCTOR, RoleKey.ADMIN)
  upsertMinePost(@CurrentUser() user: AuthUser, @Body() dto: UpsertDoctorProfileDto) {
    return this.doctors.upsertMine(user.id, dto);
  }

  @Patch('me/profile')
  @Roles(RoleKey.DOCTOR, RoleKey.ADMIN)
  upsertMinePatch(@CurrentUser() user: AuthUser, @Body() dto: UpsertDoctorProfileDto) {
    return this.doctors.upsertMine(user.id, dto);
  }
}
