import { MongooseModule, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { Product } from './product.model';
import { User } from './user.model';

export type ReviewDocument = HydratedDocument<Review>;

@Schema({
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})
export class Review {
  @Prop({
    type: Types.ObjectId,
    ref: User.name,
    required: true,
  })
  user!: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: Product.name,
    required: true,
  })
  product!: Types.ObjectId;

  @Prop({
    required: true,
    min: 1,
    max: 5,
  })
  rating!: number;

  @Prop({
    trim: true,
    maxlength: 1000,
  })
  comment?: string;

  @Prop({
    type: Types.ObjectId,
    ref: User.name,
    required: true,
  })
  createdBy!: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: User.name,
  })
  updatedBy?: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: User.name,
  })
  deletedBy?: Types.ObjectId;

  @Prop()
  deletedAt?: Date;

  @Prop({
    type: Types.ObjectId,
    ref: User.name,
  })
  restoredBy?: Types.ObjectId;

  @Prop()
  restoredAt?: Date;
}

export const ReviewSchema = SchemaFactory.createForClass(Review);

ReviewSchema.index({ user: 1, product: 1 });

export const ReviewModel = MongooseModule.forFeature([
  {
    name: Review.name,
    schema: ReviewSchema,
  },
]);