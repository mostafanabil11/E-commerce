'use server'
import getMyToken from "@/utilities/getMyToken";
import { apiMutate } from '@/lib/api';
import { CartType } from '@/Types/Cart.type';

export default async function updateItemQuantityApi(id: string, count: string) {
  const token = await getMyToken();
  if (!token) {
    return { status: "fail" as const, error: "Not Authorized" };
  }
  return apiMutate<CartType>(`/cart/${id}`, { method: 'PUT', token, body: { count: Number(count) } });
}
