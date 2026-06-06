"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, MapPin } from "lucide-react";
import { Vehicle } from "@/types/vehicle";
import { WhatsAppButton } from "@/components/ui/whatsapp-button";
import { SaveHeartButton } from "@/components/ui/save-heart-button";
import { ShareListingButton } from "@/components/ui/share-listing-button";
import { resolveImageSrcForRender } from "@/lib/media";
import { SafeImage } from "@/components/ui/safe-image";
import { formatEnumLabel, formatIndianPriceShort, formatIndianKmShort } from "@/lib/formatting";

type Props = {
  vehicle: Vehicle;
  // compact is accepted for backward-compatibility but no longer affects layout
  compact?: boolean;
};

const IMAGE_SECTION_CLASS = "basis-2/5 min-w-[124px]";
const DETAILS_SECTION_CLASS = "basis-3/5";
const TITLE_TEXT_CLASS = "text-[13.5px]";
const PRICE_TEXT_CLASS = "text-[22px] sm:text-[24px]";
const SECONDARY_TEXT_CLASS = "text-[12px]";
const CHIP_TEXT_CLASS = "text-[10.5px]";
const LOCATION_TEXT_CLASS = "text-[11.5px]";
const ROLE_TEXT_CLASS = "text-[10px]";
const LISTING_TYPE_TAG_STYLES = {
  REPO: `border border-amber-200 bg-amber-100 ${ROLE_TEXT_CLASS} font-semibold text-amber-900`,
  NON_REPO: `border border-sky-200 bg-sky-100 ${ROLE_TEXT_CLASS} font-semibold text-sky-900`,
} as const;
const BLOCKED_SECOND_LINE_TOKENS = new Set(["COMPLETE_VEHICLE", "PRIME_MOVER", "PRIME_MOVER_TRAILER", "TRAILER", "BODY"]);
const isNonEmptyString = (value: unknown): value is string => typeof value === "string" && value.trim().length > 0;

const toReadableLabel = (value: string | null | undefined) => {
  if (!value) return "";
  return formatEnumLabel(value) || value;
};

const toUpperLabel = (value: string | null | undefined) => toReadableLabel(value).toUpperCase();

const toNormalizedToken = (value: string | null | undefined) =>
  value
    ?.toString()
    .trim()
    .replace(/[\s\-]+/g, "_")
    .toUpperCase() ?? "";

const ensureSuffix = (value: string, suffix: "Trailer" | "Body") => {
  const trimmed = value.trim();
  if (!trimmed) return "";
  return new RegExp(`\\b${suffix}\\b`, "i").test(trimmed) ? trimmed : `${trimmed} ${suffix}`;
};

const isTrailerOnlyAsset = (vehicle: Vehicle) => toNormalizedToken(vehicle.assetConfiguration) === "TRAILER_ONLY";

const getTitle = (vehicle: Vehicle) => {
  if (isTrailerOnlyAsset(vehicle)) {
    const trailerTypeBase = toReadableLabel(vehicle.trailerType || vehicle.bodyType || vehicle.bodyApplicationType || vehicle.vehicleSubType || vehicle.type);
    const trailerType = trailerTypeBase ? ensureSuffix(trailerTypeBase, "Trailer") : "";
    const trailerBuilt = [vehicle.year ? String(vehicle.year) : "", getBodySizeLine(vehicle), trailerType].filter(Boolean).join(" ").trim();
    if (trailerBuilt) return trailerBuilt;
  }

  const brand = toReadableLabel(vehicle.brand).replace(/\s+motors$/i, "");
  const built = [vehicle.year ? String(vehicle.year) : "", brand, toReadableLabel(vehicle.model), toUpperLabel(vehicle.axleConfiguration)]
    .filter(Boolean)
    .join(" ")
    .trim();
  return built || toReadableLabel(vehicle.title);
};

const formatBodyLengthShort = (raw: string | null | undefined) => {
  if (!raw) return "";
  const cleaned = raw.trim().toUpperCase();
  const match = cleaned.match(/(\d+(?:\.\d+)?)\s*(?:FT|FEET|FOOT|')?/);
  return match ? `${match[1]} FT` : cleaned;
};

const getListingTypeTag = (vehicle: Vehicle) => (vehicle.listingType === "REPO" ? "REPO" : "NON REPO");

const getBodySizeLine = (vehicle: Vehicle) => {
  if (vehicle.bodyLength) return formatBodyLengthShort(vehicle.bodyLength);
  if (vehicle.trailerLength) return formatBodyLengthShort(vehicle.trailerLength);
  if (vehicle.bodyDimensions) return formatBodyLengthShort(vehicle.bodyDimensions);
  return "";
};

const getBodyTypeText = (vehicle: Vehicle) => {
  if (isTrailerOnlyAsset(vehicle)) return "";

  const trailerType = toReadableLabel(vehicle.trailerType);
  const bodyType = toReadableLabel(vehicle.bodyApplicationType || vehicle.bodyType || vehicle.vehicleSubType);
  const baseLabel = trailerType || bodyType;
  if (!baseLabel) return "";

  const token = toNormalizedToken(baseLabel);
  if (BLOCKED_SECOND_LINE_TOKENS.has(token) || token.includes("PRIME_MOVER")) return "";

  const normalizedLabel = trailerType ? ensureSuffix(baseLabel, "Trailer") : ensureSuffix(baseLabel, "Body");
  const bodyLength = getBodySizeLine(vehicle);
  return [bodyLength, normalizedLabel].filter(Boolean).join(" ").trim();
};

const getSecondLine = (vehicle: Vehicle) => getBodyTypeText(vehicle);

const buildSpecChips = (vehicle: Vehicle): string[] => {
  const chips: string[] = [];
  const seen = new Set<string>();
  const addChip = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    chips.push(trimmed);
  };

  const totalTyres = vehicle.totalTyres ?? vehicle.tyreCount ?? vehicle.currentTyreCount;
  if (typeof totalTyres === "number" && totalTyres > 0) addChip(`${totalTyres} ${totalTyres === 1 ? "Tyre" : "Tyres"}`);
  if (vehicle.bsNorm) addChip(toReadableLabel(vehicle.bsNorm));
  const transferToken = toNormalizedToken(vehicle.transferType);
  if (transferToken === "RC_TRANSFER") addChip("RC Transfer");
  else if (transferToken === "RTO_NOC") addChip("RTO NOC");
  else if (transferToken === "OPEN_NOC") addChip("Open NOC");
  const gvw = String(vehicle.gvwTonnes ?? "").trim();
  if (gvw) addChip(/\bton(?:ne|nes)?\b/i.test(gvw) ? `${gvw} GVW` : `${gvw} Ton GVW`);
  if (typeof vehicle.parkingDue === "number") {
    if (vehicle.parkingDue <= 0) addChip("No Parking Due");
    else addChip(`₹${vehicle.parkingDue} Parking Due`);
  }
  if (vehicle.tyreMountStatus) addChip(toReadableLabel(vehicle.tyreMountStatus));
  if (vehicle.suspensionType) addChip(toReadableLabel(vehicle.suspensionType));

  return chips;
};

const getSellerRoleChip = (vehicle: Vehicle) => {
  const roleToken = toNormalizedToken(vehicle.sellerRole);
  if (roleToken.includes("BROKER")) return "BROKER";
  if (roleToken.includes("DEALER")) return "DEALER";
  if (roleToken.includes("FLEET")) return "FLEET OWNER";
  if (roleToken.includes("BANK") || roleToken.includes("NBFC")) return "BANK PARTNER";
  if (roleToken.includes("RECOVERY")) return "RECOVERY AGENT";
  return "";
};

export function VehicleCard({ vehicle, compact: _compact }: Props) {
  const title = getTitle(vehicle);
  const listingTypeTag = getListingTypeTag(vehicle);
  const secondLine = getSecondLine(vehicle);
  const price = vehicle.expectedPrice ?? vehicle.price;
  const chips = buildSpecChips(vehicle);
  const maxVisibleChips = 3;
  const visibleChips = chips.slice(0, maxVisibleChips);
  const extraChipCount = chips.length - visibleChips.length;
  const locationLine = vehicle.vehicleOrYardLocation || [vehicle.city, vehicle.state].filter(Boolean).join(", ");
  const sellerRoleChip = getSellerRoleChip(vehicle);
  const listingTypeTagClass = listingTypeTag === "REPO" ? LISTING_TYPE_TAG_STYLES.REPO : LISTING_TYPE_TAG_STYLES.NON_REPO;
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
  const images = useMemo(
    () => {
      const resolvedImages = [
        vehicle.image,
        vehicle.frontPhoto,
        vehicle.leftSidePhoto,
        vehicle.rightSidePhoto,
        vehicle.backPhoto,
        vehicle.sidePhoto,
        ...(vehicle.gallery ?? []),
      ]
        .filter(isNonEmptyString)
        .map((src) => resolveImageSrcForRender(src))
        .filter(isNonEmptyString);

      return Array.from(new Set(resolvedImages));
    },
    [vehicle.backPhoto, vehicle.frontPhoto, vehicle.gallery, vehicle.image, vehicle.leftSidePhoto, vehicle.rightSidePhoto, vehicle.sidePhoto]
  );
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const safeImageIndex = images.length ? Math.min(selectedImageIndex, images.length - 1) : 0;
  const selectedImage = images[safeImageIndex] ?? null;
  const imageCount = images.length;
  const onPrevImage = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (images.length <= 1) return;
    setSelectedImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };
  const onNextImage = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (images.length <= 1) return;
    setSelectedImageIndex((prev) => (prev + 1) % images.length);
  };
  const kmDisplay = formatIndianKmShort(vehicle.odometerReading);

  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className={`relative flex h-[172px] min-w-0 w-full max-w-full items-stretch gap-2 overflow-hidden rounded-2xl border bg-white p-2 shadow-sm box-border ${
        vehicle.isFeatured ? "border-amber-300 shadow-amber-100" : "border-slate-200"
      }`}
    >
      {vehicle.isFeatured ? (
        <span
          className="absolute left-3 top-0 z-30 -translate-y-[45%] rounded-full border border-amber-300 bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-900"
          role="img"
          aria-label="Featured listing"
        >
          Featured
        </span>
      ) : null}
      <div className={`relative self-stretch ${IMAGE_SECTION_CLASS} shrink-0 overflow-hidden rounded-xl bg-slate-900/90`}>
        {selectedImage ? (
          <>
            <SafeImage
              src={selectedImage}
              alt={vehicle.title}
              fill
              sizes="(max-width: 768px) 40vw, 220px"
              className="object-cover object-center blur-md opacity-45"
              loading="lazy"
              aria-hidden
              logContext={{ component: "VehicleCard", vehicleId: vehicle.id, variant: "background" }}
            />
            <SafeImage
              src={selectedImage}
              alt={vehicle.title}
              fill
              sizes="(max-width: 768px) 40vw, 220px"
              className="z-10 object-contain object-center p-1"
              loading="lazy"
              logContext={{ component: "VehicleCard", vehicleId: vehicle.id }}
            />
          </>
        ) : (
          <div
            className="absolute inset-0 z-10 flex items-center justify-center p-3 text-center text-xs font-medium text-white/90"
            role="status"
            aria-label="No vehicle photo available"
          >
            Photo not uploaded
          </div>
        )}
        <SaveHeartButton vehicleId={vehicle.id} vehicle={vehicle} className="absolute right-2 top-2 z-20" />
        {imageCount > 1 ? (
          <>
            <button
              type="button"
              onClick={onPrevImage}
              aria-label="Previous image"
              className="absolute left-2 top-1/2 z-20 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={onNextImage}
              aria-label="Next image"
              className="absolute right-2 top-1/2 z-20 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <span
              className="absolute bottom-2 left-1/2 z-20 -translate-x-1/2 rounded-full bg-black/60 px-2 py-1 text-xs font-medium text-white"
              aria-label={`${safeImageIndex + 1} of ${imageCount} photos`}
            >
              {safeImageIndex + 1} / {imageCount}
            </span>
          </>
        ) : null}
      </div>

      <div className={`flex min-w-0 overflow-hidden ${DETAILS_SECTION_CLASS} flex-1 flex-col gap-1`}>
        <div className="flex shrink-0 min-w-0 items-center justify-between gap-1.5 overflow-hidden">
          <span
            className={`inline-flex max-w-full overflow-hidden whitespace-nowrap rounded-full px-1.5 py-0.5 uppercase tracking-wide ${listingTypeTagClass}`}
            role="status"
            aria-label={`Listing type: ${listingTypeTag}`}
          >
            {listingTypeTag}
          </span>
        </div>
        <Link
          href={`/vehicles/${vehicle.id}`}
          className={`shrink-0 min-w-0 line-clamp-2 ${TITLE_TEXT_CLASS} font-bold uppercase leading-tight text-slate-900 no-underline hover:text-slate-700 md:hover:underline`}
        >
          {title}
        </Link>
        <p
          className={`shrink-0 truncate ${PRICE_TEXT_CLASS} font-extrabold leading-none text-orange-600`}
          aria-label={`Price ${formatIndianPriceShort(price)}`}
        >
          {formatIndianPriceShort(price)}
        </p>
        {(kmDisplay || locationLine) ? (
          <p className={`shrink-0 flex items-center gap-1.5 truncate ${LOCATION_TEXT_CLASS} text-slate-600`}>
            {kmDisplay ? (
              <>
                <svg className="h-3.5 w-3.5 shrink-0 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 8v4l3 3" />
                </svg>
                <span className="shrink-0">{kmDisplay}</span>
              </>
            ) : null}
            {kmDisplay && locationLine ? <span className="shrink-0 text-slate-300">·</span> : null}
            {locationLine ? (
              <>
                <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-500" />
                <span className="truncate">{locationLine}</span>
              </>
            ) : null}
          </p>
        ) : null}
        {secondLine ? (
          <p className={`shrink-0 truncate ${SECONDARY_TEXT_CLASS} font-medium text-slate-700`}>
            <span className="truncate">{secondLine}</span>
          </p>
        ) : null}
        {visibleChips.length > 0 ? (
          <div className="shrink-0 flex min-w-0 flex-nowrap items-center gap-1 overflow-hidden">
            {visibleChips.map((chip) => (
              <span
                key={chip}
                className={`inline-flex shrink-0 items-center whitespace-nowrap rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 ${CHIP_TEXT_CLASS} font-medium text-slate-700`}
              >
                {chip}
              </span>
            ))}
            {extraChipCount > 0 ? (
              <span className={`inline-flex shrink-0 items-center whitespace-nowrap rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 ${CHIP_TEXT_CLASS} font-medium text-slate-700`}>
                +{extraChipCount} More
              </span>
            ) : null}
          </div>
        ) : null}
        {sellerRoleChip ? (
          <span
            className={`shrink-0 inline-flex w-fit min-w-0 max-w-full items-center gap-1 rounded-full px-2 py-1 ${ROLE_TEXT_CLASS} font-semibold uppercase tracking-wide ${sellerRoleChipClass}`}
          >
            <svg className="h-3 w-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <rect x="3" y="7" width="18" height="14" rx="1" />
              <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
              <line x1="12" y1="12" x2="12" y2="16" />
              <line x1="10" y1="14" x2="14" y2="14" />
            </svg>
            <span className="truncate">{sellerRoleChip}</span>
          </span>
        ) : null}
        <div className="mt-auto flex w-full min-w-0 items-center gap-1.5 pt-1">
          <WhatsAppButton
            phone={vehicle.sellerPhone}
            text="WhatsApp"
            className="h-8 min-h-8 flex-1 min-w-0 items-center justify-center rounded-lg px-3 text-xs font-semibold"
            vehicleId={vehicle.id}
          />
          <ShareListingButton
            listingId={vehicle.id}
            title={title}
            location={locationLine}
            price={price}
            variant="icon"
            className="h-8 w-8 min-h-8 min-w-8 shrink-0 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-700 shadow-none hover:bg-slate-50"
          />
        </div>
      </div>
    </motion.article>
  );
}
