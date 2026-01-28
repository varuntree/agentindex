import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  serverExternalPackages: ["better-sqlite3", "drizzle-orm"],
  // Exclude non-Next.js directories from webpack compilation
  webpack: (config) => {
    config.watchOptions = {
      ...config.watchOptions,
      ignored: [
        "**/node_modules/**",
        "**/pipeline/**",
        "**/agent-ralph-ui/**",
        "**/.git/**",
      ],
    };
    return config;
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.ratemyagent.com.au" },
      { protocol: "https", hostname: "*.domain.com.au" },
      { protocol: "https", hostname: "*.realestate.com.au" },
      { protocol: "https", hostname: "*.raywhite.com" },
      { protocol: "https", hostname: "*.mcgrath.com.au" },
      { protocol: "https", hostname: "*.belleproperty.com" },
      { protocol: "https", hostname: "*.ljhooker.com.au" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "agentindex.com.au" },
    ],
  },
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "X-Robots-Tag", value: "noindex" },
        ],
      },
    ];
  },
};

export default nextConfig;
