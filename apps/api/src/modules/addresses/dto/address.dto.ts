import { IsBoolean, IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateAddressDto {
  @IsString() @MaxLength(40) label!: string;
  @IsString() @MaxLength(120) name!: string;
  @IsString() @MaxLength(20) phone!: string;
  @IsString() @MaxLength(500) address!: string;
  @IsString() @MaxLength(60) city!: string;
  @IsOptional() @IsString() @MaxLength(10) postalCode?: string;
  @IsOptional() @IsBoolean() isDefault?: boolean;
}

export class UpdateAddressDto {
  @IsOptional() @IsString() @MaxLength(40) label?: string;
  @IsOptional() @IsString() @MaxLength(120) name?: string;
  @IsOptional() @IsString() @MaxLength(20) phone?: string;
  @IsOptional() @IsString() @MaxLength(500) address?: string;
  @IsOptional() @IsString() @MaxLength(60) city?: string;
  @IsOptional() @IsString() @MaxLength(10) postalCode?: string;
  @IsOptional() @IsBoolean() isDefault?: boolean;
  @IsOptional() @IsIn(['Home', 'Office', 'Other']) addressLabel?: string;
}
