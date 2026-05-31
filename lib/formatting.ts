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
