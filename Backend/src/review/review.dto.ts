import { IsMongoId, IsNotEmpty, IsNumber, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class AddReviewDto {
  @IsMongoId()
  @IsNotEmpty()
  product!: string;

  @IsNumber()
  @Min(1)
  @Max(5)
  @IsNotEmpty()
  @Type(() => Number)
  rating!: number;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  comment?: string;
}

export class ReviewIdParamDto {
  @IsMongoId()
  @IsNotEmpty()
  id!: string;
}

export class ProductIdParamDto {
  @IsMongoId()
  @IsNotEmpty()
  productId!: string;
}

export class FilterReviewDto {
  @IsMongoId()
  @IsOptional()
  product?: string;

  @IsNumber()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  page?: number;

  @IsNumber()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  limit?: number;
}
