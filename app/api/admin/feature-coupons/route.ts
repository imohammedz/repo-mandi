import { desc, eq } from "drizzle-orm";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  DEFAULT_FEATURE_DURATION_DAYS,
  FEATURE_COUPON_CODE_ERROR_MESSAGE,
  isValidFeatureCouponCode,
  normalizeFeatureCouponCode,
  parseOptionalDate,
  parsePositiveInteger,
  sanitizeOptionalText,
} from "@/lib/feature-coupons";
import { featureCoupons } from "@/lib/schema";

export const runtime = "nodejs";

function adminGuard(user: { accountType: string }) {
  if (user.accountType !== "ADMIN") {
    return Response.json({ message: "Forbidden." }, { status: 403 });
  }
  return null;
}

export async function GET() {
  const current = await requireUser();
  if (!current.ok) return Response.json({ message: current.message }, { status: current.status });
  const guard = adminGuard(current.user);
  if (guard) return guard;

  const coupons = await db
    .select()
    .from(featureCoupons)
    .orderBy(desc(featureCoupons.createdAt));

  return Response.json(coupons);
}

export async function POST(request: Request) {
  const current = await requireUser();
  if (!current.ok) return Response.json({ message: current.message }, { status: current.status });
  const guard = adminGuard(current.user);
  if (guard) return guard;

  const body = (await request.json().catch(() => null)) as
    | {
        code?: string;
        description?: string;
        isActive?: boolean;
        maxUses?: number | null;
        expiresAt?: string | null;
        durationDays?: number | null;
      }
    | null;

  const rawCode = normalizeFeatureCouponCode(body?.code ?? "");
  if (!rawCode) {
    return Response.json({ message: "Coupon code is required." }, { status: 400 });
  }
  if (!isValidFeatureCouponCode(rawCode)) {
    return Response.json({ message: FEATURE_COUPON_CODE_ERROR_MESSAGE }, { status: 400 });
  }

  const durationDaysResult = parsePositiveInteger(
    body?.durationDays ?? DEFAULT_FEATURE_DURATION_DAYS,
    "Duration days",
    { minimum: 1, optional: false },
  );
  if ("error" in durationDaysResult) {
    return Response.json({ message: durationDaysResult.error }, { status: 400 });
  }

  const maxUsesResult = parsePositiveInteger(body?.maxUses, "Max uses");
  if ("error" in maxUsesResult) {
    return Response.json({ message: maxUsesResult.error }, { status: 400 });
  }

  const expiresAtResult = parseOptionalDate(body?.expiresAt);
  if ("error" in expiresAtResult) {
    return Response.json({ message: expiresAtResult.error }, { status: 400 });
  }

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
      description: sanitizeOptionalText(body?.description),
      isActive: body?.isActive ?? true,
      maxUses: maxUsesResult.value,
      expiresAt: expiresAtResult.value,
      durationDays: durationDaysResult.value,
      createdBy: current.user.id,
    })
    .returning();

  return Response.json(created, { status: 201 });
}
