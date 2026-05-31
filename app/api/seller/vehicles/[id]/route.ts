import { and, eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { vehicleMedia, vehicles } from "@/lib/schema";
import { sanitizeSupabaseMediaUrl } from "@/lib/media";

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

const MAX_DOCUMENTS = 15;
const MAX_DOCUMENTS_PER_GROUP = 4;
const VALID_DOCUMENT_CATEGORIES = new Set([
  "RC",
  "INSURANCE",
  "FITNESS",
  "PERMIT",
  "INSPECTION_REPORT",
  "OTHER",
]);

async function getOwnedVehicle(id: string, sellerId: number) {
  const [vehicle] = await db.select().from(vehicles).where(eq(vehicles.id, id));
  if (!vehicle || vehicle.deletedAt) {
    return { vehicle: null, error: "not_found" as const };
  }
  if (vehicle.sellerId !== sellerId) {
    return { vehicle: null, error: "forbidden" as const };
  }
  return { vehicle, error: null };
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
    const { vehicle: existing, error } = await getOwnedVehicle(id, currentUser.id);
    if (!existing) {
      return Response.json(
        { message: error === "forbidden" ? "You do not have permission to access this listing." : "Vehicle not found." },
        { status: error === "forbidden" ? 403 : 404 }
      );
    }

    const body = (await request.json()) as Record<string, unknown>;
    const documentsRaw = Array.isArray(body.documents) ? (body.documents as unknown[]) : null;
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
    if ("description" in body || "conditionNotes" in body) {
      updates.conditionNotes = toSafeString(body.description ?? body.conditionNotes);
    }
    if ("auctionDate" in body) updates.auctionDate = toSafeString(body.auctionDate);

    const parsedDocuments =
      documentsRaw?.map((item) => {
        const current = item as Record<string, unknown>;
        const categoryRaw = toSafeString(current.category).toUpperCase();
        const category = VALID_DOCUMENT_CATEGORIES.has(categoryRaw) ? categoryRaw : "OTHER";
        return {
          url: sanitizeSupabaseMediaUrl(current.url),
          category: category as
            | "RC"
            | "INSURANCE"
            | "FITNESS"
            | "PERMIT"
            | "INSPECTION_REPORT"
            | "OTHER",
          customName: category === "OTHER" ? toSafeString(current.customName) : "",
          mimeType: toSafeString(current.mimeType),
          sizeBytes: toPositiveNumberOrNull(current.sizeBytes),
          originalFileName: toSafeString(current.originalFileName),
        };
      }).filter((item) => Boolean(item.url)) ?? null;

    if (parsedDocuments) {
      if (parsedDocuments.length > MAX_DOCUMENTS) {
        return Response.json({ message: "Maximum 15 document files allowed per listing." }, { status: 400 });
      }
      const groups = new Map<string, number>();
      for (const doc of parsedDocuments) {
        const groupKey = doc.category === "OTHER" ? `OTHER:${doc.customName.trim().toUpperCase() || "OTHER"}` : doc.category;
        const next = (groups.get(groupKey) ?? 0) + 1;
        if (next > MAX_DOCUMENTS_PER_GROUP) {
          return Response.json({ message: "Maximum 4 files allowed for this document type." }, { status: 400 });
        }
        groups.set(groupKey, next);
      }
    }

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

    if (parsedDocuments) {
      await db
        .delete(vehicleMedia)
        .where(and(eq(vehicleMedia.vehicleId, id), eq(vehicleMedia.type, "DOCUMENT")));
      if (parsedDocuments.length) {
        await db.insert(vehicleMedia).values(
          parsedDocuments.map((document) => ({
            vehicleId: id,
            type: "DOCUMENT",
            category: document.category,
            customName: document.category === "OTHER" ? document.customName || null : null,
            url: document.url,
            originalFileName: document.originalFileName,
            mimeType: document.mimeType || "application/pdf",
            sizeBytes: document.sizeBytes ?? null,
          }))
        );
      }
    }

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
    const { vehicle: existing, error } = await getOwnedVehicle(id, currentUser.id);
    if (!existing) {
      return Response.json(
        { message: error === "forbidden" ? "You do not have permission to access this listing." : "Vehicle not found." },
        { status: error === "forbidden" ? 403 : 404 }
      );
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
