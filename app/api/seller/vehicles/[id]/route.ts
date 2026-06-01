import { and, eq, inArray } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { vehicleMedia, vehicles } from "@/lib/schema";
import { sanitizeSupabaseMediaArray, sanitizeSupabaseMediaUrl } from "@/lib/media";

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
const MAX_PHOTOS = 20;
const MAX_VIDEOS = 3;
const VALID_DOCUMENT_CATEGORIES = new Set([
  "RC",
  "INSURANCE",
  "FITNESS",
  "PERMIT",
  "INSPECTION_REPORT",
  "OTHER",
]);
const VALID_VIDEO_CATEGORIES = new Set(["WALKAROUND", "ENGINE_STARTUP", "DAMAGE", "OTHER"]);
const VALID_ADDITIONAL_PHOTO_CATEGORIES = new Set([
  "TYRES",
  "ENGINE",
  "CABIN",
  "CHASSIS",
  "SUSPENSION",
  "AXLES",
  "DASHBOARD",
  "RC",
  "INSURANCE",
  "DAMAGE",
  "TRAILER_BODY",
  "LOAD_BODY",
  "HYDRAULIC_SYSTEM",
  "OTHER",
]);
const VALID_ASSET_STRUCTURES = new Set(["STANDALONE", "DETACHABLE", "EQUIPMENT"] as const);
const VALID_DETACHABLE_TYPES = new Set(["PRIME_MOVER", "TRAILER"] as const);
const VALID_LISTING_TYPES = new Set(["REGULAR", "REPO"] as const);
const VALID_LISTING_MODES = new Set(["NORMAL", "BULK"] as const);
const VALID_REPO_STATUSES = new Set([
  "Bank Seized",
  "Yard Stock",
  "Auction Live",
  "Auction Upcoming",
  "Ready For Sale",
  "Under Settlement",
] as const);
const VALID_LEGACY_VEHICLE_TYPES = new Set([
  "Mini Truck",
  "LCV (Light Commercial Vehicle)",
  "MCV (Medium Commercial Vehicle)",
  "HCV (Heavy Commercial Vehicle)",
  "Container Truck",
  "Tanker",
  "Truck",
  "Tipper",
  "Pickup",
  "Bus",
  "Trailer",
  "Tractor",
  "Equipment",
] as const);
const VALID_TRANSFER_TYPES = new Set(["RC_TRANSFER", "RTO_NOC", "OPEN_NOC", "UNKNOWN"] as const);
const VALID_AVAILABILITY_STATUSES = new Set(["AVAILABLE", "NOT_AVAILABLE", "UNKNOWN"] as const);
const VALID_KM_METER_STATUSES = new Set(["WORKING", "NOT_WORKING", "UNKNOWN"] as const);
const VALID_TYRE_MOUNT_STATUSES = new Set([
  "ON_DISC",
  "WITH_TYRES",
  "WITHOUT_DISC_AND_TYRES",
  "PARTIAL",
  "UNKNOWN",
] as const);
const VALID_TYRE_CONDITIONS = new Set(["NEW", "GOOD", "AROUND_50", "POOR", "MIXED", "UNKNOWN", "FAIR"] as const);
const VALID_ENGINE_CONDITIONS = new Set([
  "EXCELLENT",
  "GOOD",
  "AVERAGE",
  "NEEDS_WORK",
  "NOT_CHECKED",
  "UNKNOWN",
] as const);
const VALID_ROAD_SAFE_STATUSES = new Set(["ROAD_SAFE", "NOT_ROAD_SAFE", "UNKNOWN"] as const);
const LEGACY_RUNNING_CONDITION_MAP: Record<string, typeof vehicles.runningCondition._.data> = {
  RUNNING: "RUNNING",
  "NON-RUNNING": "NOT_RUNNING",
  NOT_RUNNING: "NOT_RUNNING",
  UNKNOWN: "UNKNOWN",
};

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
    const additionalPhotosRaw = Array.isArray(body.additionalPhotos) ? (body.additionalPhotos as unknown[]) : null;
    const videosRaw = Array.isArray(body.videos) ? (body.videos as unknown[]) : null;
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

    const numberOrNull = (value: unknown) => {
      const normalized = String(value ?? "").replace(/[^\d.-]/g, "");
      if (!normalized) return null;
      const parsed = Number(normalized);
      return Number.isFinite(parsed) ? parsed : null;
    };
    const normalizeRegNumber = (input: unknown) =>
      toSafeString(input)
        .toUpperCase()
        .replace(/[^A-Z0-9\s-]/g, "")
        .replace(/\s+/g, " ")
        .replace(/-+/g, "-")
        .trim();
    const yesNoUnknown = (value: unknown) => {
      const normalized = toSafeString(value).toUpperCase();
      if (normalized === "YES" || normalized === "NO" || normalized === "UNKNOWN") return normalized;
      return null;
    };
    const toUpperSnakeCase = (value: unknown) =>
      toSafeString(value)
        .toUpperCase()
        .replace(/\s+/g, "_");
    const parseOptionalUpperEnum = <T extends string>(value: unknown, allowed: Set<T>) => {
      const normalized = toSafeString(value).toUpperCase();
      if (!normalized) return null;
      return allowed.has(normalized as T) ? (normalized as T) : "__INVALID__";
    };
    const parseOptionalUpperSnakeEnum = <T extends string>(value: unknown, allowed: Set<T>) => {
      const normalized = toUpperSnakeCase(value);
      if (!normalized) return null;
      return allowed.has(normalized as T) ? (normalized as T) : "__INVALID__";
    };

    const assetStructureInput = "assetStructure" in body ? toSafeString(body.assetStructure).toUpperCase() : existing.assetStructure;
    if ("assetStructure" in body && !VALID_ASSET_STRUCTURES.has(assetStructureInput as (typeof vehicles.assetStructure._.data))) {
      return Response.json({ message: "Invalid assetStructure." }, { status: 400 });
    }
    const nextAssetStructure = assetStructureInput as typeof vehicles.assetStructure._.data;
    const detachableInput = "detachableType" in body ? toSafeString(body.detachableType).toUpperCase() : existing.detachableType;
    const normalizedDetachableType =
      nextAssetStructure === "DETACHABLE" && detachableInput && VALID_DETACHABLE_TYPES.has(detachableInput as (typeof vehicles.detachableType._.data))
        ? (detachableInput as typeof vehicles.detachableType._.data)
        : null;
    if (
      ("assetStructure" in body || "detachableType" in body) &&
      nextAssetStructure === "DETACHABLE" &&
      !normalizedDetachableType
    ) {
      return Response.json({ message: "Detachable type is required for detachable assets." }, { status: 400 });
    }

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
    if ("listingType" in body) {
      const value = toSafeString(body.listingType).toUpperCase();
      if (!VALID_LISTING_TYPES.has(value as typeof vehicles.listingType._.data)) {
        return Response.json({ message: "Invalid listingType." }, { status: 400 });
      }
      updates.listingType = value as typeof vehicles.listingType._.data;
    }
    if ("listingMode" in body) {
      const value = toSafeString(body.listingMode).toUpperCase();
      if (!VALID_LISTING_MODES.has(value as typeof vehicles.listingMode._.data)) {
        return Response.json({ message: "Invalid listingMode." }, { status: 400 });
      }
      updates.listingMode = value as typeof vehicles.listingMode._.data;
    }
    if ("assetConfiguration" in body) updates.assetConfiguration = toSafeString(body.assetConfiguration) as typeof vehicles.assetConfiguration._.data;
    if ("assetStructure" in body) updates.assetStructure = nextAssetStructure;
    if ("assetStructure" in body || "detachableType" in body) updates.detachableType = normalizedDetachableType;
    if ("assetCategory" in body) updates.assetCategory = toSafeString(body.assetCategory);
    if ("vehicleType" in body || "type" in body) {
      const rawLegacyType = toSafeString(body.vehicleType ?? body.type);
      if (rawLegacyType && VALID_LEGACY_VEHICLE_TYPES.has(rawLegacyType as typeof vehicles.type._.data)) {
        updates.type = rawLegacyType as typeof vehicles.type._.data;
      }
    }
    if ("bodyApplicationType" in body || "vehicleSubType" in body) {
      const value = toSafeString(body.bodyApplicationType ?? body.vehicleSubType);
      updates.bodyApplicationType = value || null;
      updates.vehicleSubType = value || null;
    }
    if ("brand" in body) updates.brand = toSafeString(body.brand);
    if ("model" in body) updates.model = toSafeString(body.model);
    if ("year" in body) updates.year = numberOrNull(body.year) ?? existing.year;
    if ("registrationState" in body) updates.registrationState = toSafeString(body.registrationState);
    if ("vehicleRegistrationNumber" in body) updates.vehicleRegistrationNumber = normalizeRegNumber(body.vehicleRegistrationNumber);
    if ("machineSerialNumber" in body) updates.machineSerialNumber = toSafeString(body.machineSerialNumber) || null;
    if ("kmDriven" in body) updates.kmDriven = numberOrNull(body.kmDriven);
    if ("kmMeterStatus" in body) {
      const value = parseOptionalUpperEnum(body.kmMeterStatus, VALID_KM_METER_STATUSES);
      if (value === "__INVALID__") {
        return Response.json({ message: "Invalid kmMeterStatus." }, { status: 400 });
      }
      if (value) updates.kmMeterStatus = value as typeof vehicles.kmMeterStatus._.data;
    }
    if ("runningCondition" in body || "condition" in body) {
      const raw = toSafeString(body.runningCondition ?? body.condition).toUpperCase();
      const value = raw ? (LEGACY_RUNNING_CONDITION_MAP[raw] ?? null) : "UNKNOWN";
      if (value === null) {
        return Response.json({ message: "Invalid runningCondition." }, { status: 400 });
      }
      updates.runningCondition = value;
      updates.condition = value === "RUNNING" ? "Running" : value === "NOT_RUNNING" ? "Non-running" : "Unknown";
    }
    if ("state" in body) updates.state = toSafeString(body.state);
    if ("city" in body) updates.city = toSafeString(body.city);
    if ("fuelType" in body) updates.fuelType = (toSafeString(body.fuelType) || "Diesel") as typeof vehicles.fuelType._.data;
    if ("bsNorm" in body) updates.bsNorm = toSafeString(body.bsNorm) || null;
    if ("transmission" in body) updates.transmission = toSafeString(body.transmission) || null;
    if ("axleConfiguration" in body) updates.axleConfiguration = toSafeString(body.axleConfiguration) || null;
    if ("horsepower" in body) updates.horsepower = numberOrNull(body.horsepower);
    if ("odometerReading" in body) updates.odometerReading = numberOrNull(body.odometerReading);
    if ("hourMeterReading" in body) updates.hourMeterReading = numberOrNull(body.hourMeterReading);
    if ("financeCompany" in body) updates.financeCompany = toSafeString(body.financeCompany);
    if ("repoStatus" in body) {
      const value = toSafeString(body.repoStatus);
      if (!value) {
        const effectiveListingType =
          ("listingType" in updates ? updates.listingType : existing.listingType) as typeof vehicles.listingType._.data;
        updates.repoStatus = effectiveListingType === "REGULAR" ? "Ready For Sale" : existing.repoStatus;
      } else if (!VALID_REPO_STATUSES.has(value as typeof vehicles.repoStatus._.data)) {
        return Response.json({ message: "Invalid repoStatus." }, { status: 400 });
      } else {
        updates.repoStatus = value as typeof vehicles.repoStatus._.data;
      }
    }
    if ("yardName" in body) updates.yardName = toSafeString(body.yardName);
    if ("yardContact" in body) updates.yardContact = toSafeString(body.yardContact);
    if ("reservePrice" in body) updates.reservePrice = String(numberOrNull(body.reservePrice) ?? 0);
    if ("numberOfAxles" in body) updates.numberOfAxles = numberOrNull(body.numberOfAxles);
    if ("bodyDimensions" in body) updates.bodyDimensions = toSafeString(body.bodyDimensions) || null;
    if ("trailerType" in body) updates.trailerType = toSafeString(body.trailerType) || null;
    if ("trailerLength" in body) updates.trailerLength = toSafeString(body.trailerLength) || null;
    if ("trailerManufacturer" in body) updates.trailerManufacturer = toSafeString(body.trailerManufacturer) || null;
    if ("trailerManufacturingMonthYear" in body) updates.trailerManufacturingMonthYear = toSafeString(body.trailerManufacturingMonthYear) || null;
    if ("suspensionType" in body) updates.suspensionType = toSafeString(body.suspensionType) || null;
    if ("tyreInspectionReport" in body) {
      const value = parseOptionalUpperEnum(body.tyreInspectionReport, VALID_AVAILABILITY_STATUSES);
      if (value === "__INVALID__") {
        return Response.json({ message: "Invalid tyreInspectionReport." }, { status: 400 });
      }
      updates.tyreInspectionReport = (value || null) as typeof vehicles.tyreInspectionReport._.data;
    }
    if ("totalTyres" in body || "tyreCount" in body) updates.totalTyres = numberOrNull(body.totalTyres ?? body.tyreCount);
    if ("tyreCount" in body || "totalTyres" in body) updates.tyreCount = numberOrNull(body.tyreCount ?? body.totalTyres);
    if ("currentTyreCount" in body) updates.currentTyreCount = numberOrNull(body.currentTyreCount);
    if ("tyreMountStatus" in body) {
      const value = parseOptionalUpperEnum(body.tyreMountStatus, VALID_TYRE_MOUNT_STATUSES);
      if (value === "__INVALID__") {
        return Response.json({ message: "Invalid tyreMountStatus." }, { status: 400 });
      }
      updates.tyreMountStatus = (value || null) as typeof vehicles.tyreMountStatus._.data;
    }
    if ("tyreCondition" in body) {
      const value = parseOptionalUpperEnum(body.tyreCondition, VALID_TYRE_CONDITIONS);
      if (value === "__INVALID__") {
        return Response.json({ message: "Invalid tyreCondition." }, { status: 400 });
      }
      updates.tyreCondition = (value || null) as typeof vehicles.tyreCondition._.data;
    }
    if ("trailerNumber" in body) updates.trailerNumber = toSafeString(body.trailerNumber);
    if ("bodyType" in body) updates.bodyType = toSafeString(body.bodyType) || null;
    if ("bodyLength" in body) updates.bodyLength = toSafeString(body.bodyLength) || null;
    if ("payloadCapacity" in body) updates.payloadCapacity = toSafeString(body.payloadCapacity) || null;
    if ("gvwTonnes" in body) updates.gvwTonnes = toSafeString(body.gvwTonnes);
    if ("bodyAttached" in body) updates.bodyAttached = yesNoUnknown(body.bodyAttached) as typeof vehicles.bodyAttached._.data;
    if ("bodyCondition" in body) updates.bodyCondition = toSafeString(body.bodyCondition) || null;
    if ("tyresIncluded" in body) updates.tyresIncluded = yesNoUnknown(body.tyresIncluded) as typeof vehicles.tyresIncluded._.data;
    if ("rimsDiscsIncluded" in body) updates.rimsDiscsIncluded = yesNoUnknown(body.rimsDiscsIncluded) as typeof vehicles.rimsDiscsIncluded._.data;
    if ("batteryIncluded" in body) updates.batteryIncluded = yesNoUnknown(body.batteryIncluded) as typeof vehicles.batteryIncluded._.data;
    if ("cabinAvailable" in body) updates.cabinAvailable = yesNoUnknown(body.cabinAvailable) as typeof vehicles.cabinAvailable._.data;
    if ("engineAvailable" in body) updates.engineAvailable = yesNoUnknown(body.engineAvailable) as typeof vehicles.engineAvailable._.data;
    if ("documentsAvailable" in body) updates.documentsAvailable = yesNoUnknown(body.documentsAvailable) as typeof vehicles.documentsAvailable._.data;
    if ("remarks" in body) updates.remarks = toSafeString(body.remarks) || null;
    if ("taxDue" in body) updates.taxDue = toSafeString(body.taxDue);
    if ("challans" in body) updates.challans = toSafeString(body.challans);
    if ("insuranceExpiry" in body) updates.insuranceExpiry = toSafeString(body.insuranceExpiry);
    if ("fitnessExpiry" in body) updates.fitnessExpiry = toSafeString(body.fitnessExpiry);
    if ("permitExpiry" in body) updates.permitExpiry = toSafeString(body.permitExpiry);
    if ("transferType" in body) {
      const value = parseOptionalUpperEnum(body.transferType, VALID_TRANSFER_TYPES);
      if (value === "__INVALID__") {
        return Response.json({ message: "Invalid transferType." }, { status: 400 });
      }
      updates.transferType = (value || null) as typeof vehicles.transferType._.data;
    }
    if ("nocStatus" in body) {
      const value = parseOptionalUpperEnum(body.nocStatus, VALID_AVAILABILITY_STATUSES);
      if (value === "__INVALID__") {
        return Response.json({ message: "Invalid nocStatus." }, { status: 400 });
      }
      updates.nocStatus = (value || null) as typeof vehicles.nocStatus._.data;
    }
    if ("engineNumber" in body) updates.engineNumber = toSafeString(body.engineNumber);
    if ("chassisNumber" in body) updates.chassisNumber = toSafeString(body.chassisNumber);
    if ("gpsInstalled" in body) updates.gpsInstalled = yesNoUnknown(body.gpsInstalled) as typeof vehicles.gpsInstalled._.data;
    if ("abs" in body) updates.abs = yesNoUnknown(body.abs) as typeof vehicles.abs._.data;
    if ("fleetManagementSoftwareAvailable" in body) {
      const value = parseOptionalUpperSnakeEnum(body.fleetManagementSoftwareAvailable, VALID_AVAILABILITY_STATUSES);
      if (value === "__INVALID__") {
        return Response.json({ message: "Invalid fleetManagementSoftwareAvailable." }, { status: 400 });
      }
      updates.fleetManagementSoftwareAvailable = (value || null) as typeof vehicles.fleetManagementSoftwareAvailable._.data;
    }
    if ("insuranceValidity" in body) updates.insuranceValidity = toSafeString(body.insuranceValidity) || null;
    if ("permitValidity" in body) updates.permitValidity = toSafeString(body.permitValidity) || null;
    if ("fitnessStatus" in body) updates.fitnessStatus = toSafeString(body.fitnessStatus) || null;
    if ("taxValidity" in body) updates.taxValidity = toSafeString(body.taxValidity) || null;
    if ("parkingDue" in body) updates.parkingDue = numberOrNull(body.parkingDue);
    if ("alternateContactNumber" in body) {
      updates.alternateContactNumber = toSafeString(body.alternateContactNumber).replace(/\D/g, "").slice(0, 10);
      updates.alternateContactNumberVerified = body.alternateContactNumberVerified === true;
    }
    if ("gstin" in body) updates.gstin = toSafeString(body.gstin);
    if ("engineCondition" in body) {
      const value = parseOptionalUpperSnakeEnum(body.engineCondition, VALID_ENGINE_CONDITIONS);
      if (value === "__INVALID__") {
        return Response.json({ message: "Invalid engineCondition." }, { status: 400 });
      }
      updates.engineCondition = (value || null) as typeof vehicles.engineCondition._.data;
    }
    if ("needsTowing" in body) updates.needsTowing = yesNoUnknown(body.needsTowing) as typeof vehicles.needsTowing._.data;
    if ("roadSafeStatus" in body) {
      const value = parseOptionalUpperSnakeEnum(body.roadSafeStatus, VALID_ROAD_SAFE_STATUSES);
      if (value === "__INVALID__") {
        return Response.json({ message: "Invalid roadSafeStatus." }, { status: 400 });
      }
      updates.roadSafeStatus = (value || null) as typeof vehicles.roadSafeStatus._.data;
    }

    const frontPhoto = sanitizeSupabaseMediaUrl(body.frontPhoto ?? existing.frontPhoto);
    const backPhoto = sanitizeSupabaseMediaUrl(body.backPhoto ?? existing.backPhoto);
    const leftSidePhoto = sanitizeSupabaseMediaUrl(body.leftSidePhoto ?? body.sidePhoto ?? existing.leftSidePhoto ?? existing.sidePhoto);
    const rightSidePhoto = sanitizeSupabaseMediaUrl(body.rightSidePhoto ?? existing.rightSidePhoto);
    const interiorPhoto = sanitizeSupabaseMediaUrl(body.interiorPhoto ?? existing.interiorPhoto);
    const normalizedRequiredPhotoCount = [frontPhoto, backPhoto, leftSidePhoto, rightSidePhoto, interiorPhoto].filter(Boolean).length;

    const parsedAdditionalPhotos =
      additionalPhotosRaw?.map((item) => {
        const current = item as Record<string, unknown>;
        const rawCategory = toSafeString(current.category).toUpperCase();
        const category = VALID_ADDITIONAL_PHOTO_CATEGORIES.has(rawCategory) ? rawCategory : "OTHER";
        return { url: sanitizeSupabaseMediaUrl(current.url), category };
      }).filter((item) => Boolean(item.url)) ?? [];

    const parsedVideos =
      videosRaw?.map((item) => {
        const current = item as Record<string, unknown>;
        const rawCategory = toSafeString(current.category).toUpperCase();
        const category = VALID_VIDEO_CATEGORIES.has(rawCategory) ? rawCategory : "OTHER";
        return {
          url: sanitizeSupabaseMediaUrl(current.url),
          category,
          mimeType: toSafeString(current.mimeType),
          sizeBytes: numberOrNull(current.sizeBytes),
        };
      }).filter((item) => Boolean(item.url)) ?? [];

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

    if (normalizedRequiredPhotoCount + parsedAdditionalPhotos.length > MAX_PHOTOS) {
      return Response.json({ message: "Maximum 20 photos allowed." }, { status: 400 });
    }
    if (parsedVideos.length > MAX_VIDEOS) {
      return Response.json({ message: "Maximum 3 videos allowed." }, { status: 400 });
    }
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

    const sentForReverification = existing.isPublished || existing.listingStatus === "VERIFIED";
    const forcePendingStatuses = new Set(["VERIFIED", "PENDING", "REJECTED", "BANK_PENDING_REVIEW"]);
    if (forcePendingStatuses.has(existing.listingStatus || "") || existing.isPublished) {
      updates.status = "PENDING";
      updates.listingStatus = "PENDING";
      updates.verificationStatus = "PENDING_VERIFICATION";
      updates.isPublished = false;
      updates.rejectionReason = "";
      updates.verifiedBy = null;
      updates.verifiedAt = null;
    }

    const mediaRows: Array<{
      vehicleId: string;
      type: typeof vehicleMedia.type._.data;
      category: typeof vehicleMedia.category._.data;
      url: string;
      mimeType: string;
      sizeBytes: number | null;
      customName: string | null;
      originalFileName: string;
    }> = [];

    if (frontPhoto) mediaRows.push({ vehicleId: id, type: "PHOTO", category: "FRONT", url: frontPhoto, mimeType: "", sizeBytes: null, customName: null, originalFileName: "" });
    if (backPhoto) mediaRows.push({ vehicleId: id, type: "PHOTO", category: "BACK", url: backPhoto, mimeType: "", sizeBytes: null, customName: null, originalFileName: "" });
    if (leftSidePhoto) mediaRows.push({ vehicleId: id, type: "PHOTO", category: "LEFT_SIDE", url: leftSidePhoto, mimeType: "", sizeBytes: null, customName: null, originalFileName: "" });
    if (rightSidePhoto) mediaRows.push({ vehicleId: id, type: "PHOTO", category: "RIGHT_SIDE", url: rightSidePhoto, mimeType: "", sizeBytes: null, customName: null, originalFileName: "" });
    if (leftSidePhoto) mediaRows.push({ vehicleId: id, type: "PHOTO", category: "SIDE", url: leftSidePhoto, mimeType: "", sizeBytes: null, customName: null, originalFileName: "" });
    if (interiorPhoto) mediaRows.push({ vehicleId: id, type: "PHOTO", category: "INTERIOR", url: interiorPhoto, mimeType: "", sizeBytes: null, customName: null, originalFileName: "" });
    for (const photo of parsedAdditionalPhotos) {
      mediaRows.push({
        vehicleId: id,
        type: "PHOTO",
        category: photo.category as typeof vehicleMedia.category._.data,
        url: photo.url,
        mimeType: "",
        sizeBytes: null,
        customName: null,
        originalFileName: "",
      });
    }
    for (const video of parsedVideos) {
      mediaRows.push({
        vehicleId: id,
        type: "VIDEO",
        category: video.category as typeof vehicleMedia.category._.data,
        url: video.url,
        mimeType: video.mimeType || "",
        sizeBytes: video.sizeBytes,
        customName: null,
        originalFileName: "",
      });
    }
    for (const document of parsedDocuments ?? []) {
      mediaRows.push({
        vehicleId: id,
        type: "DOCUMENT",
        category: document.category,
        url: document.url,
        mimeType: document.mimeType || "application/pdf",
        sizeBytes: document.sizeBytes ?? null,
        customName: document.category === "OTHER" ? document.customName || null : null,
        originalFileName: document.originalFileName || "",
      });
    }

    updates.frontPhoto = frontPhoto;
    updates.backPhoto = backPhoto;
    updates.leftSidePhoto = leftSidePhoto;
    updates.rightSidePhoto = rightSidePhoto;
    updates.sidePhoto = leftSidePhoto;
    updates.interiorPhoto = interiorPhoto;
    updates.gallery = sanitizeSupabaseMediaArray([
      ...[frontPhoto, backPhoto, leftSidePhoto, rightSidePhoto, interiorPhoto].filter(Boolean),
      ...parsedAdditionalPhotos.map((item) => item.url),
    ]);
    updates.image = frontPhoto || backPhoto || leftSidePhoto || rightSidePhoto || interiorPhoto || existing.image;
    updates.walkaroundVideo = parsedVideos.find((item) => item.category === "WALKAROUND")?.url || null;
    updates.engineStartUpVideo = parsedVideos.find((item) => item.category === "ENGINE_STARTUP")?.url || null;

    const [updated] = await db.update(vehicles).set(updates).where(eq(vehicles.id, id)).returning();

    if (documentsRaw || additionalPhotosRaw || videosRaw || "frontPhoto" in body || "backPhoto" in body || "leftSidePhoto" in body || "rightSidePhoto" in body || "interiorPhoto" in body || "sidePhoto" in body) {
      await db
        .delete(vehicleMedia)
        .where(and(eq(vehicleMedia.vehicleId, id), inArray(vehicleMedia.type, ["PHOTO", "VIDEO", "DOCUMENT"])));
      if (mediaRows.length) await db.insert(vehicleMedia).values(mediaRows);
    }

    return Response.json({
      vehicle: updated,
      message: sentForReverification
        ? "Your edited listing has been sent for re-verification."
        : "Listing updated successfully.",
      sentForReverification,
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
