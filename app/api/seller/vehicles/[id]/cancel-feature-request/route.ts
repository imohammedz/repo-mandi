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

    if (!["SELLER", "BANK_PARTNER", "ADMIN"].includes(currentUser.accountType)) {
      return Response.json({ message: "Forbidden." }, { status: 403 });
    }

    const { id } = await params;

    const [existing] = await db
      .select({ id: vehicles.id, sellerId: vehicles.sellerId })
      .from(vehicles)
      .where(and(eq(vehicles.id, id), isNull(vehicles.deletedAt)));

    if (!existing) {
      return Response.json({ message: "Vehicle not found." }, { status: 404 });
    }

    if (existing.sellerId !== currentUser.id) {
      return Response.json({ message: "Forbidden." }, { status: 403 });
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
      .limit(1);

    if (!pendingRequest) {
      return Response.json(
        { message: "No pending feature request found for this listing." },
        { status: 404 }
      );
    }

    const now = new Date();
    await db
      .update(featureRequests)
      .set({ status: "CANCELLED", updatedAt: now })
      .where(eq(featureRequests.id, pendingRequest.id));

    return Response.json(
      { success: true, message: "Feature request cancelled." },
      { status: 200 }
    );
  } catch (error) {
    console.error("POST /api/seller/vehicles/[id]/cancel-feature-request failed", error);
    return Response.json(
      { message: "Failed to cancel feature request." },
      { status: 500 }
    );
  }
}
