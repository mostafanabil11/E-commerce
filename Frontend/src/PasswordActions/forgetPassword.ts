'use server'

import { forgetPasswordSchemaType } from "@/Schema/ForgetPassword.schema";
import { apiUrl } from '@/lib/api';

export default async function forgetPasswordApi(formValues: forgetPasswordSchemaType) {
  try {
    const response = await fetch(apiUrl('/auth/forgotPasswords'), {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email: formValues.email }),
    });
    const payload = await response.json();
    return payload;
  } catch {
    return { statusMsg: "fail", message: "Network error occurred" };
  }
}
