import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { createSessionToken, sessionCookieOptions } from "@/lib/auth";
import { verifyOtp, getActiveOtpProvider } from "@/lib/otp/otp-service";
import { normalizeIndianPhone } from "@/lib/otp/phone";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const provider = await getActiveOtpProvider();

    if (provider === "MSG91_SMS") {
      return Response.json(
        {
          message:
            "MSG91 SMS OTP verification is handled by /api/auth/msg91/verify after the widget callback.",
        },
        { status: 410 }
      );
    }

    const body = (await request.json()) as {
      phone?: string;
      code?: string;
      purpose?: string;
    };

    const phone = normalizeIndianPhone(String(body.phone ?? ""));
    if (!phone) {
      return Response.json({ message: "Enter a valid 10-digit mobile number." }, { status: 400 });
    }

    const code = String(body.code ?? "").trim();
    if (!code) {
      return Response.json({ message: "OTP code is required." }, { status: 400 });
    }

    const purpose = typeof body.purpose === "string" && body.purpose ? body.purpose : "login";
    const result = await verifyOtp(phone, code, purpose);

    if (!result.ok) {
      return Response.json({ message: result.message }, { status: 400 });
    }

    // Look up or create the user
    const [existing] = await db.select().from(users).where(eq(users.phone, phone));
    let currentUser = existing;

    if (!existing) {
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
    console.error("POST /api/auth/otp/verify failed", error);
    return Response.json({ message: "Failed to verify OTP. Please try again." }, { status: 500 });
  }
}
