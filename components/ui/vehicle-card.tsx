"use client";

import { useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { MapPin, Truck } from "lucide-react";
import { Vehicle } from "@/types/vehicle";
import { WhatsAppButton } from "@/components/ui/whatsapp-button";
import { SaveHeartButton } from "@/components/ui/save-heart-button";
import { resolveImageSrcForRender, VEHICLE_IMAGE_PLACEHOLDER_SRC } from "@/lib/media";
import { SafeImage } from "@/components/ui/safe-image";
import { formatEnumLabel, formatIndianKmShort, formatIndianPriceShort } from "@/lib/formatting";

type Props = {
  vehicle: Vehicle;
  compact?: boolean;
};

const CARD_CLASS = "h-[182px] rounded-2xl";
const CHIP_MAX_WIDTH_CLASS = "max-w-[110px]";
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

const getTyreChip = (vehicle: Vehicle) => {
  const total = vehicle.totalTyres ?? vehicle.tyreCount ?? vehicle.currentTyreCount;
  if (typeof total === "number" && total > 0) {
    return `${total} Tyres`;
  }
  return "";
};

const getBodySizeLine = (vehicle: Vehicle) => {
  if (vehicle.bodyLength) return formatBodyLengthShort(vehicle.bodyLength);
  if (vehicle.trailerLength) return formatBodyLengthShort(vehicle.trailerLength);
  if (vehicle.bodyDimensions) return formatBodyLengthShort(vehicle.bodyDimensions);
  return "";
};

const getBodyTypeChip = (vehicle: Vehicle) => {
  const bodyLength = getBodySizeLine(vehicle);
  const bodyType = toReadableLabel(vehicle.bodyApplicationType || vehicle.trailerType || vehicle.bodyType || vehicle.vehicleSubType);
  return [bodyLength, bodyType].filter(Boolean).join(" ").trim();
};

const getRepoStatusTag = (vehicle: Vehicle) => {
  const repoStatusToken = toNormalizedToken(vehicle.repoStatus);
  if (repoStatusToken && repoStatusToken.includes("AUCTION")) return "AUCTION VEHICLE";
  return vehicle.listingType === "REPO" ? "BANK REPO" : "NON REPO";
};

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
  addChip(getBodyTypeChip(vehicle));
  addChip(getTyreChip(vehicle));

  return chips;
};

export function VehicleCard({ vehicle, compact = false }: Props) {
  const title = getTitle(vehicle);
  const listingTypeTag = getRepoStatusTag(vehicle);
  const price = vehicle.expectedPrice ?? vehicle.price;
  const kmValue = vehicle.kmDriven ?? vehicle.odometerReading ?? null;
  const kmLine = formatIndianKmShort(kmValue);
  const chips = buildSpecChips(vehicle);
  const visibleChips = chips.slice(0, compact ? 2 : 3);
  const locationLine = vehicle.vehicleOrYardLocation || [vehicle.city, vehicle.state].filter(Boolean).join(", ");
  const imageSources = useMemo(
    () => [...new Set([vehicle.image, ...(vehicle.gallery || [])].filter(isNonEmptyString).map((src) => resolveImageSrcForRender(src)))],
    [vehicle.gallery, vehicle.image]
  );
  const activeImage = imageSources[0] ?? VEHICLE_IMAGE_PLACEHOLDER_SRC;
  const imageCount = imageSources.length || 1;

  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className={`flex ${CARD_CLASS} overflow-hidden border border-slate-100 bg-white shadow-sm`}
    >
      <div className="relative w-[35%] shrink-0 self-stretch overflow-hidden bg-black">
        <SafeImage
          src={activeImage}
          alt={vehicle.title}
          aria-hidden="true"
          fill
          sizes="(max-width: 768px) 35vw, 200px"
          className="object-cover object-center"
          loading="lazy"
          logContext={{ component: "VehicleCard", vehicleId: vehicle.id }}
        />
        <SaveHeartButton vehicleId={vehicle.id} vehicle={vehicle} className="absolute right-1.5 top-1.5 z-20" />
        <span className="absolute bottom-1.5 left-1.5 z-20 rounded bg-black/55 px-1.5 py-0.5 text-[10px] font-medium text-white">
          {imageCount} {imageCount > 1 ? "Photos" : "Photo"}
        </span>
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1 p-2.5">
        <span className="inline-flex w-fit rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-700">
          {listingTypeTag}
        </span>
        <h3 className="truncate text-[13px] font-semibold leading-tight text-slate-900">{title}</h3>
        <p className="truncate text-lg font-extrabold leading-none text-slate-900">{formatIndianPriceShort(price)}</p>
        {(locationLine || kmLine) && (
          <div className="flex min-w-0 items-center gap-2 text-[11px] text-slate-600">
            {locationLine ? (
              <span className="inline-flex min-w-0 items-center gap-1 truncate">
                <MapPin className="h-3 w-3 shrink-0" aria-hidden="true" />
                <span className="truncate">{locationLine}</span>
              </span>
            ) : null}
            {kmLine ? (
              <span className="inline-flex min-w-0 items-center gap-1 truncate">
                <Truck className="h-3 w-3 shrink-0" aria-hidden="true" />
                <span className="truncate">{kmLine}</span>
              </span>
            ) : null}
          </div>
        )}
        {visibleChips.length > 0 ? (
          <div className="flex min-w-0 flex-wrap items-center gap-1 overflow-hidden">
            {visibleChips.map((chip) => (
              <span key={chip} className={`inline-flex ${CHIP_MAX_WIDTH_CLASS} truncate rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-medium text-slate-700`}>
                {chip}
              </span>
            ))}
          </div>
        ) : null}
        {vehicle.sellerRole ? (
          <span className="inline-flex w-fit truncate rounded-full bg-slate-900/90 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-white">
            {toReadableLabel(vehicle.sellerRole)}
          </span>
        ) : null}
        <div className="mt-auto flex items-center gap-1.5 pt-0.5">
          <WhatsAppButton
            phone={vehicle.sellerPhone}
            text="WhatsApp"
            className="min-h-8 flex-1 rounded-lg px-2 text-[10px] font-semibold"
            vehicleId={vehicle.id}
          />
          <Link
            href={`/vehicles/${vehicle.id}`}
            className="inline-flex min-h-8 flex-1 items-center justify-center rounded-lg border border-slate-300 px-2 text-[10px] font-semibold text-slate-700"
          >
            View Details
          </Link>
        </div>
      </div>
    </motion.article>
  );
}
