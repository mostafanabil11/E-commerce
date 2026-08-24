'use server'

import { resetPasswordSchemaType } from "@/Schema/ResetPassword.schema";
import { apiMutate } from "@/lib/api";

/** Step 3: sets the new password, provided step 2 verified the code. */
export default async function resetPasswordApi(formValues: resetPasswordSchemaType) {
  return apiMutate('/auth/resetPassword', {
    method: 'PUT',
    body: { email: formValues.email, newPassword: formValues.newPassword },
  });
}
