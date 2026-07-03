import type { NextConfig } from "next";
import path from "path";

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
        ],
    },
};

export default nextConfig;
