import { Transform } from 'class-transformer';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

export class CreateContactMessageDto {
  @Transform(trim)
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name!: string;

  @Transform(trim)
  @IsEmail()
  @MaxLength(160)
  email!: string;

  @Transform(trim)
  @IsString()
  @MinLength(3)
  @MaxLength(160)
  subject!: string;

  @Transform(trim)
  @IsString()
  @MinLength(10)
  @MaxLength(4000)
  message!: string;
}
