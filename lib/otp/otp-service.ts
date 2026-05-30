/**
 * Unified OTP service layer.
 *
 * Reads the active OTP_PROVIDER from the platform_settings table and routes
 * sendOtp / verifyOtp calls to the appropriate provider implementation.
 *
 * Supported providers:
 *   MSG91_SMS — client-side MSG91 widget; server-side send/verify not applicable
 *   WHATSAPP  — Meta WhatsApp Cloud API; fully server-side send + verify
 */

import { createHash, randomInt } from "node:crypto";
import { and, desc, eq, gt } from "drizzle-orm";
import { db } from "@/lib/db";
import { platformSettings, otpCodes } from "@/lib/schema";
import { normalizeToE164 } from "./phone";
import { sendWhatsAppOtp, checkWhatsAppEnv } from "./providers/whatsapp";

export type OtpProvider = "MSG91_SMS" | "WHATSAPP";

const OTP_EXPIRY_MINUTES = 5;
const OTP_MAX_ATTEMPTS = 5;

// ─── Provider setting ─────────────────────────────────────────────────────────

/**
 * Read the active OTP provider from the database.
 * Falls back to MSG91_SMS if no row is present.
 */
export async function getActiveOtpProvider(): Promise<OtpProvider> {
  const [row] = await db
    .select()
    .from(platformSettings)
    .where(eq(platformSettings.key, "OTP_PROVIDER"));
  const value = row?.value;
  if (value === "WHATSAPP") return "WHATSAPP";
  return "MSG91_SMS";
}

// ─── OTP code helpers ─────────────────────────────────────────────────────────

function generateOtpCode(): string {
  // 6-digit OTP: 100000 – 999999
  return String(randomInt(100000, 1000000));
}

function hashOtpCode(code: string): string {
  return createHash("sha256").update(code).digest("hex");
}

// ─── WhatsApp OTP env check ───────────────────────────────────────────────────

export function whatsAppEnvMissing(): string[] {
  const check = checkWhatsAppEnv();
  return check.ok ? [] : check.missing;
}

// ─── sendOtp ──────────────────────────────────────────────────────────────────

export type SendOtpResult =
  | { ok: true }
  | { ok: false; message: string };

/**
 * Send an OTP to the given phone number using the active provider.
 *
 * For MSG91_SMS: throws — callers should render the MSG91 widget instead.
 * For WHATSAPP:  generates, stores, and sends a 6-digit OTP via WhatsApp.
 *
 * @param phone    10-digit Indian number or E.164
 * @param purpose  Label for this OTP (e.g. "login", "phone_verify")
 */
export async function sendOtp(phone: string, purpose = "login"): Promise<SendOtpResult> {
  const provider = await getActiveOtpProvider();

  if (provider === "MSG91_SMS") {
    return {
      ok: false,
      message: "MSG91 SMS uses the widget flow. Use the login page.",
    };
  }

  // WHATSAPP flow
  const e164 = normalizeToE164(phone);
  if (!e164) {
    return { ok: false, message: "Invalid phone number." };
  }

  // Derive the 10-digit local key stored in users.phone
  const localPhone = e164.startsWith("+91") ? e164.slice(3) : e164.slice(1);

  const code = generateOtpCode();
  const codeHash = hashOtpCode(code);
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  // Invalidate any previous unconsumed OTPs for this phone+purpose
  await db
    .delete(otpCodes)
    .where(
      and(
        eq(otpCodes.phone, localPhone),
        eq(otpCodes.purpose, purpose)
      )
    );

  await db.insert(otpCodes).values({
    phone: localPhone,
    codeHash,
    purpose,
    provider,
    expiresAt,
  });

  try {
    await sendWhatsAppOtp(e164, code);
    console.log("[OTP] Sent", { provider, phone: localPhone, purpose });
    return { ok: true };
  } catch (error) {
    console.error("[OTP] Send failed", { provider, purpose }, error);
    // Clean up the stored code since delivery failed
    await db
      .delete(otpCodes)
      .where(
        and(
          eq(otpCodes.phone, localPhone),
          eq(otpCodes.purpose, purpose)
        )
      );
    return {
      ok: false,
      message:
        error instanceof Error ? error.message : "Failed to send OTP. Please try again.",
    };
  }
}

// ─── verifyOtp ────────────────────────────────────────────────────────────────

export type VerifyOtpResult =
  | { ok: true }
  | { ok: false; message: string; expired?: boolean };

/**
 * Verify an OTP code submitted by the user.
 *
 * For MSG91_SMS: throws — verification is handled by /api/auth/msg91/verify.
 * For WHATSAPP:  checks the stored hash in otpCodes, enforces expiry and
 *                attempt limits, marks the code consumed on success.
 *
 * @param phone    10-digit Indian number or E.164
 * @param code     The OTP code entered by the user
 * @param purpose  Must match the purpose used in sendOtp
 */
export async function verifyOtp(
  phone: string,
  code: string,
  purpose = "login"
): Promise<VerifyOtpResult> {
  const provider = await getActiveOtpProvider();

  if (provider === "MSG91_SMS") {
    return {
      ok: false,
      message: "MSG91 SMS verification is handled by /api/auth/msg91/verify.",
    };
  }

  const e164 = normalizeToE164(phone);
  if (!e164) {
    return { ok: false, message: "Invalid phone number." };
  }

  const localPhone = e164.startsWith("+91") ? e164.slice(3) : e164.slice(1);
  const now = new Date();

  const [record] = await db
    .select()
    .from(otpCodes)
    .where(
      and(
        eq(otpCodes.phone, localPhone),
        eq(otpCodes.purpose, purpose),
        gt(otpCodes.expiresAt, now)
      )
    )
    .orderBy(desc(otpCodes.createdAt))
    .limit(1);

  if (!record) {
    return {
      ok: false,
      message: "OTP has expired or was not found. Please request a new one.",
      expired: true,
    };
  }

  if (record.consumedAt) {
    return { ok: false, message: "This OTP has already been used." };
  }

  if (record.attempts >= OTP_MAX_ATTEMPTS) {
    return {
      ok: false,
      message: "Too many incorrect attempts. Please request a new OTP.",
    };
  }

  const inputHash = hashOtpCode(code.trim());

  if (inputHash !== record.codeHash) {
    await db
      .update(otpCodes)
      .set({ attempts: record.attempts + 1 })
      .where(eq(otpCodes.id, record.id));

    const remaining = OTP_MAX_ATTEMPTS - record.attempts - 1;
    return {
      ok: false,
      message:
        remaining > 0
          ? `Incorrect OTP. ${remaining} attempt${remaining === 1 ? "" : "s"} remaining.`
          : "Too many incorrect attempts. Please request a new OTP.",
    };
  }

  // Mark as consumed
  await db
    .update(otpCodes)
    .set({ consumedAt: now })
    .where(eq(otpCodes.id, record.id));

  console.log("[OTP] Verified", { provider, phone: localPhone, purpose });
  return { ok: true };
}
