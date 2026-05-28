import { and, eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { sellerVerifiedPhones } from "@/lib/schema";

export const runtime = "nodejs";

function normalizeIndianPhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) return digits;
  if (digits.length === 12 && digits.startsWith("91")) return digits.slice(2);
  return null;
}

function extractProviderPhone(payload: unknown) {
  const root = payload && typeof payload === "object" ? (payload as Record<string, unknown>) : null;
  const data = root?.data && typeof root.data === "object" ? (root.data as Record<string, unknown>) : null;
  const candidates = [
    root?.mobile,
    root?.phone,
    root?.phone_number,
    root?.identifier,
    data?.mobile,
    data?.phone,
    data?.phone_number,
    data?.identifier,
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

  const response = await fetch("https://control.msg91.com/api/v5/widget/verifyAccessToken", {
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

  if (!response.ok || !payload || (status && !["success", "approved", "ok"].includes(status)) || !phone) {
    return {
      ok: false as const,
      message:
        (typeof payload?.message === "string" && payload.message) || "Failed to verify alternate phone.",
    };
  }

  return { ok: true as const, phone };
}

export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return Response.json({ message: "Unauthorized." }, { status: 401 });
    }

    if (!["SELLER", "BANK_PARTNER", "ADMIN"].includes(currentUser.accountType)) {
      return Response.json({ message: "Forbidden." }, { status: 403 });
    }

    const body = (await request.json()) as { phone?: string; accessToken?: string };
    const phone = normalizeIndianPhone(body.phone ?? "");
    if (!phone) {
      return Response.json({ message: "Enter a valid 10-digit mobile number." }, { status: 400 });
    }

    const [existing] = await db
      .select()
      .from(sellerVerifiedPhones)
      .where(
        and(eq(sellerVerifiedPhones.sellerId, currentUser.id), eq(sellerVerifiedPhones.phone, phone))
      );

    if (existing) {
      return Response.json({ alreadyVerified: true, verified: true });
    }

    const accessToken = String(body.accessToken ?? "").trim();
    if (!accessToken) {
      return Response.json({ alreadyVerified: false, requiresOtp: true });
    }

    const verification = await verifyMsg91Token(accessToken);
    if (!verification.ok) {
      return Response.json({ message: verification.message }, { status: 400 });
    }

    if (verification.phone !== phone) {
      return Response.json({ message: "Verified phone number did not match the submitted number." }, { status: 400 });
    }

    await db.insert(sellerVerifiedPhones).values({
      sellerId: currentUser.id,
      phone,
    });

    return Response.json({ verified: true });
  } catch (error) {
    console.error("POST /api/seller/verified-phones/verify failed", error);
    return Response.json({ message: "Failed to verify alternate phone." }, { status: 500 });
  }
}
