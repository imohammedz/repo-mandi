import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  CircleCheck,
  FileBadge,
  FileText,
  MapPin,
  ShieldCheck,
} from "lucide-react";
import { formatCurrency } from "@/data/vehicles";
import { db } from "@/lib/db";
import { vehicleMedia, vehicles as vehiclesTable } from "@/lib/schema";
import { dbToVehicle } from "@/lib/mappers";
import { eq, ne, desc, and, isNull, asc } from "drizzle-orm";
import { ImageGallery, type GalleryMediaItem } from "@/components/ui/image-gallery";
import { SellerCard } from "@/components/ui/seller-card";
import { VehicleCard } from "@/components/ui/vehicle-card";
import { SupportContactCard } from "@/components/ui/support-contact-card";
import { getCurrentUser } from "@/lib/auth";
import { SaveHeartButton } from "@/components/ui/save-heart-button";
import { VehicleStickyContactCta } from "@/components/ui/vehicle-sticky-contact-cta";
import {
  getAssetStructureLabel,
  getDetachableTypeLabel,
  getListingModeLabel,
  hasEngineOrPowertrain,
  normalizeClassification,
} from "@/lib/vehicle-classification";
import { formatEnumLabel } from "@/lib/formatting";
import { getSupportMailto, SITE_CONFIG, SUPPORT_SUBJECTS } from "@/lib/config/site";

export const dynamic = "force-dynamic";

const normalizeText = (value: string | null | undefined) => {
  if (!value) return "";
  return value.trim().replace(/\s+/g, " ");
};

const toReadableLabel = (value: string | null | undefined) => {
  const normalized = normalizeText(value);
  if (!normalized) return "";
  return formatEnumLabel(normalized) || normalized;
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

const DOCUMENT_LABELS: Record<string, string> = {
  RC: "RC",
  INSURANCE: "Insurance",
  FITNESS: "Fitness",
  PERMIT: "Permit",
  INSPECTION_REPORT: "Evaluation Report",
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

export default async function VehicleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const currentUser = await getCurrentUser();

  const [row] = await db.select().from(vehiclesTable).where(eq(vehiclesTable.id, id));
  if (!row || row.deletedAt) notFound();
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
    {
      label: "Fitness Valid",
      value: vehicle.fitnessExpiry ? `Valid till ${vehicle.fitnessExpiry}` : "",
    },
    {
      label: "Insurance",
      value: vehicle.insuranceExpiry ? `Valid till ${vehicle.insuranceExpiry}` : "",
    },
    {
      label: "Permit",
      value: vehicle.permitExpiry ? `Valid till ${vehicle.permitExpiry}` : "",
    },
  ].filter((item) => item.value);

  const conditionSpecs = [
    {
      label: "Running Condition",
      value: showsRunning ? toReadableLabel(vehicle.runningCondition || vehicle.condition) : "",
    },
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

  const conditionNotes = dedupeLabels([
    ...(vehicle.inspectionNotes || []),
    normalizeText(vehicle.conditionNotes),
  ]);
  if (vehicle.yardVerified) {
    conditionNotes.push("RepoMandi Physical Inspection Completed");
  }

  return (
    <main className="mx-auto w-full max-w-4xl space-y-5 px-4 pb-[calc(8rem+env(safe-area-inset-bottom,0px))] pt-4">
      <div className="flex flex-wrap gap-2">
        <Link
          href="/vehicles"
          className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700"
        >
          <ArrowLeft className="h-4 w-4" /> Back to listings
        </Link>
        {isOwner ? (
          <Link
            href={`/seller/listings/${vehicle.id}/edit`}
            className="inline-flex min-h-11 items-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700"
          >
            Edit listing
          </Link>
        ) : null}
      </div>

      <div className="relative">
        <ImageGallery media={orderedGalleryMedia} title={heroTitle} />
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
        <p className="text-xs text-slate-600">
          Need assistance?{" "}
          <Link href={getSupportMailto(SUPPORT_SUBJECTS.sellerVerification)} className="font-medium text-slate-900 underline underline-offset-2">
            Contact {SITE_CONFIG.supportEmail}
          </Link>
        </p>
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

      <div className="space-y-5">
        <SellerCard
          id="seller-contact-card"
          name={vehicle.businessName || vehicle.sellerName}
          role={vehicle.sellerRole}
          phone={vehicle.sellerPhone}
          vehicleTitle={heroTitle}
          vehicleId={vehicle.id}
          sellerId={vehicle.sellerId ?? undefined}
          city={displayLocation}
          sellerVerified={vehicle.sellerVerified ?? false}
          photosVerified={vehicle.photosVerified ?? false}
          rcVerified={vehicle.rcVerified ?? false}
          yardVerified={vehicle.yardVerified ?? false}
          className="h-fit w-full"
        />

        <div className="w-full space-y-5">
          <section className="space-y-4">
            <h2 className="text-base font-semibold text-slate-900">Vehicle Specifications</h2>
            {renderSpecGroup("Vehicle Information", vehicleInfoSpecs)}
            {renderSpecGroup("Registration & Compliance", registrationSpecs)}
            {renderSpecGroup("Condition & Usage", conditionSpecs)}
            {renderSpecGroup("Trailer / Body Details", trailerSpecs)}
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-slate-900">Condition Notes</h2>
            {conditionNotes.length ? (
              <ul className="mt-3 space-y-2 text-sm text-slate-700">
                {conditionNotes.map((note) => (
                  <li key={note} className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-slate-400" />
                    <span>{note}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-slate-500">No condition notes available.</p>
            )}
          </section>

          <SupportContactCard
            title="Questions about inspections?"
            description="Contact RepoMandi support for inspection and yard verification help."
            subject={SUPPORT_SUBJECTS.inspection}
          />

          {documentRows.length ? (
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-base font-semibold text-slate-900">Documents</h2>
              <div className="mt-3 space-y-2">
                {documentRows.map((doc) => {
                  const label = DOCUMENT_LABELS[doc.category] || toReadableLabel(doc.customName) || "Document";
                  const isVerified =
                    (doc.category === "RC" && vehicle.rcVerified) ||
                    (doc.category === "INSPECTION_REPORT" && vehicle.yardVerified);
                  return (
                    <a
                      key={doc.id}
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700"
                    >
                      <span className="inline-flex items-center gap-2">
                        {doc.category === "RC" ? <FileBadge className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                        {label}
                      </span>
                      {isVerified ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700">
                          <ShieldCheck className="h-3.5 w-3.5" />
                          Verified
                        </span>
                      ) : null}
                    </a>
                  );
                })}
              </div>
            </section>
          ) : null}

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-slate-900">Similar Vehicles</h2>
            <div className="space-y-4">
              {similar.map((item) => (
                <VehicleCard key={item.id} vehicle={item} compact />
              ))}
            </div>
          </section>
        </div>
      </div>

      <VehicleStickyContactCta
        sellerCardId="seller-contact-card"
        vehicleId={vehicle.id}
        sellerPhone={vehicle.sellerPhone}
        vehicleTitle={heroTitle}
      />
    </main>
  );
}
