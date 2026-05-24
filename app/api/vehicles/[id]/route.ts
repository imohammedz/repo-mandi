import { db } from "@/lib/db";
import { vehicles } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { unlink } from "node:fs/promises";
import path from "node:path";
import { getCurrentUser } from "@/lib/auth";

export const runtime = "nodejs";

async function cleanupUploadedImages(paths: string[]) {
  const uploadRoot = path.resolve(process.cwd(), "public", "uploads");

  await Promise.all(
    paths.map(async (urlPath) => {
      if (!urlPath.startsWith("/uploads/")) return;

      const relativeFilePath = urlPath.replace(/^\/uploads\//, "");
      const absoluteFilePath = path.resolve(uploadRoot, relativeFilePath);

      // Ensure deletion stays within /public/uploads
      if (!absoluteFilePath.startsWith(uploadRoot)) return;

      try {
        await unlink(absoluteFilePath);
      } catch {
        // ignore missing files
      }
    })
  );
}

// ── GET /api/vehicles/[id] ────────────────────────────────────────────────────
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser();
    const { id } = await params;
    const [row] = await db.select().from(vehicles).where(eq(vehicles.id, id));
    if (!row) {
      return Response.json({ message: "Vehicle not found." }, { status: 404 });
    }
    const canViewPrivate =
      currentUser?.accountType === "ADMIN" || (currentUser?.id && row.sellerId === currentUser.id);
    const isPublicLive = row.isPublished && row.listingStatus === "VERIFIED";
    if (!isPublicLive && !canViewPrivate) {
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
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return Response.json({ message: "Unauthorized." }, { status: 401 });
    }

    const { id } = await params;
    const body = (await request.json()) as Record<string, unknown>;

    const [existing] = await db.select().from(vehicles).where(eq(vehicles.id, id));
    if (!existing) {
      return Response.json({ message: "Vehicle not found." }, { status: 404 });
    }

    const isAdmin = currentUser.accountType === "ADMIN";
    const isOwner = existing.sellerId === currentUser.id;
    if (!isAdmin && !isOwner) {
      return Response.json({ message: "Forbidden." }, { status: 403 });
    }

    // Prevent id and created_at from being overwritten
    const blocked = new Set([
      "id",
      "createdAt",
      "sellerId",
      "createdByUserId",
      "isPublished",
      "verificationStatus",
      "verifiedBy",
      "verifiedAt",
      "listingStatus",
      "rejectionReason",
      "sellerVerified",
      "photosVerified",
      "yardVerified",
      "rcVerified",
    ]);
    const updates = Object.fromEntries(Object.entries(body).filter(([key]) => !blocked.has(key)));

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
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return Response.json({ message: "Unauthorized." }, { status: 401 });
    }

    const { id } = await params;
    const [existing] = await db
      .select({
        image: vehicles.image,
        gallery: vehicles.gallery,
      })
      .from(vehicles)
      .where(eq(vehicles.id, id));

    if (!existing) {
      return Response.json({ message: "Vehicle not found." }, { status: 404 });
    }

    const [fullExisting] = await db.select().from(vehicles).where(eq(vehicles.id, id));
    const isAdmin = currentUser.accountType === "ADMIN";
    const isOwner = fullExisting?.sellerId === currentUser.id;
    if (!isAdmin && !isOwner) {
      return Response.json({ message: "Forbidden." }, { status: 403 });
    }

    const [deleted] = await db
      .delete(vehicles)
      .where(eq(vehicles.id, id))
      .returning({ id: vehicles.id });

    const candidatePaths = Array.from(
      new Set([existing.image, ...(existing.gallery ?? [])].filter(Boolean))
    );
    await cleanupUploadedImages(candidatePaths);

    return Response.json({ success: true, id: deleted.id });
  } catch (error) {
    console.error("DELETE /api/vehicles/[id] failed", error);
    return Response.json({ message: "Failed to delete vehicle." }, { status: 500 });
  }
}
