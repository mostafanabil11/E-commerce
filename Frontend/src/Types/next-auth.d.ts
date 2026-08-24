/* eslint-disable */
import NextAuth ,{User} from "next-auth"
import { JWT } from "next-auth/jwt"

declare module "next-auth" {
  
  interface User {
   user :{
    _id? : string,
    name : string,
    email : string,
    role : string,
    isVerified? : boolean
   }
   token : string
  }

  interface Session {
   user : User['user'];
  }
}


declare module "next-auth/jwt" {
  
  interface JWT extends User {
    
    idToken?: string
  }
}