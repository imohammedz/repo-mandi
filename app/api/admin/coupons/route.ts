import { desc, eq } from "drizzle-orm";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { featureCouponUsages, featureCoupons } from "@/lib/schema";

export const runtime = "nodejs";

function adminGuard(user: { accountType: string }) {
  if (user.accountType !== "ADMIN") {
    return Response.json({ message: "Forbidden." }, { status: 403 });
  }
  return null;
}

// GET /api/admin/coupons
export async function GET() {
  const current = await requireUser();
  if (!current.ok) return Response.json({ message: current.message }, { status: current.status });
  const guard = adminGuard(current.user);
  if (guard) return guard;

  const coupons = await db
    .select()
    .from(featureCoupons)
    .orderBy(desc(featureCoupons.createdAt));

  // Attach usage count per coupon
  const usageCounts = await db
    .select({ couponId: featureCouponUsages.couponId })
    .from(featureCouponUsages);

  const countMap = usageCounts.reduce<Record<number, number>>((acc, row) => {
    acc[row.couponId] = (acc[row.couponId] ?? 0) + 1;
    return acc;
  }, {});

  return Response.json(
    coupons.map((c) => ({ ...c, usedCount: countMap[c.id] ?? c.usedCount }))
  );
}

// POST /api/admin/coupons
export async function POST(request: Request) {
  const current = await requireUser();
  if (!current.ok) return Response.json({ message: current.message }, { status: current.status });
  const guard = adminGuard(current.user);
  if (guard) return guard;

  const body = (await request.json()) as {
    code?: string;
    description?: string;
    isActive?: boolean;
    maxUses?: number | null;
    expiresAt?: string | null;
    startsAt?: string | null;
    perSellerLimit?: number | null;
    perListingLimit?: number | null;
  };

  const rawCode = (body.code ?? "").trim().toUpperCase();
  if (!rawCode) {
    return Response.json({ message: "Coupon code is required." }, { status: 400 });
  }
  if (!/^[A-Z0-9_-]{2,50}$/.test(rawCode)) {
    return Response.json(
      { message: "Coupon code must be 2–50 alphanumeric characters (A–Z, 0–9, -, _)." },
      { status: 400 }
    );
  }

  // Check for duplicate
  const [existing] = await db
    .select({ id: featureCoupons.id })
    .from(featureCoupons)
    .where(eq(featureCoupons.code, rawCode))
    .limit(1);

  if (existing) {
    return Response.json({ message: "A coupon with this code already exists." }, { status: 409 });
  }

  const [created] = await db
    .insert(featureCoupons)
    .values({
      code: rawCode,
      description: body.description?.trim() || null,
      isActive: body.isActive ?? true,
      maxUses: body.maxUses ?? null,
      expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
      startsAt: body.startsAt ? new Date(body.startsAt) : null,
      perSellerLimit: body.perSellerLimit ?? null,
      perListingLimit: body.perListingLimit ?? null,
      createdBy: current.user.id,
    })
    .returning();

  return Response.json(created, { status: 201 });
}
