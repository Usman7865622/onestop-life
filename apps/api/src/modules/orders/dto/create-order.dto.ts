import { Type } from 'class-transformer';
import { IsArray, IsIn, IsInt, IsOptional, IsString, Min, ValidateNested } from 'class-validator';

export class CreateOrderItemDto {
  @IsString()
  productId!: string;

  @IsInt()
  @Min(1)
  quantity!: number;
}

export class CreateOrderDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items!: CreateOrderItemDto[];

  @IsString()
  shippingName!: string;

  @IsString()
  shippingPhone!: string;

  @IsString()
  shippingAddress!: string;

  @IsOptional()
  @IsString()
  discountCode?: string;

  @IsString()
  @IsIn(['COD', 'CARD'])
  paymentMethod!: 'COD' | 'CARD';

  /** Document key/reference for the customer's prescription (file storage comes later). Required when any item is an Rx medicine. */
  @IsOptional()
  @IsString()
  prescriptionKey?: string;
}
