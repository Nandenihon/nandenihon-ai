import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    transpilePackages: ["@repo/ui", "@repo/database", "@repo/types", "@repo/utils"],
};

export default nextConfig;
