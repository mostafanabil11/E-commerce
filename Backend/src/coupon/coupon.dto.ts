import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CouponTypeEnum } from '../common/enums';

export class CreateCouponDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(50)
  code!: string;

  @IsEnum(CouponTypeEnum)
  @IsNotEmpty()
  type!: CouponTypeEnum;

  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  @Type(() => Number)
  amount!: number;

  @IsDateString()
  @IsNotEmpty()
  fromDate!: string;

  @IsDateString()
  @IsNotEmpty()
  toDate!: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  minOrderAmount?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  maxDiscount?: number;

  @IsNumber()
  @Min(1)
  @IsNotEmpty()
  @Type(() => Number)
  usageLimit!: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class UpdateCouponDto {
  @IsString()
  @IsOptional()
  @MinLength(2)
  @MaxLength(50)
  code?: string;

  @IsEnum(CouponTypeEnum)
  @IsOptional()
  type?: CouponTypeEnum;

  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  amount?: number;

  @IsDateString()
  @IsOptional()
  fromDate?: string;

  @IsDateString()
  @IsOptional()
  toDate?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  minOrderAmount?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  maxDiscount?: number;

  @IsNumber()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  usageLimit?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class CouponIdParamDto {
  @IsMongoId()
  @IsNotEmpty()
  id!: string;
}

export class FilterCouponDto {
  @IsString()
  @IsOptional()
  search?: string;

  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  isActive?: boolean;

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
