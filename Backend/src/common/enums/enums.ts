export enum GenderEnum {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
}

export enum RoleEnum {
  USER = 'USER',
  ADMIN = 'ADMIN',
}

export enum ProviderEnum {
  SYSTEM = 'SYSTEM',
  GOOGLE = 'GOOGLE',
}
export enum CouponTypeEnum {
  FIXED = 'FIXED',
  PERCENTAGE = 'PERCENTAGE',
}

export enum OrderStatusEnum {
  PENDING = 'PENDING',
  PLACED = 'PLACED',
  PROCESSING = 'PROCESSING',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
}

export enum PaymentTypeEnum {
  CASH_ON_DELIVERY = 'CASH_ON_DELIVERY',
  CARD = 'CARD',
  STRIPE = 'STRIPE',
  PAYMOB = 'PAYMOB',
}

export enum PaymentStatusEnum {
  PENDING = 'PENDING',
  PAID = 'PAID',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

