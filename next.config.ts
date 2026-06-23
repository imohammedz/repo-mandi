import type { NextConfig } from "next";

const supabaseHostname = (() => {
  const configuredSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!configuredSupabaseUrl) return null;
  try {
    return new URL(configuredSupabaseUrl).hostname;
  } catch {
    return null;
  }
})();

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      ...(supabaseHostname
        ? [
            {
              protocol: "https" as const,
              hostname: supabaseHostname,
            },
          ]
        : []),
      {
        protocol: "https",
        hostname: "github.com",
        pathname: "/user-attachments/assets/**",
      },
    ],
  },
};

export default nextConfig;
