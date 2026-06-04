"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Vehicle } from "@/types/vehicle";
import { WhatsAppButton } from "@/components/ui/whatsapp-button";
import { SaveHeartButton } from "@/components/ui/save-heart-button";
import { resolveImageSrcForRender } from "@/lib/media";
import { SafeImage } from "@/components/ui/safe-image";
import { formatEnumLabel, formatIndianShort } from "@/lib/formatting";
import { normalizeClassification } from "@/lib/vehicle-classification";

type Props = {
  vehicle: Vehicle;
  compact?: boolean;
};

const TRAILER_ONLY_PATTERN = /trailer only/i;
const PRIME_MOVER_ONLY_PATTERN = /(prime mover only|power\s*\/\s*horse\s*\/\s*tractor\s*\/\s*prime mover only)/i;
const PRIME_WITH_TRAILER_PATTERN = /prime mover \+ trailer/i;
const MAX_CHIPS_VISIBLE = 2;

const toReadableLabel = (value: string | null | undefined) => {
  if (!value) return "";
  return formatEnumLabel(value) || value;
};

const toNormalizedToken = (value: string | null | undefined) =>
  value
    ?.toString()
    .trim()
    .replace(/[\s\-]+/g, "_")
    .toUpperCase() ?? "";

const getUsageType = (vehicle: Vehicle, isTrailerOnly: boolean) => {
  const assetConfiguration = vehicle.assetConfiguration || "";
  if (PRIME_WITH_TRAILER_PATTERN.test(assetConfiguration)) return "Prime Mover + Trailer";
  if (PRIME_MOVER_ONLY_PATTERN.test(assetConfiguration)) return "Prime Mover Only";
  if (TRAILER_ONLY_PATTERN.test(assetConfiguration) || isTrailerOnly) return "Trailer Only";
  return toReadableLabel(assetConfiguration) || "";
};

const getTitle = (vehicle: Vehicle, isTrailerOnly: boolean) => {
  if (isTrailerOnly) {
    const length = toReadableLabel(vehicle.trailerLength || vehicle.bodyLength);
    const bodyType = toReadableLabel(
      vehicle.bodyApplicationType || vehicle.trailerType || vehicle.bodyType || vehicle.vehicleSubType
    );
    const trailerLabel = bodyType.toLowerCase().includes("trailer") ? bodyType : [bodyType, "Trailer"].filter(Boolean).join(" ");
    const built = [length, trailerLabel].filter(Boolean).join(" ").trim();
    return built || toReadableLabel(vehicle.title);
  }

  const brand = toReadableLabel(vehicle.brand).replace(/\s+motors$/i, "");
  const built = [vehicle.year ? String(vehicle.year) : "", brand, toReadableLabel(vehicle.model)]
    .filter(Boolean)
    .join(" ")
    .trim();

  return built || toReadableLabel(vehicle.title);
};

const getSecondLine = (vehicle: Vehicle, isTrailerOnly: boolean) => {
  if (isTrailerOnly) {
    const parts: string[] = [];
    if (typeof vehicle.numberOfAxles === "number" && vehicle.numberOfAxles > 0) {
      parts.push(`${vehicle.numberOfAxles}${vehicle.numberOfAxles === 1 ? " Axle" : " Axles"}`);
    }
    const bodyType = toReadableLabel(vehicle.bodyApplicationType || vehicle.trailerType || vehicle.bodyType || vehicle.vehicleSubType);
    if (bodyType) parts.push(bodyType);
    return parts.join(" ").trim();
  }

  const axle = toReadableLabel(vehicle.axleConfiguration || vehicle.axleType);
  const bodyType = toReadableLabel(vehicle.bodyApplicationType || vehicle.vehicleSubType || vehicle.bodyType);
  return [axle, bodyType].filter(Boolean).join(" ").trim();
};

const getTyreLine = (vehicle: Vehicle) => {
  const total = vehicle.totalTyres ?? vehicle.tyreCount ?? vehicle.currentTyreCount;
  if (typeof total === "number" && total > 0) {
    return `${total} ${total === 1 ? "Tyre" : "Tyre"}`;
  }
  return "";
};

const getDimensionsLine = (vehicle: Vehicle) => {
  return vehicle.bodyDimensions?.trim() || "";
};

const getDisplayLocation = (vehicle: Vehicle) => {
  return vehicle.vehicleOrYardLocation || [vehicle.city, vehicle.state].filter(Boolean).join(", ") || "";
};

const getBadges = (vehicle: Vehicle): string[] => {
  const badges: string[] = [];
  if (vehicle.listingType === "REPO") {
    badges.push("REPO DEAL");
    if (vehicle.repoStatus === "Bank Seized") badges.push("BANK SEIZED");
  }
  if (vehicle.isFeatured) badges.push("FEATURED");
  if (badges.length === 0 && vehicle.listingType !== "REPO") badges.push("USED VEHICLE");
  return badges.slice(0, 2);
};

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

  if (vehicle.rcVerified) addChip("RC Verified");
  if (vehicle.photosVerified) addChip("Photos Verified");
  if (vehicle.sellerVerified) addChip("Verified Seller");

  return chips;
};

const getBadgeClass = (badge: string) => {
  if (badge === "REPO DEAL") return "bg-red-600 text-white";
  if (badge === "BANK SEIZED") return "bg-amber-600 text-white";
  if (badge === "FEATURED") return "bg-indigo-600 text-white";
  return "bg-slate-600 text-white";
};

const getChipClass = (chip: string) => {
  if (chip.includes("Verified")) return "bg-emerald-50 text-emerald-700";
  if (chip === "RC Transfer" || chip === "RTO NOC" || chip === "Open NOC") return "bg-blue-50 text-blue-700";
  return "bg-slate-100 text-slate-700";
};

export function VehicleCard({ vehicle }: Props) {
  const classification = normalizeClassification({
    assetStructure: vehicle.assetStructure,
    detachableType: vehicle.detachableType,
    assetConfiguration: vehicle.assetConfiguration,
  });
  const isTrailerOnly = classification.assetStructure === "DETACHABLE" && classification.detachableType === "TRAILER";
  const title = getTitle(vehicle, isTrailerOnly);
  const secondLine = getSecondLine(vehicle, isTrailerOnly);
  const tyreLine = getTyreLine(vehicle);
  const usageType = getUsageType(vehicle, isTrailerOnly);
  const dimensionsLine = getDimensionsLine(vehicle);
  const displayLocation = getDisplayLocation(vehicle);
  const price = vehicle.expectedPrice ?? vehicle.price;
  const badges = getBadges(vehicle);
  const chips = buildChips(vehicle);
  const visibleChips = chips.slice(0, MAX_CHIPS_VISIBLE);
  const extraChipCount = chips.length - visibleChips.length;
  const preferredImage = resolveImageSrcForRender(vehicle.image || vehicle.gallery[0]);

  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="flex overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm"
    >
      {/* Image — 38% width, full card height */}
      <div className="relative w-[38%] shrink-0 self-stretch bg-black">
        <SafeImage
          src={preferredImage}
          alt={vehicle.title}
          fill
          sizes="(max-width: 768px) 38vw, 200px"
          className="object-cover object-center"
          loading="lazy"
          logContext={{ component: "VehicleCard", vehicleId: vehicle.id }}
        />
        <SaveHeartButton vehicleId={vehicle.id} vehicle={vehicle} className="absolute right-2 top-2 z-20" />
      </div>

      {/* Details */}
      <div className="flex min-w-0 flex-1 flex-col gap-1.5 p-3">
        {/* Badges */}
        {badges.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {badges.map((badge) => (
              <span key={badge} className={`inline-flex rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${getBadgeClass(badge)}`}>
                {badge}
              </span>
            ))}
          </div>
        )}

        {/* Title */}
        <h3 className="truncate text-sm font-semibold leading-snug text-slate-900">{title}</h3>

        {/* Second line: Axle + Body Type */}
        {secondLine ? (
          <p className="truncate text-xs text-slate-600">{secondLine}</p>
        ) : null}

        {/* Tyre line */}
        {tyreLine ? (
          <p className="truncate text-xs text-slate-500">{tyreLine}</p>
        ) : null}

        {/* Configuration line */}
        {usageType ? (
          <p className="truncate text-xs text-slate-500">{usageType}</p>
        ) : null}

        {/* Dimensions */}
        {dimensionsLine ? (
          <p className="truncate text-xs text-slate-500">{dimensionsLine}</p>
        ) : null}

        {/* Price */}
        <p className="text-base font-bold text-slate-900">{formatIndianShort(price)}</p>

        {/* Location */}
        {displayLocation ? (
          <p className="truncate text-xs text-slate-500">
            📍 {displayLocation}
          </p>
        ) : null}

        {/* Business name */}
        {vehicle.businessName ? (
          <p className="truncate text-xs font-medium text-slate-700">{vehicle.businessName}</p>
        ) : null}

        {/* Seller info */}
        {vehicle.sellerName ? (
          <p className="truncate text-xs text-slate-500">
            {[vehicle.sellerRole, vehicle.sellerName].filter(Boolean).join(" • ")}
          </p>
        ) : null}

        {/* Chips */}
        {visibleChips.length > 0 ? (
          <div className="flex flex-wrap items-center gap-1">
            {visibleChips.map((chip) => (
              <span key={chip} className={`inline-flex rounded px-1.5 py-0.5 text-[10px] font-medium ${getChipClass(chip)}`}>
                {chip}
              </span>
            ))}
            {extraChipCount > 0 ? (
              <span className="inline-flex rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-700">
                +{extraChipCount} More
              </span>
            ) : null}
          </div>
        ) : null}

        {/* Actions */}
        <div className="mt-auto flex gap-2 pt-1">
          <WhatsAppButton phone={vehicle.sellerPhone} text="WhatsApp" className="flex-1 text-xs" vehicleId={vehicle.id} />
          <Link
            href={`/vehicles/${vehicle.id}`}
            className="inline-flex flex-1 min-h-9 items-center justify-center rounded-lg border border-slate-200 px-2 text-xs font-semibold text-slate-700"
          >
            View Details
          </Link>
        </div>
      </div>
    </motion.article>
  );
}
