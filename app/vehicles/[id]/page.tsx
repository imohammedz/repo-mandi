import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import {
  ArrowLeft,
  CalendarDays,
  CircleCheck,
  FileText,
  MapPin,
  ShieldCheck,
} from "lucide-react";
import { formatCurrency } from "@/data/vehicles";
import { db } from "@/lib/db";
import { vehicleMedia, vehicles as vehiclesTable, users as usersTable } from "@/lib/schema";
import { dbToVehicle } from "@/lib/mappers";
import { eq, ne, desc, and, isNull, asc, count } from "drizzle-orm";
import { ImageGallery, type GalleryMediaItem } from "@/components/ui/image-gallery";
import { SellerCard } from "@/components/ui/seller-card";
import { VehicleCard } from "@/components/ui/vehicle-card";
import { SupportContactInline } from "@/components/ui/support-contact-inline";
import { SupportContactCard } from "@/components/ui/support-contact-card";
import { getCurrentUser } from "@/lib/auth";
import { SaveHeartButton } from "@/components/ui/save-heart-button";
import { ShareListingButton } from "@/components/ui/share-listing-button";
import { VehicleStickyContactCta } from "@/components/ui/vehicle-sticky-contact-cta";
import { FinanceEstimateCard } from "@/components/ui/finance-estimate-card";
import {
  getAssetStructureLabel,
  getDetachableTypeLabel,
  getListingModeLabel,
  hasEngineOrPowertrain,
  normalizeClassification,
} from "@/lib/vehicle-classification";
import { formatDisplayLabel } from "@/lib/formatting";
import { SITE_CONFIG, SUPPORT_SUBJECTS } from "@/lib/config/site";
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

const buildClassificationLine = (vehicle: ReturnType<typeof dbToVehicle>) => {
  const categoryLabel = toReadableLabel(vehicle.assetCategory || vehicle.type);
  const axleLabel = toReadableLabel(vehicle.axleConfiguration || vehicle.axleType);
  const bodyLabel = toReadableLabel(vehicle.bodyApplicationType || vehicle.vehicleSubType);

  const first = categoryLabel || bodyLabel;
  const secondCandidate = axleLabel || bodyLabel;
  if (!first && !secondCandidate) return "";
  if (!secondCandidate || first.toLowerCase() === secondCandidate.toLowerCase()) return first;
  return `${first} • ${secondCandidate}`;
};

const buildQuickInfoChips = (vehicle: ReturnType<typeof dbToVehicle>, showsRunning: boolean) => {
  const chips = dedupeLabels([
    showsRunning
      ? toReadableLabel(vehicle.runningCondition || vehicle.condition) === "Running"
        ? "Running"
        : ""
      : "",
    vehicle.bsNorm ? toReadableLabel(vehicle.bsNorm) : "",
    vehicle.tyresIncluded === "YES" ? "Tyres Included" : "",
    vehicle.rimsDiscsIncluded === "YES" ? "Rims Included" : "",
    vehicle.documentsAvailable === "YES" ? "RC Available" : "",
    vehicle.acCabin === "YES" ? "AC Cabin" : "",
    toReadableLabel(vehicle.axleConfiguration || vehicle.axleType),
    vehicle.suspensionType ? toReadableLabel(vehicle.suspensionType) : "",
    vehicle.batteryIncluded === "YES" ? "Battery Included" : "",
    vehicle.keyAvailable === "YES" ? "Key Available" : "",
  ]);

  return chips;
};

const toSpecValue = (value: string | number | null | undefined) => {
  if (value === null || value === undefined) return "";
  if (typeof value === "number") return value.toLocaleString("en-IN");
  return normalizeText(value);
};

const renderSpecGroup = (title: string, rows: Array<{ label: string; value: string }>) => {
  if (!rows.length) return null;
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      <dl className="mt-4 grid gap-x-4 gap-y-3 sm:grid-cols-2">
        {rows.map((row) => (
          <div key={`${title}-${row.label}`}>
            <dt className="text-xs font-medium text-slate-500">{row.label}</dt>
            <dd className="mt-0.5 text-sm font-semibold text-slate-900">{row.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
};

const formatDate = (value: Date | string | null | undefined) => {
  if (!value) return "";
  const parsed = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

const getFileNameFromUrl = (url: string) => {
  try {
    const parsed = new URL(url);
    const parts = parsed.pathname.split("/").filter(Boolean);
    return decodeURIComponent(parts[parts.length - 1] || "document");
  } catch {
    return "document";
  }
};

const DOCUMENT_LABELS: Record<string, string> = {
  RC: "RC",
  INSURANCE: "Insurance",
  FITNESS: "Fitness",
  PERMIT: "Permit",
  INSPECTION_REPORT: "Inspection Report",
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

  const documentRows = await db
    .select()
    .from(vehicleMedia)
    .where(and(eq(vehicleMedia.vehicleId, vehicle.id), eq(vehicleMedia.type, "DOCUMENT")))
    .orderBy(desc(vehicleMedia.createdAt));
  const documentCategorySummary = dedupeLabels(
    documentRows.map((doc) => {
      if (doc.category === "OTHER") return toReadableLabel(doc.customName) || "Other";
      return DOCUMENT_LABELS[doc.category] || toReadableLabel(doc.category);
    })
  );
  const canDownloadDocuments = currentUser?.accountType === "ADMIN";

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

  const trustTags = dedupeLabels([
    vehicle.sellerVerified ? "Verified Seller" : "",
    vehicle.photosVerified ? "Photos Verified" : "",
    vehicle.rcVerified ? "RC Verified" : "",
    vehicle.yardVerified ? "Yard Verified" : "",
  ]);

  const classificationTags = dedupeLabels([
    vehicle.listingType === "REPO" ? "Repo" : "Regular",
    getListingModeLabel(vehicle.listingMode),
    getAssetStructureLabel(vehicle.assetStructure) || "Standalone",
    getDetachableTypeLabel(vehicle.detachableType),
  ]);

  const quickInfoChips = buildQuickInfoChips(vehicle, showsRunning);
  const updatedAtLabel = formatDate(row.updatedAt);
  const heroTitle = buildHeroTitle(vehicle);
  const classificationLine = buildClassificationLine(vehicle);

  const vehicleInfoSpecs = [
    { label: "Brand", value: toSpecValue(vehicle.brand) },
    { label: "Model", value: toSpecValue(vehicle.model) },
    { label: "Year", value: toSpecValue(vehicle.year) },
    { label: "Fuel Type", value: toSpecValue(vehicle.fuelType) },
    {
      label: "Configuration",
      value: toSpecValue(
        toReadableLabel(vehicle.axleConfiguration || vehicle.axleType) ||
          toReadableLabel(vehicle.bodyApplicationType || vehicle.assetCategory || vehicle.type)
      ),
    },
    { label: "KM Driven", value: toSpecValue(vehicle.kmDriven) },
  ].filter((item) => item.value);

  const registrationSpecs = [
    {
      label: "Registered State / RTO",
      value: toSpecValue(vehicle.registrationState),
    },
    {
      label: "Registration Number",
      value: toSpecValue(vehicle.vehicleRegistrationNumber),
    },
    {
      label: "RC Available",
      value: vehicle.documentsAvailable ? toReadableLabel(vehicle.documentsAvailable) : "",
    },
  ].filter((item) => item.value);

  const conditionSpecs = [
    {
      label: "Running Condition",
      value: showsRunning ? toReadableLabel(vehicle.runningCondition || vehicle.condition) : "",
    },
    { label: "Engine Condition", value: vehicle.engineCondition ? toReadableLabel(vehicle.engineCondition) : "" },
    { label: "Tyres Included", value: vehicle.tyresIncluded ? toReadableLabel(vehicle.tyresIncluded) : "" },
    { label: "Rims Included", value: vehicle.rimsDiscsIncluded ? toReadableLabel(vehicle.rimsDiscsIncluded) : "" },
    { label: "Battery Included", value: vehicle.batteryIncluded ? toReadableLabel(vehicle.batteryIncluded) : "" },
    { label: "Key Available", value: vehicle.keyAvailable ? toReadableLabel(vehicle.keyAvailable) : "" },
  ].filter((item) => item.value);

  const trailerSpecs = [
    { label: "Trailer Type", value: toSpecValue(vehicle.trailerType) },
    { label: "Trailer Length", value: toSpecValue(vehicle.trailerLength) },
    {
      label: "Suspension",
      value: toSpecValue(toReadableLabel(vehicle.suspensionType)),
    },
    { label: "Axles", value: toSpecValue(vehicle.numberOfAxles) },
    { label: "Body Dimensions", value: toSpecValue(vehicle.bodyDimensions) },
  ].filter((item) => item.value);

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

  const documentationSpecs = [
    { label: "Insurance Valid Till", value: vehicle.insuranceValidity ? formatDocumentationDate(vehicle.insuranceValidity) : "" },
    { label: "Permit Valid Till", value: vehicle.permitValidity ? formatDocumentationDate(vehicle.permitValidity) : "" },
    { label: "Fitness Valid Till", value: vehicle.fitnessStatus ? formatDocumentationDate(vehicle.fitnessStatus) : "" },
    { label: "Tax Valid Till", value: vehicle.taxValidity ? formatDocumentationDate(vehicle.taxValidity) : "" },
    { label: "Parking Due", value: parkingDueLabel(vehicle.parkingDue) },
  ].filter((item) => item.value);

  const description = (vehicle.description ?? vehicle.conditionNotes ?? "").trim();
  const inspectionNotes = dedupeLabels(vehicle.inspectionNotes || []);
  if (vehicle.yardVerified) inspectionNotes.push("RepoMandi Physical Inspection Completed");

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

      <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
        <div className="flex flex-wrap gap-2">
          {classificationTags.map((tag) => (
            <span
              key={tag}
              className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700"
            >
              {tag}
            </span>
          ))}
          {trustTags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700"
            >
              <CircleCheck className="h-3.5 w-3.5" />
              {tag}
            </span>
          ))}
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-slate-900 md:text-3xl">{heroTitle}</h1>
          {classificationLine ? <p className="text-sm text-slate-500">{classificationLine}</p> : null}
        </div>

        <p className="text-3xl font-bold text-slate-900">{formatCurrency(vehicle.expectedPrice ?? vehicle.price)}</p>
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <MapPin className="h-4 w-4" />
          <span>{displayLocation || "Location unavailable"}</span>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Transfer Type</p>
          <p className="text-sm font-semibold text-slate-900">{transferTypeLabel}</p>
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
          <span>{vehicle.listingType === "REPO" ? "Repo" : "Regular"}</span>
          <span>•</span>
          <span>{getListingModeLabel(vehicle.listingMode)}</span>
          {updatedAtLabel ? (
            <>
              <span>•</span>
              <span className="inline-flex items-center gap-1">
                <CalendarDays className="h-3.5 w-3.5" /> Updated {updatedAtLabel}
              </span>
            </>
          ) : null}
        </div>
        <SupportContactInline prompt="Need assistance?" subject={SUPPORT_SUBJECTS.sellerVerification} className="text-xs text-slate-600" />
      </section>

      {quickInfoChips.length ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
          <div className="flex flex-wrap gap-2">
            {quickInfoChips.map((chip) => (
              <span key={chip} className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                {chip}
              </span>
            ))}
          </div>
        </section>
      ) : null}

      <FinanceEstimateCard
        vehicleId={vehicle.id}
        vehicleTitle={heroTitle}
        listingPrice={vehicle.expectedPrice ?? vehicle.price ?? null}
      />

      <div className="space-y-5">
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

        <div className="w-full space-y-5">
          <section className="space-y-4">
            <h2 className="text-base font-semibold text-slate-900">Vehicle Specifications</h2>
            {renderSpecGroup("Vehicle Information", vehicleInfoSpecs)}
            {renderSpecGroup("Registration & Compliance", registrationSpecs)}
            {renderSpecGroup("Condition & Usage", conditionSpecs)}
            {renderSpecGroup("Trailer / Body Details", trailerSpecs)}
            {renderSpecGroup("Documentation Details", documentationSpecs)}
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-slate-900">Description</h2>
            {description ? (
              <p className="mt-3 whitespace-pre-wrap text-sm text-slate-700">{description}</p>
            ) : (
              <p className="mt-2 text-sm text-slate-500">No description available.</p>
            )}
            {inspectionNotes.length ? (
              <div className="mt-4 border-t border-slate-100 pt-3">
                <h3 className="text-sm font-semibold text-slate-800">Inspection Notes</h3>
                <ul className="mt-2 space-y-2 text-sm text-slate-700">
                  {inspectionNotes.map((note) => (
                    <li key={note} className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-slate-400" />
                      <span>{note}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </section>

          <SupportContactCard
            title="Questions about inspections?"
            description="Contact RepoMandi support for inspection and yard verification help."
            subject={SUPPORT_SUBJECTS.inspection}
          />

          {documentRows.length ? (
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-base font-semibold text-slate-900">Documents Uploaded</h2>
              <ul className="mt-3 space-y-2 text-sm text-slate-700">
                {documentCategorySummary.map((label) => (
                  <li key={label} className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                    <span>{label}</span>
                  </li>
                ))}
              </ul>
              {canDownloadDocuments ? (
                <div className="mt-4 space-y-2 border-t border-slate-100 pt-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Admin Document Access</p>
                  {documentRows.map((doc) => {
                    const label =
                      doc.category === "OTHER"
                        ? `Other: ${toReadableLabel(doc.customName) || "Other"}`
                        : DOCUMENT_LABELS[doc.category] || toReadableLabel(doc.category) || "Document";
                    const isVerified =
                      (doc.category === "RC" && vehicle.rcVerified) ||
                      (doc.category === "INSPECTION_REPORT" && vehicle.yardVerified);
                    const fileName = doc.originalFileName || getFileNameFromUrl(doc.url);
                    return (
                      <a
                        key={doc.id}
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700"
                      >
                        <span className="min-w-0">
                          <span className="block font-medium text-slate-800">{label}</span>
                          <span className="block truncate text-xs text-slate-500">{fileName}</span>
                        </span>
                        <span className="inline-flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          {isVerified ? (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700">
                              <ShieldCheck className="h-3.5 w-3.5" />
                              Verified
                            </span>
                          ) : null}
                        </span>
                      </a>
                    );
                  })}
                </div>
              ) : null}
              {!canDownloadDocuments ? (
                <p className="mt-3 text-xs text-slate-500">
                  Document files are only available to admins during verification.
                </p>
              ) : null}
              {!documentCategorySummary.length ? (
                <p className="mt-3 text-sm text-slate-500">No documents uploaded.</p>
              ) : null}
              <div className="mt-3 text-xs text-slate-500">
                {documentRows.length} {documentRows.length === 1 ? "file" : "files"} uploaded.
              </div>
            </section>
          ) : null}

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-slate-900">Similar Vehicles</h2>
            <div className="space-y-2">
              {similar.map((item) => (
                <VehicleCard key={item.id} vehicle={item} compact />
              ))}
            </div>
          </section>
        </div>
      </div>

      <VehicleStickyContactCta
        vehicleId={vehicle.id}
        sellerPhone={vehicle.sellerPhone}
        vehicleTitle={heroTitle}
      />
    </main>
  );
}
