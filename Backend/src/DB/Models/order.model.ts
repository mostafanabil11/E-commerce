import { MongooseModule, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { Product } from './product.model';
import { User } from './user.model';
import { Coupon } from './coupon.model';
import { OrderStatusEnum, PaymentStatusEnum, PaymentTypeEnum } from '../../common/enums';

export type OrderDocument = HydratedDocument<Order>;

@Schema({ _id: false })
export class OrderItem {
  @Prop({
    type: Types.ObjectId,
    ref: Product.name,
    required: true,
  })
  product!: Types.ObjectId;

  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ required: true, min: 1 })
  quantity!: number;

  @Prop({ required: true, min: 0 })
  unitPrice!: number;

  @Prop({ required: true, min: 0 })
  totalUnitPrice!: number;
}

export const OrderItemSchema = SchemaFactory.createForClass(OrderItem);

@Schema({ _id: false })
export class ShippingAddress {
  @Prop({ required: true, trim: true })
  street!: string;

  @Prop({ required: true, trim: true })
  city!: string;

  @Prop({ required: true, trim: true })
  country!: string;

  @Prop({ required: true, trim: true })
  phone!: string;

  @Prop({ trim: true })
  postalCode?: string;
}

export const ShippingAddressSchema = SchemaFactory.createForClass(ShippingAddress);

@Schema({
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})
export class Order {
  @Prop({ required: true, unique: true, uppercase: true })
  orderCode!: string;

  @Prop({
    type: Types.ObjectId,
    ref: User.name,
    required: true,
  })
  user!: Types.ObjectId;

  @Prop({
    type: [OrderItemSchema],
    required: true,
  })
  items!: OrderItem[];

  @Prop({
    type: ShippingAddressSchema,
    required: true,
  })
  shippingAddress!: ShippingAddress;

  @Prop({
    type: String,
    enum: Object.values(OrderStatusEnum),
    default: OrderStatusEnum.PLACED,
  })
  orderStatus!: OrderStatusEnum;

  @Prop({
    type: String,
    enum: Object.values(PaymentTypeEnum),
    default: PaymentTypeEnum.CASH_ON_DELIVERY,
  })
  paymentType!: PaymentTypeEnum;

  @Prop({
    type: String,
    enum: Object.values(PaymentStatusEnum),
    default: PaymentStatusEnum.PENDING,
  })
  paymentStatus!: PaymentStatusEnum;

  @Prop({ trim: true })
  paymentTransactionId?: string;

  @Prop({ required: true, min: 0 })
  subTotal!: number;

  @Prop({ default: 0, min: 0 })
  shippingFee!: number;

  @Prop({
    type: Types.ObjectId,
    ref: Coupon.name,
  })
  coupon?: Types.ObjectId;

  @Prop({ default: 0, min: 0 })
  discount!: number;

  @Prop({ required: true, min: 0 })
  totalPrice!: number;

  @Prop({ trim: true })
  note?: string;

  @Prop({ trim: true })
  cancellationReason?: string;

  @Prop({
    type: Types.ObjectId,
    ref: User.name,
  })
  cancelledBy?: Types.ObjectId;

  @Prop()
  cancelledAt?: Date;

  @Prop({ default: 0, min: 0 })
  refundedAmount?: number;

  @Prop({ trim: true })
  refundReason?: string;

  @Prop({
    type: Types.ObjectId,
    ref: User.name,
  })
  refundedBy?: Types.ObjectId;

  @Prop()
  refundedAt?: Date;

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
}

export const OrderSchema = SchemaFactory.createForClass(Order);
export const OrderModel = MongooseModule.forFeature([
  { name: Order.name, schema: OrderSchema },
]);
