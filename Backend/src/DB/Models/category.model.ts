import { MongooseModule, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { User } from './user.model';

export type CategoryDocument = HydratedDocument<Category>;

@Schema({
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})
export class Category {
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
    index: true,
  })
  parentCategory?: Types.ObjectId;

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

export const CategorySchema = SchemaFactory.createForClass(Category);

CategorySchema.virtual('subcategories', {
  ref: Category.name,
  localField: '_id',
  foreignField: 'parentCategory',
});

CategorySchema.virtual('brands', {
  ref: 'Brand',
  localField: '_id',
  foreignField: 'category',
});

CategorySchema.virtual('products', {
  ref: 'Product',
  localField: '_id',
  foreignField: 'category',
});

export const CategoryModel = MongooseModule.forFeature([
  {
    name: Category.name,
    schema: CategorySchema,
  },
]);