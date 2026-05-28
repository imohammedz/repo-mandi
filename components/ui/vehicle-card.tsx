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
import {
  getListingModeLabel,
  normalizeClassification,
} from "@/lib/vehicle-classification";

type Props = {
  vehicle: Vehicle;
  compact?: boolean;
};

const ASSET_STRUCTURE_TAG_LABELS = {
  STANDALONE: "Standalone",
  DETACHABLE: "Detachable",
  EQUIPMENT: "Equipment",
} as const;

const ASSET_CATEGORY_META_LABELS: Record<string, string> = {
  "SCV / LCV": "SCV / LCV",
  "Rigid Trucks": "Rigid Truck",
  "Prime Mover + Trailer": "Prime Mover",
  "Bus / Passenger Commercial": "Passenger",
  "Construction Equipment": "Construction Equipment",
  "Material Handling / Special Equipment": "Material Handling",
};

const asNormalizedToken = (value: string | null | undefined) =>
  value
    ?.toString()
    .trim()
    .replace(/[\s-]+/g, "_")
    .toUpperCase() ?? "";

const asReadable = (value: string | null | undefined) => {
  if (!value) return "";
  const formatted = formatEnumLabel(value);
  return formatted || value;
};

const dedupeSegments = (segments: string[]) => {
  const seen = new Set<string>();
  return segments
    .map((segment) => segment.trim())
    .filter(Boolean)
    .filter((segment) => {
      const key = segment.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .join(" ");
};

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

const composeTrailerMetaValue = (bodyApplicationType: string, trailerLength: string) => {
  if (!bodyApplicationType) return trailerLength;
  if (!trailerLength) return bodyApplicationType;
  if (bodyApplicationType.toLowerCase().includes(trailerLength.toLowerCase())) return bodyApplicationType;
  return `${bodyApplicationType} ${trailerLength}`;
};

const buildListingTitle = (vehicle: Vehicle) => {
  const classification = normalizeClassification({
    assetStructure: vehicle.assetStructure,
    detachableType: vehicle.detachableType,
    assetConfiguration: vehicle.assetConfiguration,
  });
  const bodyApplicationType = asReadable(vehicle.bodyApplicationType || vehicle.vehicleSubType);
  const trailerLength = asReadable(vehicle.trailerLength || vehicle.bodyLength);
  const isTipper = /tipper/i.test(bodyApplicationType || "") || /tipper/i.test(vehicle.type || "");

  if (classification.assetStructure === "DETACHABLE" && classification.detachableType === "TRAILER") {
    const trailerTitle = composeTrailerMetaValue(bodyApplicationType, trailerLength);
    return trailerTitle || asReadable(vehicle.title);
  }

  if (classification.assetStructure === "EQUIPMENT") {
    return (
      dedupeSegments([
        String(vehicle.year || ""),
        asReadable(vehicle.brand),
        asReadable(vehicle.model),
        bodyApplicationType,
      ]) || asReadable(vehicle.title)
    );
  }

  if (isTipper) {
    return (
      dedupeSegments([
        String(vehicle.year || ""),
        asReadable(vehicle.brand),
        asReadable(vehicle.model),
        "Tipper",
      ]) || asReadable(vehicle.title)
    );
  }

  return (
    dedupeSegments([
      String(vehicle.year || ""),
      asReadable(vehicle.brand),
      asReadable(vehicle.model),
      bodyApplicationType,
    ]) || asReadable(vehicle.title)
  );
};

const buildMetaLine = (vehicle: Vehicle) => {
  const classification = normalizeClassification({
    assetStructure: vehicle.assetStructure,
    detachableType: vehicle.detachableType,
    assetConfiguration: vehicle.assetConfiguration,
  });
  const bodyApplicationType = asReadable(vehicle.bodyApplicationType || vehicle.vehicleSubType);
  const trailerLength = asReadable(vehicle.trailerLength || vehicle.bodyLength);
  const axleConfig = asReadable(vehicle.axleConfiguration || vehicle.axleType);
  const categoryLabel =
    ASSET_CATEGORY_META_LABELS[vehicle.assetCategory || ""] ||
    asReadable(vehicle.assetCategory || vehicle.type);

  if (classification.assetStructure === "DETACHABLE" && classification.detachableType === "TRAILER") {
    return combineMetaParts(["Trailer", composeTrailerMetaValue(bodyApplicationType, trailerLength)]);
  }

  const isPrimeMoverContext =
    classification.detachableType === "PRIME_MOVER" ||
    /prime mover/i.test(vehicle.assetCategory || "") ||
    /prime mover/i.test(bodyApplicationType || "");

  if (isPrimeMoverContext) {
    return combineMetaParts(["Prime Mover", axleConfig || bodyApplicationType]);
  }

  if (classification.assetStructure === "EQUIPMENT") {
    return combineMetaParts([categoryLabel || "Construction Equipment", bodyApplicationType || asReadable(vehicle.type)]);
  }

  return combineMetaParts([categoryLabel, bodyApplicationType]);
};

const buildConditionChips = (vehicle: Vehicle, showsRunning: boolean) => {
  const chips: string[] = [];
  const runningToken = asNormalizedToken(vehicle.runningCondition || vehicle.condition);
  const yesNoToken = (value: string | null | undefined) => asNormalizedToken(value);

  if (showsRunning && runningToken) {
    if (runningToken === "RUNNING") chips.push("Running");
    else if (runningToken === "NOT_RUNNING" || runningToken === "NON_RUNNING") chips.push("Not Running");
    else chips.push("Condition Unknown");
  }

  if (vehicle.bsNorm) chips.push(asReadable(vehicle.bsNorm));
  if (yesNoToken(vehicle.acCabin) === "YES") chips.push("AC Cabin");
  if (typeof vehicle.numberOfAxles === "number" && vehicle.numberOfAxles > 0) {
    chips.push(`${vehicle.numberOfAxles} ${vehicle.numberOfAxles === 1 ? "Axle" : "Axles"}`);
  }
  if (vehicle.suspensionType) {
    const suspension = asReadable(vehicle.suspensionType);
    chips.push(/suspension/i.test(suspension) ? suspension : `${suspension} Suspension`);
  }
  if (yesNoToken(vehicle.tyresIncluded) === "YES") chips.push("Tyres Included");
  else if (yesNoToken(vehicle.tyresIncluded) === "UNKNOWN") chips.push("Tyres Unknown");
  if (yesNoToken(vehicle.rimsDiscsIncluded) === "YES") chips.push("Rims Included");
  else if (yesNoToken(vehicle.rimsDiscsIncluded) === "UNKNOWN") chips.push("Rims Unknown");
  if (yesNoToken(vehicle.documentsAvailable) === "YES") chips.push("RC Available");
  if (yesNoToken(vehicle.keyAvailable) === "YES") chips.push("Keys Available");
  if (vehicle.listingType === "REPO" && vehicle.repoStatus) chips.push(asReadable(vehicle.repoStatus));

  return chips.slice(0, 8);
};

const buildVerificationBadges = (vehicle: Vehicle) => {
  const badges: string[] = [];
  if (vehicle.photosVerified) badges.push("Photos Verified");
  if (vehicle.rcVerified) badges.push("RC Verified");
  if (vehicle.sellerVerified) badges.push("Verified Seller");
  if (vehicle.yardVerified) badges.push("Yard Verified");
  for (const badge of vehicle.verifiedBadges || []) {
    const readableBadge = asReadable(badge);
    if (!badges.find((entry) => entry.toLowerCase() === readableBadge.toLowerCase())) {
      badges.push(readableBadge);
    }
  }
  return badges.slice(0, 3);
};

export function VehicleCard({ vehicle, compact = false }: Props) {
  const displayLocation =
    vehicle.vehicleOrYardLocation ||
    [vehicle.city, vehicle.state].filter(Boolean).join(", ");
  const classification = normalizeClassification({
    assetStructure: vehicle.assetStructure,
    detachableType: vehicle.detachableType,
    assetConfiguration: vehicle.assetConfiguration,
  });
  const showsRunning =
    classification.assetStructure === "STANDALONE" ||
    classification.assetStructure === "EQUIPMENT" ||
    classification.detachableType === "PRIME_MOVER";
  const title = buildListingTitle(vehicle);
  const metaLine = buildMetaLine(vehicle);
  const conditionChips = buildConditionChips(vehicle, showsRunning);
  const verificationBadges = buildVerificationBadges(vehicle);
  const sellerDisplayName = vehicle.businessName || vehicle.sellerName;
  const sellerRoleLabel = asReadable(vehicle.sellerRole);
  const preferredImage = resolveImageSrcForRender(vehicle.image || vehicle.gallery[0]);
  const topTags = [
    vehicle.listingType === "REPO" ? "Repo" : "Regular",
    getListingModeLabel(vehicle.listingMode),
    ASSET_STRUCTURE_TAG_LABELS[classification.assetStructure] || "Standalone",
  ].filter(Boolean);

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
        <div>
          <div className="mb-2 flex flex-wrap gap-1.5">
            {topTags.map((tag) => (
              <span
                key={tag}
                className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                  tag === "Repo"
                    ? "bg-amber-50 text-amber-700"
                    : tag === "Regular"
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-slate-100 text-slate-700"
                }`}
              >
                {tag}
              </span>
            ))}
          </div>
          <h3 className="text-base font-semibold leading-snug text-slate-900">{title}</h3>
          {metaLine ? <p className="mt-1 text-sm text-slate-500">{metaLine}</p> : null}
        </div>

        <div className="flex items-center gap-1 text-sm text-slate-500">
          <MapPin className="h-4 w-4" />
          {displayLocation || "Location unavailable"}
        </div>

        <p className="text-lg font-semibold text-slate-900">{formatCurrency(vehicle.expectedPrice ?? vehicle.price)}</p>

        {conditionChips.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {conditionChips.map((chip) => (
              <span key={chip} className="inline-flex rounded-full bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-700">
                {chip}
              </span>
            ))}
          </div>
        ) : null}

        {verificationBadges.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {verificationBadges.map((badge) => (
              <span key={badge} className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-medium text-emerald-700">
                ✓ {badge}
              </span>
            ))}
          </div>
        ) : null}

        <p className="text-xs text-slate-600">
          {sellerDisplayName}
          {sellerRoleLabel ? ` • ${sellerRoleLabel}` : ""}
        </p>

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
