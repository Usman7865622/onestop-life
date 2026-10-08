import { Transform, Type } from 'class-transformer';
import { IsArray, IsBoolean, IsInt, IsOptional, IsString, Length, MaxLength, Min } from 'class-validator';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

export class UpsertDoctorProfileDto {
  @Transform(trim)
  @IsString()
  @Length(2, 80)
  speciality!: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(200)
  qualifications?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  experienceYears?: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  feeMinor!: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  languages?: string[];

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(1000)
  about?: string;

  @IsOptional()
  @IsBoolean()
  isBookable?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  facilityIds?: string[];
}

export class ListDoctorsQueryDto {
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(80)
  speciality?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(80)
  city?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(120)
  q?: string;
}
