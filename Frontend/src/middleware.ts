import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";
import { getAuthSecret } from '@/lib/authSecret';


export async function middleware(request : NextRequest) {
 
    const token = await getToken({
      req : request,
      secret : getAuthSecret()
    });

     
    if(token){
        if(request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/register' ){
             return NextResponse.redirect(new URL('/' , request.url));
        }
        else{
             return NextResponse.next();
        }
        
    }
   
    else{
        if(
            request.nextUrl.pathname === '/cart' || 
            request.nextUrl.pathname === '/wishlist' || 
            request.nextUrl.pathname === '/verifyemail' || 
            request.nextUrl.pathname.startsWith('/checkout')
        ){
            return NextResponse.redirect(new URL('/login' , request.url));
        }
        return NextResponse.next();
    }
}

export const config = {
    matcher : ['/cart', '/wishlist', '/verifyemail', '/checkout/:path*', '/login', '/register']
}

