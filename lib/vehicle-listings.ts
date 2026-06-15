import { and, asc, count, desc, eq, gte, ilike, isNull, lte, ne, or, type SQL } from "drizzle-orm";
import { db } from "@/lib/db";
import { sanitizeSupabaseMediaArray, sanitizeSupabaseMediaUrl } from "@/lib/media";
import { vehicles } from "@/lib/schema";
import type { Vehicle } from "@/types/vehicle";

export const DEFAULT_VEHICLE_LISTING_PAGE = 1;
export const DEFAULT_VEHICLE_LISTING_LIMIT = 10;
const MAX_VEHICLE_LISTING_LIMIT = 50;

const TYRE_COUNT_PATTERN =
  /\b(?:(\d+)\s*(?:tyre|tyres|tire|tires|wheel|wheels)|(?:tyre|tyres|tire|tires|wheel|wheels)\s*(\d+))\b/i;

const TYRE_MOUNT_STATUS_ALIASES = [
  { value: "ON_DISC", aliases: ["ON_DISC", "ON DISC", "ONDISC", "DISC", "DISC TYRE", "DISC TYRES"] },
  { value: "WITH_TYRES", aliases: ["WITH_TYRES", "WITH TYRE", "WITH TYRES", "TYRE FITTED", "TYRES FITTED"] },
  {
    value: "WITHOUT_DISC_AND_TYRES",
    aliases: [
      "WITHOUT_DISC_AND_TYRES",
      "WITHOUT DISC AND TYRES",
      "WITHOUT TYRES",
      "WITHOUT TYRE",
      "NO TYRES",
      "NO TYRE",
      "NO DISC",
      "NO DISC AND TYRES",
    ],
  },
  { value: "PARTIAL", aliases: ["PARTIAL", "PARTIAL TYRE", "PARTIAL TYRES", "SOME TYRES", "SOME TYRE"] },
] as const;

const TYRE_CONDITION_ALIASES = [
  { value: "NEW", aliases: ["NEW", "BRAND NEW"] },
  { value: "GOOD", aliases: ["GOOD"] },
  { value: "FAIR", aliases: ["FAIR"] },
  { value: "AROUND_50", aliases: ["AROUND_50", "AROUND 50", "50", "50%", "AROUND 50 PERCENT"] },
  { value: "POOR", aliases: ["POOR", "BAD"] },
  { value: "MIXED", aliases: ["MIXED", "MIX"] },
  { value: "UNKNOWN", aliases: ["UNKNOWN"] },
] as const;

const TYRES_INCLUDED_ALIASES = [
  { value: "YES", aliases: ["YES", "INCLUDED", "WITH TYRES", "TYRES INCLUDED", "TYRE INCLUDED"] },
  { value: "NO", aliases: ["NO", "NOT INCLUDED", "WITHOUT TYRES", "WITHOUT TYRE", "NO TYRES", "NO TYRE"] },
  { value: "UNKNOWN", aliases: ["UNKNOWN"] },
] as const;

const DETACHABLE_TYPE_ALIASES = [
  { value: "PRIME_MOVER", aliases: ["PRIME_MOVER", "PRIME MOVER", "PRIMEMOVER"] },
  { value: "TRAILER", aliases: ["TRAILER", "TRAILERS"] },
] as const;

const ASSET_STRUCTURE_ALIASES = [
  { value: "STANDALONE", aliases: ["STANDALONE", "STAND ALONE"] },
  { value: "DETACHABLE", aliases: ["DETACHABLE"] },
  { value: "EQUIPMENT", aliases: ["EQUIPMENT"] },
] as const;

const TYRE_MOUNT_CONTEXT_PHRASES = ["TYRE MOUNT STATUS", "TYRE MOUNT", "MOUNT STATUS", "MOUNT"] as const;
const TYRE_CONDITION_CONTEXT_PHRASES = ["TYRE CONDITION", "CONDITION"] as const;
const TYRES_INCLUDED_CONTEXT_PHRASES = ["TYRES INCLUDED", "TYRE INCLUDED", "INCLUDED", "TYRES", "TYRE"] as const;

const normalizeSearchKeyword = (value: string) =>
  value
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

function getExactAliasMatches<T extends string>(
  query: string,
  options: readonly { value: T; aliases: readonly string[] }[]
) {
  const normalizedQuery = normalizeSearchKeyword(query);
  if (!normalizedQuery) return [] as T[];

  return options
    .filter(({ aliases }) => aliases.some((alias) => normalizeSearchKeyword(alias) === normalizedQuery))
    .map(({ value }) => value);
}

function stripContextPhrase(value: string, phrases: readonly string[]) {
  let next = value;

  for (const phrase of phrases) {
    const normalizedPhrase = normalizeSearchKeyword(phrase);
    if (next.startsWith(`${normalizedPhrase} `)) next = next.slice(normalizedPhrase.length + 1).trim();
    if (next.endsWith(` ${normalizedPhrase}`)) next = next.slice(0, -1 * (normalizedPhrase.length + 1)).trim();
    if (next === normalizedPhrase) next = "";
  }

  return next;
}

function getTyreAliasMatches<T extends string>(
  query: string,
  options: readonly { value: T; aliases: readonly string[] }[],
  contextPhrases: readonly string[]
) {
  const normalizedQuery = normalizeSearchKeyword(query);
  const normalizedCandidates = [normalizedQuery, stripContextPhrase(normalizedQuery, contextPhrases)].filter(Boolean);
  if (!normalizedCandidates.length) return [] as T[];

  return options
    .filter(({ aliases }) =>
      aliases.some((alias) => {
        const normalizedAlias = normalizeSearchKeyword(alias);
        return normalizedCandidates.includes(normalizedAlias);
      })
    )
    .map(({ value }) => value);
}

function getTyreCountSearchValue(query: string) {
  const match = query.match(TYRE_COUNT_PATTERN);
  const countValue = match?.[1] ?? match?.[2];
  if (!countValue) return null;

  const parsed = Number.parseInt(countValue, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function getIntegerFilterValue(value?: string | null) {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

export type VehicleListingSearchParams = {
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
  tyreInspectionReport?: string;
  totalTyres?: string;
  tyreMountStatus?: string;
  tyreCondition?: string;
  tyresIncluded?: string;
  minPrice?: string;
  maxPrice?: string;
  verifiedOnly?: string;
  sort?: string;
  page?: string;
  limit?: string;
};

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

  if (params.q) {
    const keywordConditions: SQL[] = [
      ilike(vehicles.title, `%${params.q}%`),
      ilike(vehicles.brand, `%${params.q}%`),
      ilike(vehicles.model, `%${params.q}%`),
      ilike(vehicles.assetCategory, `%${params.q}%`),
      ilike(vehicles.vehicleSubType, `%${params.q}%`),
      ilike(vehicles.bodyType, `%${params.q}%`),
      ilike(vehicles.bodyApplicationType, `%${params.q}%`),
      ilike(vehicles.trailerType, `%${params.q}%`),
      ilike(vehicles.vehicleOrYardLocation, `%${params.q}%`),
      ilike(vehicles.yardLocation, `%${params.q}%`),
      ilike(vehicles.city, `%${params.q}%`),
      ilike(vehicles.state, `%${params.q}%`),
      ilike(vehicles.vehicleRegistrationNumber, `%${params.q}%`),
      ilike(vehicles.repoStatus, `%${params.q}%`),
      ilike(vehicles.sellerRole, `%${params.q}%`),
      ilike(vehicles.financeCompany, `%${params.q}%`),
    ];

    const tyreCountSearchValue = getTyreCountSearchValue(params.q);
    if (tyreCountSearchValue !== null) {
      keywordConditions.push(
        or(
          eq(vehicles.totalTyres, tyreCountSearchValue),
          eq(vehicles.tyreCount, tyreCountSearchValue),
          eq(vehicles.currentTyreCount, tyreCountSearchValue)
        )!
      );
    }

    for (const detachableType of getExactAliasMatches(params.q, DETACHABLE_TYPE_ALIASES)) {
      keywordConditions.push(eq(vehicles.detachableType, detachableType as typeof vehicles.detachableType._.data));
    }

    for (const assetStructure of getExactAliasMatches(params.q, ASSET_STRUCTURE_ALIASES)) {
      keywordConditions.push(eq(vehicles.assetStructure, assetStructure as typeof vehicles.assetStructure._.data));
    }

    for (const tyreMountStatus of getTyreAliasMatches(params.q, TYRE_MOUNT_STATUS_ALIASES, TYRE_MOUNT_CONTEXT_PHRASES)) {
      keywordConditions.push(eq(vehicles.tyreMountStatus, tyreMountStatus as typeof vehicles.tyreMountStatus._.data));
    }

    for (const tyreCondition of getTyreAliasMatches(params.q, TYRE_CONDITION_ALIASES, TYRE_CONDITION_CONTEXT_PHRASES)) {
      keywordConditions.push(eq(vehicles.tyreCondition, tyreCondition as typeof vehicles.tyreCondition._.data));
    }

    for (const tyresIncluded of getTyreAliasMatches(params.q, TYRES_INCLUDED_ALIASES, TYRES_INCLUDED_CONTEXT_PHRASES)) {
      keywordConditions.push(eq(vehicles.tyresIncluded, tyresIncluded as typeof vehicles.tyresIncluded._.data));
    }

    conditions.push(
      or(...keywordConditions)!
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
  if (params.tyreInspectionReport) {
    conditions.push(eq(vehicles.tyreInspectionReport, params.tyreInspectionReport as typeof vehicles.tyreInspectionReport._.data));
  }
  const totalTyres = getIntegerFilterValue(params.totalTyres);
  if (totalTyres !== null) {
    conditions.push(
      or(
        eq(vehicles.totalTyres, totalTyres),
        eq(vehicles.tyreCount, totalTyres),
        eq(vehicles.currentTyreCount, totalTyres)
      )!
    );
  }
  if (params.tyreMountStatus) conditions.push(eq(vehicles.tyreMountStatus, params.tyreMountStatus as typeof vehicles.tyreMountStatus._.data));
  if (params.tyreCondition) conditions.push(eq(vehicles.tyreCondition, params.tyreCondition as typeof vehicles.tyreCondition._.data));
  if (params.tyresIncluded) conditions.push(eq(vehicles.tyresIncluded, params.tyresIncluded as typeof vehicles.tyresIncluded._.data));
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

function getVehicleListingOrderBy(sort?: string) {
  if (sort === "priceAsc") {
    return [desc(vehicles.isFeatured), asc(vehicles.price), desc(vehicles.createdAt)] as const;
  }

  if (sort === "priceDesc") {
    return [desc(vehicles.isFeatured), desc(vehicles.price), desc(vehicles.createdAt)] as const;
  }

  return [desc(vehicles.isFeatured), desc(vehicles.createdAt)] as const;
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
