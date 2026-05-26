const SUPABASE_PUBLIC_STORAGE_PATH = "/storage/v1/object/public/";

export const VEHICLE_IMAGE_PLACEHOLDER_SRC = "/file.svg";

function getConfiguredSupabaseStorageHost() {
  const configuredUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!configuredUrl) return "";
  try {
    return new URL(configuredUrl).hostname;
  } catch {
    return "";
  }
}

const SUPABASE_STORAGE_HOST = getConfiguredSupabaseStorageHost();
const ALLOWED_LOCAL_IMAGE_PATHS = new Set([VEHICLE_IMAGE_PLACEHOLDER_SRC]);

export function shouldLogMediaDebug() {
  return (
    process.env.NODE_ENV !== "production" ||
    process.env.NEXT_PUBLIC_MEDIA_DEBUG_LOGS === "true" ||
    process.env.MEDIA_DEBUG_LOGS === "true"
  );
}

function toTrimmedString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function isLegacyLocalUploadUrl(value: unknown): boolean {
  const url = toTrimmedString(value);
  if (!url) return false;
  return (
    url.startsWith("/uploads/") ||
    url.startsWith("uploads/") ||
    /(^|\/)public\/uploads(\/|$)/.test(url)
  );
}

export function isSupabasePublicStorageUrl(value: unknown): boolean {
  const url = toTrimmedString(value);
  if (!url || !SUPABASE_STORAGE_HOST) return false;

  try {
    const parsed = new URL(url);
    return (
      parsed.protocol === "https:" &&
      parsed.hostname === SUPABASE_STORAGE_HOST &&
      parsed.pathname.startsWith(SUPABASE_PUBLIC_STORAGE_PATH)
    );
  } catch {
    return false;
  }
}

export function sanitizeSupabaseMediaUrl(value: unknown): string {
  const url = toTrimmedString(value);
  if (!url || isLegacyLocalUploadUrl(url)) return "";
  return isSupabasePublicStorageUrl(url) ? url : "";
}

export function sanitizeSupabaseMediaArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return Array.from(
    new Set(
      value
        .map((item) => sanitizeSupabaseMediaUrl(item))
        .filter(Boolean)
    )
  );
}

export function resolveImageSrcForRender(value: unknown, fallback = VEHICLE_IMAGE_PLACEHOLDER_SRC): string {
  const url = toTrimmedString(value);
  if (!url) return fallback;
  if (isLegacyLocalUploadUrl(url)) return fallback;
  if (url.startsWith("/")) {
    return ALLOWED_LOCAL_IMAGE_PATHS.has(url) ? url : fallback;
  }
  return isSupabasePublicStorageUrl(url) ? url : fallback;
}
