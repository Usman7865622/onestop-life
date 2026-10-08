import { Transform, Type } from 'class-transformer';
import { IsEnum, IsIn, IsInt, IsOptional, IsString, Length, Max, MaxLength, Min } from 'class-validator';
import { BloodGroup } from '@prisma/client';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

export const BLOOD_URGENCIES = ['NORMAL', 'URGENT', 'CRITICAL'] as const;

export class ListBloodBanksQueryDto {
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(80)
  city?: string;
}

export class ListBloodRequestsQueryDto {
  @IsOptional()
  @IsEnum(BloodGroup)
  bloodGroup?: BloodGroup;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(80)
  city?: string;
}

export class CreateBloodRequestDto {
  @IsEnum(BloodGroup)
  bloodGroup!: BloodGroup;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(20)
  units!: number;

  @Transform(trim)
  @IsString()
  @Length(2, 80)
  city!: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(160)
  hospitalName?: string;

  @IsOptional()
  @IsIn(BLOOD_URGENCIES)
  urgency?: (typeof BLOOD_URGENCIES)[number];

  @Transform(trim)
  @IsString()
  @Length(10, 20)
  contactPhone!: string;
}
