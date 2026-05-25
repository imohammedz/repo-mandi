import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { vehicles } from "@/lib/schema";

export const runtime = "nodejs";

export async function PATCH(
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
    const [existing] = await db.select().from(vehicles).where(eq(vehicles.id, id));
    if (!existing) {
      return Response.json({ message: "Vehicle not found." }, { status: 404 });
    }

    if (existing.sellerId !== currentUser.id) {
      return Response.json({ message: "Forbidden." }, { status: 403 });
    }

    if (!["VERIFIED", "PENDING"].includes(existing.listingStatus)) {
      return Response.json(
        { message: "Only pending or verified listings can be marked as sold." },
        { status: 400 }
      );
    }

    const soldUpdates: Partial<typeof vehicles.$inferInsert> & Record<string, unknown> = {
      listingStatus: "SOLD",
      status: "APPROVED",
      isPublished: false,
      updatedAt: new Date(),
    };
    if ("soldAt" in (existing as Record<string, unknown>)) {
      soldUpdates.soldAt = new Date();
    }

    const [updated] = await db
      .update(vehicles)
      .set(soldUpdates as Partial<typeof vehicles.$inferInsert>)
      .where(eq(vehicles.id, id))
      .returning();

    return Response.json(updated);
  } catch (error) {
    console.error("PATCH /api/seller/vehicles/[id]/mark-sold failed", error);
    return Response.json(
      { message: "Failed to mark vehicle as sold." },
      { status: 500 }
    );
  }
}
