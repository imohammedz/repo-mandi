/**
 * Phone number normalization utilities.
 *
 * All OTP sends and verifications use these helpers to ensure consistent
 * phone number formatting across providers.
 */

/**
 * Normalise an Indian phone number to 10-digit local format.
 *
 * Accepts:
 *  - 10-digit number (9876543210)
 *  - 12-digit number prefixed with 91 (919876543210)
 *  - E.164 with +91 prefix (+919876543210)
 *
 * Returns the 10-digit number or null if the input is not a valid Indian number.
 */
export function normalizeIndianPhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10) return digits;
  if (digits.length === 12 && digits.startsWith("91")) return digits.slice(2);
  return null;
}

/**
 * Normalise any phone to E.164 format (+XXXXXXXXXXX).
 *
 * For a plain 10-digit Indian number, +91 is prepended.
 * For numbers already starting with +, the digits are kept.
 *
 * Returns null if the result does not match E.164 format.
 */
export function normalizeToE164(raw: string): string | null {
  const trimmed = raw.trim();

  if (!trimmed.startsWith("+")) {
    const tenDigit = normalizeIndianPhone(trimmed);
    if (!tenDigit) return null;
    return `+91${tenDigit}`;
  }

  const digits = trimmed.slice(1).replace(/\D/g, "");
  if (!digits) return null;
  const e164 = `+${digits}`;
  // E.164: + followed by 8–15 digits
  if (!/^\+[1-9]\d{7,14}$/.test(e164)) return null;
  return e164;
}
