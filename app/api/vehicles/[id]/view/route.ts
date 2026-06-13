import { db } from "@/lib/db";
import { vehicles } from "@/lib/schema";
import { eq, sql } from "drizzle-orm";

export const runtime = "nodejs";

// POST /api/vehicles/[id]/view — increment viewCount by 1
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id) {
    return Response.json({ message: "Missing vehicle id." }, { status: 400 });
  }

  const [row] = await db
    .select({ id: vehicles.id, isPublished: vehicles.isPublished, listingStatus: vehicles.listingStatus, deletedAt: vehicles.deletedAt })
    .from(vehicles)
    .where(eq(vehicles.id, id));

  if (!row || row.deletedAt) {
    return Response.json({ message: "Vehicle not found." }, { status: 404 });
  }

  if (!row.isPublished || row.listingStatus !== "VERIFIED") {
    // Silently ignore view increments for non-live listings
    return Response.json({ ok: true });
  }

  await db
    .update(vehicles)
    .set({ viewCount: sql`${vehicles.viewCount} + 1` })
    .where(eq(vehicles.id, id));

  return Response.json({ ok: true });
}
