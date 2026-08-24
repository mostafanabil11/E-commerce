import { BadRequestException, Injectable, NotFoundException, Optional } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Cart, CartDocument } from '../DB/Models/cart.model';
import { Product, ProductDocument } from '../DB/Models/product.model';
import { Coupon, CouponDocument } from '../DB/Models/coupon.model';
import { AddToCartDto, ApplyCouponDto, UpdateQuantityDto } from './cart.dto';
import { CouponTypeEnum } from '../common/enums';
import { RedisService } from '../common/redis/redis.service';

@Injectable()
export class CartService {
  constructor(
    @InjectModel(Cart.name)
    private readonly cartModel: Model<CartDocument>,
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
    @InjectModel(Coupon.name)
    private readonly couponModel: Model<CouponDocument>,
    @Optional() private readonly redisService?: RedisService,
  ) {}

  private async invalidateCartCache(userId: string) {
    if (this.redisService) {
      try {
        await this.redisService.del(`cart:user:${userId}`);
      } catch {
        // Ignore cache deletion errors
      }
    }
  }

  private async checkAndRecalculateCoupon(cart: CartDocument): Promise<void> {
    if (!cart.coupon) {
      cart.discount = 0;
      return;
    }

    if (cart.items.length === 0) {
      cart.coupon = undefined;
      cart.discount = 0;
      return;
    }

    const coupon = await this.couponModel.findOne({
      _id: cart.coupon,
      deletedAt: null,
    });

    const now = new Date();
    if (
      !coupon ||
      !coupon.isActive ||
      now < new Date(coupon.fromDate) ||
      now > new Date(coupon.toDate) ||
      coupon.usedCount >= coupon.usageLimit ||
      cart.subTotal < coupon.minOrderAmount
    ) {
      cart.coupon = undefined;
      cart.discount = 0;
      return;
    }

    let discount = 0;
    if (coupon.type === CouponTypeEnum.FIXED) {
      discount = coupon.amount;
    } else if (coupon.type === CouponTypeEnum.PERCENTAGE) {
      discount = (cart.subTotal * coupon.amount) / 100;
      if (coupon.maxDiscount && coupon.maxDiscount > 0) {
        discount = Math.min(discount, coupon.maxDiscount);
      }
    }

    discount = Math.min(discount, cart.subTotal);
    cart.discount = Math.round(discount * 100) / 100;
  }

  async getCart(userId: string) {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user ID');
    }

    const cacheKey = `cart:user:${userId}`;

    if (this.redisService) {
      try {
        const cached = await this.redisService.get(cacheKey);
        if (cached) return cached;
      } catch {
      }
    }

    const userObjectId = new Types.ObjectId(userId);

    let cart = await this.cartModel
      .findOne({ user: userObjectId, deletedAt: { $exists: false } })
      .populate({
        path: 'items.product',
        select:
          'title price discount images imageCover quantity isActive ratingsAverage category brand subcategory',
        populate: [
          { path: 'category', select: 'name slug image' },
          { path: 'brand', select: 'name slug image' },
          { path: 'subcategory', select: 'name slug' },
        ],
      })
      .populate({
        path: 'coupon',
        select: 'code type amount maxDiscount minOrderAmount fromDate toDate',
      });

    if (!cart) {
      cart = await this.cartModel.create({
        user: userObjectId,
        createdBy: userObjectId,
        items: [],
        totalItems: 0,
        subTotal: 0,
        discount: 0,
        totalPrice: 0,
      });
    }

    if (this.redisService) {
      try {
        await this.redisService.set(cacheKey, cart, 300);
      } catch {
      }
    }

    return cart;
  }

  async getUserCart(userId: string) {
    return this.getCart(userId);
  }

  async addToCart(userId: string, addToCartDto: AddToCartDto) {
    const { productId, quantity = 1 } = addToCartDto;
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user ID');
    }
    if (!Types.ObjectId.isValid(productId)) {
      throw new BadRequestException('Invalid product ID');
    }
    const userObjectId = new Types.ObjectId(userId);

    const product = await this.productModel.findOne({
      _id: new Types.ObjectId(productId),
      deletedAt: { $exists: false },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (!product.isActive) {
      throw new BadRequestException('Product is inactive and cannot be added to cart');
    }

    if (product.quantity < 1) {
      throw new BadRequestException('Product is out of stock');
    }

    const unitPrice =
      product.discount && product.discount > 0
        ? Math.round((product.price - (product.price * product.discount) / 100) * 100) / 100
        : product.price;

    let cart = await this.cartModel.findOne({
      user: userObjectId,
      deletedAt: { $exists: false },
    });

    if (!cart) {
      cart = new this.cartModel({
        user: userObjectId,
        createdBy: userObjectId,
        items: [],
        totalItems: 0,
        subTotal: 0,
        discount: 0,
        totalPrice: 0,
      });
    }

    const itemIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId.toString(),
    );

    if (itemIndex > -1) {
      const newQuantity = cart.items[itemIndex].quantity + quantity;

      if (product.quantity < newQuantity) {
        throw new BadRequestException(
          `Insufficient stock. Available stock: ${product.quantity}, currently in cart: ${cart.items[itemIndex].quantity}`,
        );
      }

      cart.items[itemIndex].quantity = newQuantity;
      cart.items[itemIndex].unitPrice = unitPrice;
      cart.items[itemIndex].totalUnitPrice = Math.round(unitPrice * newQuantity * 100) / 100;
    } else {
      if (product.quantity < quantity) {
        throw new BadRequestException(
          `Insufficient stock. Available stock: ${product.quantity}, requested: ${quantity}`,
        );
      }

      cart.items.push({
        product: new Types.ObjectId(productId),
        quantity,
        unitPrice,
        totalUnitPrice: Math.round(unitPrice * quantity * 100) / 100,
      } as any);
    }

    cart.updatedBy = userObjectId;
    cart.markModified('items');
    await this.checkAndRecalculateCoupon(cart);
    await cart.save();
    await this.invalidateCartCache(userId);

    return this.getCart(userId);
  }

  async updateQuantity(userId: string, updateQuantityDto: UpdateQuantityDto) {
    const { productId, quantity } = updateQuantityDto;
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user ID');
    }
    if (!Types.ObjectId.isValid(productId)) {
      throw new BadRequestException('Invalid product ID');
    }
    const userObjectId = new Types.ObjectId(userId);

    const product = await this.productModel.findOne({
      _id: new Types.ObjectId(productId),
      deletedAt: { $exists: false },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (!product.isActive) {
      throw new BadRequestException('Product is inactive');
    }

    if (product.quantity < quantity) {
      throw new BadRequestException(
        `Insufficient stock. Available stock: ${product.quantity}, requested: ${quantity}`,
      );
    }

    const cart = await this.cartModel.findOne({
      user: userObjectId,
      deletedAt: { $exists: false },
    });

    if (!cart) {
      throw new NotFoundException('Cart not found for this user');
    }

    const itemIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId.toString(),
    );

    if (itemIndex === -1) {
      throw new NotFoundException('Product not found in cart');
    }

    const unitPrice =
      product.discount && product.discount > 0
        ? Math.round((product.price - (product.price * product.discount) / 100) * 100) / 100
        : product.price;

    cart.items[itemIndex].quantity = quantity;
    cart.items[itemIndex].unitPrice = unitPrice;
    cart.items[itemIndex].totalUnitPrice = Math.round(unitPrice * quantity * 100) / 100;

    cart.updatedBy = userObjectId;
    cart.markModified('items');
    await this.checkAndRecalculateCoupon(cart);
    await cart.save();
    await this.invalidateCartCache(userId);

    return this.getCart(userId);
  }

  async removeItem(userId: string, productId: string) {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user ID');
    }
    if (!Types.ObjectId.isValid(productId)) {
      throw new BadRequestException('Invalid product ID');
    }
    const userObjectId = new Types.ObjectId(userId);

    const cart = await this.cartModel.findOne({
      user: userObjectId,
      deletedAt: { $exists: false },
    });

    if (!cart) {
      throw new NotFoundException('Cart not found for this user');
    }

    const itemIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId.toString(),
    );

    if (itemIndex === -1) {
      throw new NotFoundException('Product not found in cart');
    }

    cart.items.splice(itemIndex, 1);
    cart.updatedBy = userObjectId;
    cart.markModified('items');
    await this.checkAndRecalculateCoupon(cart);
    await cart.save();
    await this.invalidateCartCache(userId);

    return this.getCart(userId);
  }

  async clearCart(userId: string) {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user ID');
    }
    const userObjectId = new Types.ObjectId(userId);

    const cart = await this.cartModel.findOne({
      user: userObjectId,
      deletedAt: { $exists: false },
    });

    if (!cart) {
      throw new NotFoundException('Cart not found for this user');
    }

    cart.items = [];
    cart.totalItems = 0;
    cart.subTotal = 0;
    cart.coupon = undefined;
    cart.discount = 0;
    cart.totalPrice = 0;
    cart.updatedBy = userObjectId;
    cart.markModified('items');
    await cart.save();
    await this.invalidateCartCache(userId);

    return this.getCart(userId);
  }

  async applyCoupon(userId: string, applyCouponDto: ApplyCouponDto) {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user ID');
    }
    const userObjectId = new Types.ObjectId(userId);
    const code = applyCouponDto.code.trim().toUpperCase();

    const cart = await this.cartModel.findOne({
      user: userObjectId,
      deletedAt: { $exists: false },
    });

    if (!cart || cart.items.length === 0) {
      throw new BadRequestException('Cart is empty. Cannot apply coupon.');
    }

    const coupon = await this.couponModel.findOne({
      code,
      deletedAt: null,
    });

    if (!coupon) {
      throw new NotFoundException('Invalid coupon code');
    }

    if (!coupon.isActive) {
      throw new BadRequestException('Coupon is inactive');
    }

    const now = new Date();
    if (now < new Date(coupon.fromDate)) {
      throw new BadRequestException('Coupon is not valid yet');
    }

    if (now > new Date(coupon.toDate)) {
      throw new BadRequestException('Coupon has expired');
    }

    if (coupon.usedCount >= coupon.usageLimit) {
      throw new BadRequestException('Coupon usage limit has been reached');
    }

    if (cart.subTotal < coupon.minOrderAmount) {
      throw new BadRequestException(
        `Cart subtotal must be at least ${coupon.minOrderAmount} to use this coupon`,
      );
    }

    let discount = 0;
    if (coupon.type === CouponTypeEnum.FIXED) {
      discount = coupon.amount;
    } else if (coupon.type === CouponTypeEnum.PERCENTAGE) {
      discount = (cart.subTotal * coupon.amount) / 100;
      if (coupon.maxDiscount && coupon.maxDiscount > 0) {
        discount = Math.min(discount, coupon.maxDiscount);
      }
    }

    discount = Math.min(discount, cart.subTotal);
    discount = Math.round(discount * 100) / 100;

    cart.coupon = coupon._id as any;
    cart.discount = discount;
    cart.updatedBy = userObjectId;
    cart.markModified('discount');
    await cart.save();
    await this.invalidateCartCache(userId);

    return this.getCart(userId);
  }

  async removeCoupon(userId: string) {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user ID');
    }
    const userObjectId = new Types.ObjectId(userId);

    const cart = await this.cartModel.findOne({
      user: userObjectId,
      deletedAt: { $exists: false },
    });

    if (!cart) {
      throw new NotFoundException('Cart not found for this user');
    }

    cart.coupon = undefined;
    cart.discount = 0;
    cart.updatedBy = userObjectId;
    cart.markModified('discount');
    await cart.save();
    await this.invalidateCartCache(userId);

    return this.getCart(userId);
  }
}

