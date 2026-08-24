import { NextAuthOptions } from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { jwtDecode } from "jwt-decode";
import { apiUrl } from '@/lib/api';
import { getAuthSecret } from '@/lib/authSecret';

export const authOptions: NextAuthOptions = {
  secret: getAuthSecret(),
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  pages: {
    signIn: "/login"
  },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: {},
        password: {}
      },
      authorize: async (credentials) => {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 6000);

          const response = await fetch(apiUrl('/auth/signin'), {
            method: "POST",
            body: JSON.stringify({
              email: credentials?.email,
              password: credentials?.password
            }),
            headers: { "Content-Type": "application/json" },
            signal: controller.signal
          });
          clearTimeout(timeoutId);

          if (!response.ok) {
            return null;
          }

          const payload = await response.json();
          if (payload.token) {
            const decodedToken: { id: string } = jwtDecode(payload.token);
            return {
              id: decodedToken.id,
              user: payload.user || { email: credentials?.email },
              token: payload.token,
            };
          } else {
            return null;
          }
        } catch (error) {
          console.error("Authorize Error:", error);
          return null;
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.user = user?.user;
        token.token = user?.token;
      }
      return token;
    },
    async session({ session, token }) {
      session.user = token.user;
      return session;
    }
  }
}
