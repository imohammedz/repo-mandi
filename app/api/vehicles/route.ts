import { db } from "@/lib/db";
import { vehicleMedia, vehicles, platformSettings } from "@/lib/schema";
import { eq, ilike, and, or, desc, gte, lte } from "drizzle-orm";
import { nanoid } from "./nanoid";
import { getCurrentUser } from "@/lib/auth";

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

const VALID_ASSET_CONFIGURATIONS = [
  "Complete Vehicle",
  "Power / Horse / Tractor / Prime Mover Only",
  "Trailer Only",
  "Prime Mover + Trailer",
  "Other",
] as const;
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

    return Response.json(rows);
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

    const assetConfigurationRaw = toSafeString(body.assetConfiguration);
    const assetConfiguration = (assetConfigurationRaw || "Complete Vehicle") as AssetConfiguration;
    if (!VALID_ASSET_CONFIGURATIONS.includes(assetConfiguration)) {
      return Response.json({ message: "Invalid assetConfiguration." }, { status: 400 });
    }

    const vehicleType = toSafeString(body.vehicleType || body.type) as VehicleType;
    const brand = toSafeString(body.brand);
    const model = toSafeString(body.model);
    const registrationState = toSafeString(body.registrationState);
    // Step 4 only captures a single free-form location in MVP1.
    // Keep legacy state/city columns populated for backward compatibility with
    // existing schema consumers and filters while UI uses vehicleOrYardLocation.
    // These may still be empty when both request and profile lack values.
    const state = toSafeString(body.state) || toSafeString(currentUser.state);
    const city = toSafeString(body.city) || toSafeString(currentUser.city);
    const location = toSafeString(body.vehicleOrYardLocation || body.yardLocation);
    const conditionNotes = toSafeString(body.conditionNotes);
    const frontPhoto = toSafeString(body.frontPhoto);
    const backPhoto = toSafeString(body.backPhoto);
    const sidePhoto = toSafeString(body.sidePhoto);
    const interiorPhoto = toSafeString(body.interiorPhoto);
    const registrationNumber = normalizeRegNumber(toSafeString(body.vehicleRegistrationNumber));

    const providedYear = Number(body.year);
    const year = Number.isInteger(providedYear) ? providedYear : null;
    const expectedPrice = toNumberOrNull(body.expectedPrice ?? body.price);
    const kmMeterStatus = (toSafeString(body.kmMeterStatus) || "UNKNOWN") as KmMeterStatus;
    const runningCondition = parseRunningCondition(body.runningCondition ?? body.condition);
    const kmDriven = toNumberOrNull(body.kmDriven);
    const trailerType = toSafeString(body.trailerType);
    const trailerLength = toSafeString(body.trailerLength);
    const numberOfAxles = toNumberOrNull(body.numberOfAxles);
    const bodyDimensions = toSafeString(body.bodyDimensions);
    const suspensionType = toSafeString(body.suspensionType);
    const abs = toSafeString(body.abs).toUpperCase() as "YES" | "NO" | "UNKNOWN" | "";
    const tyreInspectionReport = toSafeString(body.tyreInspectionReport).toUpperCase();
    const isTrailerOnly = assetConfiguration === "Trailer Only";
    const hasTrailerConfiguration = assetConfiguration === "Trailer Only" || assetConfiguration === "Prime Mover + Trailer";
    const appliesTrailerLogic = vehicleType === "Trailer" || hasTrailerConfiguration;
    const requiresPoweredFields = !isTrailerOnly;
    const requiresTrailerFields = appliesTrailerLogic;
    // Non-REPO prime-mover-only listings do not include trailer assets,
    // so trailer-focused fields are not applicable.
    // Mirrors the Step 6 client-side visibility rule in app/seller/add-vehicle/page.tsx.
    // Keep both sides aligned to avoid client/server validation mismatches.
    const shouldHideTrailerFieldsInStep6 =
      listingType !== "REPO" && assetConfiguration === "Power / Horse / Tractor / Prime Mover Only";
    // Trailer fields are required only when trailer logic applies and the Step 6 hide rule does not suppress them.
    const requiresTrailerFieldsForValidation = requiresTrailerFields && !shouldHideTrailerFieldsInStep6;
    const requiresInteriorPhoto = !isTrailerOnly;
    const normalizedInteriorPhoto = isTrailerOnly ? "" : interiorPhoto;

    const financeCompany = toSafeString(body.financeCompany);
    const repoStatus = toSafeString(body.repoStatus || "Ready For Sale");
    const yardName = toSafeString(body.yardName);

    const alwaysRequiredMissing: string[] = [];
    if (!assetConfiguration) alwaysRequiredMissing.push("assetConfiguration");
    if (!vehicleType) alwaysRequiredMissing.push("vehicleType");
    if (requiresPoweredFields && !brand) alwaysRequiredMissing.push("brand");
    if (requiresPoweredFields && !model) alwaysRequiredMissing.push("model");
    if (requiresPoweredFields && !year) alwaysRequiredMissing.push("year");
    if (requiresPoweredFields && !registrationState) alwaysRequiredMissing.push("registrationState");
    if (requiresPoweredFields && !registrationNumber) alwaysRequiredMissing.push("vehicleRegistrationNumber");
    if (requiresPoweredFields && !kmMeterStatus) alwaysRequiredMissing.push("kmMeterStatus");
    if (requiresPoweredFields && !runningCondition) alwaysRequiredMissing.push("runningCondition");
    if (requiresTrailerFieldsForValidation && !trailerType) alwaysRequiredMissing.push("trailerType");
    if (requiresTrailerFieldsForValidation && !trailerLength) alwaysRequiredMissing.push("trailerLength");
    if (requiresTrailerFieldsForValidation && numberOfAxles === null) alwaysRequiredMissing.push("numberOfAxles");
    if (requiresTrailerFieldsForValidation && !bodyDimensions) alwaysRequiredMissing.push("bodyDimensions");
    if (requiresTrailerFieldsForValidation && assetConfiguration === "Prime Mover + Trailer" && !suspensionType) alwaysRequiredMissing.push("suspensionType");
    if (requiresTrailerFieldsForValidation && assetConfiguration === "Prime Mover + Trailer" && !abs) alwaysRequiredMissing.push("abs");
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

    if (isTrailerOnly && interiorPhoto) {
      return Response.json({ message: "interiorPhoto is not allowed for Trailer Only assets." }, { status: 400 });
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

    if (requiresPoweredFields && !regNumberLooksValid(registrationNumber)) {
      return Response.json(
        { message: "Invalid vehicleRegistrationNumber format. Example: MH-12-AB-1234." },
        { status: 400 }
      );
    }

    const currentYear = new Date().getFullYear();
    if (requiresPoweredFields && (year === null || year < MIN_VEHICLE_YEAR || year > currentYear)) {
      return Response.json({ message: `Year must be between ${MIN_VEHICLE_YEAR} and current year.` }, { status: 400 });
    }
    const normalizedYear = year ?? currentYear;

    if (expectedPrice === null || expectedPrice <= 0) {
      return Response.json({ message: "expectedPrice must be a positive number." }, { status: 400 });
    }

    if (requiresPoweredFields && kmMeterStatus === "WORKING" && (kmDriven === null || kmDriven < 0)) {
      return Response.json({ message: "kmDriven is required when km meter is working." }, { status: 400 });
    }

    if (tyreInspectionReport && !VALID_AVAILABILITY_STATUS.includes(tyreInspectionReport as (typeof VALID_AVAILABILITY_STATUS)[number])) {
      return Response.json({ message: "Invalid tyreInspectionReport." }, { status: 400 });
    }

    if (listingType === "REPO") {
      if (!financeCompany || !repoStatus || !yardName) {
        return Response.json({ message: "financeCompany, repoStatus, and yardName are required for repo listings." }, { status: 400 });
      }
      if (!VALID_REPO_STATUS.includes(repoStatus as (typeof VALID_REPO_STATUS)[number])) {
        return Response.json({ message: "Invalid repoStatus." }, { status: 400 });
      }
    }

    const title = [vehicleType, toSafeString(body.vehicleSubType), brand, model, normalizedYear]
      .filter(Boolean)
      .join(" ");
    const id = nanoid(title, brand, model, normalizedYear);

    const gallery = [frontPhoto, backPhoto, sidePhoto, interiorPhoto].filter(Boolean);

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
        assetConfiguration,
        status: autoApprove ? "VERIFIED" : "PENDING",
        title,
        type: vehicleType,
        vehicleSubType: toSafeString(body.vehicleSubType) || null,
        brand,
        model,
        year: normalizedYear,
        vehicleRegistrationNumber: registrationNumber,
        registrationState,
        kmMeterStatus,
        kmDriven: requiresPoweredFields && kmMeterStatus === "WORKING" ? kmDriven : null,
        runningCondition: requiresPoweredFields ? runningCondition : "UNKNOWN",
        fuelType: "Diesel",
        numberOfAxles,
        bodyType: toSafeString(body.bodyType) || null,
        bodyDimensions: bodyDimensions || null,
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
        walkaroundVideo: toSafeString(body.walkaroundVideo) || null,
        engineStartUpVideo: toSafeString(body.engineStartUpVideo) || null,
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
        yardContact: toSafeString(body.yardContact),
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
        engineNumber: toSafeString(body.engineNumber),
        chassisNumber: toSafeString(body.chassisNumber),
        trailerNumber: toSafeString(body.trailerNumber),
        gvwTonnes: toSafeString(body.gvwTonnes),
        gpsInstalled: (toSafeString(body.gpsInstalled).toUpperCase() || null) as "YES" | "NO" | "UNKNOWN" | null,
        abs: (abs || null) as "YES" | "NO" | "UNKNOWN" | null,
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
        missingPhotos: !frontPhoto || !backPhoto || !sidePhoto || (requiresInteriorPhoto && !interiorPhoto),
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
      ...(toSafeString(body.walkaroundVideo)
        ? [{ type: "VIDEO", category: "WALKAROUND", url: toSafeString(body.walkaroundVideo) }]
        : []),
      ...(toSafeString(body.engineStartUpVideo)
        ? [{ type: "VIDEO", category: "ENGINE_STARTUP", url: toSafeString(body.engineStartUpVideo) }]
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

    return Response.json(inserted, { status: 201 });
  } catch (error) {
    console.error("POST /api/vehicles failed", error);
    return Response.json({ message: "Failed to create vehicle." }, { status: 500 });
  }
}
