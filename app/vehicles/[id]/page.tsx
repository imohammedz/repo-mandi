import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import {
  ArrowLeft,
  Disc3,
  Gauge,
  MapPin,
} from "lucide-react";
import { formatCurrency } from "@/data/vehicles";
import { db } from "@/lib/db";
import { vehicleMedia, vehicles as vehiclesTable, users as usersTable } from "@/lib/schema";
import { dbToVehicle } from "@/lib/mappers";
import { eq, ne, desc, and, isNull, asc, count } from "drizzle-orm";
import { ImageGallery, type GalleryMediaItem } from "@/components/ui/image-gallery";
import { SellerCard } from "@/components/ui/seller-card";
import { VehicleCard } from "@/components/ui/vehicle-card";
import { getCurrentUser } from "@/lib/auth";
import { SaveHeartButton } from "@/components/ui/save-heart-button";
import { ShareListingButton } from "@/components/ui/share-listing-button";
import { VehicleStickyContactCta } from "@/components/ui/vehicle-sticky-contact-cta";
import { FinanceEstimateCard } from "@/components/ui/finance-estimate-card";
import { InsuranceRenewalCard } from "@/components/ui/insurance-renewal-card";
import { VehicleDetailChips } from "@/components/ui/vehicle-detail-chips";
import {
  getAssetStructureLabel,
  getDetachableTypeLabel,
  hasEngineOrPowertrain,
  normalizeClassification,
} from "@/lib/vehicle-classification";
import {
  formatDisplayLabel,
  formatIndianKmShort,
  formatIndianPriceShort,
  getPreferredTrailerTypeLabel,
} from "@/lib/formatting";
import { SITE_CONFIG } from "@/lib/config/site";
import { resolveImageSrcForRender } from "@/lib/media";

export const dynamic = "force-dynamic";

const getVehicleRow = cache(async (id: string): Promise<typeof vehiclesTable.$inferSelect | null> => {
  const [row] = await db.select().from(vehiclesTable).where(eq(vehiclesTable.id, id));
  if (!row || row.deletedAt) return null;
  return row;
});

const normalizeText = (value: string | null | undefined) => {
  if (!value) return "";
  return value.trim().replace(/\s+/g, " ");
};

const toReadableLabel = (value: string | null | undefined) => {
  const normalized = normalizeText(value);
  if (!normalized) return "";
  return formatDisplayLabel(normalized) || normalized;
};

const getTransferTypeLabel = (transferType: string | null | undefined, nocStatus: string | null | undefined) => {
  const normalizedTransferType = normalizeText(transferType).replace(/[\s-]+/g, "_").toUpperCase();
  if (normalizedTransferType === "RC_TRANSFER") return "RC Transfer";
  if (normalizedTransferType === "RTO_NOC") return "RTO NOC";
  if (normalizedTransferType === "OPEN_NOC") return "Open NOC";
  if (normalizedTransferType === "UNKNOWN") return "Unknown";

  const normalizedNocStatus = normalizeText(nocStatus).replace(/[\s-]+/g, "_").toUpperCase();
  if (normalizedNocStatus === "AVAILABLE") return "RC Transfer";
  return "Unknown";
};

const dedupeLabels = (parts: Array<string | null | undefined>) => {
  const seen = new Set<string>();
  const unique: string[] = [];

  for (const part of parts) {
    const normalized = normalizeText(part);
    if (!normalized) continue;
    const key = normalized.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(normalized);
  }

  return unique;
};

const buildHeroTitle = (vehicle: ReturnType<typeof dbToVehicle>) => {
  const classification = normalizeClassification({
    assetStructure: vehicle.assetStructure,
    detachableType: vehicle.detachableType,
    assetConfiguration: vehicle.assetConfiguration,
  });

  const axleLabel = toReadableLabel(vehicle.axleConfiguration || vehicle.axleType);
  const bodyLabel = toReadableLabel(vehicle.bodyApplicationType || vehicle.vehicleSubType);
  const categoryLabel = toReadableLabel(vehicle.assetCategory || vehicle.type);

  const base = dedupeLabels([String(vehicle.year || ""), vehicle.brand, vehicle.model]);
  const classificationParts =
    classification.assetStructure === "DETACHABLE" && classification.detachableType === "TRAILER"
      ? dedupeLabels([vehicle.trailerType, vehicle.trailerLength, "Trailer"])
      : classification.assetStructure === "DETACHABLE" &&
          classification.detachableType === "PRIME_MOVER"
        ? dedupeLabels([axleLabel, "Prime Mover"])
        : dedupeLabels([axleLabel, bodyLabel || categoryLabel]);

  const computed = [...base, ...classificationParts].join(" ").trim();
  return computed || vehicle.title;
};

const formatBodyLengthShort = (raw: string | null | undefined) => {
  if (!raw) return "";
  const cleaned = raw.trim().toUpperCase();
  const match = cleaned.match(/(\d+(?:\.\d+)?)\s*(?:FT|FEET|FOOT|')?/);
  return match ? `${match[1]} FT` : cleaned;
};

const getTyreText = (vehicle: ReturnType<typeof dbToVehicle>) => {
  const total = vehicle.totalTyres ?? vehicle.tyreCount ?? vehicle.currentTyreCount;
  if (typeof total === "number" && total > 0) {
    return `${total} ${total === 1 ? "Tyre" : "Tyres"}`;
  }
  return "";
};

const getBodyTypeText = (vehicle: ReturnType<typeof dbToVehicle>) => {
  if (vehicle.assetCategory === "Prime Mover + Trailer") {
    const trailerLength = formatBodyLengthShort(vehicle.trailerLength || vehicle.bodyLength || vehicle.bodyDimensions);
    const trailerType = getPreferredTrailerTypeLabel(vehicle);
    return [trailerLength, trailerType].filter(Boolean).join(" ").trim();
  }
  const bodyLength = formatBodyLengthShort(vehicle.bodyLength || vehicle.trailerLength || vehicle.bodyDimensions);
  const bodyType = toReadableLabel(vehicle.bodyApplicationType || vehicle.trailerType || vehicle.bodyType || vehicle.vehicleSubType);
  return [bodyLength, bodyType].filter(Boolean).join(" ").trim();
};

const buildPrimaryTitle = (vehicle: ReturnType<typeof dbToVehicle>) => {
  const classification = normalizeClassification({
    assetStructure: vehicle.assetStructure,
    detachableType: vehicle.detachableType,
    assetConfiguration: vehicle.assetConfiguration,
  });

  const axleLabel = toReadableLabel(vehicle.axleConfiguration || vehicle.axleType);

  if (classification.assetStructure === "DETACHABLE" && classification.detachableType === "TRAILER") {
    const bodyLength = formatBodyLengthShort(vehicle.trailerLength || vehicle.bodyLength);
    const trailerType = toReadableLabel(vehicle.trailerType || vehicle.bodyApplicationType);
    const parts = dedupeLabels([String(vehicle.year || ""), vehicle.brand, vehicle.model, bodyLength, trailerType]);
    return parts.join(" ").trim() || vehicle.title || "";
  }

  const parts = dedupeLabels([String(vehicle.year || ""), vehicle.brand, vehicle.model, axleLabel]);
  return parts.join(" ").trim() || vehicle.title || "";
};

const buildTrailerSubtitle = (vehicle: ReturnType<typeof dbToVehicle>) => {
  const classification = normalizeClassification({
    assetStructure: vehicle.assetStructure,
    detachableType: vehicle.detachableType,
    assetConfiguration: vehicle.assetConfiguration,
  });
  if (classification.assetStructure === "DETACHABLE" && classification.detachableType === "TRAILER") {
    return "";
  }
  return getBodyTypeText(vehicle);
};

const buildConfigurationLine = (vehicle: ReturnType<typeof dbToVehicle>) => {
  const classification = normalizeClassification({
    assetStructure: vehicle.assetStructure,
    detachableType: vehicle.detachableType,
    assetConfiguration: vehicle.assetConfiguration,
  });

  const axleLabel = toReadableLabel(vehicle.axleConfiguration || vehicle.axleType);

  if (classification.assetStructure === "DETACHABLE" && classification.detachableType === "PRIME_MOVER") {
    const hasTrailerInfo = !!(vehicle.trailerType || vehicle.trailerLength || vehicle.bodyLength);
    const suffix = hasTrailerInfo ? "Prime Mover + Trailer" : "Prime Mover";
    return dedupeLabels([axleLabel, suffix]).join(" ").trim();
  }
  if (classification.assetStructure === "DETACHABLE" && classification.detachableType === "TRAILER") {
    return "Trailer";
  }
  if (classification.assetStructure === "EQUIPMENT") {
    return toReadableLabel(vehicle.assetCategory || vehicle.type);
  }
  const assetCategoryLabel = normalizeText(vehicle.assetCategory);
  return dedupeLabels([axleLabel, assetCategoryLabel]).join(" ").trim();
};

const toNormalizedToken = (value: string | null | undefined) =>
  value
    ?.toString()
    .trim()
    .replace(/[\s-]+/g, "_")
    .toUpperCase() ?? "";

const getSellerRoleChip = (vehicle: ReturnType<typeof dbToVehicle>) => {
  const roleToken = toNormalizedToken(vehicle.sellerRole);
  if (roleToken.includes("BROKER")) return "BROKER";
  if (roleToken.includes("DEALER")) return "DEALER";
  if (roleToken.includes("FLEET")) return "FLEET OWNER";
  if (roleToken.includes("BANK") || roleToken.includes("NBFC")) return "BANK PARTNER";
  if (roleToken.includes("RECOVERY")) return "RECOVERY AGENT";
  return "";
};

const buildVehicleSpecChips = (vehicle: ReturnType<typeof dbToVehicle>, showsRunning: boolean) => {
  const chips = dedupeLabels([
    showsRunning
      ? toReadableLabel(vehicle.runningCondition || vehicle.condition) === "Running"
        ? "Running"
        : ""
      : "",
    vehicle.bsNorm ? toReadableLabel(vehicle.bsNorm) : "",
    vehicle.fuelType ? toReadableLabel(vehicle.fuelType) : "",
    vehicle.suspensionType ? toReadableLabel(vehicle.suspensionType) : "",
    vehicle.engineCondition ? toReadableLabel(vehicle.engineCondition) : "",
    getAssetStructureLabel(vehicle.assetStructure),
    getDetachableTypeLabel(vehicle.detachableType),
    vehicle.batteryIncluded === "YES" ? "Battery Included" : "",
    vehicle.rimsDiscsIncluded === "YES" ? "Rims Included" : "",
    vehicle.keyAvailable === "YES" ? "Key Available" : "",
  ]);

  return chips;
};

const PHOTO_DISPLAY_PRIORITY: Record<string, number> = {
  FRONT: 1,
  BACK: 2,
  LEFT_SIDE: 3,
  SIDE: 3,
  RIGHT_SIDE: 4,
  INTERIOR: 5,
  TRAILER_BODY: 6,
  LOAD_BODY: 6,
  HYDRAULIC_SYSTEM: 6,
  TYRES: 7,
  CHASSIS: 8,
  DAMAGE: 9,
  OTHER: 10,
};

const VIDEO_DISPLAY_PRIORITY = 11;
const DEFAULT_PHOTO_DISPLAY_PRIORITY = 10;

const getMediaDisplayPriority = (item: GalleryMediaItem) =>
  item.kind === "video"
    ? VIDEO_DISPLAY_PRIORITY
    : PHOTO_DISPLAY_PRIORITY[item.category || "OTHER"] || DEFAULT_PHOTO_DISPLAY_PRIORITY;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const row = await getVehicleRow(id);
  if (!row) {
    return {
      title: `${SITE_CONFIG.name} Listing`,
      description: `Commercial vehicle listing on ${SITE_CONFIG.name}.`,
    };
  }

  const isPublicLive = row.isPublished && row.listingStatus === "VERIFIED";
  if (!isPublicLive) {
    return {
      robots: { index: false, follow: false },
    };
  }

  const vehicle = dbToVehicle(row);
  const shareTitle = buildHeroTitle(vehicle);
  const sharePrice = formatCurrency(vehicle.expectedPrice ?? vehicle.price);
  const shareLocation = vehicle.vehicleOrYardLocation || [vehicle.city, vehicle.state].filter(Boolean).join(", ");
  const description = `${shareLocation || "India"} • ${sharePrice} • Verified commercial vehicle listing on ${SITE_CONFIG.name}.`;
  const image = resolveImageSrcForRender(vehicle.image || vehicle.gallery[0]);
  const canonical = `/vehicles/${vehicle.id}`;

  return {
    title: shareTitle,
    description,
    alternates: { canonical },
    openGraph: {
      title: shareTitle,
      description,
      url: canonical,
      images: image ? [{ url: image, alt: shareTitle }] : undefined,
      type: "website",
    },
  };
}

export default async function VehicleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const currentUser = await getCurrentUser();

  const row = await getVehicleRow(id);
  if (!row) notFound();
  const isPublicLive = row.isPublished && row.listingStatus === "VERIFIED";
  const isOwner = Boolean(currentUser?.id && row.sellerId === currentUser.id);
  const canViewPrivate = currentUser?.accountType === "ADMIN" || isOwner;
  if (!isPublicLive && !canViewPrivate) notFound();

  const vehicle = dbToVehicle(row);
  const mediaRows = await db
    .select()
    .from(vehicleMedia)
    .where(eq(vehicleMedia.vehicleId, vehicle.id))
    .orderBy(asc(vehicleMedia.createdAt));

  const galleryMedia: GalleryMediaItem[] = [];
  const seenMedia = new Set<string>();
  const pushGalleryMedia = (item: GalleryMediaItem) => {
    const sourceUrl = item.url || item.mediumUrl || item.fullUrl || item.thumbnailUrl;
    if (!sourceUrl) return;
    const key = `${item.kind}:${sourceUrl}`;
    if (seenMedia.has(key)) return;
    seenMedia.add(key);
    galleryMedia.push(item);
  };

  for (const row of mediaRows) {
    if (row.type === "PHOTO") {
      pushGalleryMedia({
        kind: "image",
        url: row.url,
        category: row.category,
      });
      continue;
    }

    if (row.type === "VIDEO") {
      pushGalleryMedia({
        kind: "video",
        url: row.url,
        category: row.category,
      });
      continue;
    }

    if (row.type !== "DOCUMENT") {
      pushGalleryMedia({
        kind: "image",
        url: row.url,
        category: "OTHER",
      });
    }
  }

  const fallbackPhotoFields: Array<{ url?: string; category: string }> = [
    { url: vehicle.frontPhoto, category: "FRONT" },
    { url: vehicle.backPhoto, category: "BACK" },
    { url: vehicle.leftSidePhoto || vehicle.sidePhoto, category: "LEFT_SIDE" },
    { url: vehicle.rightSidePhoto, category: "RIGHT_SIDE" },
    { url: vehicle.interiorPhoto, category: "INTERIOR" },
  ];
  for (const photo of fallbackPhotoFields) {
    if (!photo.url) continue;
    pushGalleryMedia({
      kind: "image",
      url: photo.url,
      category: photo.category,
    });
  }
  for (const additionalUrl of vehicle.gallery) {
    pushGalleryMedia({
      kind: "image",
      url: additionalUrl,
      category: "OTHER",
    });
  }
  if (vehicle.walkaroundVideo) {
    pushGalleryMedia({
      kind: "video",
      url: vehicle.walkaroundVideo,
      category: "WALKAROUND",
    });
  }
  if (vehicle.engineStartUpVideo) {
    pushGalleryMedia({
      kind: "video",
      url: vehicle.engineStartUpVideo,
      category: "ENGINE_STARTUP",
    });
  }

  const orderedGalleryMedia = [...galleryMedia].sort((a, b) => {
    return getMediaDisplayPriority(a) - getMediaDisplayPriority(b);
  });

  const displayLocation =
    vehicle.vehicleOrYardLocation || [vehicle.city, vehicle.state].filter(Boolean).join(", ");
  const transferTypeLabel = getTransferTypeLabel(vehicle.transferType, vehicle.nocStatus);
  const showsRunning = hasEngineOrPowertrain({
    assetStructure: vehicle.assetStructure,
    detachableType: vehicle.detachableType,
    assetConfiguration: vehicle.assetConfiguration,
  });

  const similarRows = await db
    .select()
    .from(vehiclesTable)
    .where(
      and(
        ne(vehiclesTable.id, id),
        eq(vehiclesTable.isPublished, true),
        eq(vehiclesTable.listingStatus, "VERIFIED"),
        isNull(vehiclesTable.deletedAt)
      )
    )
    .orderBy(desc(vehiclesTable.createdAt))
    .limit(3);
  const similar = similarRows.map(dbToVehicle);

  // Seller stats
  let memberSinceYear: string | undefined;
  let trucksSold = 0;
  if (vehicle.sellerId) {
    const [sellerRow] = await db
      .select({ joinedSince: usersTable.joinedSince })
      .from(usersTable)
      .where(eq(usersTable.id, vehicle.sellerId));
    if (sellerRow?.joinedSince) {
      const joinedAt = new Date(sellerRow.joinedSince);
      if (!Number.isNaN(joinedAt.getTime())) {
        memberSinceYear = String(joinedAt.getFullYear());
      }
    }
    const [soldResult] = await db
      .select({ count: count() })
      .from(vehiclesTable)
      .where(
        and(
          eq(vehiclesTable.sellerId, vehicle.sellerId),
          eq(vehiclesTable.listingStatus, "SOLD"),
          isNull(vehiclesTable.deletedAt)
        )
      );
    trucksSold = soldResult?.count ?? 0;
  }

  const vehicleSpecChips = buildVehicleSpecChips(vehicle, showsRunning);
  const heroTitle = buildHeroTitle(vehicle);
  const listingTypeTag = vehicle.listingType === "REPO" ? "REPO" : "NON REPO";
  const sellerRoleChip = getSellerRoleChip(vehicle);
  const listingTypeTagClass =
    listingTypeTag === "REPO"
      ? "border border-amber-200 bg-amber-50 text-amber-800"
      : "border border-blue-100 bg-blue-50 text-blue-700";
  const sellerRoleChipClass =
    sellerRoleChip === "BROKER"
      ? "border border-amber-200 bg-amber-100 text-amber-800"
      : sellerRoleChip === "DEALER"
        ? "border border-blue-200 bg-blue-100 text-blue-800"
        : sellerRoleChip === "FLEET OWNER"
          ? "border border-green-200 bg-green-100 text-green-800"
          : sellerRoleChip === "BANK PARTNER"
            ? "border border-purple-200 bg-purple-100 text-purple-800"
            : "border border-red-200 bg-red-100 text-red-800";
  const priceLine = formatIndianPriceShort(vehicle.expectedPrice ?? vehicle.price);
  const kmLine = formatIndianKmShort(vehicle.kmDriven ?? vehicle.odometerReading ?? null);
  const primaryTitle = buildPrimaryTitle(vehicle);
  const trailerSubtitle = buildTrailerSubtitle(vehicle);
  const configurationLine = buildConfigurationLine(vehicle);
  const tyreText = getTyreText(vehicle);
  const rtoInfo = normalizeText(vehicle.registrationState);
  const tyreMountStatus =
    vehicle.tyresIncluded === "YES"
      ? "With Tyres"
      : vehicle.tyresIncluded === "NO"
        ? "Without Tyres"
        : "";
  const tyreMountStatusChip = vehicle.tyreMountStatus ? toReadableLabel(vehicle.tyreMountStatus) : "";
  const cabinTypeLabel =
    vehicle.acCabin === "YES"
      ? "AC Cabin"
      : vehicle.acCabin === "NO"
        ? "Non-AC Cabin"
        : "";
  const metadataChipClass =
    "inline-flex shrink-0 items-center gap-1 rounded-md border border-slate-200 bg-slate-100 px-2 py-0.5 text-[12px] text-slate-600";
  const metadataTextChipClass =
    "inline-flex shrink-0 rounded-md border border-slate-200 bg-slate-100 px-2 py-0.5 text-[12px] font-medium text-slate-600";

  const formatDocumentationDate = (v: string | null | undefined) => {
    if (!v) return "";
    const trimmed = normalizeText(v);
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(trimmed)) return trimmed;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return toReadableLabel(trimmed);
    const parsed = new Date(`${trimmed}T00:00:00`);
    if (Number.isNaN(parsed.getTime())) return toReadableLabel(trimmed);
    const day = String(parsed.getDate()).padStart(2, "0");
    const month = String(parsed.getMonth() + 1).padStart(2, "0");
    const year = parsed.getFullYear();
    return `${day}/${month}/${year}`;
  };
  const parkingDueLabel = (v: number | string | null | undefined) => {
    if (v === null || v === undefined || v === "") return "";
    if (typeof v === "number") return `₹${v.toLocaleString("en-IN")}`;
    const trimmed = normalizeText(v);
    const parsed = Number(trimmed.replace(/[^\d]/g, ""));
    if (Number.isFinite(parsed)) return `₹${Math.max(0, parsed).toLocaleString("en-IN")}`;
    if (trimmed === "NO_DUE") return "₹0";
    return toReadableLabel(trimmed);
  };

  const allDetailChips = dedupeLabels([
    ...vehicleSpecChips,
    vehicle.sellerVerified ? "Verified Seller" : "",
    vehicle.photosVerified ? "Photos Verified" : "",
    vehicle.rcVerified ? "RC Verified" : "",
    vehicle.yardVerified ? "Yard Verified" : "",
  ]);

  const parseDocumentationDate = (value: string | null | undefined) => {
    if (!value) return null;
    const trimmed = normalizeText(value);
    if (!trimmed) return null;
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(trimmed)) {
      const [day, month, year] = trimmed.split("/");
      const parsed = new Date(`${year}-${month}-${day}T00:00:00`);
      return Number.isNaN(parsed.getTime()) ? null : parsed;
    }
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      const parsed = new Date(`${trimmed}T00:00:00`);
      return Number.isNaN(parsed.getTime()) ? null : parsed;
    }
    return null;
  };

  const getValidityBadge = (value: string | null | undefined) => {
    const parsed = parseDocumentationDate(value);
    if (!parsed) return { label: "Not Set", className: "border-slate-200 bg-slate-100 text-slate-600", state: "UNKNOWN" as const };
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffInDays = Math.floor((parsed.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diffInDays < 0) return { label: "Expired", className: "border-red-200 bg-red-50 text-red-700", state: "EXPIRED" as const };
    if (diffInDays <= 30) {
      return { label: "Expiring Soon", className: "border-amber-200 bg-amber-50 text-amber-700", state: "EXPIRING_SOON" as const };
    }
    return { label: "Valid", className: "border-emerald-200 bg-emerald-50 text-emerald-700", state: "VALID" as const };
  };

  const insuranceBadge = getValidityBadge(vehicle.insuranceValidity);
  const permitBadge = getValidityBadge(vehicle.permitValidity);
  const fitnessBadge = getValidityBadge(vehicle.fitnessStatus);
  const taxBadge = getValidityBadge(vehicle.taxValidity);
  const showInsuranceRenewalCard = insuranceBadge.state === "EXPIRED" || insuranceBadge.state === "EXPIRING_SOON";

  return (
    <main className="mx-auto w-full max-w-4xl space-y-5 px-4 pb-[calc(8rem+env(safe-area-inset-bottom,0px))] pt-4">
      <div className="flex flex-wrap gap-2">
        <Link
          href="/vehicles"
          className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700"
        >
          <ArrowLeft className="h-4 w-4" /> Back to listings
        </Link>
      </div>

      <div className="relative">
        <ImageGallery media={orderedGalleryMedia} title={heroTitle} />
        <ShareListingButton
          listingId={vehicle.id}
          title={heroTitle}
          location={displayLocation}
          price={vehicle.expectedPrice ?? vehicle.price}
          variant="icon"
          className="absolute right-14 top-3 z-20"
        />
        <SaveHeartButton vehicleId={vehicle.id} vehicle={vehicle} className="absolute right-3 top-3 z-20" />
      </div>

      <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`inline-flex rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${listingTypeTagClass}`}>
            {listingTypeTag}
          </span>
          {sellerRoleChip ? (
            <span className={`inline-flex rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${sellerRoleChipClass}`}>
              {sellerRoleChip}
            </span>
          ) : null}
        </div>

        <h1 className="text-xl font-bold uppercase text-slate-900 md:text-2xl">{primaryTitle}</h1>

        {trailerSubtitle ? (
          <p className="text-base font-semibold text-slate-700">{trailerSubtitle}</p>
        ) : null}

        <p className="text-2xl font-bold text-orange-600">{priceLine}</p>

        {(tyreText || kmLine) ? (
          <div className="flex flex-wrap items-center gap-2">
            {kmLine ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm font-medium text-slate-700">
                <Gauge className="h-4 w-4 shrink-0 text-slate-500" />
                <span>{kmLine}</span>
              </span>
            ) : null}
            {tyreText ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm font-medium text-slate-700">
                <Disc3 className="h-4 w-4 shrink-0 text-slate-500" />
                <span>{tyreText}</span>
              </span>
            ) : null}
          </div>
        ) : null}

        {configurationLine ? (
          <p className="text-xs text-slate-500">{configurationLine}</p>
        ) : null}

        <p className="flex items-center gap-2 text-sm text-slate-600">
          <MapPin className="h-4 w-4 shrink-0 text-slate-500" />
          <span>{displayLocation || "Location unavailable"}</span>
        </p>

        {(rtoInfo || transferTypeLabel || tyreMountStatus || tyreMountStatusChip || cabinTypeLabel) ? (
          <div
            className="flex flex-nowrap gap-1.5 overflow-x-auto border-t border-slate-100 pt-3 pb-1 [scrollbar-width:thin]"
            tabIndex={0}
            role="region"
            aria-label="Vehicle metadata"
          >
            {rtoInfo ? (
              <span className={metadataChipClass}>
                <span className="text-slate-500">RTO:</span>
                <span className="font-medium">{rtoInfo}</span>
              </span>
            ) : null}
            {transferTypeLabel ? (
              <span className={metadataChipClass}>
                <span className="text-slate-500">Transfer:</span>
                <span className="font-medium">{transferTypeLabel}</span>
              </span>
            ) : null}
            {(tyreMountStatusChip || tyreMountStatus) ? (
              <span className={metadataChipClass}>
                <span className="text-slate-500">Tyre Mount:</span>
                <span className="font-medium">{tyreMountStatusChip || tyreMountStatus}</span>
              </span>
            ) : null}
            {cabinTypeLabel ? (
              <span className={metadataTextChipClass}>
                {cabinTypeLabel}
              </span>
            ) : null}
          </div>
        ) : null}
      </section>

      <VehicleDetailChips chips={allDetailChips} />

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-slate-900">Document Validity</h2>
        <div className="mt-4 space-y-3">
          {[
            { label: "Insurance Valid Till", value: formatDocumentationDate(vehicle.insuranceValidity), badge: insuranceBadge },
            { label: "Permit Valid Till", value: formatDocumentationDate(vehicle.permitValidity), badge: permitBadge },
            { label: "Fitness Valid Till", value: formatDocumentationDate(vehicle.fitnessStatus), badge: fitnessBadge },
            { label: "Tax Valid Till", value: formatDocumentationDate(vehicle.taxValidity), badge: taxBadge },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5">
              <div>
                <p className="text-xs text-slate-500">{item.label}</p>
                <p className="text-sm font-semibold text-slate-900">{item.value || "Not Set"}</p>
              </div>
              <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${item.badge.className}`}>
                {item.badge.label}
              </span>
            </div>
          ))}
          <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5">
            <p className="text-xs text-slate-500">Parking Due</p>
            <p className="text-sm font-semibold text-slate-900">{parkingDueLabel(vehicle.parkingDue) || "Not Set"}</p>
          </div>
        </div>
      </section>

      <FinanceEstimateCard
        vehicleId={vehicle.id}
        vehicleTitle={heroTitle}
        listingPrice={vehicle.expectedPrice ?? vehicle.price ?? null}
      />

      {showInsuranceRenewalCard ? (
        <InsuranceRenewalCard
          vehicleId={vehicle.id}
          vehicleTitle={heroTitle}
          insuranceValidTill={formatDocumentationDate(vehicle.insuranceValidity) || "Not Set"}
          alertType={insuranceBadge.state === "EXPIRED" ? "EXPIRED" : "EXPIRING_SOON"}
        />
      ) : null}

      <SellerCard
        id="seller-contact-card"
        name={vehicle.businessName || vehicle.sellerName}
        role={vehicle.sellerRole}
        phone={vehicle.sellerPhone}
        vehicleTitle={heroTitle}
        sellerId={vehicle.sellerId ?? undefined}
        city={displayLocation}
        sellerVerified={vehicle.sellerVerified ?? false}
        photosVerified={vehicle.photosVerified ?? false}
        rcVerified={vehicle.rcVerified ?? false}
        yardVerified={vehicle.yardVerified ?? false}
        trucksSold={trucksSold}
        memberSinceYear={memberSinceYear}
        className="h-fit w-full"
      />

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-slate-900">Similar Vehicles</h2>
        <div className="space-y-2">
          {similar.map((item) => (
            <VehicleCard key={item.id} vehicle={item} compact />
          ))}
        </div>
      </section>

      <VehicleStickyContactCta
        vehicleId={vehicle.id}
        sellerPhone={vehicle.sellerPhone}
        vehicleTitle={heroTitle}
      />
    </main>
  );
}
