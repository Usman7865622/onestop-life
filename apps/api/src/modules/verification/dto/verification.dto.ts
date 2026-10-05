import { Transform, Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Length, Max, MaxLength, Min } from 'class-validator';
import { VerificationStatus, VerificationType } from '@prisma/client';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

export class CreateVerificationDto {
  @IsEnum(VerificationType)
  type!: VerificationType;

  @Transform(trim)
  @IsString()
  @Length(3, 64)
  licenseNumber!: string;

  @Transform(trim)
  @IsString()
  @Length(2, 120)
  licenseAuthority!: string;

  /** Storage key of the uploaded licence file. The upload service arrives in a later phase. */
  @Transform(trim)
  @IsString()
  @Length(1, 255)
  documentKey!: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(500)
  notes?: string;
}

export class ApproveDto {
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(500)
  note?: string;
}

export class RejectDto {
  @Transform(trim)
  @IsString()
  @Length(3, 500)
  note!: string;
}

export class ListVerificationQueryDto {
  @IsOptional()
  @IsEnum(VerificationStatus)
  status?: VerificationStatus;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  pageSize: number = 20;
}
