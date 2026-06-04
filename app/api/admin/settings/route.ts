import { db } from "@/lib/db";
import { platformSettings } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { requireUser } from "@/lib/auth";

export const runtime = "nodejs";

const ALLOWED_KEYS = ["AUTO_APPROVE_LISTINGS", "AUTO_FEATURE_APPROVAL_ENABLED", "OTP_PROVIDER"] as const;
type SettingKey = (typeof ALLOWED_KEYS)[number];

const OTP_PROVIDER_VALUES = ["MSG91_SMS", "WHATSAPP", "TWILIO_SMS"] as const;
type OtpProviderValue = (typeof OTP_PROVIDER_VALUES)[number];

async function getSetting(key: SettingKey): Promise<string | null> {
  const [row] = await db
    .select()
    .from(platformSettings)
    .where(eq(platformSettings.key, key));
  return row?.value ?? null;
}

// GET /api/admin/settings
export async function GET() {
  const current = await requireUser();
  if (!current.ok) {
    return Response.json({ message: current.message }, { status: current.status });
  }
  if (current.user.accountType !== "ADMIN") {
    return Response.json({ message: "Forbidden." }, { status: 403 });
  }

  const autoApprove = await getSetting("AUTO_APPROVE_LISTINGS");
  const autoFeatureApprove = await getSetting("AUTO_FEATURE_APPROVAL_ENABLED");
  const otpProvider = (await getSetting("OTP_PROVIDER")) ?? "MSG91_SMS";

  return Response.json({
    AUTO_APPROVE_LISTINGS: autoApprove === "true",
    AUTO_FEATURE_APPROVAL_ENABLED: autoFeatureApprove === "true",
    OTP_PROVIDER: otpProvider,
  });
}

// PATCH /api/admin/settings
export async function PATCH(request: Request) {
  const current = await requireUser();
  if (!current.ok) {
    return Response.json({ message: current.message }, { status: current.status });
  }
  if (current.user.accountType !== "ADMIN") {
    return Response.json({ message: "Forbidden." }, { status: 403 });
  }

  const body = (await request.json()) as Record<string, unknown>;

  for (const key of Object.keys(body)) {
    if (!ALLOWED_KEYS.includes(key as SettingKey)) {
      return Response.json({ message: `Unknown setting key: ${key}` }, { status: 400 });
    }
  }

  // Validate OTP_PROVIDER value if present
  if ("OTP_PROVIDER" in body) {
    const v = body["OTP_PROVIDER"];
    if (!OTP_PROVIDER_VALUES.includes(v as OtpProviderValue)) {
      return Response.json(
        { message: `Invalid OTP_PROVIDER value. Allowed: ${OTP_PROVIDER_VALUES.join(", ")}` },
        { status: 400 }
      );
    }
  }

  const results: Record<string, unknown> = {};

  // Handle boolean settings
  if ("AUTO_APPROVE_LISTINGS" in body) {
    const boolValue = Boolean(body["AUTO_APPROVE_LISTINGS"]);
    await db
      .insert(platformSettings)
      .values({ key: "AUTO_APPROVE_LISTINGS", value: String(boolValue), updatedAt: new Date() })
      .onConflictDoUpdate({
        target: platformSettings.key,
        set: { value: String(boolValue), updatedAt: new Date() },
      });
    results["AUTO_APPROVE_LISTINGS"] = boolValue;
  }

  if ("AUTO_FEATURE_APPROVAL_ENABLED" in body) {
    const boolValue = Boolean(body["AUTO_FEATURE_APPROVAL_ENABLED"]);
    await db
      .insert(platformSettings)
      .values({ key: "AUTO_FEATURE_APPROVAL_ENABLED", value: String(boolValue), updatedAt: new Date() })
      .onConflictDoUpdate({
        target: platformSettings.key,
        set: { value: String(boolValue), updatedAt: new Date() },
      });
    results["AUTO_FEATURE_APPROVAL_ENABLED"] = boolValue;
  }

  // Handle OTP_PROVIDER
  if ("OTP_PROVIDER" in body) {
    const value = String(body["OTP_PROVIDER"]) as OtpProviderValue;
    await db
      .insert(platformSettings)
      .values({ key: "OTP_PROVIDER", value, updatedAt: new Date() })
      .onConflictDoUpdate({
        target: platformSettings.key,
        set: { value, updatedAt: new Date() },
      });
    results["OTP_PROVIDER"] = value;
  }

  return Response.json(results);
}
