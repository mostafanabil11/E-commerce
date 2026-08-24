import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  Query,
  RawBodyRequest,
  Req,
  UseGuards,
} from '@nestjs/common';
import { OrderService } from './order.service';
import {
  CancelOrderDto,
  CreateOrderDto,
  FilterOrderDto,
  OrderIdParamDto,
  RefundOrderDto,
  UpdateOrderStatusDto,
  UpdatePaymentStatusDto,
  CheckoutSessionDto,
  CartIdParamDto,
} from './order.dto';
import { AuthGuard } from '../common/guard/auth.guard';
import { RolesGuard } from '../common/guard/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/user.decorator';
import { PaymentTypeEnum, RoleEnum } from '../common/enums';

@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  @UseGuards(AuthGuard)
  async createOrder(
    @CurrentUser('id') userId: string,
    @Body() createOrderDto: CreateOrderDto,
  ) {
    return this.orderService.createOrder(userId, createOrderDto);
  }

  /**
   * Creates the order from the caller's cart and hands back a Stripe Checkout
   * URL. `cartId` is accepted for parity with the storefront's call signature;
   * the authenticated user's own cart is always the one charged. `url` is
   * where Stripe returns the customer afterwards.
   */
  @Post('checkout-session/:cartId')
  @UseGuards(AuthGuard)
  async createCheckoutSession(
    @CurrentUser('id') userId: string,
    @Param() params: CartIdParamDto,
    @Query('url') url: string | undefined,
    @Body() checkoutSessionDto: CheckoutSessionDto,
  ) {
    const { details, city, phone } = checkoutSessionDto.shippingAddress;

    const result = await this.orderService.createOrder(
      userId,
      {
        shippingAddress: {
          street: details,
          city,
          country: 'Egypt',
          phone,
        },
        paymentType: PaymentTypeEnum.STRIPE,
      },
      url,
    );

    return {
      status: 'success',
      session: { url: result.checkoutUrl },
      order: result.order,
    };
  }

  @Get('my-orders')
  @UseGuards(AuthGuard)
  async getUserOrders(
    @CurrentUser('id') userId: string,
    @Query() query: FilterOrderDto,
  ) {
    const result = await this.orderService.getUserOrders(userId, query);
    return {
      success: true,
      ...result,
    };
  }

  @Get('admin/all')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(RoleEnum.ADMIN)
  async getAllOrdersAdmin(@Query() query: FilterOrderDto) {
    const result = await this.orderService.getAllOrdersAdmin(query);
    return {
      success: true,
      ...result,
    };
  }

  @Get('admin/:id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(RoleEnum.ADMIN)
  async getAnyOrderByIdAdmin(@Param() params: OrderIdParamDto) {
    const order = await this.orderService.getAnyOrderByIdAdmin(params.id);
    return {
      success: true,
      order,
    };
  }

  @Patch('admin/:id/status')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(RoleEnum.ADMIN)
  async updateOrderStatusAdmin(
    @Param() params: OrderIdParamDto,
    @Body() updateDto: UpdateOrderStatusDto,
    @CurrentUser('id') adminId: string,
  ) {
    return this.orderService.updateOrderStatusAdmin(params.id, updateDto, adminId);
  }

  @Patch('admin/:id/payment-status')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(RoleEnum.ADMIN)
  async updatePaymentStatusAdmin(
    @Param() params: OrderIdParamDto,
    @Body() updateDto: UpdatePaymentStatusDto,
    @CurrentUser('id') adminId: string,
  ) {
    return this.orderService.updatePaymentStatusAdmin(params.id, updateDto, adminId);
  }

  @Patch('admin/:id/refund')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(RoleEnum.ADMIN)
  async refundOrderAdmin(
    @Param() params: OrderIdParamDto,
    @Body() refundDto: RefundOrderDto,
    @CurrentUser('id') adminId: string,
  ) {
    return this.orderService.refundOrderAdmin(params.id, refundDto, adminId);
  }

  @Get(':id')
  @UseGuards(AuthGuard)
  async getUserOrderById(
    @CurrentUser('id') userId: string,
    @Param() params: OrderIdParamDto,
  ) {
    const order = await this.orderService.getUserOrderById(userId, params.id);
    return {
      success: true,
      order,
    };
  }

  @Patch(':id/cancel')
  @UseGuards(AuthGuard)
  async cancelOrder(
    @CurrentUser('id') userId: string,
    @Param() params: OrderIdParamDto,
    @Body() cancelOrderDto: CancelOrderDto,
  ) {
    return this.orderService.cancelOrder(userId, params.id, cancelOrderDto);
  }

  @Post('webhook/stripe')
  async handleStripeWebhook(
    @Headers('stripe-signature') signature: string,
    @Req() req: RawBodyRequest<Request>,
  ) {
    const rawBody = req.rawBody || Buffer.from(JSON.stringify(req.body));
    return this.orderService.handleStripeWebhook(signature, rawBody);
  }

  @Post('webhook/paymob')
  async handlePaymobWebhook(@Body() body: any) {
    return this.orderService.handlePaymobWebhook(body);
  }
}
