'use server'

import { verifyCodeSchemaType } from "@/Schema/VerifyCode.schema";
import { apiUrl } from '@/lib/api';

export default async function verifyResetCodeApi(formValues: verifyCodeSchemaType) {
  try {
    const response = await fetch(apiUrl('/auth/verifyResetCode'), {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ resetCode: formValues.resetCode }),
    });
    const payload = await response.json();
    return payload;
  } catch {
    return { status: "fail", message: "Network error occurred" };
  }
}
