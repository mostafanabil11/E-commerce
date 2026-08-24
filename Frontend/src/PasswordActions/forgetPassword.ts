'use server'

import { forgetPasswordSchemaType } from "@/Schema/ForgetPassword.schema";
import { apiMutate } from "@/lib/api";

/** Step 1 of the reset flow: emails a one-time code. */
export default async function forgetPasswordApi(formValues: forgetPasswordSchemaType) {
  return apiMutate('/auth/forgotPasswords', {
    method: 'POST',
    body: { email: formValues.email },
  });
}
