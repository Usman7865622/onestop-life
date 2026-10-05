import { Transform } from 'class-transformer';
import { IsString, Matches, MaxLength, MinLength } from 'class-validator';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

export class RequestOtpDto {
  @Transform(trim)
  @IsString()
  @MinLength(10)
  @MaxLength(20)
  phone!: string;
}

export class VerifyOtpDto {
  @Transform(trim)
  @IsString()
  @MinLength(10)
  @MaxLength(20)
  phone!: string;

  @Transform(trim)
  @IsString()
  @Matches(/^\d{6}$/, { message: 'code must be 6 digits' })
  code!: string;
}
