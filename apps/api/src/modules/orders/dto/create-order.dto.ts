import { Type } from 'class-transformer';
import { IsArray, IsIn, IsInt, IsOptional, IsString, IsUUID, Min, ValidateNested } from 'class-validator';

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
  @IsIn(['COD', 'CARD', 'JAZZCASH', 'EASYPAISA', 'WALLET'])
  paymentMethod!: 'COD' | 'CARD' | 'JAZZCASH' | 'EASYPAISA' | 'WALLET';

  @IsOptional()
  @IsString()
  shippingCity?: string;

  @IsOptional()
  @IsString()
  shippingPostalCode?: string;

  @IsOptional()
  @IsIn(['Home', 'Office', 'Other'])
  addressLabel?: string;

  @IsOptional()
  @IsString()
  deliveryNotes?: string;

  @IsOptional()
  @IsIn(['STANDARD', 'EXPRESS'])
  deliverySpeed?: 'STANDARD' | 'EXPRESS';

  @IsOptional()
  @IsString()
  emiPlan?: string;

  @IsOptional()
  @IsString()
  deliverySlot?: string;

  @IsOptional()
  giftWrap?: boolean;

  @IsOptional()
  @IsString()
  giftMessage?: string;

  /** Document key/reference for the customer's prescription (file storage comes later). Required when any item is an Rx medicine. */
  @IsOptional()
  @IsString()
  prescriptionKey?: string;

  /**
   * A OneStop digital prescription that covers the order's Rx medicines,
   * issued by a doctor after a completed visit. When present and valid it
   * satisfies the Rx gate instead of an uploaded prescription document — the
   * pharmacist still verifies the order before dispatch.
   */
  @IsOptional()
  @IsUUID()
  prescriptionId?: string;
}
