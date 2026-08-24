import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { WishlistService } from './wishlist.service';
import { AddWishlistItemDto, WishlistParamDto } from './wishlist.dto';
import { AuthGuard } from '../common/guard/auth.guard';
import { CurrentUser } from '../common/decorators/user.decorator';

@Controller('wishlist')
@UseGuards(AuthGuard)
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  @Post()
  async addToWishlist(
    @CurrentUser('id') userId: string,
    @Body() dto: AddWishlistItemDto,
  ) {
    return this.wishlistService.addToWishlist(userId, dto);
  }

  @Get()
  async getWishlist(@CurrentUser('id') userId: string) {
    return this.wishlistService.getWishlist(userId);
  }

  @Delete(':productId')
  async removeFromWishlist(
    @CurrentUser('id') userId: string,
    @Param() params: WishlistParamDto,
  ) {
    return this.wishlistService.removeFromWishlist(userId, params.productId);
  }

  @Delete()
  async clearWishlist(@CurrentUser('id') userId: string) {
    return this.wishlistService.clearWishlist(userId);
  }
}
