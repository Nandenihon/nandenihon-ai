import type { NextConfig } from "next";

const apiUrl = process.env.NEXT_PUBLIC_API_URL;
const apiImagePattern = apiUrl
  ? (() => {
      try {
        const url = new URL(apiUrl);
        return {
          protocol: url.protocol.replace(":", "") as "http" | "https",
          hostname: url.hostname,
          port: url.port,
          pathname: "/uploads/**",
        };
      } catch {
        return null;
      }
    })()
  : null;

const nextConfig: NextConfig = {
  transpilePackages: ["@repo/ui", "@repo/database", "@repo/types", "@repo/utils"],
  serverExternalPackages: ["ssh2", "mysql2", "mongoose"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "http",
        hostname: "192.168.187.21",
        port: "3002",
        pathname: "/uploads/**",
      },
      ...(apiImagePattern ? [apiImagePattern] : []),
    ],
  },
};

export default nextConfig;
