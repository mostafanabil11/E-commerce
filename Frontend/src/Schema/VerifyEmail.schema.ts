import * as z from "zod"

export const verifyEmailSchema = z.object({
  otp: z
    .string()
    .nonempty({ message: "Please enter the verification code" })
    .regex(/^\d{6}$/, { message: "The code is 6 digits" }),
})

export type verifyEmailSchemaType = z.infer<typeof verifyEmailSchema>
