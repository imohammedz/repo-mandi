import { eq } from "drizzle-orm";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { featureCoupons } from "@/lib/schema";

export const runtime = "nodejs";

function adminGuard(user: { accountType: string }) {
  if (user.accountType !== "ADMIN") {
    return Response.json({ message: "Forbidden." }, { status: 403 });
  }
  return null;
}

// PATCH /api/admin/coupons/[id]
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const current = await requireUser();
  if (!current.ok) return Response.json({ message: current.message }, { status: current.status });
  const guard = adminGuard(current.user);
  if (guard) return guard;

  const { id } = await params;
  const couponId = parseInt(id, 10);
  if (isNaN(couponId)) {
    return Response.json({ message: "Invalid coupon ID." }, { status: 400 });
  }

  const [existing] = await db
    .select()
    .from(featureCoupons)
    .where(eq(featureCoupons.id, couponId))
    .limit(1);

  if (!existing) {
    return Response.json({ message: "Coupon not found." }, { status: 404 });
  }

  const body = (await request.json()) as {
    description?: string;
    isActive?: boolean;
    maxUses?: number | null;
    expiresAt?: string | null;
    startsAt?: string | null;
    perSellerLimit?: number | null;
    perListingLimit?: number | null;
  };

  const now = new Date();
  const [updated] = await db
    .update(featureCoupons)
    .set({
      description: "description" in body ? (body.description?.trim() || null) : existing.description,
      isActive: "isActive" in body ? (body.isActive ?? existing.isActive) : existing.isActive,
      maxUses: "maxUses" in body ? (body.maxUses ?? null) : existing.maxUses,
      expiresAt: "expiresAt" in body ? (body.expiresAt ? new Date(body.expiresAt) : null) : existing.expiresAt,
      startsAt: "startsAt" in body ? (body.startsAt ? new Date(body.startsAt) : null) : existing.startsAt,
      perSellerLimit: "perSellerLimit" in body ? (body.perSellerLimit ?? null) : existing.perSellerLimit,
      perListingLimit: "perListingLimit" in body ? (body.perListingLimit ?? null) : existing.perListingLimit,
      updatedAt: now,
    })
    .where(eq(featureCoupons.id, couponId))
    .returning();

  return Response.json(updated);
}

// DELETE /api/admin/coupons/[id]
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const current = await requireUser();
  if (!current.ok) return Response.json({ message: current.message }, { status: current.status });
  const guard = adminGuard(current.user);
  if (guard) return guard;

  const { id } = await params;
  const couponId = parseInt(id, 10);
  if (isNaN(couponId)) {
    return Response.json({ message: "Invalid coupon ID." }, { status: 400 });
  }

  const [deleted] = await db
    .delete(featureCoupons)
    .where(eq(featureCoupons.id, couponId))
    .returning({ id: featureCoupons.id });

  if (!deleted) {
    return Response.json({ message: "Coupon not found." }, { status: 404 });
  }

  return Response.json({ success: true });
}
