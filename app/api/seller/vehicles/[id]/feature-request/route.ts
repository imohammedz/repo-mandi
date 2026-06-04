import { and, desc, eq, isNull } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { featureRequests, platformSettings, vehicles } from "@/lib/schema";

export const runtime = "nodejs";
const FEATURE_DURATION_DAYS = 7;
const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

export async function POST(
  _request: Request,
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
