import twilio from "twilio";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { createSessionToken, sessionCookieOptions } from "@/lib/auth";

export const runtime = "nodejs";

const indianMobilePattern = /^\d{10}$/;
const otpPattern = /^\d{6}$/;
// E.164: +[country code][subscriber number], 8-15 digits after "+"
const e164Pattern = /^\+[1-9]\d{7,14}$/;

const normalizePhoneToE164 = (rawPhone: string) => {
  const trimmed = rawPhone.trim();
  if (!trimmed.startsWith("+")) return null;
  const digits = trimmed.slice(1).replace(/\D/g, "");
  if (!digits) return null;
  const normalized = `+${digits}`;
  if (!e164Pattern.test(normalized)) return null;
  return normalized;
};

const normalizeIndianPhone = (phone: string) => `+91${phone}`;

const getAdminPhoneNumbers = () => {
  const raw = process.env.ADMIN_PHONE_NUMBERS;
  if (!raw) return null;

  const normalized = raw
    .split(",")
    .map((value) => normalizePhoneToE164(value))
    .filter((value): value is string => Boolean(value));

  return new Set(normalized);
};
const ADMIN_PHONE_NUMBERS = getAdminPhoneNumbers();

const getTwilioConfig = () => {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID;

  if (!accountSid || !authToken || !verifyServiceSid) {
    return null;
  }

  return { accountSid, authToken, verifyServiceSid };
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { phone?: string; code?: string; intent?: "admin" };
    const phone = (body.phone ?? "").replace(/\D/g, "").slice(0, 10);
    const code = (body.code ?? "").replace(/\D/g, "").slice(0, 6);
    const intent = body.intent === "admin" ? "admin" : "default";

    if (!indianMobilePattern.test(phone)) {
      return Response.json({ message: "Enter a valid 10-digit mobile number." }, { status: 400 });
    }

    if (!otpPattern.test(code)) {
      return Response.json({ message: "Enter a valid 6-digit OTP." }, { status: 400 });
    }

    if (intent === "admin" && (!ADMIN_PHONE_NUMBERS || ADMIN_PHONE_NUMBERS.size === 0)) {
      return Response.json(
        {
          message:
            "Admin authentication requires ADMIN_PHONE_NUMBERS with at least one E.164 phone number.",
        },
        { status: 500 }
      );
    }

    const twilioConfig = getTwilioConfig();
    if (!twilioConfig) {
      return Response.json({ message: "OTP service is not configured." }, { status: 500 });
    }

    const client = twilio(twilioConfig.accountSid, twilioConfig.authToken);
    const result = await client.verify.v2
      .services(twilioConfig.verifyServiceSid)
      .verificationChecks.create({ to: `+91${phone}`, code });

    if (result.status !== "approved") {
      return Response.json({ message: "Invalid or expired OTP." }, { status: 400 });
    }

    const normalizedPhone = normalizeIndianPhone(phone);
    const isAuthorizedAdmin = ADMIN_PHONE_NUMBERS ? ADMIN_PHONE_NUMBERS.has(normalizedPhone) : false;

    if (intent === "admin" && !isAuthorizedAdmin) {
      return Response.json({ message: "This phone number is not authorized for admin access." }, { status: 403 });
    }

    const [existing] = await db.select().from(users).where(eq(users.phone, phone));
    let currentUser = existing;

    if (isAuthorizedAdmin) {
      const adminPayload = {
        accountType: "ADMIN" as const,
        isProfileComplete: true,
        isVerified: true,
        verificationStatus: "VERIFIED" as const,
        updatedAt: new Date(),
      };

      [currentUser] = existing
        ? await db.update(users).set(adminPayload).where(eq(users.id, existing.id)).returning()
        : await db
            .insert(users)
            .values({
              phone,
              ...adminPayload,
            })
            .returning();
    } else if (!existing) {
      [currentUser] = await db
        .insert(users)
        .values({
          phone,
          accountType: "BUYER",
          isProfileComplete: false,
        })
        .returning();
    }

    if (!currentUser) {
      return Response.json({ message: "Failed to complete login. Please try again." }, { status: 500 });
    }

    const token = createSessionToken(currentUser.id, currentUser.phone);
    const response = NextResponse.json({
      success: true,
      user: {
        id: currentUser.id,
        accountType: currentUser.accountType,
        isProfileComplete: currentUser.isProfileComplete,
      },
      needsOnboarding: !currentUser.isProfileComplete,
    });
    response.cookies.set({
      ...sessionCookieOptions(),
      value: token,
    });
    return response;
  } catch (error) {
    console.error("OTP verify failed", error);
    return Response.json({ message: "Failed to verify OTP. Please try again." }, { status: 500 });
  }
}
