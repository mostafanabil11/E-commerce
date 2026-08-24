import { CartDocument } from '../DB/Models/cart.model';

/**
 * The storefront expects the cart in a flatter shape than the one stored:
 * `items[].quantity/unitPrice` are surfaced as `products[].count/price`, and
 * the totals are hoisted onto the envelope.
 */
export function toCartResponse(cart: CartDocument) {
  const plain = cart.toJSON() as Record<string, any>;
  const items: any[] = plain.items ?? [];

  return {
    status: 'success' as const,
    numOfCartItems: items.length,
    cartId: String(plain._id),
    data: {
      _id: String(plain._id),
      cartOwner: String(plain.user),
      products: items.map((item) => ({
        count: item.quantity,
        _id: item.product?._id ? String(item.product._id) : String(item.product),
        product: item.product,
        price: item.unitPrice,
      })),
      createdAt: plain.createdAt,
      updatedAt: plain.updatedAt,
      __v: plain.__v ?? 0,
      totalCartPrice: plain.totalPrice ?? plain.subTotal ?? 0,
      subTotal: plain.subTotal ?? 0,
      discount: plain.discount ?? 0,
      coupon: plain.coupon ?? null,
    },
  };
}
