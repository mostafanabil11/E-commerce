import type { NextConfig } from "next";

/**
 * Product imagery is served by the backend out of its /uploads directory, so
 * the API host has to be allowed for next/image. `API` drives the dev default;
 * add your deployed backend host here before shipping.
 */
const apiHost = (() => {
  try {
    return new URL(process.env.API || "http://localhost:5000/api/v1");
  } catch {
    return new URL("http://localhost:5000");
  }
})();

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: apiHost.protocol.replace(":", "") as "http" | "https",
        hostname: apiHost.hostname,
        port: apiHost.port || undefined,
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
