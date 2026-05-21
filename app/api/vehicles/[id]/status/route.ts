import { db } from "@/lib/db";
import { vehicles } from "@/lib/schema";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";

// ── PATCH /api/vehicles/[id]/status ──────────────────────────────────────────
// Body: { status: "Verified" | "Rejected" | "Pending" | "Sold" }
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = (await request.json()) as { status?: string };
    const allowed = ["Pending", "Verified", "Rejected", "Sold"];

    if (!body.status || !allowed.includes(body.status)) {
      return Response.json(
        { message: `status must be one of: ${allowed.join(", ")}.` },
        { status: 400 }
      );
    }

    const [updated] = await db
      .update(vehicles)
      .set({
        listingStatus: body.status as typeof vehicles.listingStatus._.data,
        updatedAt: new Date(),
      })
      .where(eq(vehicles.id, id))
      .returning();

    if (!updated) {
      return Response.json({ message: "Vehicle not found." }, { status: 404 });
    }
    return Response.json(updated);
  } catch (error) {
    console.error("PATCH /api/vehicles/[id]/status failed", error);
    return Response.json({ message: "Failed to update listing status." }, { status: 500 });
  }
}
