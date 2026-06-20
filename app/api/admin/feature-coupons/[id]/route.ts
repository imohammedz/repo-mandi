import { eq } from "drizzle-orm";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  isValidFeatureCouponCode,
  normalizeFeatureCouponCode,
  parseOptionalDate,
  parsePositiveInteger,
  sanitizeOptionalText,
} from "@/lib/feature-coupons";
import { featureCouponUsages, featureCoupons } from "@/lib/schema";

export const runtime = "nodejs";

function adminGuard(user: { accountType: string }) {
  if (user.accountType !== "ADMIN") {
    return Response.json({ message: "Forbidden." }, { status: 403 });
  }
  return null;
}

async function getCouponWithUsage(couponId: number) {
  const [coupon] = await db
    .select()
    .from(featureCoupons)
    .where(eq(featureCoupons.id, couponId))
    .limit(1);

  if (!coupon) {
    return { coupon: null, hasUsage: false };
  }

  const [usage] = await db
    .select({ id: featureCouponUsages.id })
    .from(featureCouponUsages)
    .where(eq(featureCouponUsages.couponId, couponId))
    .limit(1);

  return { coupon, hasUsage: Boolean(usage) };
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const current = await requireUser();
  if (!current.ok) return Response.json({ message: current.message }, { status: current.status });
  const guard = adminGuard(current.user);
  if (guard) return guard;

  const { id } = await params;
  const couponId = Number.parseInt(id, 10);
  if (Number.isNaN(couponId)) {
    return Response.json({ message: "Invalid coupon ID." }, { status: 400 });
  }

  const { coupon: existing, hasUsage } = await getCouponWithUsage(couponId);
  if (!existing) {
    return Response.json({ message: "Coupon not found." }, { status: 404 });
  }

  const body = (await request.json().catch(() => null)) as
    | {
        code?: string;
        description?: string | null;
        isActive?: boolean;
        maxUses?: number | null;
        expiresAt?: string | null;
        durationDays?: number | null;
      }
    | null;

  let nextCode = existing.code;
  if (body && "code" in body) {
    nextCode = normalizeFeatureCouponCode(body.code ?? "");
    if (!nextCode) {
      return Response.json({ message: "Coupon code is required." }, { status: 400 });
    }
    if (!isValidFeatureCouponCode(nextCode)) {
      return Response.json(
        { message: "Coupon code must be 2–50 uppercase letters, numbers, hyphens, or underscores with no spaces." },
        { status: 400 },
      );
    }
    if (hasUsage && nextCode !== existing.code) {
      return Response.json({ message: "Coupon code cannot be changed after usage." }, { status: 400 });
    }
    if (nextCode !== existing.code) {
      const [otherCoupon] = await db
        .select({ id: featureCoupons.id })
        .from(featureCoupons)
        .where(eq(featureCoupons.code, nextCode))
        .limit(1);
      if (otherCoupon && otherCoupon.id !== couponId) {
        return Response.json({ message: "A coupon with this code already exists." }, { status: 409 });
      }
    }
  }

  const maxUsesResult =
    body && "maxUses" in body
      ? parsePositiveInteger(body.maxUses, "Max uses")
      : { value: existing.maxUses };
  if ("error" in maxUsesResult) {
    return Response.json({ message: maxUsesResult.error }, { status: 400 });
  }

  if (maxUsesResult.value !== null && maxUsesResult.value < existing.usedCount) {
    return Response.json(
      { message: `Max uses cannot be less than the current used count (${existing.usedCount}).` },
      { status: 400 },
    );
  }

  const durationDaysResult =
    body && "durationDays" in body
      ? parsePositiveInteger(body.durationDays, "Duration days", { minimum: 1, optional: false })
      : { value: existing.durationDays };
  if ("error" in durationDaysResult) {
    return Response.json({ message: durationDaysResult.error }, { status: 400 });
  }

  const expiresAtResult =
    body && "expiresAt" in body
      ? parseOptionalDate(body.expiresAt)
      : { value: existing.expiresAt };
  if ("error" in expiresAtResult) {
    return Response.json({ message: expiresAtResult.error }, { status: 400 });
  }

  const now = new Date();
  const [updated] = await db
    .update(featureCoupons)
    .set({
      code: nextCode,
      description:
        body && "description" in body
          ? sanitizeOptionalText(body.description)
          : existing.description,
      isActive:
        body && "isActive" in body
          ? body.isActive ?? existing.isActive
          : existing.isActive,
      maxUses: maxUsesResult.value,
      expiresAt: expiresAtResult.value,
      durationDays: durationDaysResult.value,
      updatedAt: now,
    })
    .where(eq(featureCoupons.id, couponId))
    .returning();

  return Response.json(updated);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const current = await requireUser();
  if (!current.ok) return Response.json({ message: current.message }, { status: current.status });
  const guard = adminGuard(current.user);
  if (guard) return guard;

  const { id } = await params;
  const couponId = Number.parseInt(id, 10);
  if (Number.isNaN(couponId)) {
    return Response.json({ message: "Invalid coupon ID." }, { status: 400 });
  }

  const { coupon: existing, hasUsage } = await getCouponWithUsage(couponId);
  if (!existing) {
    return Response.json({ message: "Coupon not found." }, { status: 404 });
  }

  if (hasUsage || existing.usedCount > 0) {
    return Response.json({ message: "Used coupons cannot be deleted." }, { status: 400 });
  }

  await db.delete(featureCoupons).where(eq(featureCoupons.id, couponId));

  return Response.json({ success: true });
}
