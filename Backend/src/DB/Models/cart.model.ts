import { MongooseModule, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { Product } from './product.model';
import { User } from './user.model';
import { Coupon } from './coupon.model';

export type CartDocument = HydratedDocument<Cart>;

@Schema({ _id: false })
export class CartItem {
  @Prop({
    type: Types.ObjectId,
    ref: Product.name,
    required: true,
  })
  product!: Types.ObjectId;

  @Prop({
    required: true,
    min: 1,
    default: 1,
  })
  quantity!: number;

  @Prop({
    required: true,
    min: 0,
  })
  unitPrice!: number;

  @Prop({
    required: true,
    min: 0,
  })
  totalUnitPrice!: number;
}

export const CartItemSchema = SchemaFactory.createForClass(CartItem);

@Schema({
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})
export class Cart {
  @Prop({
    type: Types.ObjectId,
    ref: User.name,
    required: true,
    unique: true,
  })
  user!: Types.ObjectId;

  @Prop({
    type: [CartItemSchema],
    default: [],
  })
  items!: CartItem[];

  @Prop({
    default: 0,
    min: 0,
  })
  totalItems!: number;

  @Prop({
    default: 0,
    min: 0,
  })
  subTotal!: number;

  @Prop({
    type: Types.ObjectId,
    ref: Coupon.name,
  })
  coupon?: Types.ObjectId;

  @Prop({
    default: 0,
    min: 0,
  })
  discount!: number;

  @Prop({
    default: 0,
    min: 0,
  })
  totalPrice!: number;

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

export const CartSchema = SchemaFactory.createForClass(Cart);

CartSchema.pre('save', function (this: CartDocument) {
  if (this.isModified('items') || this.isModified('discount')) {
    this.totalItems = this.items.reduce((acc, item) => acc + (item.quantity || 0), 0);
    this.subTotal = this.items.reduce(
      (acc, item) => acc + (item.totalUnitPrice ?? (item.unitPrice || 0) * (item.quantity || 0)),
      0,
    );
    this.subTotal = Math.round(this.subTotal * 100) / 100;

    const currentDiscount = this.discount || 0;
    this.totalPrice = Math.max(0, Math.round((this.subTotal - currentDiscount) * 100) / 100);
  }
});

export const CartModel = MongooseModule.forFeature([
  {
    name: Cart.name,
    schema: CartSchema,
  },
]);