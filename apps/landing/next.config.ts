import type { NextConfig } from "next";
import path from "path";
import createBundleAnalyzer from "@next/bundle-analyzer";

const withBundleAnalyzer = createBundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

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
      {
        protocol: "https",
        hostname: "pub-3100e4c32b054e6598de798c71120dc1.r2.dev",
        pathname: "/**",
      },
      ...uploadImagePatterns,
    ],
  },
};

// @next/bundle-analyzer resolves against the workspace-hoisted `next` install, whose
// NextConfig type doesn't structurally match this app's own (newer) `next` version.
export default withBundleAnalyzer(nextConfig as Parameters<typeof withBundleAnalyzer>[0]) as NextConfig;
