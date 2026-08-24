import * as z from "zod"



export const registerSchema = z.object({
     name: z
      .string()
      .nonempty({ message: "Name is required" })
      .min(2, { message: "Name must be at least 2 characters long" })
      .max(50, { message: "Name must be less than 50 characters" }),

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

    rePassword: z
      .string()
      .nonempty({ message: "Please confirm your password" }),

    phone: z
      .string()
      .nonempty({ message: "Phone number is required" })
      .regex(/^(?:\+20|0)?1[0-2,5]\d{8}$/, { message: "Invalid phone number" }), 
})
  .refine((data) => data.password === data.rePassword, {
    message: "Passwords do not match",
    path: ["rePassword"],
  });

 export type registerSchemaType = z.infer<typeof registerSchema>