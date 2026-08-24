import { decode } from "next-auth/jwt";
import { cookies } from "next/headers";
import { getAuthSecret } from '@/lib/authSecret';

export default async function getMyToken() {
  try {
    const encryptedToken = (await cookies()).get('next-auth.session-token')?.value ||
    (await cookies()).get('__Secure-next-auth.session-token')?.value;

    if (!encryptedToken) return null;

    const token = await decode({
      token: encryptedToken,
      secret: getAuthSecret()
    });

    return token?.token || null;
  } catch {
    return null;
  }
}
