import { desc, eq } from "drizzle-orm";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { featureCouponUsages, featureCoupons, users, vehicles } from "@/lib/schema";

export const runtime = "nodejs";

function adminGuard(user: { accountType: string }) {
  if (user.accountType !== "ADMIN") {
    return Response.json({ message: "Forbidden." }, { status: 403 });
  }
  return null;
}

export async function GET(
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

  const [coupon] = await db
    .select({ id: featureCoupons.id, code: featureCoupons.code })
    .from(featureCoupons)
    .where(eq(featureCoupons.id, couponId))
    .limit(1);

  if (!coupon) {
    return Response.json({ message: "Coupon not found." }, { status: 404 });
  }

  const usageRows = await db
    .select({
      id: featureCouponUsages.id,
      couponId: featureCouponUsages.couponId,
      couponCode: featureCoupons.code,
      sellerId: featureCouponUsages.sellerId,
      sellerName: users.fullName,
      sellerPhone: users.phone,
      vehicleId: featureCouponUsages.vehicleId,
      vehicleTitle: vehicles.title,
      usedAt: featureCouponUsages.usedAt,
    })
    .from(featureCouponUsages)
    .leftJoin(featureCoupons, eq(featureCouponUsages.couponId, featureCoupons.id))
    .leftJoin(users, eq(featureCouponUsages.sellerId, users.id))
    .leftJoin(vehicles, eq(featureCouponUsages.vehicleId, vehicles.id))
    .where(eq(featureCouponUsages.couponId, couponId))
    .orderBy(desc(featureCouponUsages.usedAt));

  return Response.json(usageRows);
}
