import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import { RoleKey } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { AuthUser } from '../../common/types/auth-user';
import { CreateAppointmentDto, UpdateAppointmentStatusDto } from './dto/appointment.dto';
import { AppointmentsService } from './appointments.service';

@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointments: AppointmentsService) {}

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateAppointmentDto) {
    return this.appointments.create(user, dto);
  }

  @Get('mine')
  mine(@CurrentUser() user: AuthUser) {
    return this.appointments.listMine(user);
  }

  @Get('doctor/mine')
  @Roles(RoleKey.DOCTOR, RoleKey.ADMIN)
  doctorMine(@CurrentUser() user: AuthUser) {
    return this.appointments.listDoctorMine(user);
  }

  @Patch(':id/cancel')
  cancel(@Param('id', new ParseUUIDPipe()) id: string, @CurrentUser() user: AuthUser) {
    return this.appointments.cancel(id, user);
  }

  @Patch(':id/status')
  @Roles(RoleKey.DOCTOR, RoleKey.ADMIN)
  updateStatus(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: UpdateAppointmentStatusDto,
  ) {
    return this.appointments.updateStatus(id, user, dto.status);
  }
}
