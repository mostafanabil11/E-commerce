/**
 * Secret used to sign and decrypt NextAuth session tokens.
 *
 * Deliberately has no fallback: a hardcoded default in a public repository
 * would let anyone forge a valid session.
 */
export function getAuthSecret(): string {
  const secret = process.env.NEXTAUTH_SECRET;

  if (!secret) {
    throw new Error(
      'NEXTAUTH_SECRET is not set. Locally, add it to .env.local. When deploying, set it ' +
        'in the hosting provider environment variables (Vercel: Project -> Settings -> ' +
        'Environment Variables). Generate one with: openssl rand -base64 32',
    );
  }

  return secret;
}
