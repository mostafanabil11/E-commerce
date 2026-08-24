'use server'
import getMyToken from "@/utilities/getMyToken";
import { apiMutate } from '@/lib/api';

export default async function getLoggedUserWishlistApi() {
  const token = await getMyToken();
  if (!token) {
    return { status: "fail" as const, error: "Please login first", data: [] };
  }
  return apiMutate('/wishlist', { method: 'GET', token });
}
