import type { NextConfig } from "next";
import path from "path";

const apiUrl = process.env.NEXT_PUBLIC_API_URL;
const uploadUrl = process.env.NEXT_PUBLIC_UPLOAD_BASE_URL;
const legacyUploadHosts = new Set(["nandenihon.com", "www.nandenihon.com"]);

function createUploadImagePattern(value: string | undefined, pathname?: string) {
  return value
    ? (() => {
      try {
        const url = new URL(value);
        const patternPathname =
          pathname || `${url.pathname.replace(/\/$/, "") || ""}/**`;

        if (legacyUploadHosts.has(url.hostname)) {
          return null;
        }

        return {
          protocol: url.protocol.replace(":", "") as "http" | "https",
          hostname: url.hostname,
          port: url.port,
          pathname: patternPathname,
        };
      } catch {
        return null;
      }
    })()
    : null;
}

const uploadImagePatterns = [
  createUploadImagePattern(apiUrl, "/uploads/**"),
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
        hostname: "blog.nandenihon.com",
        pathname: "/wp-content/uploads/**",
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
