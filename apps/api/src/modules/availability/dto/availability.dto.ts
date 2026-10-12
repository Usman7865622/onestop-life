import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Matches, Max, Min } from 'class-validator';

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

export class CreateAvailabilitySlotDto {
  /**
   * Target doctor profile. Optional when the caller is a DOCTOR — their own
   * profile is used. ADMINs must pass it to manage another doctor's schedule.
   */
  @IsOptional()
  @IsString()
  doctorProfileId?: string;

  @IsOptional()
  @IsString()
  facilityId?: string;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(6)
  weekday!: number;

  @Matches(TIME_PATTERN, { message: 'startTime must be HH:MM (24h)' })
  startTime!: string;

  @Matches(TIME_PATTERN, { message: 'endTime must be HH:MM (24h)' })
  endTime!: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(10)
  @Max(120)
  slotMinutes?: number;
}
