"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Gauge, MapPin, ShipWheel, Truck } from "lucide-react";
import { Vehicle } from "@/types/vehicle";
import { WhatsAppButton } from "@/components/ui/whatsapp-button";
import { SaveHeartButton } from "@/components/ui/save-heart-button";
import { ShareListingButton } from "@/components/ui/share-listing-button";
import { resolveImageSrcForRender } from "@/lib/media";
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
  const listingTypeTagClass =
    listingTypeTag === "REPO"
      ? "border border-amber-200 bg-amber-50 text-[11px] font-semibold text-amber-800"
      : "border border-blue-100 bg-blue-50 text-[10px] font-medium text-blue-700";
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

  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className={`flex ${cardClass} w-full max-w-full items-stretch gap-3 overflow-hidden rounded-2xl border border-slate-200 bg-white p-3 shadow-sm box-border`}
    >
      <div className="relative h-[180px] w-[35%] min-w-[120px] max-w-[140px] shrink-0 overflow-hidden rounded-xl bg-black/80 sm:h-auto md:w-[38%] md:max-w-[180px]">
        {selectedImage ? (
          <>
            <SafeImage
              src={selectedImage}
              alt={vehicle.title}
              fill
              sizes="(max-width: 768px) 45vw, 240px"
              className="scale-110 object-cover object-center blur-md opacity-40"
              loading="lazy"
              aria-hidden
              logContext={{ component: "VehicleCard", vehicleId: vehicle.id, variant: "background" }}
            />
            <SafeImage
              src={selectedImage}
              alt={vehicle.title}
              fill
              sizes="(max-width: 768px) 45vw, 240px"
              className="z-10 object-contain object-center p-0.5"
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

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <span
          className={`inline-flex w-fit rounded px-1.5 py-0.5 uppercase tracking-wide ${listingTypeTagClass}`}
          role="status"
          aria-label={`Listing type: ${listingTypeTag}`}
        >
          {listingTypeTag}
        </span>
        <h3 className="min-w-0 line-clamp-2 text-[14px] font-semibold uppercase leading-tight text-slate-900">
          <Link href={`/vehicles/${vehicle.id}`} className="inline-block min-w-0 hover:text-slate-700">
            {title}
          </Link>
        </h3>
        <p className="truncate text-2xl font-extrabold leading-none text-orange-600" aria-label={`Price ${formatIndianPriceShort(price)}`}>
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
        {secondLine ? (
          <p className="flex items-center gap-1 truncate text-[12px] text-slate-600">
            <ShipWheel className="h-3.5 w-3.5 shrink-0 text-slate-500" />
            <span className="truncate">{secondLine}</span>
          </p>
        ) : null}
        {usageType ? (
          <p className="flex items-center gap-1 truncate text-[12px] font-medium uppercase text-slate-700">
            <Truck className="h-3.5 w-3.5 shrink-0 text-slate-500" />
            <span className="truncate">{usageType}</span>
          </p>
        ) : null}
        {visibleChips.length > 0 ? (
          <div className="flex min-w-0 flex-nowrap items-center gap-1.5 overflow-hidden">
            {visibleChips.map((chip) => (
              <span
                key={chip}
                className="inline-flex max-w-full items-center overflow-hidden rounded-full bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-700"
              >
                <span className="truncate">{chip}</span>
              </span>
            ))}
            {extraChipCount > 0 ? (
              <span className="inline-flex shrink-0 items-center rounded-full bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-700">
                +{extraChipCount} More
              </span>
            ) : null}
          </div>
        ) : null}
        {sellerRoleChip ? (
          <span className={`inline-flex w-fit items-center rounded-full px-2 py-1 text-[11px] font-semibold uppercase tracking-wide ${sellerRoleChipClass}`}>
            {sellerRoleChip}
          </span>
        ) : null}
        <div className="mt-auto flex w-full min-w-0 items-center gap-1.5 pt-1">
          <WhatsAppButton
            phone={vehicle.sellerPhone}
            text="WhatsApp"
            className="h-10 min-h-10 min-w-0 flex-1 items-center justify-center rounded-xl px-2 text-sm font-semibold"
            vehicleId={vehicle.id}
          />
          <Link
            href={`/vehicles/${vehicle.id}`}
            className="inline-flex h-10 min-h-10 min-w-0 flex-1 items-center justify-center truncate rounded-xl border border-slate-300 px-2 text-sm font-semibold text-slate-700"
          >
            View Details
          </Link>
          <ShareListingButton
            listingId={vehicle.id}
            title={title}
            location={locationLine}
            price={price}
            variant="icon"
            className="h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-700 shadow-none hover:bg-slate-50"
          />
        </div>
      </div>
    </motion.article>
  );
}
