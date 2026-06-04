import { and, eq, isNull } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { featureRequests, vehicles } from "@/lib/schema";

export const runtime = "nodejs";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return Response.json({ message: "Unauthorized." }, { status: 401 });
    }

    if (!["SELLER", "BANK_PARTNER"].includes(currentUser.accountType)) {
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

    if (existing.listingStatus === "SOLD") {
      return Response.json(
        { message: "Sold listings cannot be featured." },
        { status: 400 }
      );
    }

    if (!["VERIFIED", "PENDING"].includes(existing.listingStatus)) {
      return Response.json(
        { message: "Only pending or verified listings can request featuring." },
        { status: 400 }
      );
    }

    await db
      .insert(featureRequests)
      .values({
        vehicleId: id,
        sellerId: currentUser.id,
        status: "PENDING",
      });

    return Response.json(
      { success: true, message: "Feature request submitted. RepoMandi will review and feature your listing." },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/seller/vehicles/[id]/feature-request failed", error);
    return Response.json(
      { message: "Failed to submit feature request." },
      { status: 500 }
    );
  }
}
