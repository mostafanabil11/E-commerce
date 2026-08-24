import { MongooseModule, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { User } from './user.model';
import { CouponTypeEnum } from '../../common/enums';


export type CouponDocument = HydratedDocument<Coupon>;

@Schema({
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})
export class Coupon {
  @Prop({
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
  })
  code!: string;

  @Prop({
    type: String,
    enum: Object.values(CouponTypeEnum),
    required: true,
  })
  type!: CouponTypeEnum;

  @Prop({
    required: true,
    min: 0,
  })
  amount!: number;

  @Prop({
    required: true,
  })
  fromDate!: Date;

  @Prop({
    required: true,
  })
  toDate!: Date;

  @Prop({
    default: 0,
    min: 0,
  })
  minOrderAmount!: number;

  @Prop({
    default: 0,
    min: 0,
  })
  maxDiscount!: number;

  @Prop({
    required: true,
    min: 1,
  })
  usageLimit!: number;

  @Prop({
    default: 0,
    min: 0,
  })
  usedCount!: number;

  @Prop({
    default: true,
  })
  isActive!: boolean;

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

export const CouponSchema = SchemaFactory.createForClass(Coupon);

export const CouponModel = MongooseModule.forFeature([
  {
    name: Coupon.name,
    schema: CouponSchema,
  },
]);