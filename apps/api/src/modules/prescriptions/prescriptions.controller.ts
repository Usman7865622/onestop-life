import { Body, Controller, Get, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { RoleKey } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { AuthUser } from '../../common/types/auth-user';
import { CreatePrescriptionDto } from './dto/prescription.dto';
import { PrescriptionsService } from './prescriptions.service';

@Controller('prescriptions')
export class PrescriptionsController {
  constructor(private readonly prescriptions: PrescriptionsService) {}

  @Post()
  @Roles(RoleKey.DOCTOR, RoleKey.ADMIN)
  issue(@CurrentUser() user: AuthUser, @Body() dto: CreatePrescriptionDto) {
    return this.prescriptions.create(user, dto);
  }

  @Get('mine')
  mine(@CurrentUser() user: AuthUser) {
    return this.prescriptions.listMine(user);
  }

  @Get('refills/mine')
  refillsMine(@CurrentUser() user: AuthUser) {
    return this.prescriptions.refillsMine(user);
  }

  @Get('doctor/mine')
  @Roles(RoleKey.DOCTOR, RoleKey.ADMIN)
  doctorMine(@CurrentUser() user: AuthUser) {
    return this.prescriptions.listDoctorMine(user);
  }

  @Get('appointment/:appointmentId')
  byAppointment(@Param('appointmentId', new ParseUUIDPipe()) appointmentId: string, @CurrentUser() user: AuthUser) {
    return this.prescriptions.getByAppointmentId(appointmentId, user);
  }

  @Get(':id')
  byId(@Param('id', new ParseUUIDPipe()) id: string, @CurrentUser() user: AuthUser) {
    return this.prescriptions.getById(id, user);
  }
}
