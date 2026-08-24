import {
  IsBoolean,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { OrderStatusEnum, PaymentStatusEnum, PaymentTypeEnum } from '../common/enums';

export class ShippingAddressDto {
  @IsString()
  @IsNotEmpty()
  street!: string;

  @IsString()
  @IsNotEmpty()
  city!: string;

  @IsString()
  @IsNotEmpty()
  country!: string;

  @IsString()
  @IsNotEmpty()
  phone!: string;

  @IsString()
  @IsOptional()
  postalCode?: string;
}

export class CreateOrderDto {
  @ValidateNested()
  @Type(() => ShippingAddressDto)
  @IsNotEmpty()
  shippingAddress!: ShippingAddressDto;

  @IsEnum(PaymentTypeEnum)
  @IsOptional()
  paymentType?: PaymentTypeEnum;

  @IsString()
  @IsOptional()
  couponCode?: string;

  @IsString()
  @IsOptional()
  note?: string;
}

export class FilterOrderDto {
  @IsEnum(OrderStatusEnum)
  @IsOptional()
  orderStatus?: OrderStatusEnum;

  @IsEnum(PaymentStatusEnum)
  @IsOptional()
  paymentStatus?: PaymentStatusEnum;

  @IsString()
  @IsOptional()
  search?: string;

  @IsNumber()
  @Type(() => Number)
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @IsNumber()
  @Type(() => Number)
  @Min(1)
  @IsOptional()
  limit?: number = 10;
}

export class UpdateOrderStatusDto {
  @IsEnum(OrderStatusEnum)
  @IsNotEmpty()
  orderStatus!: OrderStatusEnum;
}

export class UpdatePaymentStatusDto {
  @IsEnum(PaymentStatusEnum)
  @IsNotEmpty()
  paymentStatus!: PaymentStatusEnum;

  @IsString()
  @IsOptional()
  paymentTransactionId?: string;
}

export class CancelOrderDto {
  @IsString()
  @IsOptional()
  cancellationReason?: string;
}

export class OrderIdParamDto {
  @IsMongoId()
  @IsNotEmpty()
  id!: string;
}

export class RefundOrderDto {
  @IsNumber()
  @Type(() => Number)
  @Min(0.01)
  @IsOptional()
  amount?: number;

  @IsString()
  @IsOptional()
  reason?: string;

  @IsBoolean()
  @IsOptional()
  restockItems?: boolean = true;
}

/**
 * The storefront's checkout form collects a free-text address line, a city and
 * a phone number. It is mapped onto the richer ShippingAddress on the way in.
 */
export class CheckoutAddressDto {
  @IsString()
  @IsNotEmpty()
  details!: string;

  @IsString()
  @IsNotEmpty()
  city!: string;

  @IsString()
  @IsNotEmpty()
  phone!: string;
}

export class CheckoutSessionDto {
  @ValidateNested()
  @Type(() => CheckoutAddressDto)
  @IsNotEmpty()
  shippingAddress!: CheckoutAddressDto;
}

export class CartIdParamDto {
  @IsMongoId()
  @IsNotEmpty()
  cartId!: string;
}
