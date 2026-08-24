'use server'
import getMyToken from "@/utilities/getMyToken"
import { apiUrl } from '@/lib/api';

export default async function updateItemQuantityApi(id:string , count : string) {
  const token = await getMyToken();
  if(!token){
    return { status: "fail", message: "Not Authorized" };
  }
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const response = await fetch(apiUrl(`/cart/${id}`) , {
      method : "PUT" ,
      headers : {
          token : token,
          "Content-Type" : "application/json"
      } ,
      body : JSON.stringify({ count : count }),
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    const payload = await response.json();
    return payload;
  } catch {
    return { status: "fail", message: "Network error occurred" };
  }
}
