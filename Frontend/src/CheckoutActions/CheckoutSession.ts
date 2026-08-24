'use server'

import { checkoutSchemaType } from "@/Schema/Checkout.shcema";
import getMyToken from "@/utilities/getMyToken";
import { apiMutate } from '@/lib/api';

interface CheckoutSessionPayload {
  session: { url?: string };
}

export default async function CheckoutSessionApi(
  cartId: string,
  url: string | undefined,
  formValues: checkoutSchemaType,
) {
  const token = await getMyToken();
  if (!token) {
    return { status: "fail" as const, error: "Login first" };
  }

  const returnUrl =
    url && url.trim() !== "" ? url : process.env.NEXT_URL || "http://localhost:3000";

  return apiMutate<CheckoutSessionPayload>(
    `/orders/checkout-session/${cartId}?url=${encodeURIComponent(returnUrl)}`,
    { method: 'POST', token, body: { shippingAddress: formValues } },
  );
}
