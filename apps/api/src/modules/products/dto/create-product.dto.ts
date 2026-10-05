import { IsBoolean, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateProductDto {
  @IsString()
  nameEn!: string;

  @IsOptional()
  @IsString()
  nameUr?: string;

  @IsInt()
  @Min(1)
  priceMinor!: number;

  @IsString()
  unit!: string;

  @IsString()
  category!: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsBoolean()
  inStock?: boolean;
}
