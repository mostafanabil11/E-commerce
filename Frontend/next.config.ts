import type { NextConfig } from "next";

/**
 * Product imagery is served by the backend from its /uploads directory, so the
 * API host must be allowed for next/image.
 *
 * The host is derived from `API`, and in development any localhost port is also
 * allowed: the API base and the URLs the API returns can legitimately differ
 * (for example when the backend runs on a non-default port but advertises
 * PUBLIC_URL on another), and that mismatch should not blank out every image.
 */
function apiPattern() {
  try {
    const url = new URL(process.env.API || "http://localhost:5000/api/v1");
    return {
      protocol: url.protocol.replace(":", "") as "http" | "https",
      hostname: url.hostname,
      port: url.port || undefined,
      pathname: "/**",
    };
  } catch {
    return undefined;
  }
}

const localhostPatterns = [
  // No `port` means any port on that host.
  { protocol: "http" as const, hostname: "localhost", pathname: "/**" },
  { protocol: "http" as const, hostname: "127.0.0.1", pathname: "/**" },
];

const pattern = apiPattern();

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      ...(pattern ? [pattern] : []),
      ...(process.env.NODE_ENV === "production" ? [] : localhostPatterns),
    ],
  },
};

export default nextConfig;
