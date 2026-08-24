'use server'
import getMyToken from "@/utilities/getMyToken";
import { apiUrl } from '@/lib/api';

export default async function getUserCartApi() {
  const token = await getMyToken();
  if(!token){
    return { status: "fail", message: "Please login first", data: null };
  }
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const response = await fetch(apiUrl('/cart'), {
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
    return { status: "fail", message: "Network error occurred", data: null };
  }
}
