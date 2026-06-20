export const DEFAULT_FEATURE_DURATION_DAYS = 30;

const FEATURE_COUPON_CODE_REGEX = /^[A-Z0-9_-]{2,50}$/;

export function normalizeFeatureCouponCode(value: string) {
  return value.trim().toUpperCase();
}

export function isValidFeatureCouponCode(value: string) {
  return FEATURE_COUPON_CODE_REGEX.test(value) && !/\s/.test(value);
}

export function sanitizeOptionalText(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export function parseOptionalDate(value: string | null | undefined) {
  if (!value) {
    return { value: null as Date | null };
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return { error: "Expiry date is invalid." };
  }

  return { value: parsed };
}

export function parsePositiveInteger(
  value: unknown,
  fieldLabel: string,
  options?: { minimum?: number; optional?: boolean },
) {
  const minimum = options?.minimum ?? 1;
  const optional = options?.optional ?? true;

  if (value === null || value === undefined || value === "") {
    if (optional) {
      return { value: null as number | null };
    }
    return { error: `${fieldLabel} is required.` };
  }

  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isInteger(parsed) || parsed < minimum) {
    return { error: `${fieldLabel} must be at least ${minimum}.` };
  }

  return { value: parsed };
}
