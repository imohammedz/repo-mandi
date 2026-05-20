import { db } from "@/lib/db";
import { vehicles } from "@/lib/schema";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";

// ── GET /api/vehicles/[id] ────────────────────────────────────────────────────
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const [row] = await db.select().from(vehicles).where(eq(vehicles.id, id));
    if (!row) {
      return Response.json({ message: "Vehicle not found." }, { status: 404 });
    }
    return Response.json(row);
  } catch (error) {
    console.error("GET /api/vehicles/[id] failed", error);
    return Response.json({ message: "Failed to fetch vehicle." }, { status: 500 });
  }
}

// ── PUT /api/vehicles/[id] ────────────────────────────────────────────────────
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = (await request.json()) as Record<string, unknown>;

    // Prevent id and created_at from being overwritten
    const { id: _ignored, createdAt: _ca, ...updates } = body;
    void _ignored;
    void _ca;

    const [updated] = await db
      .update(vehicles)
      .set({ ...(updates as Partial<typeof vehicles.$inferInsert>), updatedAt: new Date() })
      .where(eq(vehicles.id, id))
      .returning();

    if (!updated) {
      return Response.json({ message: "Vehicle not found." }, { status: 404 });
    }
    return Response.json(updated);
  } catch (error) {
    console.error("PUT /api/vehicles/[id] failed", error);
    return Response.json({ message: "Failed to update vehicle." }, { status: 500 });
  }
}

// ── DELETE /api/vehicles/[id] ─────────────────────────────────────────────────
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const [deleted] = await db
      .delete(vehicles)
      .where(eq(vehicles.id, id))
      .returning({ id: vehicles.id });

    if (!deleted) {
      return Response.json({ message: "Vehicle not found." }, { status: 404 });
    }
    return Response.json({ success: true, id: deleted.id });
  } catch (error) {
    console.error("DELETE /api/vehicles/[id] failed", error);
    return Response.json({ message: "Failed to delete vehicle." }, { status: 500 });
  }
}
