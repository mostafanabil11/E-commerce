'use server'

import { checkoutSchemaType } from "@/Schema/Checkout.shcema";
import getMyToken from "@/utilities/getMyToken"
import { apiUrl } from '@/lib/api';

export default async function CheckoutSessionApi(
  cartId:string ,
  url = process.env.NEXT_URL || "http://localhost:3000",
  formValues:checkoutSchemaType
) {
  const token = await getMyToken();
  if(!token){
    return { status: "fail", message: "Login first" };
  }
  const returnUrl = url && url.trim() !== "" ? url : (process.env.NEXT_URL || "http://localhost:3000");
  try {
    const response = await fetch(apiUrl(`/orders/checkout-session/${cartId}?url=${returnUrl}`),{
      method : "POST",
      headers :{
        token : token,
        "Content-Type" : "application/json"
      },
      body : JSON.stringify({shippingAddress : formValues})
    });
    const payload = await response.json();
    return payload;
  } catch {
    return { status: "fail", message: "Network error occurred" };
  }
}


