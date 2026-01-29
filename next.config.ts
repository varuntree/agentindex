import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["better-sqlite3", "drizzle-orm"],
  // Exclude non-Next.js directories from webpack compilation
  webpack: (config, { isServer, dev }) => {
    config.watchOptions = {
      ...config.watchOptions,
      ignored: [
        "**/node_modules/**",
        "**/pipeline/**",
        "**/agent-ralph/**",
        "**/.git/**",
      ],
    };

    // Work around occasional server chunk-path mismatch during prerender/build
    // (runtime expects `./<id>.js` but chunks are emitted under `server/chunks/`).
    if (!dev && isServer && typeof config.output?.chunkFilename === "string") {
      if (!config.output.chunkFilename.includes("chunks/")) {
        config.output.chunkFilename = "chunks/[id].js";
      }
    }

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
