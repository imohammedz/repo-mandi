"use client";

import Link from "next/link";
import { MapPin } from "lucide-react";
import { motion } from "framer-motion";
import { formatCurrency } from "@/data/vehicles";
import { Vehicle } from "@/types/vehicle";
import { WhatsAppButton } from "@/components/ui/whatsapp-button";
import { SaveHeartButton } from "@/components/ui/save-heart-button";
import { resolveImageSrcForRender } from "@/lib/media";
import { SafeImage } from "@/components/ui/safe-image";
import { formatEnumLabel } from "@/lib/formatting";
import { normalizeClassification } from "@/lib/vehicle-classification";

type Props = {
  vehicle: Vehicle;
  compact?: boolean;
};

const SUSPENSION_PATTERN = /suspension/i;
const TRAILER_ONLY_PATTERN = /trailer only/i;
const PRIME_MOVER_ONLY_PATTERN = /(prime mover only|power\s*\/\s*horse\s*\/\s*tractor\s*\/\s*prime mover only)/i;
const PRIME_WITH_TRAILER_PATTERN = /prime mover \+ trailer/i;
const MAX_CHIPS_VISIBLE = 3;

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

const combineMetaParts = (parts: string[]) => {
  const seen = new Set<string>();
  return parts
    .map((part) => part.trim())
    .filter(Boolean)
    .filter((part) => {
      const key = part.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .join(" • ");
};

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
    const bodyType = toReadableLabel(vehicle.bodyApplicationType || vehicle.trailerType || vehicle.bodyType || vehicle.vehicleSubType);
    const trailerLabel = bodyType.toLowerCase().includes("trailer") ? bodyType : [bodyType, "Trailer"].filter(Boolean).join(" ");
    const built = [length, trailerLabel].filter(Boolean).join(" ").trim();
    return built || toReadableLabel(vehicle.title);
  }

  const brand = toReadableLabel(vehicle.brand).replace(/\s+motors$/i, "");
  const built = [
    vehicle.year ? String(vehicle.year) : "",
    brand,
    toReadableLabel(vehicle.model),
    toReadableLabel(vehicle.axleConfiguration || vehicle.axleType),
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

  return built || toReadableLabel(vehicle.title);
};

const getSecondaryLines = (vehicle: Vehicle, isTrailerOnly: boolean) => {
  const lines: string[] = [];
  const usageType = getUsageType(vehicle, isTrailerOnly);

  if (isTrailerOnly) {
    if (typeof vehicle.numberOfAxles === "number" && vehicle.numberOfAxles > 0) {
      lines.push(`${vehicle.numberOfAxles} ${vehicle.numberOfAxles === 1 ? "Axle" : "Axles"}`);
    }
    if (vehicle.suspensionType) {
      const suspension = toReadableLabel(vehicle.suspensionType);
      lines.push(SUSPENSION_PATTERN.test(suspension) ? suspension : `${suspension} Suspension`);
    }
    if (usageType) lines.push(usageType);
    return lines;
  }

  const totalTyres = vehicle.totalTyres ?? vehicle.tyreCount ?? vehicle.currentTyreCount;
  if (typeof totalTyres === "number" && totalTyres > 0) {
    lines.push(`${totalTyres} ${totalTyres === 1 ? "Tyre" : "Tyres"}`);
  }

  const usageIsPrimeWithTrailer = usageType === "Prime Mover + Trailer";
  const bodyType = toReadableLabel(vehicle.bodyApplicationType || vehicle.vehicleSubType || vehicle.bodyType);
  const trailerLength = toReadableLabel(vehicle.trailerLength || vehicle.bodyLength);

  if (usageIsPrimeWithTrailer) {
    lines.push(combineMetaParts(["Body Trailer", trailerLength]));
  } else if (bodyType || trailerLength) {
    lines.push(combineMetaParts([bodyType, trailerLength]));
  }

  if (usageType) lines.push(usageType);
  return lines.filter(Boolean);
};

const getTyreSummary = (vehicle: Vehicle) => {
  const tyreMountStatusToken = toNormalizedToken(vehicle.tyreMountStatus);
  const mountStatus =
    tyreMountStatusToken === "ON_DISC"
      ? "On Disc"
      : tyreMountStatusToken === "TYRES_ONLY"
        ? "Tyres Only"
        : tyreMountStatusToken === "NO_TYRES"
          ? "No Tyres"
          : tyreMountStatusToken === "PARTIAL"
            ? "Partial"
            : "";

  const tyreConditionToken = toNormalizedToken(vehicle.tyreCondition);
  const condition =
    tyreConditionToken === "AROUND_50"
      ? "50%"
      : tyreConditionToken
        ? toReadableLabel(tyreConditionToken)
        : "";

  if (!mountStatus && !condition) return "";
  return `Tyre: ${[mountStatus || "Unknown", condition].filter(Boolean).join(" • ")}`;
};

const getTransferType = (vehicle: Vehicle) => {
  const transferToken = toNormalizedToken(vehicle.transferType);
  if (transferToken === "RC_TRANSFER") return "RC Transfer";
  if (transferToken === "RTO_NOC") return "RTO NOC";
  if (transferToken === "OPEN_NOC") return "Open NOC";
  if (transferToken === "UNKNOWN") return "Unknown";

  const legacyNocToken = toNormalizedToken(vehicle.nocStatus);
  if (legacyNocToken === "AVAILABLE") return "RC Transfer";
  if (legacyNocToken === "NOT_AVAILABLE" || legacyNocToken === "UNKNOWN") return "Unknown";
  return "Unknown";
};

const getDisplayLocation = (vehicle: Vehicle) => {
  const location = vehicle.vehicleOrYardLocation || [vehicle.city, vehicle.state].filter(Boolean).join(", ");
  const registration = vehicle.registrationState?.trim();
  if (registration && location) return `${registration} • ${location}`;
  return registration || location || "Location unavailable";
};

const buildCommercialChips = (vehicle: Vehicle) => {
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

  if (vehicle.listingType === "REPO") addChip("Repo");
  if (vehicle.listingType === "REPO" && vehicle.repoStatus) addChip(toReadableLabel(vehicle.repoStatus));
  if (vehicle.bsNorm) addChip(toReadableLabel(vehicle.bsNorm));
  if (vehicle.photosVerified) addChip("Photos Verified");
  if (vehicle.rcVerified) addChip("RC Verified");
  if (vehicle.yardVerified) addChip("Yard Verified");
  if (vehicle.sellerVerified) addChip("Verified Seller");

  return chips;
};

const getChipClass = (chip: string) => {
  if (chip === "Repo") return "bg-amber-50 text-amber-700";
  if (chip.includes("Verified")) return "bg-emerald-50 text-emerald-700";
  return "bg-slate-100 text-slate-700";
};

export function VehicleCard({ vehicle, compact = false }: Props) {
  const classification = normalizeClassification({
    assetStructure: vehicle.assetStructure,
    detachableType: vehicle.detachableType,
    assetConfiguration: vehicle.assetConfiguration,
  });
  const isTrailerOnly = classification.assetStructure === "DETACHABLE" && classification.detachableType === "TRAILER";
  const title = getTitle(vehicle, isTrailerOnly);
  const secondaryLines = getSecondaryLines(vehicle, isTrailerOnly);
  const tyreSummary = getTyreSummary(vehicle);
  const displayLocation = getDisplayLocation(vehicle);
  const transferType = getTransferType(vehicle);
  const kmLine =
    typeof vehicle.kmDriven === "number" && vehicle.kmDriven > 0
      ? `${vehicle.kmDriven.toLocaleString("en-IN")} KM`
      : typeof vehicle.odometerReading === "number" && vehicle.odometerReading > 0
        ? `${vehicle.odometerReading.toLocaleString("en-IN")} KM`
        : "";
  const chips = buildCommercialChips(vehicle);
  const visibleChips = chips.slice(0, MAX_CHIPS_VISIBLE);
  const extraChipCount = chips.length - visibleChips.length;
  const preferredImage = resolveImageSrcForRender(vehicle.image || vehicle.gallery[0]);

  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm"
    >
      <div className="relative">
        <SafeImage
          src={preferredImage}
          alt={vehicle.title}
          width={1200}
          height={800}
          className={compact ? "h-40 w-full object-cover" : "h-52 w-full object-cover"}
          logContext={{ component: "VehicleCard", vehicleId: vehicle.id }}
        />
        <SaveHeartButton vehicleId={vehicle.id} vehicle={vehicle} className="absolute right-3 top-3" />
      </div>

      <div className="space-y-3 p-4">
        <div className="space-y-1">
          <h3 className="text-base font-semibold leading-snug text-slate-900">{title}</h3>
          {secondaryLines.map((line) => (
            <p key={line} className="text-sm text-slate-600">
              {line}
            </p>
          ))}
        </div>

        {kmLine ? <p className="text-sm text-slate-600">{kmLine}</p> : null}
        {tyreSummary ? <p className="text-sm text-slate-600">{tyreSummary}</p> : null}

        <div className="flex items-center gap-1 text-sm text-slate-600">
          <MapPin className="h-4 w-4" />
          {displayLocation}
        </div>

        <p className="text-sm text-slate-600">Transfer: {transferType}</p>

        <p className="text-lg font-semibold text-slate-900">{formatCurrency(vehicle.expectedPrice ?? vehicle.price)}</p>

        {visibleChips.length > 0 ? (
          <div className="flex flex-wrap items-center gap-1.5">
            {visibleChips.map((chip) => (
              <span key={chip} className={`inline-flex rounded-full px-2 py-1 text-[11px] font-medium ${getChipClass(chip)}`}>
                {chip}
              </span>
            ))}
            {extraChipCount > 0 ? (
              <span className="inline-flex rounded-full bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-700">
                +{extraChipCount} More
              </span>
            ) : null}
          </div>
        ) : null}

        <div className="grid grid-cols-2 gap-2">
          <WhatsAppButton phone={vehicle.sellerPhone} text="WhatsApp" className="w-full" vehicleId={vehicle.id} />
          <Link
            href={`/vehicles/${vehicle.id}`}
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700"
          >
            View Details
          </Link>
        </div>
      </div>
    </motion.article>
  );
}
