import { Transform, Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);
const toInt = ({ value }: { value: unknown }) => {
  const parsed = typeof value === 'string' ? Number.parseInt(value, 10) : value;
  return typeof parsed === 'number' && Number.isNaN(parsed) ? undefined : parsed;
};

export class PrescriptionItemDto {
  @IsOptional()
  @IsUUID()
  productId?: string;

  @IsString()
  @Transform(trim)
  @MaxLength(160)
  name!: string;

  @IsOptional()
  @IsString()
  @Transform(trim)
  @MaxLength(80)
  dosage?: string;

  @IsOptional()
  @IsString()
  @Transform(trim)
  @MaxLength(80)
  frequency?: string;

  @IsOptional()
  @Transform(toInt)
  @IsInt()
  @Min(1)
  @Max(365)
  durationDays?: number;

  @IsOptional()
  @Transform(toInt)
  @IsInt()
  @Min(1)
  @Max(50)
  qty?: number;

  @IsOptional()
  @IsString()
  @Transform(trim)
  @MaxLength(200)
  notes?: string;
}

export class CreatePrescriptionDto {
  @IsUUID()
  appointmentId!: string;

  @IsOptional()
  @IsString()
  @Transform(trim)
  @MaxLength(300)
  diagnosis?: string;

  @IsOptional()
  @IsString()
  @Transform(trim)
  @MaxLength(500)
  notes?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => PrescriptionItemDto)
  items!: PrescriptionItemDto[];
}
