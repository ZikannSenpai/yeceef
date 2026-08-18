import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.tiktokcdn.com" },
      { protocol: "https", hostname: "*.ibytedtos.com" },
      { protocol: "https", hostname: "*.tiktok.com" },
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "i.pravatar.cc" }
    ]
  }
};

export default nextConfig;
