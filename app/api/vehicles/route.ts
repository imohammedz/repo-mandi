import { db } from "@/lib/db";
import { vehicleMedia, vehicles, platformSettings } from "@/lib/schema";
import { eq, ilike, and, or, desc, gte, lte } from "drizzle-orm";
import { nanoid } from "./nanoid";
import { getCurrentUser } from "@/lib/auth";
import { sanitizeSupabaseMediaArray, sanitizeSupabaseMediaUrl, shouldLogMediaDebug } from "@/lib/media";
import {
  ASSET_STRUCTURE_VALUES,
  LEGACY_ASSET_CONFIGURATION_VALUES,
  LISTING_MODE_VALUES,
  getAssetCategoryOptions,
  getBodyApplicationOptions,
  hasEngineOrPowertrain,
  normalizeClassification,
  normalizeListingMode,
  toLegacyAssetConfiguration,
  toLegacyVehicleType,
  type AssetStructure,
  type ListingMode,
} from "@/lib/vehicle-classification";

export const runtime = "nodejs";

const VALID_TYPES = [
  "Mini Truck",
  "Pickup",
  "LCV (Light Commercial Vehicle)",
  "MCV (Medium Commercial Vehicle)",
  "HCV (Heavy Commercial Vehicle)",
  "Trailer",
  "Tanker",
  "Container Truck",
  "Tipper",
  "Bus",
  // Backward compatibility
  "Truck",
  "Tractor",
] as const;
type VehicleType = (typeof VALID_TYPES)[number];

const VALID_LISTING_TYPES = ["REGULAR", "REPO"] as const;
type ListingType = (typeof VALID_LISTING_TYPES)[number];

const VALID_LISTING_MODES = LISTING_MODE_VALUES;
const VALID_ASSET_CONFIGURATIONS = LEGACY_ASSET_CONFIGURATION_VALUES;
type AssetConfiguration = (typeof VALID_ASSET_CONFIGURATIONS)[number];

const VALID_KM_METER_STATUS = ["WORKING", "NOT_WORKING", "UNKNOWN"] as const;
type KmMeterStatus = (typeof VALID_KM_METER_STATUS)[number];

const VALID_RUNNING_CONDITIONS = ["RUNNING", "NOT_RUNNING", "UNKNOWN"] as const;
type RunningCondition = (typeof VALID_RUNNING_CONDITIONS)[number];
const VALID_AVAILABILITY_STATUS = ["AVAILABLE", "NOT_AVAILABLE", "UNKNOWN"] as const;

const VALID_REPO_STATUS = [
  "Bank Seized",
  "Yard Stock",
  "Auction Live",
  "Auction Upcoming",
  "Ready For Sale",
  "Under Settlement",
] as const;

const LEGACY_RUNNING_MAP: Record<string, RunningCondition> = {
  Running: "RUNNING",
  "Non-running": "NOT_RUNNING",
  "Not Running": "NOT_RUNNING",
  Unknown: "UNKNOWN",
};

const MIN_REASONABLE_PRICE = 100000; // INR threshold for low-price risk flagging in admin review.
const MIN_VEHICLE_YEAR = 2000;
const MAX_PHOTOS = 20;

// Categories sellers can assign to additional (non-required) photos.
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

function normalizeRegNumber(input: string) {
  return input
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9\s-]/g, "")
    .replace(/\s+/g, " ")
    .replace(/-+/g, "-");
}

function regNumberLooksValid(value: string) {
  // Format (loose): 2 letters (state) + 1-2 digits + 1-3 letters + 1-4 digits, with optional separators.
  return /^[A-Z]{2}[ -]?\d{1,2}[ -]?[A-Z]{1,3}[ -]?\d{1,4}$/.test(value);
}

function toNumberOrNull(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  const asNumber = Number(String(value).replace(/,/g, ""));
  return Number.isFinite(asNumber) ? asNumber : null;
}

function toSafeString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function parseRunningCondition(value: unknown): RunningCondition {
  const normalized = toSafeString(value);
  if (VALID_RUNNING_CONDITIONS.includes(normalized as RunningCondition)) {
    return normalized as RunningCondition;
  }
  return LEGACY_RUNNING_MAP[normalized] ?? "UNKNOWN";
}

function parseBoolean(value: unknown) {
  if (typeof value === "boolean") return value;
  const normalized = toSafeString(value).toUpperCase();
  if (["YES", "TRUE", "1"].includes(normalized)) return true;
  if (["NO", "FALSE", "0"].includes(normalized)) return false;
  return null;
}

function parseYesNoUnknown(value: unknown) {
  const normalized = toSafeString(value).toUpperCase();
  if (["YES", "NO", "UNKNOWN"].includes(normalized)) {
    return normalized as "YES" | "NO" | "UNKNOWN";
  }
  return null;
}

// ── GET /api/vehicles?type=&state=&q= ─────────────────────────────────────────
export async function GET(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    const url = new URL(request.url);
    const typeParam = url.searchParams.get("type");
    const state = url.searchParams.get("state") ?? url.searchParams.get("registrationState");
    const query = url.searchParams.get("q");
    const city = url.searchParams.get("city");
    const brand = url.searchParams.get("brand");
    const financeCompany = url.searchParams.get("financeCompany");
    const listingType = url.searchParams.get("listingType");
    const listingMode = url.searchParams.get("listingMode");
    const assetStructure = url.searchParams.get("assetStructure");
    const assetConfiguration = url.searchParams.get("assetConfiguration");
    const mine = url.searchParams.get("mine") === "1";
    const includeAll = url.searchParams.get("includeAll") === "1";
    const verifiedOnly = url.searchParams.get("verifiedOnly") === "1";
    const minPrice = url.searchParams.get("minPrice");
    const maxPrice = url.searchParams.get("maxPrice");

    if (typeParam && !VALID_TYPES.includes(typeParam as VehicleType)) {
      return Response.json(
        { message: `type must be one of: ${VALID_TYPES.join(", ")}.` },
        { status: 400 }
      );
    }

    if (listingType && !VALID_LISTING_TYPES.includes(listingType as ListingType)) {
      return Response.json(
        { message: `listingType must be one of: ${VALID_LISTING_TYPES.join(", ")}.` },
        { status: 400 }
      );
    }

    if (listingMode && !VALID_LISTING_MODES.includes(listingMode as ListingMode)) {
      return Response.json(
        { message: `listingMode must be one of: ${VALID_LISTING_MODES.join(", ")}.` },
        { status: 400 }
      );
    }

    if (assetStructure && !ASSET_STRUCTURE_VALUES.includes(assetStructure as AssetStructure)) {
      return Response.json(
        { message: `assetStructure must be one of: ${ASSET_STRUCTURE_VALUES.join(", ")}.` },
        { status: 400 }
      );
    }

    if (assetConfiguration && !VALID_ASSET_CONFIGURATIONS.includes(assetConfiguration as AssetConfiguration)) {
      return Response.json(
        { message: `assetConfiguration must be one of: ${VALID_ASSET_CONFIGURATIONS.join(", ")}.` },
        { status: 400 }
      );
    }

    const type = typeParam as VehicleType | null;
    const conditions = [];

    const isAdmin = currentUser?.accountType === "ADMIN";
    const shouldApplyPublicGate = !(isAdmin && includeAll) && !mine;
    if (shouldApplyPublicGate) {
      conditions.push(eq(vehicles.isPublished, true));
      conditions.push(eq(vehicles.listingStatus, "VERIFIED"));
    }

    if (mine) {
      if (!currentUser || !["SELLER", "BANK_PARTNER", "ADMIN"].includes(currentUser.accountType)) {
        return Response.json({ message: "Unauthorized." }, { status: 401 });
      }
      conditions.push(eq(vehicles.sellerId, currentUser.id));
    }

    if (type) conditions.push(eq(vehicles.type, type));
    if (listingType) conditions.push(eq(vehicles.listingType, listingType as ListingType));
    if (listingMode) conditions.push(eq(vehicles.listingMode, listingMode as ListingMode));
    if (assetStructure) conditions.push(eq(vehicles.assetStructure, assetStructure as AssetStructure));
    if (assetConfiguration) conditions.push(eq(vehicles.assetConfiguration, assetConfiguration as AssetConfiguration));
    if (state) conditions.push(eq(vehicles.state, state));
    if (city) conditions.push(ilike(vehicles.city, `%${city}%`));
    if (brand) conditions.push(ilike(vehicles.brand, `%${brand}%`));
    if (financeCompany) conditions.push(ilike(vehicles.financeCompany, `%${financeCompany}%`));
    if (verifiedOnly) conditions.push(eq(vehicles.sellerVerified, true));
    if (minPrice) conditions.push(gte(vehicles.price, minPrice));
    if (maxPrice) conditions.push(lte(vehicles.price, maxPrice));
    if (query) {
      conditions.push(
        or(
          ilike(vehicles.title, `%${query}%`),
          ilike(vehicles.brand, `%${query}%`),
          ilike(vehicles.model, `%${query}%`),
          ilike(vehicles.city, `%${query}%`),
          ilike(vehicles.vehicleOrYardLocation, `%${query}%`)
        )
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    const rows = whereClause
      ? await db.select().from(vehicles).where(whereClause).orderBy(desc(vehicles.createdAt))
      : await db.select().from(vehicles).orderBy(desc(vehicles.createdAt));

    const normalizedRows = rows.map((row) => ({
      ...row,
      image: sanitizeSupabaseMediaUrl(row.image),
      gallery: sanitizeSupabaseMediaArray(row.gallery),
      frontPhoto: sanitizeSupabaseMediaUrl(row.frontPhoto),
      backPhoto: sanitizeSupabaseMediaUrl(row.backPhoto),
      sidePhoto: sanitizeSupabaseMediaUrl(row.sidePhoto),
      interiorPhoto: sanitizeSupabaseMediaUrl(row.interiorPhoto),
      walkaroundVideo: sanitizeSupabaseMediaUrl(row.walkaroundVideo) || null,
      engineStartUpVideo: sanitizeSupabaseMediaUrl(row.engineStartUpVideo) || null,
    }));

    return Response.json(normalizedRows);
  } catch (error) {
    console.error("GET /api/vehicles failed", error);
    return Response.json({ message: "Failed to fetch vehicles." }, { status: 500 });
  }
}

// ── POST /api/vehicles ────────────────────────────────────────────────────────
export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return Response.json({ message: "Unauthorized." }, { status: 401 });
    }

    if (currentUser.accountType === "BUYER") {
      return Response.json({ message: "Buyers cannot submit listings." }, { status: 403 });
    }

    if (!["SELLER", "BANK_PARTNER", "ADMIN"].includes(currentUser.accountType)) {
      return Response.json({ message: "Only sellers or bank partners can post listings." }, { status: 403 });
    }

    if (!currentUser.isProfileComplete) {
      return Response.json({ message: "Complete your profile before posting." }, { status: 403 });
    }

    const body = (await request.json()) as Record<string, unknown>;

    const listingTypeRaw = toSafeString(body.listingType);
    if (!listingTypeRaw) {
      return Response.json({ message: "listingType is required." }, { status: 400 });
    }
    const listingType = listingTypeRaw as ListingType;
    if (!VALID_LISTING_TYPES.includes(listingType)) {
      return Response.json({ message: "Invalid listing type." }, { status: 400 });
    }

    const listingMode = normalizeListingMode(toSafeString(body.listingMode));
    if (!VALID_LISTING_MODES.includes(listingMode)) {
      return Response.json({ message: "Invalid listing mode." }, { status: 400 });
    }
    if (listingMode === "BULK") {
      return Response.json(
        { message: "Bulk lot listings are coming soon. Contact RepoMandi to list multiple vehicles." },
        { status: 400 }
      );
    }

    const sellerRole = currentUser.sellerRole ?? "";
    const canCreateRepo =
      currentUser.accountType === "BANK_PARTNER" ||
      currentUser.accountType === "ADMIN" ||
      sellerRole === "BROKER" ||
      sellerRole === "RECOVERY_AGENT";
    const canCreateRegular =
      currentUser.accountType !== "BANK_PARTNER" && sellerRole !== "RECOVERY_AGENT";

    if (listingType === "REPO" && !canCreateRepo) {
      return Response.json({ message: "Your role can only create regular listings." }, { status: 403 });
    }
    if (listingType === "REGULAR" && !canCreateRegular) {
      return Response.json({ message: "Your role can only create repo listings." }, { status: 403 });
    }

    const legacyAssetConfigurationInput = toSafeString(body.assetConfiguration);
    if (
      legacyAssetConfigurationInput &&
      !VALID_ASSET_CONFIGURATIONS.includes(legacyAssetConfigurationInput as AssetConfiguration)
    ) {
      return Response.json({ message: "Invalid assetConfiguration." }, { status: 400 });
    }

    const classification = normalizeClassification({
      assetStructure: toSafeString(body.assetStructure),
      detachableType: toSafeString(body.detachableType),
      assetConfiguration: legacyAssetConfigurationInput,
    });
    const assetStructure = classification.assetStructure;
    const detachableType = classification.detachableType;
    const assetConfiguration = toLegacyAssetConfiguration(assetStructure, detachableType);
    const poweredAsset = hasEngineOrPowertrain({
      assetStructure,
      detachableType,
    });
    const isTrailerAsset = assetStructure === "DETACHABLE" && detachableType === "TRAILER";

    const assetCategory = toSafeString(body.assetCategory || body.vehicleType || body.type);
    const bodyApplicationType = toSafeString(
      body.bodyApplicationType || body.vehicleSubType || body.bodyType
    );
    if (!assetCategory) {
      return Response.json({ message: "assetCategory is required." }, { status: 400 });
    }
    if (!getAssetCategoryOptions(assetStructure, detachableType).includes(assetCategory)) {
      return Response.json({ message: "Invalid assetCategory." }, { status: 400 });
    }
    if (
      bodyApplicationType &&
      !getBodyApplicationOptions(assetStructure, detachableType).includes(bodyApplicationType)
    ) {
      return Response.json({ message: "Invalid bodyApplicationType." }, { status: 400 });
    }

    const vehicleType = toLegacyVehicleType(assetCategory, assetStructure, detachableType) as VehicleType;
    const brand = toSafeString(body.brand);
    const model = toSafeString(body.model);
    const registrationState = toSafeString(body.registrationState);
    const isRegistered = parseBoolean(body.isRegistered);
    // Step 4 only captures a single free-form location in MVP1.
    // Keep legacy state/city columns populated for backward compatibility with
    // existing schema consumers and filters while UI uses vehicleOrYardLocation.
    // These may still be empty when both request and profile lack values.
    const state = toSafeString(body.state) || toSafeString(currentUser.state);
    const city = toSafeString(body.city) || toSafeString(currentUser.city);
    const location = toSafeString(body.vehicleOrYardLocation || body.yardLocation);
    const conditionNotes = toSafeString(body.conditionNotes);
    const frontPhoto = sanitizeSupabaseMediaUrl(body.frontPhoto);
    const backPhoto = sanitizeSupabaseMediaUrl(body.backPhoto);
    const sidePhoto = sanitizeSupabaseMediaUrl(body.sidePhoto);
    const interiorPhoto = sanitizeSupabaseMediaUrl(body.interiorPhoto);
    const additionalPhotosRaw = Array.isArray(body.additionalPhotos) ? (body.additionalPhotos as unknown[]) : [];
    const walkaroundVideo = sanitizeSupabaseMediaUrl(body.walkaroundVideo);
    const engineStartUpVideo = sanitizeSupabaseMediaUrl(body.engineStartUpVideo ?? body.engineStartupVideo);
    const registrationNumber = normalizeRegNumber(toSafeString(body.vehicleRegistrationNumber));

    const providedYear = Number(body.year);
    const year = Number.isInteger(providedYear) ? providedYear : null;
    const expectedPrice = toNumberOrNull(body.expectedPrice ?? body.price);
    const kmMeterStatus = (toSafeString(body.kmMeterStatus) || "UNKNOWN") as KmMeterStatus;
    const runningCondition = parseRunningCondition(body.runningCondition ?? body.condition);
    const kmDriven = toNumberOrNull(body.kmDriven);
    // Keep odometer aligned with KM Driven when only the Step 3 field is supplied.
    const odometerReading = toNumberOrNull(body.odometerReading ?? body.kmDriven);
    const hourMeterReading = toNumberOrNull(body.hourMeterReading);
    const trailerType = toSafeString(body.trailerType);
    const trailerLength = toSafeString(body.trailerLength);
    const numberOfAxles = toNumberOrNull(body.numberOfAxles);
    const bodyDimensions = toSafeString(body.bodyDimensions);
    const suspensionType = toSafeString(body.suspensionType);
    const abs = toSafeString(body.abs).toUpperCase() as "YES" | "NO" | "UNKNOWN" | "";
    const tyreInspectionReport = toSafeString(body.tyreInspectionReport).toUpperCase();
    const requiresInteriorPhoto = false;
    const normalizedInteriorPhoto = interiorPhoto;

    const financeCompany = toSafeString(body.financeCompany);
    const repoStatus = toSafeString(body.repoStatus || "Ready For Sale");
    const yardName = toSafeString(body.yardName);
    const yardContact = toSafeString(body.yardContact);
    const machineSerialNumber = toSafeString(body.machineSerialNumber);

    const alwaysRequiredMissing: string[] = [];
    if (!listingMode) alwaysRequiredMissing.push("listingMode");
    if (!assetStructure) alwaysRequiredMissing.push("assetStructure");
    if (assetStructure === "DETACHABLE" && !detachableType) alwaysRequiredMissing.push("detachableType");
    if (!assetCategory) alwaysRequiredMissing.push("assetCategory");
    if ((assetStructure === "STANDALONE" || detachableType === "PRIME_MOVER" || assetStructure === "EQUIPMENT") && !brand) {
      alwaysRequiredMissing.push("brand");
    }
    if ((assetStructure === "STANDALONE" || detachableType === "PRIME_MOVER" || assetStructure === "EQUIPMENT") && !model) {
      alwaysRequiredMissing.push("model");
    }
    if (!year) alwaysRequiredMissing.push("year");
    if (assetStructure === "STANDALONE" && isRegistered === null) alwaysRequiredMissing.push("isRegistered");
    if ((assetStructure === "STANDALONE" || detachableType === "PRIME_MOVER") && !registrationState) {
      alwaysRequiredMissing.push("registrationState");
    }
    if (detachableType === "PRIME_MOVER" && !registrationNumber) {
      alwaysRequiredMissing.push("vehicleRegistrationNumber");
    }
    if (assetStructure === "STANDALONE" && isRegistered && !registrationNumber) {
      alwaysRequiredMissing.push("vehicleRegistrationNumber");
    }
    if (poweredAsset && !kmMeterStatus) alwaysRequiredMissing.push("kmMeterStatus");
    if (poweredAsset && !runningCondition) alwaysRequiredMissing.push("runningCondition");
    if (isTrailerAsset && !trailerType) alwaysRequiredMissing.push("trailerType");
    if (isTrailerAsset && !trailerLength) alwaysRequiredMissing.push("trailerLength");
    if (isTrailerAsset && numberOfAxles === null) alwaysRequiredMissing.push("numberOfAxles");
    if (expectedPrice === null) alwaysRequiredMissing.push("expectedPrice");
    // vehicleOrYardLocation remains a strict required field in MVP1.
    if (!location) alwaysRequiredMissing.push("vehicleOrYardLocation");
    if (!conditionNotes) alwaysRequiredMissing.push("conditionNotes");
    if (!frontPhoto) alwaysRequiredMissing.push("frontPhoto");
    if (!backPhoto) alwaysRequiredMissing.push("backPhoto");
    if (!sidePhoto) alwaysRequiredMissing.push("sidePhoto");
    if (requiresInteriorPhoto && !normalizedInteriorPhoto) alwaysRequiredMissing.push("interiorPhoto");

    if (alwaysRequiredMissing.length > 0) {
      return Response.json(
        { message: `Missing required fields: ${alwaysRequiredMissing.join(", ")}.` },
        { status: 400 }
      );
    }

    // Validate and cap additional photos.
    const additionalPhotoItems = additionalPhotosRaw
      .map((item) => {
        const it = item as Record<string, unknown>;
        return {
          url: sanitizeSupabaseMediaUrl(it?.url),
          category: toSafeString(it?.category),
        };
      })
      .filter((item) => Boolean(item.url))
      .slice(0, MAX_PHOTOS);

    const requiredPhotoCount = [frontPhoto, backPhoto, sidePhoto, normalizedInteriorPhoto].filter(Boolean).length;
    if (requiredPhotoCount + additionalPhotoItems.length > MAX_PHOTOS) {
      return Response.json({ message: `Maximum ${MAX_PHOTOS} photos allowed.` }, { status: 400 });
    }

    if (!VALID_TYPES.includes(vehicleType)) {
      return Response.json({ message: "Invalid vehicleType." }, { status: 400 });
    }

    if (!VALID_KM_METER_STATUS.includes(kmMeterStatus)) {
      return Response.json({ message: "Invalid kmMeterStatus." }, { status: 400 });
    }

    if (!VALID_RUNNING_CONDITIONS.includes(runningCondition)) {
      return Response.json({ message: "Invalid runningCondition." }, { status: 400 });
    }

    if ((detachableType === "PRIME_MOVER" || (assetStructure === "STANDALONE" && isRegistered)) && !regNumberLooksValid(registrationNumber)) {
      return Response.json(
        { message: "Invalid vehicleRegistrationNumber format. Example: MH-12-AB-1234." },
        { status: 400 }
      );
    }

    const currentYear = new Date().getFullYear();
    if (year === null || year < MIN_VEHICLE_YEAR || year > currentYear) {
      return Response.json({ message: `Year must be between ${MIN_VEHICLE_YEAR} and current year.` }, { status: 400 });
    }
    const normalizedYear = year ?? currentYear;

    if (expectedPrice === null || expectedPrice <= 0) {
      return Response.json({ message: "expectedPrice must be a positive number." }, { status: 400 });
    }

    if (poweredAsset && kmMeterStatus === "WORKING" && (kmDriven === null || kmDriven < 0)) {
      return Response.json({ message: "kmDriven is required when km meter is working." }, { status: 400 });
    }

    if (tyreInspectionReport && !VALID_AVAILABILITY_STATUS.includes(tyreInspectionReport as (typeof VALID_AVAILABILITY_STATUS)[number])) {
      return Response.json({ message: "Invalid tyreInspectionReport." }, { status: 400 });
    }

    if (listingType === "REPO") {
      if (!financeCompany || !repoStatus || !yardName || !yardContact) {
        return Response.json({ message: "financeCompany, repoStatus, yardName, and yardContact are required for repo listings." }, { status: 400 });
      }
      if (!VALID_REPO_STATUS.includes(repoStatus as (typeof VALID_REPO_STATUS)[number])) {
        return Response.json({ message: "Invalid repoStatus." }, { status: 400 });
      }
    }

    const title = [assetCategory, bodyApplicationType, brand, model, normalizedYear]
      .filter(Boolean)
      .join(" ");
    const id = nanoid(title, brand, model, normalizedYear);

    const gallery = sanitizeSupabaseMediaArray([
      frontPhoto,
      backPhoto,
      sidePhoto,
      normalizedInteriorPhoto,
      ...additionalPhotoItems.map((p) => p.url),
    ]);

    // Check auto-approval setting
    const [autoApproveRow] = await db
      .select()
      .from(platformSettings)
      .where(eq(platformSettings.key, "AUTO_APPROVE_LISTINGS"));
    const autoApprove = autoApproveRow?.value === "true";
    const now = new Date();

    const [inserted] = await db
      .insert(vehicles)
      .values({
        id,
        sellerId: currentUser.id,
        createdByUserId: currentUser.id,
        listingType,
        listingMode,
        assetConfiguration,
        assetStructure,
        detachableType,
        status: autoApprove ? "VERIFIED" : "PENDING",
        title,
        type: vehicleType,
        assetCategory,
        vehicleSubType: bodyApplicationType || null,
        bodyApplicationType: bodyApplicationType || null,
        brand,
        model,
        year: normalizedYear,
        isRegistered,
        vehicleRegistrationNumber: registrationNumber,
        registrationState,
        kmMeterStatus,
        kmDriven: poweredAsset && kmMeterStatus === "WORKING" ? kmDriven : null,
        runningCondition: poweredAsset ? runningCondition : "UNKNOWN",
        fuelType: "Diesel",
        bsNorm: toSafeString(body.bsNorm) || null,
        transmission: toSafeString(body.transmission) || null,
        axleConfiguration: toSafeString(body.axleConfiguration) || null,
        horsepower: toNumberOrNull(body.horsepower),
        odometerReading,
        hourMeterReading,
        numberOfAxles,
        bodyType: toSafeString(body.bodyType) || null,
        bodyLength: toSafeString(body.bodyLength) || null,
        bodyDimensions: bodyDimensions || null,
        payloadCapacity: toSafeString(body.payloadCapacity) || null,
        bodyAttached: parseYesNoUnknown(body.bodyAttached),
        bodyCondition: toSafeString(body.bodyCondition) || null,
        trailerType: trailerType || null,
        trailerLength: trailerLength || null,
        trailerManufacturer: toSafeString(body.trailerManufacturer) || null,
        trailerManufacturingMonthYear: toSafeString(body.trailerManufacturingMonthYear) || null,
        suspensionType: suspensionType || null,
        tyreInspectionReport: (tyreInspectionReport || null) as "AVAILABLE" | "NOT_AVAILABLE" | "UNKNOWN" | null,
        tyreCount: toNumberOrNull(body.tyreCount),
        currentTyreCount: toNumberOrNull(body.currentTyreCount),
        tyreCondition: (toSafeString(body.tyreCondition)
          .toUpperCase()
          .replace(/%/g, "")
          .replace(/\s+/g, "_") || null) as
          | "NEW"
          | "GOOD"
          | "FAIR"
          | "AROUND_50"
          | "POOR"
          | "MIXED"
          | "UNKNOWN"
          | null,
        city,
        state,
        vehicleOrYardLocation: location,
        image: frontPhoto,
        gallery,
        frontPhoto,
        backPhoto,
        sidePhoto,
        interiorPhoto: normalizedInteriorPhoto,
        walkaroundVideo: walkaroundVideo || null,
        engineStartUpVideo: engineStartUpVideo || null,
        financeCompany: listingType === "REPO" ? financeCompany : "",
        bankInstitutionName:
          currentUser.accountType === "BANK_PARTNER" ? currentUser.institutionName : "",
        branchName: currentUser.accountType === "BANK_PARTNER" ? currentUser.branchName : "",
        price: String(expectedPrice),
        expectedPrice: String(expectedPrice),
        reservePrice: body.reservePrice ? String(toNumberOrNull(body.reservePrice) ?? 0) : "0",
        repoStatus:
          listingType === "REPO"
            ? (repoStatus as typeof vehicles.repoStatus._.data)
            : "Ready For Sale",
        sellerType:
          currentUser.accountType === "BANK_PARTNER"
            ? "Bank Agent"
            : ((toSafeString(body.sellerType) || "Yard Partner") as typeof vehicles.sellerType._.data),
        sellerName: currentUser.fullName,
        sellerRole: currentUser.sellerRole || currentUser.bankRole || "",
        sellerPhone: currentUser.phone,
        alternateContactNumber: toSafeString(body.alternateContactNumber),
        businessName: currentUser.businessName,
        gstin: toSafeString(body.gstin),
        condition: runningCondition === "RUNNING" ? "Running" : runningCondition === "NOT_RUNNING" ? "Non-running" : "Unknown",
        conditionNotes,
        engineCondition: (toSafeString(body.engineCondition).toUpperCase().replace(/\s+/g, "_") || null) as
          | "GOOD"
          | "AVERAGE"
          | "NEEDS_WORK"
          | "NOT_CHECKED"
          | "UNKNOWN"
          | null,
        needsTowing: (toSafeString(body.needsTowing).toUpperCase() || null) as "YES" | "NO" | "UNKNOWN" | null,
        roadSafeStatus: (toSafeString(body.roadSafeStatus).toUpperCase().replace(/\s+/g, "_") || null) as
          | "ROAD_SAFE"
          | "NOT_ROAD_SAFE"
          | "UNKNOWN"
          | null,
        accidentNotes: toSafeString(body.accidentNotes),
        auctionDate: toSafeString(body.auctionDate),
        yardName: listingType === "REPO" ? yardName : "",
        yardContact,
        yardLocation: location,
        taxDue: toSafeString(body.taxDue),
        challans: toSafeString(body.challans),
        insuranceExpiry: toSafeString(body.insuranceExpiry),
        fitnessExpiry: toSafeString(body.fitnessExpiry),
        permitExpiry: toSafeString(body.permitExpiry),
        nocStatus: (toSafeString(body.nocStatus).toUpperCase().replace(/\s+/g, "_") || null) as
          | "AVAILABLE"
          | "NOT_AVAILABLE"
          | "UNKNOWN"
          | null,
        machineSerialNumber: machineSerialNumber || null,
        engineNumber: toSafeString(body.engineNumber),
        chassisNumber: toSafeString(body.chassisNumber),
        trailerNumber: toSafeString(body.trailerNumber),
        gvwTonnes: toSafeString(body.gvwTonnes),
        gpsInstalled: (toSafeString(body.gpsInstalled).toUpperCase() || null) as "YES" | "NO" | "UNKNOWN" | null,
        abs: (abs || null) as "YES" | "NO" | "UNKNOWN" | null,
        batteryAvailable: parseYesNoUnknown(body.batteryAvailable),
        keyAvailable: parseYesNoUnknown(body.keyAvailable),
        tyresIncluded: parseYesNoUnknown(body.tyresIncluded),
        rimsDiscsIncluded: parseYesNoUnknown(body.rimsDiscsIncluded),
        batteryIncluded: parseYesNoUnknown(body.batteryIncluded),
        cabinAvailable: parseYesNoUnknown(body.cabinAvailable),
        engineAvailable: parseYesNoUnknown(body.engineAvailable),
        documentsAvailable: parseYesNoUnknown(body.documentsAvailable),
        remarks: toSafeString(body.remarks) || null,
        fleetManagementSoftwareAvailable: (toSafeString(body.fleetManagementSoftwareAvailable).toUpperCase().replace(/\s+/g, "_") || null) as
          | "AVAILABLE"
          | "NOT_AVAILABLE"
          | "UNKNOWN"
          | null,
        verifiedBadges: [],
        inspectionNotes: [],
        listingStatus: autoApprove ? "VERIFIED" : "PENDING",
        verificationStatus: autoApprove ? "VERIFIED" : "PENDING_VERIFICATION",
        isPublished: autoApprove,
        rcVerified: false,
        photosVerified: false,
        yardVerified: false,
        sellerVerified: currentUser.isVerified,
        missingPhotos: !frontPhoto || !backPhoto || !sidePhoto || (requiresInteriorPhoto && !normalizedInteriorPhoto),
        priceTooLow: expectedPrice < MIN_REASONABLE_PRICE,
        duplicateRegistration: false,
        newSeller: !currentUser.isVerified,
        missingYardLocation: !location,
        rejectionReason: "",
        verifiedBy: null,
        verifiedAt: autoApprove ? now : null,
      })
      .returning();

    const mediaRows = [
      { type: "PHOTO", category: "FRONT", url: frontPhoto },
      { type: "PHOTO", category: "BACK", url: backPhoto },
      { type: "PHOTO", category: "SIDE", url: sidePhoto },
      { type: "PHOTO", category: "INTERIOR", url: interiorPhoto },
      ...(walkaroundVideo
        ? [{ type: "VIDEO", category: "WALKAROUND", url: walkaroundVideo }]
        : []),
      ...(engineStartUpVideo
        ? [{ type: "VIDEO", category: "ENGINE_STARTUP", url: engineStartUpVideo }]
        : []),
      ...(toSafeString(body.inspectionReport)
        ? [{ type: "DOCUMENT", category: "INSPECTION_REPORT", url: toSafeString(body.inspectionReport) }]
        : []),
      ...(toSafeString(body.rcDocument)
        ? [{ type: "DOCUMENT", category: "RC", url: toSafeString(body.rcDocument) }]
        : []),
      ...(toSafeString(body.insuranceDocument)
        ? [{ type: "DOCUMENT", category: "INSURANCE", url: toSafeString(body.insuranceDocument) }]
        : []),
      ...(toSafeString(body.fitnessDocument)
        ? [{ type: "DOCUMENT", category: "FITNESS", url: toSafeString(body.fitnessDocument) }]
        : []),
      ...(toSafeString(body.permitDocument)
        ? [{ type: "DOCUMENT", category: "PERMIT", url: toSafeString(body.permitDocument) }]
        : []),
      ...additionalPhotoItems.map((p) => {
        const rawCat = p.category ? p.category.toUpperCase() : "";
        const category = VALID_ADDITIONAL_PHOTO_CATEGORIES.has(rawCat) ? rawCat : "OTHER";
        return { type: "PHOTO", category, url: p.url };
      }),
    ].filter((item) => Boolean(item.url));

    if (mediaRows.length > 0) {
      await db.insert(vehicleMedia).values(
        mediaRows.map((item) => ({
          vehicleId: inserted.id,
          type: item.type as typeof vehicleMedia.type._.data,
          category: item.category as typeof vehicleMedia.category._.data,
          url: item.url,
          mimeType: "",
          customName: null,
        }))
      );
    }

    if (shouldLogMediaDebug()) {
      console.info("Stored DB media URLs", {
        vehicleId: inserted.id,
        image: inserted.image,
        frontPhoto: inserted.frontPhoto,
        backPhoto: inserted.backPhoto,
        sidePhoto: inserted.sidePhoto,
        interiorPhoto: inserted.interiorPhoto,
        walkaroundVideo: inserted.walkaroundVideo,
        engineStartUpVideo: inserted.engineStartUpVideo,
        galleryCount: inserted.gallery?.length ?? 0,
      });
    }

    return Response.json(inserted, { status: 201 });
  } catch (error) {
    console.error("POST /api/vehicles failed", error);
    return Response.json({ message: "Failed to create vehicle." }, { status: 500 });
  }
}
