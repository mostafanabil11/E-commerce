import {
  BadRequestException,
  Injectable,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Wishlist, WishlistDocument } from '../DB/Models/wishlist.model';
import { Product, ProductDocument } from '../DB/Models/product.model';
import { AddWishlistItemDto } from './wishlist.dto';
import { RedisService } from '../common/redis/redis.service';

@Injectable()
export class WishlistService {
  constructor(
    @InjectModel(Wishlist.name)
    private readonly wishlistModel: Model<WishlistDocument>,
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
    @Optional() private readonly redisService?: RedisService,
  ) {}

  private async invalidateWishlistCache(userId: string) {
    if (this.redisService) {
      try {
        await this.redisService.del(`wishlist:user:${userId}`);
      } catch {
      }
    }
  }

  async addToWishlist(userId: string, dto: AddWishlistItemDto) {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user ID');
    }
    if (!Types.ObjectId.isValid(dto.productId)) {
      throw new BadRequestException('Invalid product ID');
    }

    const product = await this.productModel.findOne({
      _id: dto.productId,
      deletedAt: { $exists: false },
    });
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const userObjectId = new Types.ObjectId(userId);
    const productObjectId = new Types.ObjectId(dto.productId);

    let wishlist = await this.wishlistModel.findOne({ user: userObjectId });

    if (!wishlist) {
      wishlist = new this.wishlistModel({
        user: userObjectId,
        products: [productObjectId],
      });
    } else {
      const exists = wishlist.products.some(
        (id) => id.toString() === dto.productId,
      );
      if (exists) {
        throw new BadRequestException('Product already in wishlist');
      }
      wishlist.products.push(productObjectId);
    }

    await wishlist.save();
    await this.invalidateWishlistCache(userId);

    return {
      status: 'success',
      message: 'Product added successfully to your wishlist',
      data: wishlist.products,
    };
  }

  async removeFromWishlist(userId: string, productId: string) {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user ID');
    }
    if (!Types.ObjectId.isValid(productId)) {
      throw new BadRequestException('Invalid product ID');
    }

    const userObjectId = new Types.ObjectId(userId);

    const wishlist = await this.wishlistModel.findOne({ user: userObjectId });
    if (!wishlist) {
      throw new NotFoundException('Wishlist not found');
    }

    const initialCount = wishlist.products.length;
    wishlist.products = wishlist.products.filter(
      (id) => id.toString() !== productId,
    );

    if (wishlist.products.length === initialCount) {
      throw new NotFoundException('Product not found in wishlist');
    }

    await wishlist.save();
    await this.invalidateWishlistCache(userId);

    return {
      status: 'success',
      message: 'Product removed successfully from your wishlist',
      data: wishlist.products,
    };
  }

  async getWishlist(userId: string) {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user ID');
    }

    const cacheKey = `wishlist:user:${userId}`;

    if (this.redisService) {
      try {
        const cached = await this.redisService.get(cacheKey);
        if (cached) return cached;
      } catch {
      }
    }

    const userObjectId = new Types.ObjectId(userId);

    let wishlist = await this.wishlistModel
      .findOne({ user: userObjectId })
      .populate({
        path: 'products',
        select:
          'title slug description price discount images imageCover quantity sold isActive ratingsAverage ratingsQuantity category brand subcategory createdAt updatedAt',
        populate: [
          { path: 'category', select: 'name slug image' },
          { path: 'brand', select: 'name slug image' },
          { path: 'subcategory', select: 'name slug' },
        ],
      })
      .exec();

    if (!wishlist) {
      wishlist = await this.wishlistModel.create({
        user: userObjectId,
        products: [],
      });
    }

    const result = {
      status: 'success',
      count: wishlist.products.length,
      data: wishlist.products,
    };

    if (this.redisService) {
      try {
        await this.redisService.set(cacheKey, result, 300);
      } catch {
      }
    }

    return result;
  }

  async clearWishlist(userId: string) {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user ID');
    }

    const userObjectId = new Types.ObjectId(userId);

    const wishlist = await this.wishlistModel.findOne({ user: userObjectId });
    if (wishlist) {
      wishlist.products = [];
      await wishlist.save();
    }

    await this.invalidateWishlistCache(userId);

    return {
      status: 'success',
      message: 'Wishlist cleared successfully',
      data: [],
    };
  }
}
