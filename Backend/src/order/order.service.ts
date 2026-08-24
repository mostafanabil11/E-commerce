import {
  BadRequestException,
  Injectable,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { createHmac } from 'crypto';
import { InjectModel } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { Model, Types } from 'mongoose';
import Stripe from 'stripe';
import { Order, OrderDocument } from '../DB/Models/order.model';
import { Cart, CartDocument } from '../DB/Models/cart.model';
import { Product, ProductDocument } from '../DB/Models/product.model';
import { Coupon, CouponDocument } from '../DB/Models/coupon.model';
import {
  CancelOrderDto,
  CreateOrderDto,
  FilterOrderDto,
  RefundOrderDto,
  UpdateOrderStatusDto,
  UpdatePaymentStatusDto,
} from './order.dto';
import {
  CouponTypeEnum,
  OrderStatusEnum,
  PaymentStatusEnum,
  PaymentTypeEnum,
} from '../common/enums';
import { RedisService } from '../common/redis/redis.service';
import { EmailService } from '../common/email/email.service';

@Injectable()
export class OrderService {
  private stripeClient?: Stripe;

  constructor(
    @InjectModel(Order.name)
    private readonly orderModel: Model<OrderDocument>,
    @InjectModel(Cart.name)
    private readonly cartModel: Model<CartDocument>,
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
    @InjectModel(Coupon.name)
    private readonly couponModel: Model<CouponDocument>,
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
    @Optional() private readonly redisService?: RedisService,
  ) {
    const stripeSecret = this.configService.get<string>('STRIPE_SECRET_KEY');
    if (stripeSecret) {
      this.stripeClient = new Stripe(stripeSecret, {
        apiVersion: '2025-01-27.acacia' as any,
      });
    }
  }

  private async invalidateOrderCaches(userId?: string) {
    if (this.redisService) {
      try {
        await this.redisService.delByPattern('orders:*');
        await this.redisService.delByPattern('products:*');
        if (userId) {
          await this.redisService.del(`cart:user:${userId}`);
        }
      } catch {
      }
    }
  }

  private generateOrderCode(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `ORD-${timestamp}-${random}`;
  }

  async createOrder(
    userId: string,
    createOrderDto: CreateOrderDto,
    returnUrl?: string,
  ) {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user ID');
    }
    const userObjectId = new Types.ObjectId(userId);

    const cart = await this.cartModel
      .findOne({ user: userObjectId, deletedAt: { $exists: false } })
      .populate('items.product');

    if (!cart || cart.items.length === 0) {
      throw new BadRequestException('Cart is empty. Cannot place an order.');
    }

    const orderItems: any[] = [];
    let calculatedSubTotal = 0;

    for (const item of cart.items) {
      const product = await this.productModel.findOne({
        _id: item.product,
        deletedAt: { $exists: false },
      });

      if (!product) {
        throw new NotFoundException(`Product ${item.product} not found`);
      }

      if (!product.isActive) {
        throw new BadRequestException(`Product ${product.title} is inactive`);
      }

      if (product.quantity < item.quantity) {
        throw new BadRequestException(
          `Insufficient stock for ${product.title}. Available: ${product.quantity}, requested: ${item.quantity}`,
        );
      }

      const unitPrice =
        product.discount && product.discount > 0
          ? Math.round((product.price - (product.price * product.discount) / 100) * 100) / 100
          : product.price;

      const totalUnitPrice = Math.round(unitPrice * item.quantity * 100) / 100;
      calculatedSubTotal += totalUnitPrice;

      orderItems.push({
        product: product._id,
        name: product.title,
        quantity: item.quantity,
        unitPrice,
        totalUnitPrice,
      });
    }

    calculatedSubTotal = Math.round(calculatedSubTotal * 100) / 100;

    let appliedCoupon: CouponDocument | null = null;
    let discount = 0;

    if (createOrderDto.couponCode) {
      const code = createOrderDto.couponCode.trim().toUpperCase();
      const coupon = await this.couponModel.findOne({ code, deletedAt: null });
      if (!coupon) {
        throw new NotFoundException('Invalid coupon code');
      }
      if (!coupon.isActive) {
        throw new BadRequestException('Coupon is inactive');
      }
      const now = new Date();
      if (now < new Date(coupon.fromDate) || now > new Date(coupon.toDate)) {
        throw new BadRequestException('Coupon is not valid or expired');
      }
      if (coupon.usedCount >= coupon.usageLimit) {
        throw new BadRequestException('Coupon usage limit reached');
      }
      if (calculatedSubTotal < coupon.minOrderAmount) {
        throw new BadRequestException(
          `Subtotal must be at least ${coupon.minOrderAmount} to use this coupon`,
        );
      }
      appliedCoupon = coupon;
    } else if (cart.coupon) {
      const coupon = await this.couponModel.findOne({ _id: cart.coupon, deletedAt: null });
      if (coupon && coupon.isActive) {
        const now = new Date();
        if (
          now >= new Date(coupon.fromDate) &&
          now <= new Date(coupon.toDate) &&
          coupon.usedCount < coupon.usageLimit &&
          calculatedSubTotal >= coupon.minOrderAmount
        ) {
          appliedCoupon = coupon;
        }
      }
    }

    if (appliedCoupon) {
      if (appliedCoupon.type === CouponTypeEnum.FIXED) {
        discount = appliedCoupon.amount;
      } else if (appliedCoupon.type === CouponTypeEnum.PERCENTAGE) {
        discount = (calculatedSubTotal * appliedCoupon.amount) / 100;
        if (appliedCoupon.maxDiscount && appliedCoupon.maxDiscount > 0) {
          discount = Math.min(discount, appliedCoupon.maxDiscount);
        }
      }
      discount = Math.min(discount, calculatedSubTotal);
      discount = Math.round(discount * 100) / 100;
    }

    const shippingFee = Number(this.configService.get<number>('SHIPPING_FEE') ?? 0);
    const totalPrice = Math.max(0, Math.round((calculatedSubTotal + shippingFee - discount) * 100) / 100);

    const paymentType = createOrderDto.paymentType || PaymentTypeEnum.CASH_ON_DELIVERY;
    const paymentStatus = PaymentStatusEnum.PENDING;

    const orderCode = this.generateOrderCode();

    const newOrder = new this.orderModel({
      orderCode,
      user: userObjectId,
      items: orderItems,
      shippingAddress: createOrderDto.shippingAddress,
      orderStatus: OrderStatusEnum.PLACED,
      paymentType,
      paymentStatus,
      subTotal: calculatedSubTotal,
      shippingFee,
      coupon: appliedCoupon ? appliedCoupon._id : undefined,
      discount,
      totalPrice,
      note: createOrderDto.note,
      createdBy: userObjectId,
    });

    const savedOrder = await newOrder.save();

    for (const item of orderItems) {
      await this.productModel.findByIdAndUpdate(item.product, {
        $inc: { quantity: -item.quantity },
      });
    }

    if (appliedCoupon) {
      await this.couponModel.findByIdAndUpdate(appliedCoupon._id, {
        $inc: { usedCount: 1 },
      });
    }

    cart.items = [];
    cart.totalItems = 0;
    cart.subTotal = 0;
    cart.coupon = undefined;
    cart.discount = 0;
    cart.totalPrice = 0;
    cart.updatedBy = userObjectId;
    cart.markModified('items');
    await cart.save();

    await this.invalidateOrderCaches(userId);

    let checkoutUrl: string | undefined = undefined;
    const returnBase = (
      returnUrl ||
      this.configService.get<string>('FRONTEND_URL') ||
      'http://localhost:3000'
    ).replace(/\/+$/, '');

    if (paymentType === PaymentTypeEnum.STRIPE || paymentType === PaymentTypeEnum.CARD) {
      const stripeSecret = this.configService.get<string>('STRIPE_SECRET_KEY');
      const stripeInstance =
        this.stripeClient ||
        (stripeSecret && !stripeSecret.includes('your_stripe_secret_key')
          ? new Stripe(stripeSecret, { apiVersion: '2025-01-27.acacia' as any })
          : undefined);

      if (stripeInstance) {
        try {
          const userDoc = await this.orderModel.db.model('User').findById(userId);
          const session = await stripeInstance.checkout.sessions.create({
            payment_method_types: ['card'],
            mode: 'payment',
            customer_email: userDoc?.email,
            client_reference_id: savedOrder._id.toString(),
            line_items: savedOrder.items.map((item) => ({
              price_data: {
                currency: 'egp',
                product_data: {
                  name: item.name,
                },
                unit_amount: Math.round(item.unitPrice * 100),
              },
              quantity: item.quantity,
            })),
            success_url: `${returnBase}/order/success?orderId=${savedOrder._id}`,
            cancel_url: `${returnBase}/order/cancel?orderId=${savedOrder._id}`,
          });

          savedOrder.paymentTransactionId = session.id;
          await savedOrder.save();
          checkoutUrl = session.url || undefined;
        } catch (error) {
          console.error('Stripe Checkout Creation Error:', error);
        }
      }
    } else if (paymentType === PaymentTypeEnum.PAYMOB) {
      try {
        const userDoc = await this.orderModel.db.model('User').findById(userId);
        checkoutUrl = await this.createPaymobCheckoutSession(savedOrder, userDoc);
        if (checkoutUrl) {
          savedOrder.paymentTransactionId = 'PAYMOB_PENDING';
          await savedOrder.save();
        }
      } catch (error) {
        console.error('Paymob Checkout Creation Error:', error);
      }
    }

    try {
      const userDoc = await this.orderModel.db.model('User').findById(userId);
      if (userDoc?.email) {
        const customerFirstName = userDoc.name || 'Valued Customer';
        this.emailService.sendOrderConfirmationEmail(
          userDoc.email,
          customerFirstName,
          savedOrder,
        ).catch(() => {});
      }
    } catch {}

    return {
      success: true,
      message: 'Order placed successfully',
      order: savedOrder,
      checkoutUrl,
    };
  }

  async getUserOrders(userId: string, query: FilterOrderDto) {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user ID');
    }
    const { orderStatus, page = 1, limit = 10 } = query;
    const cacheKey = `orders:user:${userId}:${orderStatus || ''}:${page}:${limit}`;

    if (this.redisService) {
      try {
        const cached = await this.redisService.get(cacheKey);
        if (cached) return cached;
      } catch {
      }
    }

    const filter: any = { user: new Types.ObjectId(userId) };
    if (orderStatus) {
      filter.orderStatus = orderStatus;
    }

    const skip = (page - 1) * limit;
    const [orders, total] = await Promise.all([
      this.orderModel
        .find(filter)
        .populate('items.product', 'name slug images price')
        .populate('coupon', 'code type amount')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.orderModel.countDocuments(filter),
    ]);

    const result = {
      orders,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };

    if (this.redisService) {
      try {
        await this.redisService.set(cacheKey, result, 300);
      } catch {
      }
    }

    return result;
  }

  async getUserOrderById(userId: string, orderId: string) {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user ID');
    }
    if (!Types.ObjectId.isValid(orderId)) {
      throw new BadRequestException('Invalid order ID');
    }

    const cacheKey = `orders:id:${orderId}`;

    if (this.redisService) {
      try {
        const cached = await this.redisService.get(cacheKey);
        if (cached && cached.user.toString() === userId.toString()) {
          return cached;
        }
      } catch {
      }
    }

    const order = await this.orderModel
      .findOne({ _id: new Types.ObjectId(orderId), user: new Types.ObjectId(userId) })
      .populate('items.product', 'name slug images price')
      .populate('coupon', 'code type amount')
      .exec();

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (this.redisService) {
      try {
        await this.redisService.set(cacheKey, order, 300);
      } catch {
      }
    }

    return order;
  }

  async cancelOrder(userId: string, orderId: string, cancelOrderDto: CancelOrderDto) {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user ID');
    }
    if (!Types.ObjectId.isValid(orderId)) {
      throw new BadRequestException('Invalid order ID');
    }

    const order = await this.orderModel.findOne({
      _id: new Types.ObjectId(orderId),
      user: new Types.ObjectId(userId),
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (
      order.orderStatus !== OrderStatusEnum.PLACED &&
      order.orderStatus !== OrderStatusEnum.PENDING
    ) {
      throw new BadRequestException(
        `Cannot cancel order with status '${order.orderStatus}'. Only PLACED or PENDING orders can be cancelled.`,
      );
    }

    order.orderStatus = OrderStatusEnum.CANCELLED;
    order.cancellationReason = cancelOrderDto.cancellationReason || 'Cancelled by customer';
    order.cancelledBy = new Types.ObjectId(userId);
    order.cancelledAt = new Date();
    order.updatedBy = new Types.ObjectId(userId);

    await order.save();

    for (const item of order.items) {
      await this.productModel.findByIdAndUpdate(item.product, {
        $inc: { quantity: item.quantity },
      });
    }

    await this.invalidateOrderCaches(userId);

    try {
      const userDoc = await this.orderModel.db.model('User').findById(userId);
      if (userDoc?.email) {
        const customerFirstName = userDoc.name || 'Valued Customer';
        this.emailService.sendOrderCancellationEmail(
          userDoc.email,
          customerFirstName,
          order,
          order.cancellationReason,
        ).catch(() => {});
      }
    } catch {}

    return {
      success: true,
      message: 'Order cancelled successfully',
      order,
    };
  }

  async getAllOrdersAdmin(query: FilterOrderDto) {
    const { orderStatus, paymentStatus, search, page = 1, limit = 10 } = query;
    const cacheKey = `orders:admin:${orderStatus || ''}:${paymentStatus || ''}:${search || ''}:${page}:${limit}`;

    if (this.redisService) {
      try {
        const cached = await this.redisService.get(cacheKey);
        if (cached) return cached;
      } catch {
      }
    }

    const filter: any = {};
    if (orderStatus) filter.orderStatus = orderStatus;
    if (paymentStatus) filter.paymentStatus = paymentStatus;
    if (search) {
      filter.$or = [
        { orderCode: { $regex: search, $options: 'i' } },
        { 'shippingAddress.phone': { $regex: search, $options: 'i' } },
        { 'shippingAddress.city': { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;
    const [orders, total] = await Promise.all([
      this.orderModel
        .find(filter)
        .populate('user', 'name email phone')
        .populate('items.product', 'name slug price')
        .populate('coupon', 'code type amount')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.orderModel.countDocuments(filter),
    ]);

    const result = {
      orders,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };

    if (this.redisService) {
      try {
        await this.redisService.set(cacheKey, result, 300);
      } catch {
      }
    }

    return result;
  }

  async getAnyOrderByIdAdmin(orderId: string) {
    if (!Types.ObjectId.isValid(orderId)) {
      throw new BadRequestException('Invalid order ID');
    }

    const order = await this.orderModel
      .findById(orderId)
      .populate('user', 'name email phone')
      .populate('items.product', 'name slug images price')
      .populate('coupon', 'code type amount')
      .exec();

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  async updateOrderStatusAdmin(orderId: string, updateDto: UpdateOrderStatusDto, adminId: string) {
    if (!Types.ObjectId.isValid(orderId)) {
      throw new BadRequestException('Invalid order ID');
    }

    const order = await this.orderModel.findById(orderId);
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (updateDto.orderStatus === OrderStatusEnum.CANCELLED && order.orderStatus !== OrderStatusEnum.CANCELLED) {
      for (const item of order.items) {
        await this.productModel.findByIdAndUpdate(item.product, {
          $inc: { quantity: item.quantity },
        });
      }
      order.cancelledBy = new Types.ObjectId(adminId);
      order.cancelledAt = new Date();
    }

    order.orderStatus = updateDto.orderStatus;
    if (adminId && Types.ObjectId.isValid(adminId)) {
      order.updatedBy = new Types.ObjectId(adminId);
    }

    await order.save();
    await this.invalidateOrderCaches(order.user.toString());

    try {
      const userDoc = await this.orderModel.db.model('User').findById(order.user);
      if (userDoc?.email) {
        const customerFirstName = userDoc.name || 'Valued Customer';
        this.emailService.sendOrderStatusUpdateEmail(
          userDoc.email,
          customerFirstName,
          order,
          order.orderStatus,
        ).catch(() => {});
      }
    } catch {}

    return {
      success: true,
      message: 'Order status updated successfully',
      order,
    };
  }

  async updatePaymentStatusAdmin(orderId: string, updateDto: UpdatePaymentStatusDto, adminId: string) {
    if (!Types.ObjectId.isValid(orderId)) {
      throw new BadRequestException('Invalid order ID');
    }

    const order = await this.orderModel.findById(orderId);
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    order.paymentStatus = updateDto.paymentStatus;
    if (updateDto.paymentTransactionId) {
      order.paymentTransactionId = updateDto.paymentTransactionId;
    }
    if (adminId && Types.ObjectId.isValid(adminId)) {
      order.updatedBy = new Types.ObjectId(adminId);
    }

    await order.save();
    await this.invalidateOrderCaches(order.user.toString());

    return {
      success: true,
      message: 'Payment status updated successfully',
      order,
    };
  }

  async refundOrderAdmin(orderId: string, refundDto: RefundOrderDto, adminId: string) {
    if (!Types.ObjectId.isValid(orderId)) {
      throw new BadRequestException('Invalid order ID');
    }

    const order = await this.orderModel.findById(orderId);
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.paymentStatus === PaymentStatusEnum.REFUNDED) {
      throw new BadRequestException('Order is already fully refunded');
    }

    if (order.paymentStatus !== PaymentStatusEnum.PAID) {
      throw new BadRequestException('Only paid orders can be refunded');
    }

    const alreadyRefunded = order.refundedAmount || 0;
    const remainingRefundable = Math.max(0, order.totalPrice - alreadyRefunded);

    if (remainingRefundable <= 0) {
      throw new BadRequestException('No refundable balance remaining on this order');
    }

    const refundAmount = refundDto.amount !== undefined ? Number(refundDto.amount) : remainingRefundable;

    if (refundAmount <= 0) {
      throw new BadRequestException('Refund amount must be greater than 0');
    }

    if (refundAmount > remainingRefundable + 0.01) {
      throw new BadRequestException(
        `Refund amount (${refundAmount}) exceeds maximum refundable balance (${remainingRefundable})`,
      );
    }

    const refundAmountCents = Math.round(refundAmount * 100);

    if (order.paymentType === PaymentTypeEnum.STRIPE || order.paymentType === PaymentTypeEnum.CARD) {
      const stripeSecret = this.configService.get<string>('STRIPE_SECRET_KEY');
      if (this.stripeClient || (stripeSecret && !stripeSecret.includes('your_stripe_secret_key'))) {
        try {
          const stripeInstance = this.stripeClient || new Stripe(stripeSecret!, { apiVersion: '2025-01-27.acacia' as any });
          
          if (order.paymentTransactionId && order.paymentTransactionId.startsWith('cs_')) {
            const session = await stripeInstance.checkout.sessions.retrieve(order.paymentTransactionId);
            if (session.payment_intent) {
              await stripeInstance.refunds.create({
                payment_intent: typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent.id,
                amount: refundAmountCents,
              });
            }
          } else if (order.paymentTransactionId && order.paymentTransactionId.startsWith('pi_')) {
            await stripeInstance.refunds.create({
              payment_intent: order.paymentTransactionId,
              amount: refundAmountCents,
            });
          }
        } catch (error: any) {
          console.error('Stripe Refund Error:', error);
          throw new BadRequestException(`Stripe refund failed: ${error?.message || error}`);
        }
      }
    } else if (order.paymentType === PaymentTypeEnum.PAYMOB) {
      const apiKey = this.configService.get<string>('PAYMOB_API_KEY')?.trim();
      if (apiKey && apiKey !== 'your_paymob_api_key' && order.paymentTransactionId && order.paymentTransactionId !== 'PAYMOB_PENDING') {
        try {
          const authRes = await fetch('https://accept.paymob.com/api/auth/tokens', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ api_key: apiKey }),
          });
          const authData = await authRes.json();
          const token = authData.token;

          if (token) {
            const refundRes = await fetch('https://accept.paymob.com/api/acceptance/void_refund/refund', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                auth_token: token,
                transaction_id: order.paymentTransactionId,
                amount_cents: refundAmountCents,
              }),
            });
            const refundData = await refundRes.json();
            if (refundData.success === false || refundData.detail) {
              console.error('Paymob Refund Error:', refundData);
              throw new BadRequestException(`Paymob refund failed: ${refundData.detail || refundData.message || 'Unknown error'}`);
            }
          }
        } catch (error: any) {
          console.error('Paymob Refund Exception:', error);
          throw new BadRequestException(`Paymob refund failed: ${error?.message || error}`);
        }
      }
    }

    const shouldRestock = refundDto.restockItems !== false;
    if (shouldRestock) {
      for (const item of order.items) {
        await this.productModel.findByIdAndUpdate(item.product, {
          $inc: { quantity: item.quantity },
        });
      }
    }

    const newTotalRefunded = Math.round((alreadyRefunded + refundAmount) * 100) / 100;
    order.refundedAmount = newTotalRefunded;
    order.refundReason = refundDto.reason || order.refundReason || 'Admin Refund';
    if (adminId && Types.ObjectId.isValid(adminId)) {
      order.refundedBy = new Types.ObjectId(adminId);
      order.updatedBy = new Types.ObjectId(adminId);
    }
    order.refundedAt = new Date();

    const isFullyRefunded = newTotalRefunded >= Math.round(order.totalPrice * 100) / 100;

    if (isFullyRefunded) {
      order.paymentStatus = PaymentStatusEnum.REFUNDED;
      order.orderStatus = OrderStatusEnum.REFUNDED;
    }

    await order.save();
    await this.invalidateOrderCaches(order.user.toString());

    try {
      const userDoc = await this.orderModel.db.model('User').findById(order.user);
      if (userDoc?.email) {
        const customerFirstName = userDoc.name || 'Valued Customer';
        this.emailService.sendOrderStatusUpdateEmail(
          userDoc.email,
          customerFirstName,
          order,
          isFullyRefunded ? 'REFUNDED (FULL)' : `REFUNDED (PARTIAL: ${refundAmount} EGP)`,
        ).catch(() => {});
      }
    } catch {}

    return {
      success: true,
      message: isFullyRefunded
        ? `Order #${order.orderCode} has been fully refunded (${newTotalRefunded} EGP)`
        : `Order #${order.orderCode} has been partially refunded by ${refundAmount} EGP (Total refunded: ${newTotalRefunded} EGP)`,
      order,
    };
  }

  async handleStripeWebhook(signature: string, payload: Buffer) {
    const webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');
    if (!this.stripeClient || !webhookSecret) {
      throw new BadRequestException('Stripe webhook not configured');
    }

    let event: Stripe.Event;
    try {
      event = this.stripeClient.webhooks.constructEvent(payload, signature, webhookSecret);
    } catch {
      throw new BadRequestException('Invalid webhook signature');
    }
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const orderId = session.client_reference_id;
      if (orderId && Types.ObjectId.isValid(orderId)) {
        await this.markOrderPaid(orderId, session.id);
      }
    }
    return { received: true };
  }

  /**
   * Settles an order once the gateway confirms payment: flags it paid, records
   * the sale against each product, and empties the buyer's cart.
   *
   * Inventory was already reserved and the cart cleared when the order was
   * created, so this is idempotent - a replayed webhook is a no-op.
   */
  private async markOrderPaid(orderId: string, transactionId: string) {
    const order = await this.orderModel.findById(orderId);
    if (!order) return;

    if (order.paymentStatus === PaymentStatusEnum.PAID) {
      return;
    }

    order.paymentStatus = PaymentStatusEnum.PAID;
    order.paymentTransactionId = transactionId;
    await order.save();

    // `sold` drives the "best sellers" ordering, so it only counts paid orders.
    for (const item of order.items) {
      await this.productModel.findByIdAndUpdate(item.product, {
        $inc: { sold: item.quantity },
      });
    }

    // Defensive: the cart is normally emptied at order creation, but a cart
    // refilled between checkout and payment should not survive the purchase.
    await this.cartModel.updateOne(
      { user: order.user },
      {
        $set: {
          items: [],
          totalItems: 0,
          subTotal: 0,
          discount: 0,
          totalPrice: 0,
        },
        $unset: { coupon: 1 },
      },
    );

    await this.invalidateOrderCaches(order.user.toString());
  }

  private async createPaymobCheckoutSession(order: OrderDocument, userDoc: any): Promise<string | undefined> {
    const apiKey = this.configService.get<string>('PAYMOB_API_KEY')?.trim();
    const integrationId = this.configService.get<string>('PAYMOB_INTEGRATION_ID')?.trim();
    const iframeId = this.configService.get<string>('PAYMOB_IFRAME_ID')?.trim();

    if (!apiKey || apiKey === 'your_paymob_api_key' || !integrationId || !iframeId) {
      console.warn('Paymob credentials not fully configured in environment.');
      return undefined;
    }

    try {
      const authRes = await fetch('https://accept.paymob.com/api/auth/tokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ api_key: apiKey }),
      });
      const authData = await authRes.json();
      const token = authData.token;
      if (!token) {
        console.error('Paymob Auth Failed:', authData);
        return undefined;
      }

      const amountCents = Math.round(order.totalPrice * 100);

      const orderRes = await fetch('https://accept.paymob.com/api/ecommerce/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          auth_token: token,
          delivery_needed: false,
          amount_cents: amountCents,
          currency: 'EGP',
          merchant_order_id: order._id.toString(),
          items: [],
        }),
      });
      const orderData = await orderRes.json();
      const paymobOrderId = orderData.id;
      if (!paymobOrderId) {
        console.error('Paymob Order Registration Failed:', orderData);
        return undefined;
      }

      const paymentKeyRes = await fetch('https://accept.paymob.com/api/acceptance/payment_keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          auth_token: token,
          amount_cents: amountCents,
          expiration: 3600,
          order_id: paymobOrderId,
          billing_data: {
            apartment: 'NA',
            email: userDoc?.email || 'customer@example.com',
            floor: 'NA',
            first_name: userDoc?.name ? userDoc.name.split(' ')[0] : 'Customer',
            street: order.shippingAddress?.street || 'NA',
            building: 'NA',
            phone_number: order.shippingAddress?.phone || '01000000000',
            shipping_method: 'PKG',
            postal_code: order.shippingAddress?.postalCode || 'NA',
            city: order.shippingAddress?.city || 'Cairo',
            country: order.shippingAddress?.country || 'EG',
            last_name: userDoc?.name && userDoc.name.split(' ').length > 1 ? userDoc.name.split(' ')[1] : 'User',
            state: 'NA',
          },
          currency: 'EGP',
          integration_id: Number(integrationId),
        }),
      });
      const paymentKeyData = await paymentKeyRes.json();
      const paymentToken = paymentKeyData.token;
      if (!paymentToken) {
        console.error('Paymob Payment Key Generation Failed:', paymentKeyData);
        return undefined;
      }

      return `https://accept.paymob.com/api/acceptance/iframes/${iframeId}?payment_token=${paymentToken}`;
    } catch (error) {
      console.error('Paymob Checkout Session Error:', error);
      return undefined;
    }
  }

  async handlePaymobWebhook(payload: any) {
    const hmacSecret = this.configService.get<string>('PAYMOB_HMAC_SECRET');
    const data = payload?.obj || payload;

    if (!data) {
      throw new BadRequestException('Invalid Paymob payload');
    }

    if (hmacSecret && hmacSecret !== 'your_paymob_hmac_secret') {
      const receivedHmac = payload?.hmac || payload?.obj?.hmac || payload?.type;
      if (receivedHmac && typeof receivedHmac === 'string') {
        const concatenatedData = [
          data.amount_cents,
          data.created_at,
          data.currency,
          data.error_occured,
          data.has_parent_transaction,
          data.id,
          data.integration_id,
          data.is_3d_secure,
          data.is_auth,
          data.is_capture,
          data.is_refunded,
          data.is_standalone_payment,
          data.pending,
          data.order?.id,
          data.owner,
          data.pending,
          data.source_data?.pan,
          data.source_data?.sub_type,
          data.source_data?.type,
          data.success,
        ].join('');

        const calculatedHmac = createHmac('sha512', hmacSecret)
          .update(concatenatedData)
          .digest('hex');

        if (calculatedHmac.toLowerCase() !== receivedHmac.toLowerCase()) {
          throw new BadRequestException('Invalid Paymob HMAC signature');
        }
      }
    }

    const isSuccess = data.success === true || data.success === 'true';
    const merchantOrderId = data.order?.merchant_order_id || data.merchant_order_id;

    if (isSuccess && merchantOrderId && Types.ObjectId.isValid(merchantOrderId)) {
      await this.markOrderPaid(merchantOrderId, data.id?.toString() ?? '');
    }

    return { received: true };
  }
}
