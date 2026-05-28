import { and, eq, isNull } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { vehicles } from "@/lib/schema";

export const runtime = "nodejs";

function toSafeString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function toPositiveNumberOrNull(value: unknown) {
  const normalized = String(value ?? "").replace(/\D/g, "");
  if (!normalized) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

async function getOwnedVehicle(id: string, sellerId: number) {
  const [vehicle] = await db
    .select()
    .from(vehicles)
    .where(and(eq(vehicles.id, id), eq(vehicles.sellerId, sellerId), isNull(vehicles.deletedAt)));

  return vehicle;
}

export async function PATCH(
  request: Request,
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
    const existing = await getOwnedVehicle(id, currentUser.id);
    if (!existing) {
      return Response.json({ message: "Vehicle not found." }, { status: 404 });
    }

    const body = (await request.json()) as Record<string, unknown>;
    const expectedPrice = toPositiveNumberOrNull(body.expectedPrice ?? body.price);
    if (body.expectedPrice !== undefined || body.price !== undefined) {
      if (expectedPrice === null) {
        return Response.json({ message: "Expected price must be a positive number." }, { status: 400 });
      }
    }

    const location = toSafeString(body.vehicleOrYardLocation ?? body.yardLocation);
    const updates: Partial<typeof vehicles.$inferInsert> = {
      updatedAt: new Date(),
    };

    if ("title" in body) updates.title = toSafeString(body.title) || existing.title;
    if (expectedPrice !== null) {
      updates.price = String(expectedPrice);
      updates.expectedPrice = String(expectedPrice);
    }
    if (location) {
      updates.vehicleOrYardLocation = location;
      updates.yardLocation = location;
    }
    if ("conditionNotes" in body) updates.conditionNotes = toSafeString(body.conditionNotes);
    if ("auctionDate" in body) updates.auctionDate = toSafeString(body.auctionDate);

    const needsReverification = existing.isPublished || existing.listingStatus === "VERIFIED";
    if (needsReverification) {
      updates.status = "PENDING";
      updates.listingStatus = "PENDING";
      updates.verificationStatus = "PENDING_VERIFICATION";
      updates.isPublished = false;
      updates.rejectionReason = "";
      updates.verifiedBy = null;
      updates.verifiedAt = null;
    }

    const [updated] = await db.update(vehicles).set(updates).where(eq(vehicles.id, id)).returning();

    return Response.json({
      vehicle: updated,
      message: needsReverification
        ? "Your edited listing has been sent for re-verification."
        : "Listing updated successfully.",
      sentForReverification: needsReverification,
    });
  } catch (error) {
    console.error("PATCH /api/seller/vehicles/[id] failed", error);
    return Response.json({ message: "Failed to update vehicle." }, { status: 500 });
  }
}

export async function DELETE(
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
    const existing = await getOwnedVehicle(id, currentUser.id);
    if (!existing) {
      return Response.json({ message: "Vehicle not found." }, { status: 404 });
    }

    const [updated] = await db
      .update(vehicles)
      .set({
        deletedAt: new Date(),
        isPublished: false,
        updatedAt: new Date(),
      })
      .where(eq(vehicles.id, id))
      .returning({ id: vehicles.id });

    return Response.json({ success: true, id: updated.id });
  } catch (error) {
    console.error("DELETE /api/seller/vehicles/[id] failed", error);
    return Response.json({ message: "Failed to delete vehicle." }, { status: 500 });
  }
}
