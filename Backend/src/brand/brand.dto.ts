import { IsMongoId, IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength, Min, MinLength } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { Type } from 'class-transformer';

export class CreateBrandDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  name!: string;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  description?: string;

  @IsString()
  @IsOptional()
  image?: string;

  @IsMongoId()
  @IsNotEmpty()
  category!: string;
}

export class UpdateBrandDto extends PartialType(CreateBrandDto) {}

export class BrandIdParamDto {
  @IsMongoId()
  @IsNotEmpty()
  id!: string;
}

export class FilterBrandDto {
  @IsString()
  @IsOptional()
  search?: string;

  @IsMongoId()
  @IsOptional()
  category?: string;

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
