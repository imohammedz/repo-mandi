/**
 * Normalizes a rupee amount from any display format to a plain integer.
 *
 * Accepts:  16000000  |  "16000000"  |  "16000000.00"  |  "1,60,00,000"  |  "₹1,60,00,000"
 * Returns:  16000000  (integer rupees, never paise, never extra zeros)
 * Returns:  null for empty / null / non-positive values
 *
 * This is the single source of truth for price normalization on both
 * client (prefill + submit) and server (PATCH validation).
 */
export function normalizeRupeeAmount(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  const str = String(value)
    .replace(/₹/g, "")
    .replace(/,/g, "")
    .trim();
  if (!str) return null;
  // parseFloat handles "16000000.00" → 16000000; Math.round removes fp noise
  const parsed = parseFloat(str);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return Math.round(parsed);
}

const SPECIAL_LABELS: Record<string, string> = {
  RC_TRANSFER: "RC Transfer",
  RTO_NOC: "RTO NOC",
  OPEN_NOC: "Open NOC",
};

const SPECIAL_TOKEN_LABELS: Record<string, string> = {
  RC: "RC",
  RTO: "RTO",
  NOC: "NOC",
};

export function formatDisplayLabel(value: string | null | undefined) {
  if (!value) return "";

  const compact = value.replace(/\s+/g, " ").trim();
  if (!compact) return "";

  const normalizedKey = compact.replace(/[\s-]+/g, "_").toUpperCase();
  if (SPECIAL_LABELS[normalizedKey]) return SPECIAL_LABELS[normalizedKey];

  const tokens = compact
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .map((token, index) => {
      const upper = token.toUpperCase();
      if (SPECIAL_TOKEN_LABELS[upper]) return SPECIAL_TOKEN_LABELS[upper];
      if (/^\d+X\d+$/i.test(upper)) return upper.toLowerCase();
      if (/^BS\d+$/i.test(upper)) return upper;
      const lowered = token.toLowerCase();
      if (index === 0) return lowered.charAt(0).toUpperCase() + lowered.slice(1);
      return lowered;
    })
    .join(" ");

  return tokens;
}

export function formatEnumLabel(value: string | null | undefined) {
  return formatDisplayLabel(value);
}
