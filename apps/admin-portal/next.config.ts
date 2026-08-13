import type { NextConfig } from "next";
import path from "path";
import createBundleAnalyzer from "@next/bundle-analyzer";

const withBundleAnalyzer = createBundleAnalyzer({
    enabled: process.env.ANALYZE === "true",
});

const nextConfig: NextConfig = {
    transpilePackages: ["@repo/ui", "@repo/database", "@repo/types", "@repo/utils"],
    serverExternalPackages: ["ssh2", "mysql2"],
    // Expose secrets to Edge Runtime (middleware). These are server-only and never
    // sent to the browser. Values come from .env.local / Vercel dashboard.
    env: {
        JWT_SECRET: process.env.JWT_SECRET ?? "",
    },
    turbopack: {
        root: path.resolve(__dirname, "../../"),
    },
    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "drive.google.com",
            },
            {
                protocol: "https",
                hostname: "lh3.googleusercontent.com",
            },
            // For dev
            {
                protocol: "https",
                hostname: "dev-pub-3100e4c32b054e6598de798c71120dc1.r2.dev",
                pathname: "/**",
            },
        ],
    },
};

export default withBundleAnalyzer(nextConfig);
