import * as z from "zod"



export const loginSchema = z.object({

    email: z
      .email().nonempty({ message: "Email is required" }),
    password: z
      .string()
      .nonempty({ message: "Password is required" })
      .min(8, { message: "Password must be at least 8 characters long" })
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/,
        { message: "Password must contain at least one uppercase, one lowercase letter, and one number" }
      ),
})
;

 export type loginSchemaType = z.infer<typeof loginSchema>