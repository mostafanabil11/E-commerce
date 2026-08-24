import { MongooseModule, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { Product } from './product.model';
import { User } from './user.model';

export type WishlistDocument = HydratedDocument<Wishlist>;

@Schema({
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})
export class Wishlist {
  @Prop({
    type: Types.ObjectId,
    ref: User.name,
    required: true,
    unique: true,
  })
  user!: Types.ObjectId;

  @Prop({
    type: [{ type: Types.ObjectId, ref: Product.name }],
    default: [],
  })
  products!: Types.ObjectId[];
}

export const WishlistSchema = SchemaFactory.createForClass(Wishlist);
export const WishlistModel = MongooseModule.forFeature([
  { name: Wishlist.name, schema: WishlistSchema },
]);
