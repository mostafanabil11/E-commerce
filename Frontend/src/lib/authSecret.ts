/**
 * Secret used to sign and decrypt NextAuth session tokens.
 *
 * Deliberately has no fallback: a hardcoded default in a public repository
 * would let anyone forge a valid session. Set NEXTAUTH_SECRET in `.env.local`
 * (generate one with `openssl rand -base64 32`).
 */
export function getAuthSecret(): string {
  const secret = process.env.NEXTAUTH_SECRET;

  if (!secret) {
    throw new Error(
      'NEXTAUTH_SECRET is not set. Add it to .env.local — generate one with: openssl rand -base64 32',
    );
  }

  return secret;
}
