import type { NextConfig } from "next";
import { loadEnvConfig } from "@next/env";
import path from "path";

loadEnvConfig(__dirname);

const nextConfig: NextConfig = {
    transpilePackages: ["@repo/ui", "@repo/database", "@repo/types", "@repo/utils"],
    serverExternalPackages: ["ssh2", "mysql2"],
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
