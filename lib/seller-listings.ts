import { and, desc, eq, inArray, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { dbToVehicle } from "@/lib/mappers";
import { featureRequests, vehicles as vehiclesTable } from "@/lib/schema";
import type { Vehicle } from "@/types/vehicle";

export const SELLER_LISTINGS_PAGE_SIZE = 10;

export type SellerListingSort =
  | "newest"
  | "oldest"
  | "mostViewed"
  | "mostInquiries"
  | "priceDesc"
  | "priceAsc";

export type SellerListingFeatureStatus = "FEATURED" | "PENDING" | "REJECTED" | "NONE";

export type SellerListingItem = {
  vehicle: Vehicle;
  featureStatus: SellerListingFeatureStatus;
  featuredUntil: string | null;
};

export type SellerListingPagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
};

export type SellerListingsMetrics = {
  totalListings: number;
  totalViews: number;
  totalInquiries: number;
  featuredListings: number;
  soldListings: number;
};

export type SellerListingsResult = {
  items: SellerListingItem[];
  metrics: SellerListingsMetrics;
  pagination: SellerListingPagination;
  sort: SellerListingSort;
  hasFeatureRequests: boolean;
};

export type SellerListingSearchParams = {
  sort?: string;
  page?: string;
  limit?: string;
};

function getSort(value?: string | null): SellerListingSort {
  if (
    value === "oldest" ||
    value === "mostViewed" ||
    value === "mostInquiries" ||
    value === "priceDesc" ||
    value === "priceAsc"
  ) {
    return value;
  }

  return "newest";
}

export function getSellerListingPage(value?: string | null) {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

export function getSellerListingLimit(value?: string | null) {
  const parsed = Number.parseInt(value ?? "", 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return SELLER_LISTINGS_PAGE_SIZE;
  return Math.min(parsed, 50);
}

function getTimestamp(value?: string | null) {
  if (!value) return 0;
  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function getNumericPrice(vehicle: Vehicle) {
  return vehicle.expectedPrice && vehicle.expectedPrice > 0 ? vehicle.expectedPrice : vehicle.price;
}

function compareListings(a: SellerListingItem, b: SellerListingItem, sort: SellerListingSort) {
  const createdAtDiff = getTimestamp(b.vehicle.createdAt) - getTimestamp(a.vehicle.createdAt);

  if (sort === "oldest") {
    return getTimestamp(a.vehicle.createdAt) - getTimestamp(b.vehicle.createdAt);
  }

  if (sort === "mostViewed") {
    return (b.vehicle.viewCount ?? 0) - (a.vehicle.viewCount ?? 0) || createdAtDiff;
  }

  if (sort === "mostInquiries") {
    return b.vehicle.inquiries - a.vehicle.inquiries || createdAtDiff;
  }

  if (sort === "priceDesc") {
    return getNumericPrice(b.vehicle) - getNumericPrice(a.vehicle) || createdAtDiff;
  }

  if (sort === "priceAsc") {
    return getNumericPrice(a.vehicle) - getNumericPrice(b.vehicle) || createdAtDiff;
  }

  return createdAtDiff;
}

export async function getSellerListings(
  sellerId: number,
  params: SellerListingSearchParams,
  options?: { page?: number; limit?: number; includePagesUpToCurrent?: boolean },
): Promise<SellerListingsResult> {
  const rows = await db
    .select()
    .from(vehiclesTable)
    .where(and(eq(vehiclesTable.sellerId, sellerId), isNull(vehiclesTable.deletedAt)))
    .orderBy(desc(vehiclesTable.createdAt));

  const vehicles = rows.map(dbToVehicle);
  const vehicleIds = rows.map((row) => row.id);
  const featureRequestRows =
    vehicleIds.length === 0
      ? []
      : await db
          .select({ vehicleId: featureRequests.vehicleId, status: featureRequests.status })
          .from(featureRequests)
          .where(
            and(eq(featureRequests.sellerId, sellerId), inArray(featureRequests.vehicleId, vehicleIds)),
          )
          .orderBy(desc(featureRequests.createdAt));

  const latestFeatureStatusByVehicle = new Map<string, string>();
  for (const row of featureRequestRows) {
    if (!latestFeatureStatusByVehicle.has(row.vehicleId)) {
      latestFeatureStatusByVehicle.set(row.vehicleId, row.status);
    }
  }

  const now = new Date();
  const items = vehicles.map((vehicle) => {
    const featuredExpiry = vehicle.featuredExpiresAt ? new Date(vehicle.featuredExpiresAt) : null;
    const isFeaturedActive = Boolean(vehicle.isFeatured) && (!featuredExpiry || featuredExpiry > now);
    const featuredUntil = vehicle.featuredExpiresAt ?? null;

    let featureStatus: SellerListingFeatureStatus = "NONE";
    if (isFeaturedActive) {
      featureStatus = "FEATURED";
    } else {
      const latestStatus = latestFeatureStatusByVehicle.get(vehicle.id);
      if (latestStatus === "PENDING") featureStatus = "PENDING";
      else if (latestStatus === "REJECTED") featureStatus = "REJECTED";
    }

    return { vehicle, featureStatus, featuredUntil };
  });

  const sort = getSort(params.sort);
  const sortedItems = [...items].sort((a, b) => compareListings(a, b, sort));
  const total = sortedItems.length;
  const limit = options?.limit ?? getSellerListingLimit(params.limit);
  const totalPages = total > 0 ? Math.ceil(total / limit) : 0;
  const requestedPage = options?.page ?? getSellerListingPage(params.page);
  const page = totalPages > 0 ? Math.min(requestedPage, totalPages) : 1;
  const queryLimit = options?.includePagesUpToCurrent ? page * limit : limit;
  const offset = options?.includePagesUpToCurrent ? 0 : (page - 1) * limit;

  return {
    items: sortedItems.slice(offset, offset + queryLimit),
    metrics: {
      totalListings: total,
      totalViews: vehicles.reduce((sum, vehicle) => sum + (vehicle.viewCount ?? 0), 0),
      totalInquiries: vehicles.reduce((sum, vehicle) => sum + vehicle.inquiries, 0),
      featuredListings: items.filter((item) => item.featureStatus === "FEATURED").length,
      soldListings: vehicles.filter((vehicle) => vehicle.listingStatus === "SOLD").length,
    },
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: totalPages > 0 && page < totalPages,
      hasPrevPage: page > 1,
    },
    sort,
    hasFeatureRequests: items.some((item) => item.featureStatus !== "NONE"),
  };
}
