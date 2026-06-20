import { and, count, desc, eq, gte, ilike, inArray, isNull, lte, ne, or, sql, type SQL } from "drizzle-orm";
import { db } from "@/lib/db";
import { sanitizeSupabaseMediaArray, sanitizeSupabaseMediaUrl } from "@/lib/media";
import { vehicles } from "@/lib/schema";
import type { Vehicle } from "@/types/vehicle";

export const DEFAULT_VEHICLE_LISTING_PAGE = 1;
export const DEFAULT_VEHICLE_LISTING_LIMIT = 10;
const MAX_VEHICLE_LISTING_LIMIT = 50;
export const HOMEPAGE_CATEGORY_IDS = [
  "prime-mover",
  "trailers",
  "tippers",
  "container",
  "buses",
  "equipment",
] as const;
export type HomepageCategoryId = (typeof HOMEPAGE_CATEGORY_IDS)[number];

const PRIME_MOVER_ONLY_VALUES = [
  "PRIME_MOVER_ONLY",
  "Prime Mover Only",
  "Power / Horse / Tractor / Prime Mover Only",
] as const;
const TRAILER_ONLY_VALUES = ["TRAILER_ONLY", "Trailer Only"] as const;

export type VehicleListingSearchParams = {
  category?: HomepageCategoryId;
  q?: string;
  type?: string;
  listingType?: string;
  listingMode?: string;
  assetStructure?: string;
  detachableType?: string;
  assetCategory?: string;
  bodyType?: string;
  bodyApplicationType?: string;
  brand?: string;
  model?: string;
  location?: string;
  city?: string;
  state?: string;
  runningCondition?: string;
  repoStatus?: string;
  sellerRole?: string;
  financeCompany?: string;
  minPrice?: string;
  maxPrice?: string;
  verifiedOnly?: string;
  sort?: string;
  page?: string;
  limit?: string;
};

export function isHomepageCategory(value?: string | null): value is HomepageCategoryId {
  return HOMEPAGE_CATEGORY_IDS.includes(value as HomepageCategoryId);
}

function buildHomepageCategoryCondition(category: HomepageCategoryId) {
  switch (category) {
    case "prime-mover":
      return inArray(vehicles.assetConfiguration, PRIME_MOVER_ONLY_VALUES);
    case "trailers":
      return inArray(vehicles.assetConfiguration, TRAILER_ONLY_VALUES);
    case "tippers":
      return or(
        ilike(vehicles.bodyType, "%Tipper%"),
        ilike(vehicles.bodyType, "%Tip Trailer%"),
        ilike(vehicles.bodyApplicationType, "%Tipper%"),
        ilike(vehicles.bodyApplicationType, "%Tip Trailer%"),
        ilike(vehicles.vehicleSubType, "%Tipper%"),
        ilike(vehicles.vehicleSubType, "%Tip Trailer%"),
        ilike(vehicles.assetCategory, "%Tipper%"),
        ilike(vehicles.trailerType, "%Tipper%"),
        ilike(vehicles.trailerType, "%Tip Trailer%")
      )!;
    case "container":
      return or(
        ilike(vehicles.bodyType, "%Container%"),
        ilike(vehicles.bodyApplicationType, "%Container%"),
        ilike(vehicles.vehicleSubType, "%Container%"),
        ilike(vehicles.assetCategory, "%Container%"),
        ilike(vehicles.trailerType, "%Container%")
      )!;
    case "buses":
      return or(
        eq(vehicles.type, "Bus"),
        ilike(vehicles.assetCategory, "%Bus%"),
        ilike(vehicles.vehicleSubType, "%Bus%")
      )!;
    case "equipment":
      return or(eq(vehicles.assetCategory, "Equipment"), eq(vehicles.type, "Equipment"))!;
  }
}

export type ListingPagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
};

export type PaginatedVehicleListings = {
  items: Vehicle[];
  pagination: ListingPagination;
};

const vehicleCardSelect = {
  id: vehicles.id,
  sellerId: vehicles.sellerId,
  createdByUserId: vehicles.createdByUserId,
  listingType: vehicles.listingType,
  listingMode: vehicles.listingMode,
  assetConfiguration: vehicles.assetConfiguration,
  assetStructure: vehicles.assetStructure,
  detachableType: vehicles.detachableType,
  status: vehicles.status,
  title: vehicles.title,
  type: vehicles.type,
  assetCategory: vehicles.assetCategory,
  vehicleSubType: vehicles.vehicleSubType,
  bodyApplicationType: vehicles.bodyApplicationType,
  brand: vehicles.brand,
  model: vehicles.model,
  year: vehicles.year,
  kmDriven: vehicles.kmDriven,
  odometerReading: vehicles.odometerReading,
  axleConfiguration: vehicles.axleConfiguration,
  axleType: vehicles.axleType,
  bodyType: vehicles.bodyType,
  bodyLength: vehicles.bodyLength,
  bodyDimensions: vehicles.bodyDimensions,
  trailerType: vehicles.trailerType,
  trailerLength: vehicles.trailerLength,
  totalTyres: vehicles.totalTyres,
  tyreCount: vehicles.tyreCount,
  currentTyreCount: vehicles.currentTyreCount,
  tyreMountStatus: vehicles.tyreMountStatus,
  registrationState: vehicles.registrationState,
  city: vehicles.city,
  state: vehicles.state,
  vehicleOrYardLocation: vehicles.vehicleOrYardLocation,
  image: vehicles.image,
  gallery: vehicles.gallery,
  frontPhoto: vehicles.frontPhoto,
  backPhoto: vehicles.backPhoto,
  sidePhoto: vehicles.sidePhoto,
  leftSidePhoto: vehicles.leftSidePhoto,
  rightSidePhoto: vehicles.rightSidePhoto,
  interiorPhoto: vehicles.interiorPhoto,
  price: vehicles.price,
  expectedPrice: vehicles.expectedPrice,
  repoStatus: vehicles.repoStatus,
  sellerType: vehicles.sellerType,
  sellerRole: vehicles.sellerRole,
  sellerPhone: vehicles.sellerPhone,
  transferType: vehicles.transferType,
  nocStatus: vehicles.nocStatus,
  acCabin: vehicles.acCabin,
  rcVerified: vehicles.rcVerified,
  photosVerified: vehicles.photosVerified,
  yardVerified: vehicles.yardVerified,
  sellerVerified: vehicles.sellerVerified,
  isPublished: vehicles.isPublished,
  isFeatured: vehicles.isFeatured,
  featuredAt: vehicles.featuredAt,
  featuredExpiresAt: vehicles.featuredExpiresAt,
  featuredBy: vehicles.featuredBy,
  listingStatus: vehicles.listingStatus,
  verificationStatus: vehicles.verificationStatus,
  rejectionReason: vehicles.rejectionReason,
  verifiedBy: vehicles.verifiedBy,
  verifiedAt: vehicles.verifiedAt,
  soldAt: vehicles.soldAt,
  deletedAt: vehicles.deletedAt,
  inquiries: vehicles.inquiries,
  createdAt: vehicles.createdAt,
} as const;

async function fetchVehicleCardRows(whereClause: SQL, sort?: string, limit?: number, offset?: number) {
  return db
    .select(vehicleCardSelect)
    .from(vehicles)
    .where(whereClause)
    .orderBy(...getVehicleListingOrderBy(sort))
    .limit(limit ?? DEFAULT_VEHICLE_LISTING_LIMIT)
    .offset(offset ?? 0);
}

type VehicleCardRow = Awaited<ReturnType<typeof fetchVehicleCardRows>>[number];

export function getVehicleListingPage(value?: string | null) {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_VEHICLE_LISTING_PAGE;
}

export function getVehicleListingLimit(value?: string | null) {
  const parsed = Number.parseInt(value ?? "", 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_VEHICLE_LISTING_LIMIT;
  return Math.min(parsed, MAX_VEHICLE_LISTING_LIMIT);
}

export function buildPublicVehicleConditions(params: VehicleListingSearchParams) {
  const conditions: SQL[] = [
    eq(vehicles.isPublished, true),
    isNull(vehicles.deletedAt),
    ne(vehicles.status, "SOLD"),
  ];

  if (params.category && isHomepageCategory(params.category)) {
    conditions.push(buildHomepageCategoryCondition(params.category));
  }

  if (params.q) {
    conditions.push(
      or(
        ilike(vehicles.title, `%${params.q}%`),
        ilike(vehicles.brand, `%${params.q}%`),
        ilike(vehicles.model, `%${params.q}%`),
        ilike(vehicles.assetCategory, `%${params.q}%`),
        ilike(vehicles.bodyApplicationType, `%${params.q}%`),
        ilike(vehicles.vehicleOrYardLocation, `%${params.q}%`),
        ilike(vehicles.yardLocation, `%${params.q}%`),
        ilike(vehicles.city, `%${params.q}%`),
        ilike(vehicles.state, `%${params.q}%`),
        ilike(vehicles.vehicleRegistrationNumber, `%${params.q}%`)
      )!
    );
  }

  if (params.type) conditions.push(eq(vehicles.type, params.type as typeof vehicles.type._.data));
  if (params.listingType) conditions.push(eq(vehicles.listingType, params.listingType as typeof vehicles.listingType._.data));
  if (params.listingMode) conditions.push(eq(vehicles.listingMode, params.listingMode as typeof vehicles.listingMode._.data));
  if (params.assetStructure) conditions.push(eq(vehicles.assetStructure, params.assetStructure as typeof vehicles.assetStructure._.data));
  if (params.detachableType) conditions.push(eq(vehicles.detachableType, params.detachableType as typeof vehicles.detachableType._.data));
  if (params.assetCategory) conditions.push(ilike(vehicles.assetCategory, `%${params.assetCategory}%`));
  if (params.bodyType) conditions.push(ilike(vehicles.bodyType, `%${params.bodyType}%`));
  if (params.bodyApplicationType) conditions.push(ilike(vehicles.bodyApplicationType, `%${params.bodyApplicationType}%`));
  if (params.brand) conditions.push(ilike(vehicles.brand, `%${params.brand}%`));
  if (params.model) conditions.push(ilike(vehicles.model, `%${params.model}%`));
  if (params.location) {
    conditions.push(
      or(
        ilike(vehicles.vehicleOrYardLocation, `%${params.location}%`),
        ilike(vehicles.yardLocation, `%${params.location}%`),
        ilike(vehicles.city, `%${params.location}%`),
        ilike(vehicles.state, `%${params.location}%`)
      )!
    );
  }
  if (params.city) conditions.push(ilike(vehicles.city, `%${params.city}%`));
  if (params.state) conditions.push(ilike(vehicles.state, `%${params.state}%`));
  if (params.runningCondition) conditions.push(eq(vehicles.runningCondition, params.runningCondition as typeof vehicles.runningCondition._.data));
  if (params.repoStatus) conditions.push(ilike(vehicles.repoStatus, `%${params.repoStatus}%`));
  if (params.sellerRole) conditions.push(ilike(vehicles.sellerRole, `%${params.sellerRole}%`));
  if (params.financeCompany) conditions.push(ilike(vehicles.financeCompany, `%${params.financeCompany}%`));
  if (params.minPrice) conditions.push(gte(vehicles.price, params.minPrice));
  if (params.maxPrice) conditions.push(lte(vehicles.price, params.maxPrice));
  if (params.verifiedOnly === "1") conditions.push(eq(vehicles.sellerVerified, true));

  return conditions;
}

function mapVehicleCardRow(row: VehicleCardRow) {
  return {
    id: row.id,
    sellerId: row.sellerId,
    createdByUserId: row.createdByUserId,
    listingType: row.listingType,
    listingMode: row.listingMode,
    assetConfiguration: row.assetConfiguration as Vehicle["assetConfiguration"],
    assetStructure: row.assetStructure,
    detachableType: row.detachableType,
    status: row.status,
    title: row.title,
    type: row.type,
    assetCategory: row.assetCategory || row.type,
    vehicleSubType: row.vehicleSubType,
    bodyApplicationType: row.bodyApplicationType || row.vehicleSubType || row.bodyType,
    brand: row.brand,
    model: row.model,
    year: row.year,
    kmDriven: row.kmDriven,
    odometerReading: row.odometerReading,
    axleConfiguration: row.axleConfiguration || row.axleType,
    axleType: row.axleType,
    bodyType: row.bodyType,
    bodyLength: row.bodyLength,
    bodyDimensions: row.bodyDimensions,
    trailerType: row.trailerType,
    trailerLength: row.trailerLength,
    totalTyres: row.totalTyres ?? row.tyreCount ?? row.currentTyreCount,
    tyreCount: row.tyreCount,
    currentTyreCount: row.currentTyreCount,
    tyreMountStatus: row.tyreMountStatus,
    registrationState: row.registrationState,
    city: row.city,
    state: row.state,
    vehicleOrYardLocation: row.vehicleOrYardLocation,
    image: sanitizeSupabaseMediaUrl(row.image),
    gallery: sanitizeSupabaseMediaArray(row.gallery),
    frontPhoto: sanitizeSupabaseMediaUrl(row.frontPhoto) || undefined,
    backPhoto: sanitizeSupabaseMediaUrl(row.backPhoto) || undefined,
    sidePhoto: sanitizeSupabaseMediaUrl(row.sidePhoto) || undefined,
    leftSidePhoto: sanitizeSupabaseMediaUrl(row.leftSidePhoto) || sanitizeSupabaseMediaUrl(row.sidePhoto) || undefined,
    rightSidePhoto: sanitizeSupabaseMediaUrl(row.rightSidePhoto) || undefined,
    interiorPhoto: sanitizeSupabaseMediaUrl(row.interiorPhoto) || undefined,
    financeCompany: "",
    fuelType: "Diesel",
    price: Number(row.price),
    expectedPrice: Number(row.expectedPrice),
    reservePrice: 0,
    repoStatus: row.repoStatus,
    sellerType: row.sellerType,
    sellerName: "",
    sellerRole: row.sellerRole,
    sellerPhone: row.sellerPhone,
    condition: "Unknown",
    conditionNotes: "",
    accidentNotes: "",
    auctionDate: "",
    yardLocation: "",
    verifiedBadges: [],
    rcVerified: row.rcVerified,
    photosVerified: row.photosVerified,
    yardVerified: row.yardVerified,
    sellerVerified: row.sellerVerified,
    isPublished: row.isPublished,
    isFeatured: row.isFeatured,
    featuredAt: row.featuredAt?.toISOString() ?? null,
    featuredExpiresAt: row.featuredExpiresAt?.toISOString() ?? null,
    featuredBy: row.featuredBy,
    transferType: row.transferType,
    nocStatus: row.nocStatus,
    acCabin: row.acCabin,
    verificationStatus: row.verificationStatus,
    rejectionReason: row.rejectionReason,
    verifiedBy: row.verifiedBy,
    verifiedAt: row.verifiedAt?.toISOString() ?? null,
    soldAt: row.soldAt?.toISOString() ?? null,
    deletedAt: row.deletedAt?.toISOString() ?? null,
    inspectionNotes: [],
    inquiries: row.inquiries,
    listingStatus: row.listingStatus,
  } as Vehicle;
}

function getActiveFeaturedCaseSql() {
  return sql`
    case
      when ${vehicles.isFeatured} = true
        and (${vehicles.featuredExpiresAt} is null or ${vehicles.featuredExpiresAt} > now())
      then 1
      else 0
    end
  `;
}

export function getVehicleListingOrderBy(sort?: string) {
  const normalizedSort = sort ?? "newest";
  const activeFeaturedCase = getActiveFeaturedCaseSql();
  const activeFeaturedFirst = sql`${activeFeaturedCase} desc`;
  const featuredAtDescNullsLast = sql`
    case
      when ${activeFeaturedCase} = 1 then ${vehicles.featuredAt}
      else null
    end desc nulls last
  `;
  let priceOrder: SQL | undefined;

  if (normalizedSort === "price-low") {
    priceOrder = sql`${vehicles.price} asc nulls last`;
  } else if (normalizedSort === "price-high") {
    priceOrder = sql`${vehicles.price} desc nulls last`;
  }

  if (priceOrder) {
    return [activeFeaturedFirst, featuredAtDescNullsLast, priceOrder, desc(vehicles.createdAt)] as const;
  }

  return [activeFeaturedFirst, featuredAtDescNullsLast, desc(vehicles.createdAt)] as const;
}

export async function getPaginatedPublicVehicleListings(
  params: VehicleListingSearchParams,
  options?: { page?: number; limit?: number; includePagesUpToCurrent?: boolean }
): Promise<PaginatedVehicleListings> {
  const page = options?.page ?? getVehicleListingPage(params.page);
  const limit = options?.limit ?? getVehicleListingLimit(params.limit);
  const conditions = buildPublicVehicleConditions(params);
  const whereClause = and(...conditions) ?? eq(vehicles.isPublished, true);
  const [totalResult] = await db.select({ count: count() }).from(vehicles).where(whereClause);
  const total = totalResult?.count ?? 0;
  const totalPages = total > 0 ? Math.ceil(total / limit) : 0;
  const safePage = totalPages > 0 ? Math.min(page, totalPages) : DEFAULT_VEHICLE_LISTING_PAGE;
  const queryLimit = options?.includePagesUpToCurrent ? safePage * limit : limit;
  const offset = options?.includePagesUpToCurrent ? 0 : (safePage - 1) * limit;
  const rows = await fetchVehicleCardRows(whereClause, params.sort, queryLimit, offset);

  return {
    items: rows.map(mapVehicleCardRow),
    pagination: {
      page: safePage,
      limit,
      total,
      totalPages,
      hasNextPage: totalPages > 0 && safePage < totalPages,
      hasPrevPage: safePage > DEFAULT_VEHICLE_LISTING_PAGE,
    },
  };
}
