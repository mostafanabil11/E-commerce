import { IsInt, IsMongoId, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class AddToCartDto {
  @IsNotEmpty({ message: 'Product ID is required' })
  @IsMongoId({ message: 'Invalid product ID' })
  productId!: string;

  @IsOptional()
  @IsInt({ message: 'Quantity must be an integer' })
  @Min(1, { message: 'Quantity must be at least 1' })
  quantity?: number;
}

export class UpdateQuantityDto {
  @IsNotEmpty({ message: 'Product ID is required' })
  @IsMongoId({ message: 'Invalid product ID' })
  productId!: string;

  @IsNotEmpty({ message: 'Quantity is required' })
  @IsInt({ message: 'Quantity must be an integer' })
  @Min(1, { message: 'Quantity must be at least 1' })
  quantity!: number;
}

export class ProductIdParamDto {
  @IsNotEmpty({ message: 'Product ID is required' })
  @IsMongoId({ message: 'Invalid product ID' })
  productId!: string;
}

export class UserIdParamDto {
  @IsNotEmpty({ message: 'User ID is required' })
  @IsMongoId({ message: 'Invalid user ID' })
  userId!: string;
}

export class ApplyCouponDto {
  @IsNotEmpty({ message: 'Coupon code is required' })
  @IsString({ message: 'Coupon code must be a string' })
  code!: string;
}
/** The storefront sends the new line quantity as `count`. */
export class UpdateCountDto {
  @IsInt()
  @Min(1)
  count!: number;
}
