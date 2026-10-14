import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // next/image serves AVIF/WebP automatically; allow the external hosts used in the catalogue.
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "thumb.wikimedia.org" },
      { protocol: "https", hostname: "upload.wikimedia.org" },
    ],
    formats: ["image/avif", "image/webp"],
  },
  async redirects() {
    // Permanent redirects for SEO. Add legacy/old URLs here when they exist.
    return [
      // { source: "/old-path", destination: "/new-path", permanent: true },
    ];
  },
};

export default nextConfig;
