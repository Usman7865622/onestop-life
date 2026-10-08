import { Transform } from 'class-transformer';
import { IsDateString, IsOptional, IsString, IsUUID, Length, MaxLength } from 'class-validator';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

export class ListLabTestsQueryDto {
  @IsOptional()
  @IsUUID()
  facilityId?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(120)
  q?: string;
}

export class CreateLabBookingDto {
  @IsUUID()
  testId!: string;

  @IsDateString()
  scheduledAt!: string;

  @Transform(trim)
  @IsString()
  @Length(5, 255)
  address!: string;

  @Transform(trim)
  @IsString()
  @Length(2, 120)
  patientName!: string;

  @Transform(trim)
  @IsString()
  @Length(10, 20)
  phone!: string;
}
