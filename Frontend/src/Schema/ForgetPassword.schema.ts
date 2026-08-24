import * as z from "zod"



export const forgetPasswordSchema = z.object({

    email: z.email().nonempty({ message: "Please enter your email" }),
 
})
;

 export type forgetPasswordSchemaType = z.infer<typeof forgetPasswordSchema>