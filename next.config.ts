import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    turbopack: false,
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "**.public.blob.vercel-storage.com" },
    ],
    formats: ["image/avif", "image/webp"],
  },
  experimental: {
    // server actions body size for image uploads
    serverActions: { bodySizeLimit: "8mb" },
  },
};

export default nextConfig;
