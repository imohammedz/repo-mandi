import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { createSessionToken, sessionCookieOptions } from "@/lib/auth";
import { users } from "@/lib/schema";

export const runtime = "nodejs";

const indianMobilePattern = /^\d{10}$/;
const e164Pattern = /^\+[1-9]\d{7,14}$/;

function normalizeIndianPhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) return digits;
  if (digits.length === 12 && digits.startsWith("91")) return digits.slice(2);
  return null;
}

function normalizePhoneToE164(rawPhone: string) {
  const trimmed = rawPhone.trim();
  if (!trimmed.startsWith("+")) return null;
  const digits = trimmed.slice(1).replace(/\D/g, "");
  if (!digits) return null;
  const normalized = `+${digits}`;
  if (!e164Pattern.test(normalized)) return null;
  return normalized;
}

function getAdminPhoneNumbers() {
  const raw = process.env.ADMIN_PHONE_NUMBERS;
  if (!raw) return null;

  const normalized = raw
    .split(",")
    .map((value) => normalizePhoneToE164(value))
    .filter((value): value is string => Boolean(value));

  return new Set(normalized);
}

const ADMIN_PHONE_NUMBERS = getAdminPhoneNumbers();

function extractProviderPhone(payload: unknown) {
  const root = payload && typeof payload === "object" ? (payload as Record<string, unknown>) : null;
  const data = root?.data && typeof root.data === "object" ? (root.data as Record<string, unknown>) : null;

  const candidates = [
    root?.mobile,
    root?.phone,
    root?.phone_number,
    root?.identifier,
    root?.number,
    root?.msisdn,
    data?.mobile,
    data?.phone,
    data?.phone_number,
    data?.identifier,
    data?.number,
    data?.msisdn,
    root?.message,
    data?.message,
  ];

  for (const value of candidates) {
    if (typeof value !== "string") continue;
    const normalized = normalizeIndianPhone(value);
    if (normalized) return normalized;
  }

  return null;
}

async function verifyMsg91Token(verifiedToken: string) {
  const authKey = process.env.MSG91_AUTH_KEY;
  if (!authKey) {
    throw new Error("MSG91_AUTH_KEY environment variable is required.");
  }

  const url = new URL("https://control.msg91.com/api/v5/widget/verifyAccessToken");
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      authkey: authKey,
      "access-token": verifiedToken,
    }),
    cache: "no-store",
  });

  const payload = (await response.json().catch(() => null)) as Record<string, unknown> | null;
  const status = String(payload?.type ?? payload?.status ?? "").toLowerCase();
  const phone = extractProviderPhone(payload);

  if (!response.ok || !payload || (status && !["success", "approved", "ok"].includes(status))) {
    return {
      ok: false as const,
      message:
        typeof payload?.message === "string" && !phone
          ? payload.message
          : "MSG91 verification failed. Please try again.",
    };
  }

  if (!phone) {
    return {
      ok: false as const,
      message: "MSG91 verification succeeded but no phone number was returned.",
    };
  }

  return {
    ok: true as const,
    phone,
  };
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      phone?: string;
      accessToken?: string;
      verifiedToken?: string;
      token?: string;
      intent?: "admin";
    };

    const phone = (body.phone ?? "").replace(/\D/g, "").slice(0, 10);
    const verifiedToken = String(body.accessToken ?? body.verifiedToken ?? body.token ?? "").trim();
    const intent = body.intent === "admin" ? "admin" : "default";

    if (body.phone && !indianMobilePattern.test(phone)) {
      return Response.json({ message: "Enter a valid 10-digit mobile number." }, { status: 400 });
    }

    if (!verifiedToken) {
      return Response.json({ message: "Missing MSG91 verified token." }, { status: 400 });
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

    const verification = await verifyMsg91Token(verifiedToken);
    if (!verification.ok) {
      return Response.json({ message: verification.message }, { status: 400 });
    }

    const submittedPhone = phone ? normalizeIndianPhone(phone) : null;
    if (submittedPhone && verification.phone !== submittedPhone) {
      return Response.json({ message: "Verified phone number did not match the submitted number." }, { status: 400 });
    }

    const verifiedPhone = verification.phone;
    const normalizedPhone = `+91${verifiedPhone}`;
    const isAuthorizedAdmin = ADMIN_PHONE_NUMBERS ? ADMIN_PHONE_NUMBERS.has(normalizedPhone) : false;

    if (intent === "admin" && !isAuthorizedAdmin) {
      return Response.json({ message: "This phone number is not authorized for admin access." }, { status: 403 });
    }

    const [existing] = await db.select().from(users).where(eq(users.phone, verifiedPhone));
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
              phone: verifiedPhone,
              ...adminPayload,
            })
            .returning();
    } else if (!existing) {
      [currentUser] = await db
        .insert(users)
        .values({
          phone: verifiedPhone,
          accountType: "BUYER",
          isProfileComplete: false,
        })
        .returning();
    }

    if (!currentUser) {
      return Response.json({ message: "Failed to complete login. Please try again." }, { status: 500 });
    }

    const sessionToken = createSessionToken(currentUser.id, currentUser.phone);
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
      value: sessionToken,
    });

    return response;
  } catch (error) {
    console.error("MSG91 verify failed", error);
    return Response.json({ message: "Failed to verify OTP. Please try again." }, { status: 500 });
  }
}
