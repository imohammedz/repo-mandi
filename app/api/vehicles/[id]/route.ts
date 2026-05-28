import { db } from "@/lib/db";
import { vehicles } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import {
  isSupabasePublicStorageUrl,
  sanitizeSupabaseMediaArray,
  sanitizeSupabaseMediaUrl,
  shouldLogMediaDebug,
} from "@/lib/media";

export const runtime = "nodejs";

// ── GET /api/vehicles/[id] ────────────────────────────────────────────────────
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser();
    const { id } = await params;
    const [row] = await db.select().from(vehicles).where(eq(vehicles.id, id));
    if (!row || row.deletedAt) {
      return Response.json({ message: "Vehicle not found." }, { status: 404 });
    }
    const canViewPrivate =
      currentUser?.accountType === "ADMIN" || (currentUser?.id && row.sellerId === currentUser.id);
    const isPublicLive = row.isPublished && row.listingStatus === "VERIFIED";
    if (!isPublicLive && !canViewPrivate) {
      return Response.json({ message: "Vehicle not found." }, { status: 404 });
    }
    const normalizedRow = {
      ...row,
      image: sanitizeSupabaseMediaUrl(row.image),
      gallery: sanitizeSupabaseMediaArray(row.gallery),
      frontPhoto: sanitizeSupabaseMediaUrl(row.frontPhoto),
      backPhoto: sanitizeSupabaseMediaUrl(row.backPhoto),
      sidePhoto: sanitizeSupabaseMediaUrl(row.sidePhoto),
      leftSidePhoto: sanitizeSupabaseMediaUrl(row.leftSidePhoto),
      rightSidePhoto: sanitizeSupabaseMediaUrl(row.rightSidePhoto),
      interiorPhoto: sanitizeSupabaseMediaUrl(row.interiorPhoto),
      walkaroundVideo: sanitizeSupabaseMediaUrl(row.walkaroundVideo) || null,
      engineStartUpVideo: sanitizeSupabaseMediaUrl(row.engineStartUpVideo) || null,
    };
    return Response.json(normalizedRow);
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
    if (!existing || existing.deletedAt) {
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

    // Backward compatibility: accept legacy client payload key `engineStartupVideo`.
    if ("engineStartupVideo" in updates && !("engineStartUpVideo" in updates)) {
      updates.engineStartUpVideo = updates.engineStartupVideo;
      delete updates.engineStartupVideo;
    }

    const mediaFields: Array<"image" | "frontPhoto" | "backPhoto" | "sidePhoto" | "interiorPhoto"> = [
      "image",
      "frontPhoto",
      "backPhoto",
      "sidePhoto",
      "interiorPhoto",
    ];
    const optionalMediaFields: Array<"walkaroundVideo" | "engineStartUpVideo"> = [
      "walkaroundVideo",
      "engineStartUpVideo",
    ];

    for (const field of mediaFields) {
      if (!(field in updates)) continue;
      const rawValue = updates[field];
      if (typeof rawValue !== "string" || !rawValue.trim()) {
        updates[field] = "";
        continue;
      }
      const sanitized = sanitizeSupabaseMediaUrl(rawValue);
      if (!sanitized) {
        return Response.json({ message: `${field} must be a Supabase public URL.` }, { status: 400 });
      }
      updates[field] = sanitized;
    }

    for (const field of optionalMediaFields) {
      if (!(field in updates)) continue;
      const rawValue = updates[field];
      if (rawValue === null || rawValue === undefined || (typeof rawValue === "string" && !rawValue.trim())) {
        updates[field] = null;
        continue;
      }
      const sanitized = sanitizeSupabaseMediaUrl(rawValue);
      if (!sanitized) {
        return Response.json({ message: `${field} must be a Supabase public URL.` }, { status: 400 });
      }
      updates[field] = sanitized;
    }

    if ("gallery" in updates) {
      const rawGallery = updates.gallery;
      if (rawGallery === null || rawGallery === undefined) {
        updates.gallery = [];
      } else if (!Array.isArray(rawGallery)) {
        return Response.json({ message: "gallery must be an array of Supabase public URLs." }, { status: 400 });
      } else {
        const invalidGalleryUrl = rawGallery.find(
          (item) => typeof item === "string" && item.trim() && !isSupabasePublicStorageUrl(item.trim())
        );
        if (invalidGalleryUrl) {
          return Response.json({ message: "gallery must only contain Supabase public URLs." }, { status: 400 });
        }
        updates.gallery = sanitizeSupabaseMediaArray(rawGallery);
      }
    }

    const [updated] = await db
      .update(vehicles)
      .set({ ...(updates as Partial<typeof vehicles.$inferInsert>), updatedAt: new Date() })
      .where(eq(vehicles.id, id))
      .returning();

    if (!updated) {
      return Response.json({ message: "Vehicle not found." }, { status: 404 });
    }

    if (
      "image" in updates ||
      "gallery" in updates ||
      "frontPhoto" in updates ||
      "backPhoto" in updates ||
      "sidePhoto" in updates ||
      "interiorPhoto" in updates ||
      "walkaroundVideo" in updates ||
      "engineStartUpVideo" in updates
    ) {
      if (shouldLogMediaDebug()) {
        console.info("Stored DB media URLs (update)", {
          vehicleId: updated.id,
          image: updated.image,
          frontPhoto: updated.frontPhoto,
          backPhoto: updated.backPhoto,
          sidePhoto: updated.sidePhoto,
          interiorPhoto: updated.interiorPhoto,
          walkaroundVideo: updated.walkaroundVideo,
          engineStartUpVideo: updated.engineStartUpVideo,
          galleryCount: updated.gallery?.length ?? 0,
        });
      }
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
        id: vehicles.id,
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

    return Response.json({ success: true, id: deleted.id });
  } catch (error) {
    console.error("DELETE /api/vehicles/[id] failed", error);
    return Response.json({ message: "Failed to delete vehicle." }, { status: 500 });
  }
}
