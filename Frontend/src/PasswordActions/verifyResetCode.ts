'use server'

import { verifyCodeSchemaType } from "@/Schema/VerifyCode.schema";
import { apiMutate } from "@/lib/api";

/** Step 2: confirms the emailed code before a new password may be set. */
export default async function verifyResetCodeApi(formValues: verifyCodeSchemaType) {
  return apiMutate('/auth/verifyResetCode', {
    method: 'POST',
    body: { resetCode: formValues.resetCode },
  });
}
