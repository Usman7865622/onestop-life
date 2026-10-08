import { Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsOptional, IsString, Length, MaxLength } from 'class-validator';
import { FacilityType } from '@prisma/client';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

export class CreateFacilityDto {
  @Transform(trim)
  @IsString()
  @Length(2, 120)
  name!: string;

  @IsEnum(FacilityType)
  type!: FacilityType;

  @Transform(trim)
  @IsString()
  @Length(3, 255)
  address!: string;

  @Transform(trim)
  @IsString()
  @Length(2, 80)
  city!: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(32)
  phone?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(120)
  timings?: string;

  @IsOptional()
  @IsBoolean()
  isEmergency?: boolean;
}

export class ListFacilitiesQueryDto {
  @IsOptional()
  @IsEnum(FacilityType)
  type?: FacilityType;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(80)
  city?: string;
}
