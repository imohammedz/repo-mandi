import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  DEFAULT_FEATURE_DURATION_DAYS,
  MAX_FEATURE_DURATION_DAYS,
  normalizeFeatureCouponCode,
} from "@/lib/feature-coupons";
import {
  featureCouponUsages,
  featureCoupons,
  featureRequests,
  platformSettings,
  vehicles,
} from "@/lib/schema";

export const runtime = "nodejs";
const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;
const INVALID_COUPON_MESSAGE = "Invalid or expired coupon code.";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return Response.json({ message: "Unauthorized." }, { status: 401 });
    }

    if (currentUser.accountType !== "SELLER") {
      return Response.json({ message: "Forbidden." }, { status: 403 });
    }

    const { id } = await params;

    const [existing] = await db
      .select()
      .from(vehicles)
      .where(and(eq(vehicles.id, id), isNull(vehicles.deletedAt)));

    if (!existing) {
      return Response.json({ message: "Vehicle not found." }, { status: 404 });
    }

    if (existing.sellerId !== currentUser.id) {
      return Response.json({ message: "Forbidden." }, { status: 403 });
    }

    if (existing.listingStatus === "SOLD" || existing.status === "SOLD") {
      return Response.json(
        { message: "Sold listings cannot be featured." },
        { status: 400 }
      );
    }

    if (existing.listingStatus !== "VERIFIED" || !existing.isPublished) {
      return Response.json(
        { message: "Only verified and published listings can request featuring." },
        { status: 400 }
      );
    }

    const now = new Date();
    const isActivelyFeatured =
      existing.isFeatured && (!existing.featuredExpiresAt || existing.featuredExpiresAt > now);
    if (isActivelyFeatured) {
      return Response.json({ message: "Listing is already featured." }, { status: 400 });
    }

    const [pendingRequest] = await db
      .select({ id: featureRequests.id })
      .from(featureRequests)
      .where(
        and(
          eq(featureRequests.vehicleId, id),
          eq(featureRequests.sellerId, currentUser.id),
          eq(featureRequests.status, "PENDING"),
        ),
      )
      .orderBy(desc(featureRequests.createdAt))
      .limit(1);

    if (pendingRequest) {
      return Response.json({ message: "Feature request already submitted." }, { status: 400 });
    }

    // Parse optional coupon code from request body
    let rawCouponCode: string | undefined;
    try {
      const body = (await request.json().catch(() => null)) as { couponCode?: string } | null;
      rawCouponCode = body?.couponCode;
    } catch {
      // no body is fine
    }

    const couponCode = rawCouponCode ? normalizeFeatureCouponCode(rawCouponCode) : undefined;

    if (couponCode) {
      const [coupon] = await db
        .select()
        .from(featureCoupons)
        .where(eq(featureCoupons.code, couponCode))
        .limit(1);

      if (!coupon || !coupon.isActive) {
        return Response.json({ message: INVALID_COUPON_MESSAGE }, { status: 400 });
      }

      if (coupon.expiresAt && coupon.expiresAt.getTime() < now.getTime()) {
        return Response.json({ message: INVALID_COUPON_MESSAGE }, { status: 400 });
      }

      if (coupon.startsAt && coupon.startsAt.getTime() > now.getTime()) {
        return Response.json({ message: INVALID_COUPON_MESSAGE }, { status: 400 });
      }

      const [existingListingUsage] = await db
        .select({ id: featureCouponUsages.id })
        .from(featureCouponUsages)
        .where(
          and(
            eq(featureCouponUsages.couponId, coupon.id),
            eq(featureCouponUsages.vehicleId, id),
          )
        )
        .limit(1);

      if (existingListingUsage) {
        return Response.json({ message: INVALID_COUPON_MESSAGE }, { status: 400 });
      }

      if (coupon.durationDays > MAX_FEATURE_DURATION_DAYS) {
        return Response.json({ message: INVALID_COUPON_MESSAGE }, { status: 400 });
      }
      const featuredExpiresAt = new Date(
        now.getTime() + coupon.durationDays * MILLISECONDS_PER_DAY,
      );
      const couponCountUpdate = {
        usedCount: sql`${featureCoupons.usedCount} + 1`,
        updatedAt: now,
      };

      try {
        await db.transaction(async (tx) => {
          await tx
            .update(vehicles)
            .set({
              isFeatured: true,
              featuredAt: now,
              featuredExpiresAt,
              featuredBy: currentUser.id,
              updatedAt: now,
            })
            .where(eq(vehicles.id, id));

          await tx
            .insert(featureRequests)
            .values({
              vehicleId: id,
              sellerId: currentUser.id,
              status: "APPROVED",
              requestedAt: now,
              updatedAt: now,
            });

          await tx.insert(featureCouponUsages).values({
            couponId: coupon.id,
            vehicleId: id,
            sellerId: currentUser.id,
          });

          const incremented = await tx
            .update(featureCoupons)
            .set(couponCountUpdate)
            .where(
              and(
                eq(featureCoupons.id, coupon.id),
                sql`${featureCoupons.maxUses} IS NULL OR ${featureCoupons.usedCount} < ${featureCoupons.maxUses}`,
              ),
            )
            .returning({ id: featureCoupons.id });

          if (!incremented[0]) {
            throw new Error("COUPON_EXHAUSTED");
          }
        });
      } catch (error) {
        if (
          (error instanceof Error && error.message === "COUPON_EXHAUSTED") ||
          (typeof error === "object" &&
            error !== null &&
            "code" in error &&
            error.code === "23505" &&
            "constraint" in error &&
            error.constraint === "feature_coupon_usages_coupon_vehicle_unique")
        ) {
          return Response.json({ message: INVALID_COUPON_MESSAGE }, { status: 400 });
        }
        throw error;
      }

      return Response.json(
        {
          success: true,
          status: "APPROVED",
          message: "Coupon applied. Listing featured successfully.",
        },
        { status: 200 },
      );
    }

    const [autoFeatureApprovalRow] = await db
      .select({ value: platformSettings.value })
      .from(platformSettings)
      .where(eq(platformSettings.key, "AUTO_FEATURE_APPROVAL_ENABLED"))
      .limit(1);
    const autoFeatureApprovalEnabled = autoFeatureApprovalRow?.value === "true";

    if (autoFeatureApprovalEnabled) {
      const featuredExpiresAt = new Date(
        now.getTime() + DEFAULT_FEATURE_DURATION_DAYS * MILLISECONDS_PER_DAY,
      );

      await db
        .update(vehicles)
        .set({
          isFeatured: true,
          featuredAt: now,
          featuredExpiresAt,
          featuredBy: currentUser.id,
          updatedAt: now,
        })
        .where(eq(vehicles.id, id));

      await db
        .insert(featureRequests)
        .values({
          vehicleId: id,
          sellerId: currentUser.id,
          status: "APPROVED",
          requestedAt: now,
          updatedAt: now,
        });

      return Response.json(
        {
          success: true,
          status: "APPROVED",
          message: "Your listing is now featured.",
        },
        { status: 200 },
      );
    }

    await db.insert(featureRequests).values({
      vehicleId: id,
      sellerId: currentUser.id,
      status: "PENDING",
      requestedAt: now,
      updatedAt: now,
    });

    return Response.json(
      {
        success: true,
        status: "PENDING",
        message: "Feature request submitted for review.",
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("POST /api/seller/vehicles/[id]/feature-request failed", error);
    return Response.json(
      { message: "Failed to submit feature request." },
      { status: 500 }
    );
  }
}
