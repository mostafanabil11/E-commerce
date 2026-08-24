'use server'
import getMyToken from "@/utilities/getMyToken";
import { apiMutate } from '@/lib/api';
import { CartType } from '@/Types/Cart.type';

export default async function getUserCartApi() {
  const token = await getMyToken();
  if (!token) {
    return { status: "fail" as const, error: "Please login first", data: null };
  }
  return apiMutate<CartType>('/cart', { method: 'GET', token });
}
