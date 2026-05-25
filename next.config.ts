import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "qssywsfjbkqzatwbzvvw.supabase.co",
      },
    ],
  },
};

export default nextConfig;
