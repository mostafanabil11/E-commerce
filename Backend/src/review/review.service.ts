import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Review, ReviewDocument } from '../DB/Models/review.model';
import { Product, ProductDocument } from '../DB/Models/product.model';
import { AddReviewDto, FilterReviewDto } from './review.dto';
import { RoleEnum } from '../common/enums';

@Injectable()
export class ReviewService {
  constructor(
    @InjectModel(Review.name)
    private readonly reviewModel: Model<ReviewDocument>,
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
  ) {}

  async addReview(userId: string, addReviewDto: AddReviewDto) {
    const { product: productId, rating, comment } = addReviewDto;

    if (!Types.ObjectId.isValid(productId)) {
      throw new BadRequestException('Invalid product ID');
    }

    const productExists = await this.productModel.findOne({
      _id: productId,
      deletedAt: null,
    });

    if (!productExists) {
      throw new NotFoundException('Product not found');
    }

    const existingReview = await this.reviewModel.findOne({
      user: userId,
      product: productId,
      deletedAt: null,
    });

    if (existingReview) {
      throw new BadRequestException('You have already submitted a review for this product');
    }

    const newReview = new this.reviewModel({
      user: userId,
      product: productId,
      rating,
      comment,
      createdBy: userId,
    });

    await newReview.save();
    await this.recalculateProductRating(productId);

    return this.reviewModel
      .findById(newReview._id)
      .populate('user', 'name email')
      .populate('product', 'title price')
      .exec();
  }

  /**
   * `ratingsAverage` / `ratingsQuantity` are denormalised onto Product so the
   * catalogue can be listed without joining reviews. Recomputed whenever a
   * review is added or removed.
   */
  private async recalculateProductRating(productId: string | Types.ObjectId) {
    const [stats] = await this.reviewModel.aggregate<{
      average: number;
      count: number;
    }>([
      { $match: { product: new Types.ObjectId(productId), deletedAt: null } },
      {
        $group: {
          _id: null,
          average: { $avg: '$rating' },
          count: { $sum: 1 },
        },
      },
    ]);

    await this.productModel.findByIdAndUpdate(productId, {
      ratingsAverage: stats ? Math.round(stats.average * 10) / 10 : 0,
      ratingsQuantity: stats ? stats.count : 0,
    });
  }

  async deleteReview(reviewId: string, currentUser: { id: string; role?: string }) {
    if (!Types.ObjectId.isValid(reviewId)) {
      throw new BadRequestException('Invalid review ID');
    }

    const review = await this.reviewModel.findOne({
      _id: reviewId,
      deletedAt: null,
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    const isOwner =
      review.user.toString() === currentUser.id ||
      review.createdBy?.toString() === currentUser.id;
    const isAdmin = currentUser.role === RoleEnum.ADMIN;

    if (!isOwner && !isAdmin) {
      throw new ForbiddenException('You are not authorized to delete this review');
    }

    review.deletedAt = new Date();
    review.deletedBy = currentUser.id as any;

    await review.save();
    await this.recalculateProductRating(review.product);

    return {
      success: true,
      message: 'Review deleted successfully',
    };
  }

  async getProductReviews(productId: string, query: FilterReviewDto) {
    if (!Types.ObjectId.isValid(productId)) {
      throw new BadRequestException('Invalid product ID');
    }

    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? query.limit : 10;
    const skip = (page - 1) * limit;

    const filter = { product: productId, deletedAt: null };

    const [reviews, total] = await Promise.all([
      this.reviewModel
        .find(filter)
        .populate('user', 'name email profilePicture')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.reviewModel.countDocuments(filter),
    ]);

    return {
      reviews,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getReviewById(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid review ID');
    }

    const review = await this.reviewModel
      .findOne({ _id: id, deletedAt: null })
      .populate('user', 'name email profilePicture')
      .populate('product', 'title price')
      .exec();

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    return review;
  }
}
