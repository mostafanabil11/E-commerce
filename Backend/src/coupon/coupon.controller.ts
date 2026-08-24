import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CouponService } from './coupon.service';
import {
  CouponIdParamDto,
  CreateCouponDto,
  FilterCouponDto,
  UpdateCouponDto,
} from './coupon.dto';
import { AuthGuard } from '../common/guard/auth.guard';
import { RolesGuard } from '../common/guard/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RoleEnum } from '../common/enums';
import { CurrentUser } from '../common/decorators/user.decorator';

@Controller('coupons')
@UseGuards(AuthGuard, RolesGuard)
@Roles(RoleEnum.ADMIN)
export class CouponController {
  constructor(private readonly couponService: CouponService) {}

  @Post()
  async createCoupon(
    @Body() createCouponDto: CreateCouponDto,
    @CurrentUser('id') userId: string,
  ) {
    const coupon = await this.couponService.createCoupon(createCouponDto, userId);
    return {
      success: true,
      message: 'Coupon created successfully',
      coupon,
    };
  }

  @Get()
  async getAllCoupons(@Query() query: FilterCouponDto) {
    const result = await this.couponService.getAllCoupons(query);
    return {
      success: true,
      ...result,
    };
  }

  @Get(':id')
  async getCouponById(@Param() params: CouponIdParamDto) {
    const coupon = await this.couponService.getCouponById(params.id);
    return {
      success: true,
      coupon,
    };
  }

  @Patch(':id')
  async updateCoupon(
    @Param() params: CouponIdParamDto,
    @Body() updateCouponDto: UpdateCouponDto,
    @CurrentUser('id') userId: string,
  ) {
    const coupon = await this.couponService.updateCoupon(
      params.id,
      updateCouponDto,
      userId,
    );
    return {
      success: true,
      message: 'Coupon updated successfully',
      coupon,
    };
  }

  @Delete(':id')
  async deleteCoupon(
    @Param() params: CouponIdParamDto,
    @CurrentUser('id') userId: string,
  ) {
    const result = await this.couponService.deleteCoupon(params.id, userId);
    return result;
  }
}
