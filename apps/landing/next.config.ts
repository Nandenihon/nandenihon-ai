import type { NextConfig } from "next";

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
    ],
  },
};

export default nextConfig;
