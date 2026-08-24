import * as z from "zod"

export const verifyCodeSchema = z.object({
  resetCode: z.string().min(1, { message: "Please enter the verification code" }),
})

export type verifyCodeSchemaType = z.infer<typeof verifyCodeSchema>
