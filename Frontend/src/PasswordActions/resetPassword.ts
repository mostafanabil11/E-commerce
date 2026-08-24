'use server'

import { resetPasswordSchemaType } from "@/Schema/ResetPassword.schema";
import { apiUrl } from '@/lib/api';

export default async function resetPasswordApi(formValues: resetPasswordSchemaType) {
  try {
    const response = await fetch(apiUrl('/auth/resetPassword'), {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email: formValues.email,
        newPassword: formValues.newPassword
      }),
    });
    const payload = await response.json();
    return payload;
  } catch {
    return { status: "fail", message: "Network error occurred" };
  }
}
