import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["better-sqlite3", "drizzle-orm"],
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
