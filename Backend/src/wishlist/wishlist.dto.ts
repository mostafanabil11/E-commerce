import { IsMongoId, IsNotEmpty } from 'class-validator';

export class AddWishlistItemDto {
  @IsMongoId()
  @IsNotEmpty()
  productId!: string;
}

export class WishlistParamDto {
  @IsMongoId()
  @IsNotEmpty()
  productId!: string;
}
