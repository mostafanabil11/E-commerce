"use server"
import getMyToken from "@/utilities/getMyToken";
import { apiUrl } from '@/lib/api';

export default async function removeFromWishlistApi(id:string) {
  const token = await getMyToken();
  if(!token){
    return { status: "fail", message: "Not Authorized" };
  }
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const response = await fetch(apiUrl(`/wishlist/${id}`) , {
      method : "DELETE",
      headers : {
          token : token,
          "Content-Type" : "application/json"
      },
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    const payload = await response.json();
    return payload;
  } catch {
    return { status: "fail", message: "Network error occurred" };
  }
}
