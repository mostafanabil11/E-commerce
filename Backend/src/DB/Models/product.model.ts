import { MongooseModule, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { Category } from './category.model';
import { User } from './user.model';
import { Brand } from './brand.model';

export type ProductDocument = HydratedDocument<Product>;

@Schema({
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})
export class Product {
  @Prop({
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 250,
  })
  title!: string;

  @Prop({
    unique: true,
    lowercase: true,
    trim: true,
    index: true,
  })
  slug?: string;

  @Prop({
    trim: true,
    maxlength: 5000,
  })
  description?: string;

  @Prop({
    required: true,
    min: 0,
  })
  price!: number;

  @Prop({
    min: 0,
    max: 100,
    default: 0,
  })
  discount?: number;

  @Prop({
    required: true,
    min: 0,
  })
  quantity!: number;

  @Prop({
    type: [String],
    required: true,
    default: [],
  })
  images!: string[];

  @Prop({
    trim: true,
  })
  imageCover?: string;

  // Denormalised from Review documents; recalculated on review create/delete.
  @Prop({
    min: 0,
    max: 5,
    default: 0,
  })
  ratingsAverage!: number;

  @Prop({
    min: 0,
    default: 0,
  })
  ratingsQuantity!: number;

  // Incremented when an order containing this product is paid for.
  @Prop({
    min: 0,
    default: 0,
  })
  sold!: number;

  @Prop({
    type: Types.ObjectId,
    ref: Category.name,
    required: true,
    index: true,
  })
  category!: Types.ObjectId;

  @Prop({
    type: [{ type: Types.ObjectId, ref: Category.name }],
    default: [],
    index: true,
  })
  subcategory!: Types.ObjectId[];

  @Prop({
    type: Types.ObjectId,
    ref: Brand.name,
    required: false,
    index: true,
  })
  brand?: Types.ObjectId;

  @Prop({
    default: true,
    index: true,
  })
  isActive!: boolean;

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

export const ProductSchema = SchemaFactory.createForClass(Product);

ProductSchema.virtual('categoryId').get(function (this: ProductDocument) {
  return this.category;
});

ProductSchema.virtual('priceAfterDiscount').get(function (this: ProductDocument) {
  if (!this.discount || this.discount <= 0) return this.price;
  const finalVal = this.price - (this.price * this.discount) / 100;
  return Math.max(0, Math.round(finalVal * 100) / 100);
});

export const ProductModel = MongooseModule.forFeature([
  {
    name: Product.name,
    schema: ProductSchema,
  },
]);