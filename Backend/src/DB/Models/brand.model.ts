import { MongooseModule, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { User } from './user.model';
import { Category } from './category.model';

export type BrandDocument = HydratedDocument<Brand>;

@Schema({
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})
export class Brand {
  @Prop({
    required: true,
    unique: true,
    trim: true,
    minlength: 2,
    maxlength: 100,
  })
  name!: string;

  @Prop({
    unique: true,
    lowercase: true,
    trim: true,
    index: true,
  })
  slug?: string;

  @Prop({
    trim: true,
    maxlength: 1000,
  })
  description?: string;

  @Prop()
  image?: string;

  @Prop({
    type: Types.ObjectId,
    ref: Category.name,
    required: false,
    index: true,
  })
  category?: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: User.name,
    required: true,
    index: true,
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

export const BrandSchema = SchemaFactory.createForClass(Brand);

BrandSchema.virtual('products', {
  ref: 'Product',
  localField: '_id',
  foreignField: 'brand',
});

export const BrandModel = MongooseModule.forFeature([
  {
    name: Brand.name,
    schema: BrandSchema,
  },
]);