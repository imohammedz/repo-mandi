import { db } from "@/lib/db";
import { buyerContactMethodEnum, timeToSellEnum, vehicleSaleFeedback, vehicles } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";

export const runtime = "nodejs";

function mapSoldThroughPlatformToBoolean(value: "YES" | "NO" | "NOT_SURE"): boolean | null {
  switch (value) {
    case "YES":
      return true;
    case "NO":
      return false;
    default:
      return null;
  }
}

// ── PATCH /api/vehicles/[id]/status ──────────────────────────────────────────
// Body: { status: "VERIFIED" | "REJECTED" | "PENDING" | "SOLD" }
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return Response.json({ message: "Unauthorized." }, { status: 401 });
    }

    const { id } = await params;
    const body = (await request.json()) as {
      status?: string;
      rejectionReason?: string;
      rcVerified?: boolean;
      photosVerified?: boolean;
      yardVerified?: boolean;
      sellerVerified?: boolean;
      saleFeedback?: {
        soldThroughPlatform?: "YES" | "NO" | "NOT_SURE";
        buyerContactMethod?: (typeof buyerContactMethodEnum.enumValues)[number];
        timeToSell?: (typeof timeToSellEnum.enumValues)[number];
        feedback?: string;
      };
    };
    const allowed = ["PENDING", "VERIFIED", "REJECTED", "SOLD"];

    if (!body.status || !allowed.includes(body.status)) {
      return Response.json(
        { message: `status must be one of: ${allowed.join(", ")}.` },
        { status: 400 }
      );
    }

    const [existing] = await db.select().from(vehicles).where(eq(vehicles.id, id));
    if (!existing) {
      return Response.json({ message: "Vehicle not found." }, { status: 404 });
    }

    const isAdmin = currentUser.accountType === "ADMIN";
    const isOwner = existing.sellerId === currentUser.id;
    if (!isAdmin && !(isOwner && body.status === "SOLD")) {
      return Response.json({ message: "Forbidden." }, { status: 403 });
    }

    const soldThroughPlatformAllowed = ["YES", "NO", "NOT_SURE"] as const;
    const contactMethodsAllowed = buyerContactMethodEnum.enumValues;
    const timeToSellAllowed = timeToSellEnum.enumValues;
    const saleFeedback = body.saleFeedback;
    const isSellerMarkingSold = body.status === "SOLD" && isOwner;

    if (isSellerMarkingSold) {
      if (!saleFeedback?.soldThroughPlatform || !soldThroughPlatformAllowed.includes(saleFeedback.soldThroughPlatform)) {
        return Response.json({ message: "Please answer whether this sale came from RepoMandi." }, { status: 400 });
      }
    }

    if (saleFeedback?.buyerContactMethod && !contactMethodsAllowed.includes(saleFeedback.buyerContactMethod)) {
      return Response.json({ message: "Invalid buyer contact method." }, { status: 400 });
    }
    if (saleFeedback?.timeToSell && !timeToSellAllowed.includes(saleFeedback.timeToSell)) {
      return Response.json({ message: "Invalid time to sell." }, { status: 400 });
    }

    const updates: Partial<typeof vehicles.$inferInsert> = {
      listingStatus: body.status as typeof vehicles.listingStatus._.data,
      status: body.status === "VERIFIED" || body.status === "SOLD" ? "APPROVED" : body.status,
      updatedAt: new Date(),
    };

    if (body.status === "VERIFIED") {
      updates.verificationStatus = "VERIFIED";
      updates.isPublished = true;
      updates.verifiedAt = new Date();
      updates.verifiedBy = currentUser.id;
      updates.rejectionReason = "";
      updates.sellerVerified = body.sellerVerified ?? existing.sellerVerified;
      updates.rcVerified = body.rcVerified ?? existing.rcVerified;
      updates.photosVerified = body.photosVerified ?? existing.photosVerified;
      updates.yardVerified = body.yardVerified ?? existing.yardVerified;
    } else if (body.status === "REJECTED") {
      updates.verificationStatus = "REJECTED";
      updates.isPublished = false;
      updates.rejectionReason = body.rejectionReason ?? "Rejected by admin";
      updates.verifiedBy = currentUser.id;
      updates.verifiedAt = new Date();
    } else if (body.status === "SOLD") {
      updates.isPublished = false;
      updates.soldAt = new Date();
    } else if (body.status === "PENDING") {
      updates.verificationStatus = "PENDING_VERIFICATION";
      updates.isPublished = false;
      updates.rejectionReason = "";
      updates.verifiedBy = null;
      updates.verifiedAt = null;
    }
    if (body.status !== "SOLD") {
      updates.soldAt = null;
    }

    const [updated] = await db
      .update(vehicles)
      .set(updates)
      .where(eq(vehicles.id, id))
      .returning();

    if (isSellerMarkingSold && saleFeedback?.soldThroughPlatform) {
      const soldThroughPlatform = mapSoldThroughPlatformToBoolean(saleFeedback.soldThroughPlatform);

      await db.insert(vehicleSaleFeedback).values({
        vehicleId: id,
        sellerId: currentUser.id,
        soldThroughPlatform,
        buyerContactMethod: saleFeedback.buyerContactMethod ?? null,
        timeToSell: saleFeedback.timeToSell ?? null,
        feedback: saleFeedback.feedback?.trim() ? saleFeedback.feedback.trim() : null,
      });
    }

    return Response.json(updated);
  } catch (error) {
    console.error("PATCH /api/vehicles/[id]/status failed", error);
    return Response.json({ message: "Failed to update listing status." }, { status: 500 });
  }
}
