import {
  IsArray,
  IsBoolean,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { Type, Transform } from 'class-transformer';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(250)
  title!: string;

  @IsString()
  @IsOptional()
  @MaxLength(5000)
  description?: string;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  price!: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  @Type(() => Number)
  discount?: number;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  quantity!: number;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  images?: string[];

  @IsMongoId()
  @IsNotEmpty()
  category!: string;

  @IsMongoId()
  @IsOptional()
  subcategory?: string;

  @IsMongoId()
  @IsOptional()
  brand?: string;

  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    return value === 'true' || value === true;
  })
  isActive?: boolean;
}

export class UpdateProductDto extends PartialType(CreateProductDto) {}

export class ProductIdParamDto {
  @IsMongoId()
  @IsNotEmpty()
  id!: string;
}

export class FilterProductDto {
  @IsString()
  @IsOptional()
  search?: string;

  @IsMongoId()
  @IsOptional()
  category?: string;

  @IsMongoId()
  @IsOptional()
  subcategory?: string;

  @IsMongoId()
  @IsOptional()
  brand?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  minPrice?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  maxPrice?: number;

  @IsString()
  @IsOptional()
  sort?: string;

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

