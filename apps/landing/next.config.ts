import type { NextConfig } from "next";
import path from "path";

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
  serverExternalPackages: ["ssh2", "mysql2"],
  turbopack: {
    root: path.resolve(__dirname, "../../"),
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "www.nandenihon.com",
        pathname: "/blog/wp-content/uploads/**",
      },
      {
        protocol: "https",
        hostname: "nandenihon.com",
        pathname: "/blog/wp-content/uploads/**",
      },
      {
        protocol: "https",
        hostname: "drive.google.com",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      ...uploadImagePatterns,
    ],
  },
};

export default nextConfig;
