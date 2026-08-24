import * as z from "zod"



export const checkoutSchema = z.object({

    details: z
      .string().nonempty({ message: "Please enter details" }),
    phone: z
      .string()
      .nonempty({ message: "Phone number is required" })
      .regex(/^(?:\+20|0)?1[0-2,5]\d{8}$/, { message: "Invalid phone number" }), 
    city: z
    .string()
    .nonempty({message :"City is required"})
})
;

 export type checkoutSchemaType = z.infer<typeof checkoutSchema>