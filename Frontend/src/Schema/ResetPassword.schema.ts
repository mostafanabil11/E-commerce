import * as z from "zod"

export const resetPasswordSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  newPassword: z.string().min(6, { message: "Password must be at least 6 characters" }),
})

export type resetPasswordSchemaType = z.infer<typeof resetPasswordSchema>
