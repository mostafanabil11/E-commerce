'use server'
import getMyToken from "@/utilities/getMyToken"
import { apiUrl } from '@/lib/api';

export default async function clearCartApi() {
  const token = await getMyToken();
  if(!token){
    return { status: "fail", message: "Not Authorized" };
  }
  try {
    const response = await fetch(apiUrl('/cart'), {
      method : 'DELETE',
      headers : {
          token : token,
          "Content-Type" : "application/json"
      }
    });
    const payload = await response.json();
    return payload;
  } catch {
    return { status: "fail", message: "Network error occurred" };
  }
}

