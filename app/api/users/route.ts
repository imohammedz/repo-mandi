import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { count, desc, eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import { normalizeIndianPhone } from "@/lib/otp/phone";

export const runtime = "nodejs";

const LEGACY_ROLE_ALLOWLIST = new Set(["BUYER", "SELLER", "BANK_PARTNER", "ADMIN"]);

function maskPhone(phone: string) {
  if (phone.length <= 4) return phone;
  return `${"*".repeat(phone.length - 4)}${phone.slice(-4)}`;
}

function toSafeUser(user: typeof users.$inferSelect, options?: { maskSensitive?: boolean }) {
  return {
    id: user.id,
    phone: options?.maskSensitive ? maskPhone(user.phone) : user.phone,
    fullName: user.fullName,
    accountType: user.accountType,
    sellerRole: user.sellerRole,
    bankRole: user.bankRole,
    city: user.city,
    state: user.state,
    isProfileComplete: user.isProfileComplete,
    verificationStatus: user.verificationStatus,
    trustScore: user.trustScore,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

// ── GET /api/users?phone= ─────────────────────────────────────────────────────
export async function GET(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return Response.json({ message: "Unauthorized." }, { status: 401 });
    }

    const url = new URL(request.url);
    const phone = normalizeIndianPhone(url.searchParams.get("phone") ?? "");
    const page = Math.max(1, Number(url.searchParams.get("page") ?? "1") || 1);
    const limit = Math.min(100, Math.max(1, Number(url.searchParams.get("limit") ?? "20") || 20));
    const offset = (page - 1) * limit;
    const includeSensitive = currentUser.accountType === "ADMIN" && url.searchParams.get("includeSensitive") === "1";

    if (phone) {
      if (currentUser.accountType !== "ADMIN" && currentUser.phone !== phone) {
        return Response.json({ message: "Forbidden." }, { status: 403 });
      }
      const [row] = await db.select().from(users).where(eq(users.phone, phone));
      return row
        ? Response.json(toSafeUser(row, { maskSensitive: !includeSensitive && currentUser.accountType === "ADMIN" }))
        : Response.json({ message: "User not found." }, { status: 404 });
    }

    if (currentUser.accountType !== "ADMIN") {
      return Response.json({ message: "Forbidden." }, { status: 403 });
    }
    const [totalRow] = await db.select({ total: count() }).from(users);
    const rows = await db.select().from(users).orderBy(desc(users.createdAt)).limit(limit).offset(offset);
    return Response.json({
      page,
      limit,
      total: totalRow?.total ?? 0,
      users: rows.map((row) => toSafeUser(row, { maskSensitive: !includeSensitive })),
    });
  } catch (error) {
    console.error("GET /api/users failed", error);
    return Response.json({ message: "Failed to fetch users." }, { status: 500 });
  }
}

// ── POST /api/users ───────────────────────────────────────────────────────────
// Upserts a user by phone (called after OTP verification on the role page).
export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return Response.json({ message: "Unauthorized." }, { status: 401 });
    }

    const body = (await request.json()) as { phone?: string; role?: string };
    const phone = normalizeIndianPhone(body.phone ?? "");

    if (!phone) {
      return Response.json({ message: "Valid phone is required." }, { status: 400 });
    }
    if (currentUser.accountType !== "ADMIN" && currentUser.phone !== phone) {
      return Response.json({ message: "Forbidden." }, { status: 403 });
    }
    const normalizedRole = body.role?.trim().toUpperCase() ?? "";
    const role = normalizedRole.length > 0 ? normalizedRole : null;
    if (role && !LEGACY_ROLE_ALLOWLIST.has(role)) {
      return Response.json({ message: "Invalid role." }, { status: 400 });
    }

    const [upserted] = await db
      .insert(users)
      .values({ phone, role })
      .onConflictDoUpdate({
        target: users.phone,
        set: {
          role,
          updatedAt: new Date(),
        },
      })
      .returning();

    return Response.json(toSafeUser(upserted), { status: 201 });
  } catch (error) {
    console.error("POST /api/users failed", error);
    return Response.json({ message: "Failed to upsert user." }, { status: 500 });
  }
}
