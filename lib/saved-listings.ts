import { and, desc, eq, inArray, isNull, ne } from "drizzle-orm";
import { db } from "@/lib/db";
import { dbToVehicle } from "@/lib/mappers";
import { savedListings, vehicles } from "@/lib/schema";
import type { Vehicle } from "@/types/vehicle";

export type SavedListingItem = {
  id: number;
  userId: number;
  vehicleId: string;
  createdAt: string;
  updatedAt: string;
  vehicle: Vehicle;
};

/**
 * Converts a saved_listings row and its matching vehicle row into the API-safe shape
 * used by saved-listing endpoints and client state.
 */
function mapSavedListing(row: typeof savedListings.$inferSelect, vehicleRow: typeof vehicles.$inferSelect): SavedListingItem {
  return {
    id: row.id,
    userId: row.userId,
    vehicleId: row.vehicleId,
    createdAt: row.createdAt?.toISOString() ?? new Date().toISOString(),
    updatedAt: row.updatedAt?.toISOString() ?? new Date().toISOString(),
    vehicle: dbToVehicle(vehicleRow),
  };
}

export async function getSavedListingsForUser(userId: number, options?: { limit?: number }) {
  const savedRows = options?.limit
    ? await db
        .select()
        .from(savedListings)
        .where(eq(savedListings.userId, userId))
        .orderBy(desc(savedListings.createdAt))
        .limit(options.limit)
    : await db
        .select()
        .from(savedListings)
        .where(eq(savedListings.userId, userId))
        .orderBy(desc(savedListings.createdAt));

  if (savedRows.length === 0) return [];

  const vehicleIds = savedRows.map((entry) => entry.vehicleId);
  const vehicleRows = await db
    .select()
    .from(vehicles)
    .where(
      and(
        inArray(vehicles.id, vehicleIds),
        eq(vehicles.isPublished, true),
      isNull(vehicles.deletedAt),
      ne(vehicles.status, "SOLD")
    )
    );

  const vehicleMap = new Map(vehicleRows.map((row) => [row.id, row]));

  return savedRows
    .map((entry) => {
      const vehicleRow = vehicleMap.get(entry.vehicleId);
      if (!vehicleRow) return null;
      return mapSavedListing(entry, vehicleRow);
    })
    .filter((entry): entry is SavedListingItem => Boolean(entry));
}

export async function getSavedListingForUser(userId: number, vehicleId: string) {
  const [savedEntry] = await db
    .select()
    .from(savedListings)
    .where(and(eq(savedListings.userId, userId), eq(savedListings.vehicleId, vehicleId)));

  if (!savedEntry) return null;

  const [vehicleRow] = await db
    .select()
    .from(vehicles)
    .where(
      and(
        eq(vehicles.id, vehicleId),
        eq(vehicles.isPublished, true),
      isNull(vehicles.deletedAt),
      ne(vehicles.status, "SOLD")
    )
    );

  if (!vehicleRow) return null;

  return mapSavedListing(savedEntry, vehicleRow);
}

export async function saveListingForUser(userId: number, vehicleId: string) {
  const [vehicleRow] = await db
    .select({ id: vehicles.id })
    .from(vehicles)
    .where(
      and(
        eq(vehicles.id, vehicleId),
        eq(vehicles.isPublished, true),
      isNull(vehicles.deletedAt),
      ne(vehicles.status, "SOLD")
    )
    );

  if (!vehicleRow) {
    return { ok: false as const, status: 404, message: "Listing not found." };
  }

  const [inserted] = await db
    .insert(savedListings)
    .values({
      userId,
      vehicleId,
      updatedAt: new Date(),
    })
    .onConflictDoNothing({ target: [savedListings.userId, savedListings.vehicleId] })
    .returning();

  if (inserted) {
    return { ok: true as const, created: true, row: inserted };
  }

  const [existing] = await db
    .select()
    .from(savedListings)
    .where(and(eq(savedListings.userId, userId), eq(savedListings.vehicleId, vehicleId)));

  if (!existing) {
    return { ok: false as const, status: 500, message: "Failed to save listing." };
  }

  return { ok: true as const, created: false, row: existing };
}

export async function removeSavedListingForUser(userId: number, vehicleId: string) {
  const [removed] = await db
    .delete(savedListings)
    .where(and(eq(savedListings.userId, userId), eq(savedListings.vehicleId, vehicleId)))
    .returning();

  return removed ?? null;
}
