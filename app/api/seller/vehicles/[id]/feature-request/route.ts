import { and, desc, eq, isNull } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  featureCouponUsages,
  featureCoupons,
  featureRequests,
  platformSettings,
  vehicles,
} from "@/lib/schema";

export const runtime = "nodejs";
const FEATURE_DURATION_DAYS = 30;
const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

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

    const couponCode = rawCouponCode ? rawCouponCode.trim().toUpperCase() : undefined;

    if (couponCode) {
      // Validate coupon server-side
      const [coupon] = await db
        .select()
        .from(featureCoupons)
        .where(eq(featureCoupons.code, couponCode))
        .limit(1);

      if (!coupon || !coupon.isActive) {
        return Response.json(
          { message: "Invalid or expired coupon code." },
          { status: 400 }
        );
      }

      if (coupon.expiresAt && coupon.expiresAt < now) {
        return Response.json(
          { message: "Invalid or expired coupon code." },
          { status: 400 }
        );
      }

      if (coupon.startsAt && coupon.startsAt > now) {
        return Response.json(
          { message: "Invalid or expired coupon code." },
          { status: 400 }
        );
      }

      if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
        return Response.json(
          { message: "Invalid or expired coupon code." },
          { status: 400 }
        );
      }

      // Check per-listing usage (prevent duplicate use on same listing)
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
        return Response.json(
          { message: "This coupon has already been used for this listing." },
          { status: 400 }
        );
      }

      // Check per-seller limit if set
      if (coupon.perSellerLimit !== null) {
        const sellerUsages = await db
          .select({ id: featureCouponUsages.id })
          .from(featureCouponUsages)
          .where(
            and(
              eq(featureCouponUsages.couponId, coupon.id),
              eq(featureCouponUsages.sellerId, currentUser.id),
            )
          );

        if (sellerUsages.length >= coupon.perSellerLimit) {
          return Response.json(
            { message: "Invalid or expired coupon code." },
            { status: 400 }
          );
        }
      }

      // Coupon is valid — auto-approve immediately
      const featuredExpiresAt = new Date(
        now.getTime() + FEATURE_DURATION_DAYS * MILLISECONDS_PER_DAY,
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

      // Record coupon usage and increment usedCount
      await db.insert(featureCouponUsages).values({
        couponId: coupon.id,
        vehicleId: id,
        sellerId: currentUser.id,
      });

      await db
        .update(featureCoupons)
        .set({ usedCount: coupon.usedCount + 1, updatedAt: now })
        .where(eq(featureCoupons.id, coupon.id));

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
        now.getTime() + FEATURE_DURATION_DAYS * MILLISECONDS_PER_DAY,
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
