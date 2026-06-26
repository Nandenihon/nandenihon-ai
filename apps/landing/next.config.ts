import type { NextConfig } from "next";

const apiUrl = process.env.NEXT_PUBLIC_API_URL;
const uploadUrl = process.env.NEXT_PUBLIC_UPLOAD_BASE_URL || "https://nandenihon.com";

function createUploadImagePattern(value: string | undefined) {
  return value
    ? (() => {
      try {
        const url = new URL(value);
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
}

const uploadImagePatterns = [
  createUploadImagePattern(apiUrl),
  createUploadImagePattern(uploadUrl),
].filter((pattern): pattern is NonNullable<typeof pattern> => Boolean(pattern));

const nextConfig: NextConfig = {
  transpilePackages: ["@repo/ui", "@repo/database", "@repo/types", "@repo/utils"],
  serverExternalPackages: ["ssh2", "mysql2", "mongoose"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      ...uploadImagePatterns,
    ],
  },
};

export default nextConfig;
