'use server'
import getMyToken from "@/utilities/getMyToken";
import { apiMutate } from '@/lib/api';

export default async function removeFromWishlistApi(id: string) {
  const token = await getMyToken();
  if (!token) {
    return { status: "fail" as const, error: "Not Authorized" };
  }
  return apiMutate(`/wishlist/${id}`, { method: 'DELETE', token });
}
