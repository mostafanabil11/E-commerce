import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { CartService } from './cart.service';
import {
  AddToCartDto,
  ApplyCouponDto,
  ProductIdParamDto,
  UpdateCountDto,
  UserIdParamDto,
} from './cart.dto';
import { AuthGuard } from '../common/guard/auth.guard';
import { CurrentUser } from '../common/decorators/user.decorator';
import { toCartResponse } from './cart.serializer';

/**
 * Route shapes here mirror what the storefront calls. Literal paths are
 * declared before `:productId` so they are not swallowed by the param route.
 */
@Controller('cart')
@UseGuards(AuthGuard)
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  async getCart(@CurrentUser('id') userId: string) {
    return toCartResponse(await this.cartService.getCart(userId));
  }

  @Get('user/:userId')
  async getUserCart(@Param() params: UserIdParamDto) {
    return toCartResponse(await this.cartService.getUserCart(params.userId));
  }

  @Post()
  async addToCart(
    @CurrentUser('id') userId: string,
    @Body() addToCartDto: AddToCartDto,
  ) {
    const cart = await this.cartService.addToCart(userId, addToCartDto);
    return {
      ...toCartResponse(cart),
      message: 'success',
    };
  }

  @Post('apply-coupon')
  async applyCoupon(
    @CurrentUser('id') userId: string,
    @Body() applyCouponDto: ApplyCouponDto,
  ) {
    const cart = await this.cartService.applyCoupon(userId, applyCouponDto);
    return { ...toCartResponse(cart), message: 'Coupon applied successfully' };
  }

  @Delete('remove-coupon')
  async removeCoupon(@CurrentUser('id') userId: string) {
    const cart = await this.cartService.removeCoupon(userId);
    return { ...toCartResponse(cart), message: 'Coupon removed successfully' };
  }

  /** Clears the whole cart. Must precede DELETE /:productId. */
  @Delete()
  async clearCart(@CurrentUser('id') userId: string) {
    const cart = await this.cartService.clearCart(userId);
    return { ...toCartResponse(cart), message: 'success' };
  }

  @Put(':productId')
  async updateCount(
    @CurrentUser('id') userId: string,
    @Param() params: ProductIdParamDto,
    @Body() updateCountDto: UpdateCountDto,
  ) {
    const cart = await this.cartService.updateQuantity(userId, {
      productId: params.productId,
      quantity: updateCountDto.count,
    });
    return { ...toCartResponse(cart), message: 'success' };
  }

  @Delete(':productId')
  async removeItem(
    @CurrentUser('id') userId: string,
    @Param() params: ProductIdParamDto,
  ) {
    const cart = await this.cartService.removeItem(userId, params.productId);
    return { ...toCartResponse(cart), message: 'success' };
  }
}
