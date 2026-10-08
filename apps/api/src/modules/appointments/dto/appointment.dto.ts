import { Transform } from 'class-transformer';
import { IsDateString, IsEnum, IsOptional, IsString, Length, MaxLength } from 'class-validator';
import { AppointmentStatus, AppointmentType } from '@prisma/client';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

export class CreateAppointmentDto {
  @IsString()
  doctorProfileId!: string;

  @IsOptional()
  @IsString()
  facilityId?: string;

  @IsDateString()
  startsAt!: string;

  @IsDateString()
  endsAt!: string;

  @IsOptional()
  @IsEnum(AppointmentType)
  type?: AppointmentType;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(500)
  reason?: string;

  @Transform(trim)
  @IsString()
  @Length(2, 120)
  patientName!: string;

  @Transform(trim)
  @IsString()
  @Length(10, 20)
  patientPhone!: string;
}

export class UpdateAppointmentStatusDto {
  @IsEnum(AppointmentStatus)
  status!: AppointmentStatus;
}
