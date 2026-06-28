import type { NextConfig } from "next";

<<<<<<< HEAD
const supabaseHostname = (() => {
  const configuredSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!configuredSupabaseUrl) return null;
  try {
    return new URL(configuredSupabaseUrl).hostname;
  } catch {
    return null;
=======
// Read Supabase host from environment configuration.
const configuredSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseHostname = (() => {
  if (!configuredSupabaseUrl) return undefined;

  try {
    return new URL(configuredSupabaseUrl).hostname;
  } catch {
    return undefined;
>>>>>>> main
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
