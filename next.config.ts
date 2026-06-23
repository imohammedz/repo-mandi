import type { NextConfig } from "next";

// Default host for this repository's configured Supabase Storage project.
// Override with NEXT_PUBLIC_SUPABASE_URL per environment when needed.
const defaultSupabaseUrl = "https://qssywsfjbkqzatwbzvvw.supabase.co";
const configuredSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || defaultSupabaseUrl;
const supabaseHostname = (() => {
  try {
    return new URL(configuredSupabaseUrl).hostname;
  } catch {
    return new URL(defaultSupabaseUrl).hostname;
  }
})();

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: supabaseHostname,
      },
      {
        protocol: "https",
        hostname: "github.com",
        pathname: "/user-attachments/assets/**",
      },
    ],
  },
};

export default nextConfig;
