"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Gauge, MapPin } from "lucide-react";
import { Vehicle } from "@/types/vehicle";
import { WhatsAppButton } from "@/components/ui/whatsapp-button";
import { SaveHeartButton } from "@/components/ui/save-heart-button";
import { ShareListingButton } from "@/components/ui/share-listing-button";
import { resolveImageSrcForRender, VEHICLE_IMAGE_PLACEHOLDER_SRC } from "@/lib/media";
import { SafeImage } from "@/components/ui/safe-image";
import { formatEnumLabel, formatIndianKmShort, formatIndianPriceShort } from "@/lib/formatting";

type Props = {
  vehicle: Vehicle;
  compact?: boolean;
};

const COMPACT_CARD_CLASS = "min-h-[170px]";
const REGULAR_CARD_CLASS = "min-h-[180px]";
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

const getTitle = (vehicle: Vehicle) => {
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

const getTyreText = (vehicle: Vehicle) => {
  const total = vehicle.totalTyres ?? vehicle.tyreCount ?? vehicle.currentTyreCount;
  if (typeof total === "number" && total > 0) {
    return `${total} ${total === 1 ? "Tyre" : "Tyres"}`;
  }
  return "";
};

const getBodySizeLine = (vehicle: Vehicle) => {
  if (vehicle.bodyLength) return formatBodyLengthShort(vehicle.bodyLength);
  if (vehicle.trailerLength) return formatBodyLengthShort(vehicle.trailerLength);
  if (vehicle.bodyDimensions) return formatBodyLengthShort(vehicle.bodyDimensions);
  return "";
};

const getBodyTypeText = (vehicle: Vehicle) => {
  const bodyLength = getBodySizeLine(vehicle);
  const bodyType = toReadableLabel(vehicle.bodyApplicationType || vehicle.trailerType || vehicle.bodyType || vehicle.vehicleSubType);
  return [bodyLength, bodyType].filter(Boolean).join(" ").trim();
};

const getSecondLine = (vehicle: Vehicle) => [getTyreText(vehicle), getBodyTypeText(vehicle)].filter(Boolean).join(" • ").trim();

const getAssetConfiguration = (vehicle: Vehicle) => toUpperLabel(vehicle.assetConfiguration);

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

  if (vehicle.bsNorm) addChip(toReadableLabel(vehicle.bsNorm));
  const transferToken = toNormalizedToken(vehicle.transferType);
  if (transferToken === "RC_TRANSFER") addChip("RC Transfer");
  else if (transferToken === "RTO_NOC") addChip("RTO NOC");
  else if (transferToken === "OPEN_NOC") addChip("Open NOC");
  const gvw = String(vehicle.gvwTonnes ?? "").trim();
  if (gvw) addChip(/\bton(?:ne|nes)?\b/i.test(gvw) ? `${gvw} GVW` : `${gvw} Ton GVW`);
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

export function VehicleCard({ vehicle, compact = false }: Props) {
  const title = getTitle(vehicle);
  const listingTypeTag = getListingTypeTag(vehicle);
  const secondLine = getSecondLine(vehicle);
  const usageType = getAssetConfiguration(vehicle);
  const price = vehicle.expectedPrice ?? vehicle.price;
  const kmValue = vehicle.kmDriven ?? vehicle.odometerReading ?? null;
  const kmLine = formatIndianKmShort(kmValue);
  const chips = buildSpecChips(vehicle);
  const cardClass = compact ? COMPACT_CARD_CLASS : REGULAR_CARD_CLASS;
  const maxVisibleChips = 2;
  const visibleChips = chips.slice(0, maxVisibleChips);
  const extraChipCount = chips.length - visibleChips.length;
  const locationLine = vehicle.vehicleOrYardLocation || [vehicle.city, vehicle.state].filter(Boolean).join(", ");
  const sellerRoleChip = getSellerRoleChip(vehicle);
  const imageSources = useMemo(
    () =>
      [
        vehicle.image,
        vehicle.frontPhoto,
        vehicle.gallery?.[0],
        vehicle.leftSidePhoto,
        vehicle.rightSidePhoto,
        vehicle.backPhoto,
        vehicle.sidePhoto,
        ...(vehicle.gallery || []),
      ]
        .filter(isNonEmptyString)
        .map((src) => resolveImageSrcForRender(src))
        .filter(isNonEmptyString)
        .filter((src, index, all) => all.indexOf(src) === index),
    [vehicle.backPhoto, vehicle.frontPhoto, vehicle.gallery, vehicle.image, vehicle.leftSidePhoto, vehicle.rightSidePhoto, vehicle.sidePhoto]
  );
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const safeImageIndex = imageSources.length ? Math.min(activeImageIndex, imageSources.length - 1) : 0;
  const activeImage = imageSources[safeImageIndex] ?? VEHICLE_IMAGE_PLACEHOLDER_SRC;
  const imageCount = imageSources.length || 1;
  const onPrevImage = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (imageSources.length <= 1) return;
    setActiveImageIndex((prev) => (prev === 0 ? imageSources.length - 1 : prev - 1));
  };
  const onNextImage = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (imageSources.length <= 1) return;
    setActiveImageIndex((prev) => (prev + 1) % imageSources.length);
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className={`flex ${cardClass} gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm`}
    >
      <div className="relative h-40 w-[38%] min-w-[120px] max-w-[160px] shrink-0 overflow-hidden rounded-xl bg-black/80">
        <SafeImage
          src={activeImage}
          alt={vehicle.title}
          fill
          sizes="(max-width: 768px) 40vw, 220px"
          className="scale-110 object-cover object-center blur-md opacity-40"
          loading="lazy"
          aria-hidden
          logContext={{ component: "VehicleCard", vehicleId: vehicle.id, variant: "background" }}
        />
        <SafeImage
          src={activeImage}
          alt={vehicle.title}
          fill
          sizes="(max-width: 768px) 40vw, 220px"
          className="z-10 object-contain object-center p-2"
          loading="lazy"
          logContext={{ component: "VehicleCard", vehicleId: vehicle.id }}
        />
        <SaveHeartButton vehicleId={vehicle.id} vehicle={vehicle} className="absolute right-2 top-2 z-20" />
        {imageCount > 1 ? (
          <>
            <button
              type="button"
              onClick={onPrevImage}
              aria-label="Previous image"
              className="absolute left-2 top-1/2 z-20 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-white"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={onNextImage}
              aria-label="Next image"
              className="absolute right-2 top-1/2 z-20 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-white"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <span
              className="absolute bottom-2 left-1/2 z-20 -translate-x-1/2 rounded bg-black/60 px-2 py-1 text-[11px] font-medium text-white"
              aria-label={`${safeImageIndex + 1} of ${imageCount} photos`}
            >
              {safeImageIndex + 1}/{imageCount}
            </span>
          </>
        ) : null}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <span
          className="inline-flex w-fit rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-slate-700"
          role="status"
          aria-label={`Listing type: ${listingTypeTag}`}
        >
          {listingTypeTag}
        </span>
        <h3 className="line-clamp-2 text-[15px] font-bold uppercase leading-tight text-slate-900">
          <Link href={`/vehicles/${vehicle.id}`} className="inline-block hover:text-slate-700">
            {title}
          </Link>
        </h3>
        <p className="truncate text-[22px] font-extrabold leading-none text-orange-600" aria-label={`Price ${formatIndianPriceShort(price)}`}>
          {formatIndianPriceShort(price)}
        </p>
        {locationLine ? (
          <p className="flex items-center gap-1 truncate text-[12px] text-slate-600">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-500" />
            <span className="truncate">{locationLine}</span>
          </p>
        ) : null}
        {kmLine ? (
          <p className="flex items-center gap-1 truncate text-[12px] text-slate-600">
            <Gauge className="h-3.5 w-3.5 shrink-0 text-slate-500" />
            <span className="truncate">{kmLine}</span>
          </p>
        ) : null}
        {secondLine ? <p className="truncate text-[12px] text-slate-600">{secondLine}</p> : null}
        {usageType ? <p className="truncate text-[12px] font-medium uppercase text-slate-700">{usageType}</p> : null}
        {visibleChips.length > 0 ? (
          <div className="flex min-w-0 flex-wrap items-center gap-1.5">
            {visibleChips.map((chip) => (
              <span key={chip} className="inline-flex items-center rounded-full bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-700">
                {chip}
              </span>
            ))}
            {extraChipCount > 0 ? (
              <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-700">
                +{extraChipCount} More
              </span>
            ) : null}
          </div>
        ) : null}
        {sellerRoleChip ? (
          <span className="inline-flex w-fit items-center rounded-full bg-amber-50 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-amber-900">
            {sellerRoleChip}
          </span>
        ) : null}
        <div className="mt-auto flex items-center gap-2 pt-1">
          <WhatsAppButton
            phone={vehicle.sellerPhone}
            text="WhatsApp"
            className="h-9 min-h-9 flex-1 rounded-lg px-3 text-[13px] font-semibold"
            vehicleId={vehicle.id}
          />
          <Link
            href={`/vehicles/${vehicle.id}`}
            className="inline-flex h-9 min-h-9 flex-1 items-center justify-center rounded-lg border border-slate-300 px-3 text-[13px] font-semibold text-slate-700"
          >
            View Details
          </Link>
          <ShareListingButton
            listingId={vehicle.id}
            title={title}
            location={locationLine}
            price={price}
            variant="icon"
            className="h-9 w-9 shrink-0 rounded-lg border border-slate-200 bg-white text-slate-700 shadow-none hover:bg-slate-50"
          />
        </div>
      </div>
    </motion.article>
  );
}
