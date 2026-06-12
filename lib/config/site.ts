const DEFAULT_SUPPORT_EMAIL = "support@repomandi.com";
const DEFAULT_PRIMARY_DOMAIN = "https://repomandi.com";
const DEFAULT_SECONDARY_DOMAIN = "https://repomandi.in";

export const SITE_CONFIG = {
  name: "RepoMandi",
  supportEmail: process.env.NEXT_PUBLIC_SUPPORT_EMAIL || DEFAULT_SUPPORT_EMAIL,
  primaryDomain: process.env.NEXT_PUBLIC_PRIMARY_DOMAIN || DEFAULT_PRIMARY_DOMAIN,
  secondaryDomain: process.env.NEXT_PUBLIC_SECONDARY_DOMAIN || DEFAULT_SECONDARY_DOMAIN,
} as const;

export const SITE_COPYRIGHT =
  "© 2026 RepoMandi • Built for Indian trucking marketplace • Developed in Los Angeles, California" as const;

export const SUPPORT_SUBJECTS = {
  general: "RepoMandi Support",
  sellerVerification: "RepoMandi Seller Verification Support",
  inspection: "RepoMandi Inspection Request",
} as const;

export function getSupportMailto(subject: string = SUPPORT_SUBJECTS.general) {
  return `mailto:${SITE_CONFIG.supportEmail}?subject=${encodeURIComponent(subject)}`;
}

export function getDomainLabel(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}
