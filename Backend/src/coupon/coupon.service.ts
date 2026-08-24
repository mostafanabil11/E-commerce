import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Coupon, CouponDocument } from '../DB/Models/coupon.model';
import { CreateCouponDto, FilterCouponDto, UpdateCouponDto } from './coupon.dto';
import { CouponTypeEnum } from '../common/enums';

@Injectable()
export class CouponService {
  constructor(
    @InjectModel(Coupon.name)
    private readonly couponModel: Model<CouponDocument>,
  ) {}

  private validateCouponDatesAndAmount(
    fromDate: Date,
    toDate: Date,
    type: CouponTypeEnum,
    amount: number,
  ) {
    if (fromDate >= toDate) {
      throw new BadRequestException('fromDate must be strictly earlier than toDate');
    }

    if (type === CouponTypeEnum.PERCENTAGE && (amount <= 0 || amount > 100)) {
      throw new BadRequestException('Percentage discount amount must be between 1 and 100');
    }

    if (type === CouponTypeEnum.FIXED && amount <= 0) {
      throw new BadRequestException('Fixed discount amount must be greater than 0');
    }
  }

  async createCoupon(createCouponDto: CreateCouponDto, userId: string) {
    const formattedCode = createCouponDto.code.trim().toUpperCase();

    const existingCoupon = await this.couponModel.findOne({
      code: formattedCode,
      deletedAt: null,
    });

    if (existingCoupon) {
      throw new ConflictException(`Coupon code '${formattedCode}' already exists`);
    }

    const fromDate = new Date(createCouponDto.fromDate);
    const toDate = new Date(createCouponDto.toDate);

    this.validateCouponDatesAndAmount(
      fromDate,
      toDate,
      createCouponDto.type,
      createCouponDto.amount,
    );

    const coupon = new this.couponModel({
      ...createCouponDto,
      code: formattedCode,
      fromDate,
      toDate,
      createdBy: userId,
    });

    return coupon.save();
  }

  async updateCoupon(id: string, updateCouponDto: UpdateCouponDto, userId: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid coupon ID');
    }

    const coupon = await this.couponModel.findOne({ _id: id, deletedAt: null });

    if (!coupon) {
      throw new NotFoundException('Coupon not found');
    }

    if (updateCouponDto.code) {
      const formattedCode = updateCouponDto.code.trim().toUpperCase();
      if (formattedCode !== coupon.code) {
        const existingCoupon = await this.couponModel.findOne({
          code: formattedCode,
          deletedAt: null,
        });
        if (existingCoupon) {
          throw new ConflictException(`Coupon code '${formattedCode}' already exists`);
        }
        coupon.code = formattedCode;
      }
    }

    const effectiveType = updateCouponDto.type ?? coupon.type;
    const effectiveAmount = updateCouponDto.amount ?? coupon.amount;
    const effectiveFromDate = updateCouponDto.fromDate
      ? new Date(updateCouponDto.fromDate)
      : coupon.fromDate;
    const effectiveToDate = updateCouponDto.toDate
      ? new Date(updateCouponDto.toDate)
      : coupon.toDate;

    this.validateCouponDatesAndAmount(
      effectiveFromDate,
      effectiveToDate,
      effectiveType,
      effectiveAmount,
    );

    if (updateCouponDto.type !== undefined) coupon.type = updateCouponDto.type;
    if (updateCouponDto.amount !== undefined) coupon.amount = updateCouponDto.amount;
    if (updateCouponDto.fromDate !== undefined) coupon.fromDate = effectiveFromDate;
    if (updateCouponDto.toDate !== undefined) coupon.toDate = effectiveToDate;
    if (updateCouponDto.minOrderAmount !== undefined)
      coupon.minOrderAmount = updateCouponDto.minOrderAmount;
    if (updateCouponDto.maxDiscount !== undefined)
      coupon.maxDiscount = updateCouponDto.maxDiscount;
    if (updateCouponDto.usageLimit !== undefined)
      coupon.usageLimit = updateCouponDto.usageLimit;
    if (updateCouponDto.isActive !== undefined)
      coupon.isActive = updateCouponDto.isActive;

    coupon.updatedBy = userId as any;

    return coupon.save();
  }

  async deleteCoupon(id: string, userId: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid coupon ID');
    }

    const coupon = await this.couponModel.findOne({ _id: id, deletedAt: null });

    if (!coupon) {
      throw new NotFoundException('Coupon not found');
    }

    coupon.deletedAt = new Date();
    coupon.deletedBy = userId as any;
    coupon.isActive = false;

    await coupon.save();

    return {
      success: true,
      message: 'Coupon deleted successfully',
    };
  }

  async getAllCoupons(query: FilterCouponDto) {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? query.limit : 10;
    const skip = (page - 1) * limit;

    const filter: any = { deletedAt: null };

    if (query.isActive !== undefined) {
      filter.isActive = query.isActive;
    }

    if (query.search) {
      filter.code = { $regex: query.search.trim(), $options: 'i' };
    }

    const [coupons, total] = await Promise.all([
      this.couponModel
        .find(filter)
        .populate('createdBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.couponModel.countDocuments(filter),
    ]);

    return {
      coupons,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getCouponById(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid coupon ID');
    }

    const coupon = await this.couponModel
      .findOne({ _id: id, deletedAt: null })
      .populate('createdBy', 'name email')
      .exec();

    if (!coupon) {
      throw new NotFoundException('Coupon not found');
    }

    return coupon;
  }
}
