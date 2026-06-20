export const DEFAULT_FEATURE_DURATION_DAYS = 30;
export const FEATURE_COUPON_CODE_MIN_LENGTH = 2;
export const FEATURE_COUPON_CODE_MAX_LENGTH = 50;
export const FEATURE_COUPON_CODE_ERROR_MESSAGE = `Coupon code must be ${FEATURE_COUPON_CODE_MIN_LENGTH}–${FEATURE_COUPON_CODE_MAX_LENGTH} uppercase letters, numbers, hyphens, or underscores with no spaces.`;

const FEATURE_COUPON_CODE_REGEX = new RegExp(
  `^[A-Z0-9_-]{${FEATURE_COUPON_CODE_MIN_LENGTH},${FEATURE_COUPON_CODE_MAX_LENGTH}}$`,
);

export function normalizeFeatureCouponCode(value: string) {
  return value.trim().toUpperCase();
}

export function isValidFeatureCouponCode(value: string) {
  return FEATURE_COUPON_CODE_REGEX.test(value) && !/\s/.test(value);
}

export function sanitizeOptionalText(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed?.length ? trimmed : null;
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
  options: { minimum?: number; optional: false },
): { value: number } | { error: string };
export function parsePositiveInteger(
  value: unknown,
  fieldLabel: string,
  options?: { minimum?: number; optional?: boolean },
): { value: number | null } | { error: string };
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
