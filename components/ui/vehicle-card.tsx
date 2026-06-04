"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
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

const CARD_HEIGHT_CLASS = "h-[142px]";
const CHIP_MAX_WIDTH_CLASS = "max-w-[96px]";

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

const getListingTypeTag = (vehicle: Vehicle) => (vehicle.listingType === "REPO" ? "REPO" : "NON REPO");

const formatBodyLengthShort = (raw: string | null | undefined) => {
  if (!raw) return "";
  const cleaned = raw.trim().toUpperCase();
  const match = cleaned.match(/(\d+(?:\.\d+)?)\s*(?:FT|FEET|FOOT|')?/);
  return match ? `${match[1]} FT` : cleaned;
};

const getTyreLine = (vehicle: Vehicle) => {
  const total = vehicle.totalTyres ?? vehicle.tyreCount ?? vehicle.currentTyreCount;
  if (typeof total === "number" && total > 0) {
    return `${total} Tyre`;
  }
  return "";
};

const getBodySizeLine = (vehicle: Vehicle) => {
  if (vehicle.bodyLength) return formatBodyLengthShort(vehicle.bodyLength);
  if (vehicle.trailerLength) return formatBodyLengthShort(vehicle.trailerLength);
  if (vehicle.bodyDimensions) return formatBodyLengthShort(vehicle.bodyDimensions);
  return "";
};

const getBodyTyreSummary = (vehicle: Vehicle) => {
  const tyreLine = getTyreLine(vehicle);
  const bodyLength = getBodySizeLine(vehicle);
  const bodyType = toReadableLabel(vehicle.bodyApplicationType || vehicle.trailerType || vehicle.bodyType || vehicle.vehicleSubType);
  return [tyreLine, bodyLength, bodyType].filter(Boolean).join(" ").trim();
};

const getAssetConfiguration = (vehicle: Vehicle) => toUpperLabel(vehicle.assetConfiguration);

const buildChips = (vehicle: Vehicle): string[] => {
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

  // Priority order per spec
  if (vehicle.bsNorm) addChip(toReadableLabel(vehicle.bsNorm));

  const transferToken = toNormalizedToken(vehicle.transferType);
  if (transferToken === "RC_TRANSFER") addChip("RC Transfer");
  else if (transferToken === "RTO_NOC") addChip("RTO NOC");
  else if (transferToken === "OPEN_NOC") addChip("Open NOC");
  const gvw = String(vehicle.gvwTonnes ?? "").trim();
  if (gvw) addChip(gvw.toLowerCase().includes("ton") ? `${gvw} GVW` : `${gvw} Ton GVW`);
  if (typeof vehicle.parkingDue === "number") addChip(vehicle.parkingDue > 0 ? "Parking Due" : "No Parking Due");
  if (vehicle.tyreMountStatus) addChip(toReadableLabel(vehicle.tyreMountStatus));
  if (vehicle.tyreCondition) addChip(toReadableLabel(vehicle.tyreCondition));
  if (vehicle.suspensionType) addChip(toReadableLabel(vehicle.suspensionType));
  if (vehicle.bodyType) addChip(toReadableLabel(vehicle.bodyType));

  return chips;
};

const getChipClass = (chip: string) => {
  if (chip === "RC Transfer" || chip === "RTO NOC" || chip === "Open NOC") return "bg-blue-50 text-blue-700";
  return "bg-slate-100 text-slate-700";
};

export function VehicleCard({ vehicle, compact = false }: Props) {
  const title = getTitle(vehicle);
  const listingTypeTag = getListingTypeTag(vehicle);
  const bodyTyreSummary = getBodyTyreSummary(vehicle);
  const usageType = getAssetConfiguration(vehicle);
  const price = vehicle.expectedPrice ?? vehicle.price;
  const kmValue = vehicle.kmDriven ?? vehicle.odometerReading ?? null;
  const kmLine = formatIndianKmShort(kmValue);
  const chips = buildChips(vehicle);
  const visibleChips = chips.slice(0, compact ? 3 : 4);
  const extraChipCount = chips.length - visibleChips.length;
  const imageSources = useMemo(
    () => [...new Set([vehicle.image, ...(vehicle.gallery || [])].filter(Boolean).map((src) => resolveImageSrcForRender(src as string)))],
    [vehicle.gallery, vehicle.image]
  );
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const safeImageIndex = imageSources.length ? Math.min(activeImageIndex, imageSources.length - 1) : 0;
  const activeImage = imageSources[safeImageIndex] ?? resolveImageSrcForRender(vehicle.image || vehicle.gallery[0] || "");
  const onPrevImage = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (imageSources.length <= 1) return;
    setActiveImageIndex((prev) => (prev - 1 + imageSources.length) % imageSources.length);
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
      className={`flex ${CARD_HEIGHT_CLASS} overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm`}
    >
      <div className="relative w-[38%] shrink-0 self-stretch overflow-hidden bg-black">
        <SafeImage
          src={activeImage}
          alt={vehicle.title}
          fill
          sizes="(max-width: 768px) 38vw, 200px"
          className="object-cover object-center opacity-60 blur-md scale-110"
          loading="lazy"
          logContext={{ component: "VehicleCardBlur", vehicleId: vehicle.id }}
        />
        <SafeImage
          src={activeImage}
          alt={vehicle.title}
          fill
          sizes="(max-width: 768px) 38vw, 200px"
          className="object-contain object-center p-1"
          loading="lazy"
          logContext={{ component: "VehicleCard", vehicleId: vehicle.id }}
        />
        <SaveHeartButton vehicleId={vehicle.id} vehicle={vehicle} className="absolute right-1.5 top-1.5 z-20" />
        {imageSources.length > 1 ? (
          <>
            <button
              type="button"
              onClick={onPrevImage}
              aria-label="Previous image"
              className="absolute left-1 top-1/2 z-20 inline-flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-white"
            >
              <ChevronLeft className="h-3 w-3" />
            </button>
            <button
              type="button"
              onClick={onNextImage}
              aria-label="Next image"
              className="absolute right-1 top-1/2 z-20 inline-flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-white"
            >
              <ChevronRight className="h-3 w-3" />
            </button>
            <span className="absolute bottom-1 left-1/2 z-20 -translate-x-1/2 rounded bg-black/55 px-1.5 py-0.5 text-[10px] font-medium text-white">
              {safeImageIndex + 1} / {imageSources.length}
            </span>
          </>
        ) : null}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-0.5 p-2">
        <span className="inline-flex w-fit rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-700">
          {listingTypeTag}
        </span>
        <h3 className="truncate text-[12px] font-semibold leading-tight text-slate-900">{title}</h3>
        {bodyTyreSummary ? <p className="truncate text-[10px] leading-tight text-slate-600">{bodyTyreSummary}</p> : null}
        {usageType ? (
          <p className="truncate text-[10px] font-medium leading-tight text-slate-600">{usageType}</p>
        ) : null}
        <p className="truncate text-sm font-bold leading-tight text-slate-900">{formatIndianPriceShort(price)}</p>
        {kmLine ? <p className="truncate text-[10px] leading-tight text-slate-600">{kmLine}</p> : null}
        {visibleChips.length > 0 ? (
          <div className="flex min-w-0 items-center gap-1 overflow-hidden">
            {visibleChips.map((chip) => (
              <span key={chip} className={`inline-flex ${CHIP_MAX_WIDTH_CLASS} truncate rounded px-1.5 py-0.5 text-[9px] font-medium ${getChipClass(chip)}`}>
                {chip}
              </span>
            ))}
            {extraChipCount > 0 ? (
              <span className="inline-flex shrink-0 rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-medium text-slate-700">
                +{extraChipCount} More
              </span>
            ) : null}
          </div>
        ) : null}
        {vehicle.sellerRole ? (
          <span className="inline-flex w-fit truncate rounded bg-slate-900/90 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-white">
            {toUpperLabel(vehicle.sellerRole)}
          </span>
        ) : null}
        <div className="mt-auto flex items-center gap-1 pt-0.5">
          <WhatsAppButton
            phone={vehicle.sellerPhone}
            text="WhatsApp"
            className="min-h-7 flex-1 rounded-md px-2 text-[10px] font-semibold"
            vehicleId={vehicle.id}
          />
          <Link
            href={`/vehicles/${vehicle.id}`}
            className="inline-flex min-h-7 flex-1 items-center justify-center rounded-md border border-slate-200 px-2 text-[10px] font-semibold text-slate-700"
          >
            View Details
          </Link>
          <ShareListingButton
            listingId={vehicle.id}
            title={title}
            location={vehicle.vehicleOrYardLocation || [vehicle.city, vehicle.state].filter(Boolean).join(", ")}
            price={price}
            variant="icon"
            className="h-7 w-7 shrink-0 rounded-md border border-slate-200 bg-white text-slate-700 shadow-none hover:bg-slate-50"
          />
        </div>
      </div>
    </motion.article>
  );
}
