"use client";

import Link from "next/link";
import { MapPin, Share2 } from "lucide-react";
import { motion } from "framer-motion";
import { formatCurrency } from "@/data/vehicles";
import { Vehicle } from "@/types/vehicle";
import { VerificationBadge } from "@/components/ui/verification-badge";
import { WhatsAppButton } from "@/components/ui/whatsapp-button";
import { SaveHeartButton } from "@/components/ui/save-heart-button";
import { resolveImageSrcForRender } from "@/lib/media";
import { SafeImage } from "@/components/ui/safe-image";

type Props = {
  vehicle: Vehicle;
  compact?: boolean;
};

export function VehicleCard({ vehicle, compact = false }: Props) {
  const displayLocation =
    vehicle.vehicleOrYardLocation ||
    [vehicle.city, vehicle.state].filter(Boolean).join(", ");
  const preferredImage = resolveImageSrcForRender(vehicle.image || vehicle.gallery[0]);
  const isTrailerOnly = vehicle.assetConfiguration === "Trailer Only";
  const isPrimeMoverOnly = vehicle.assetConfiguration === "Power / Horse / Tractor / Prime Mover Only";
  const vehicleMeta = vehicle as Vehicle & {
    transferType?: string | null;
    emissionNorms?: string | null;
    emissionStandard?: string | null;
    bsNorm?: string | null;
    parkingDue?: string | null;
    noParkingDue?: boolean | null;
  };

  const baseVehicleTitle = [vehicle.year, vehicle.brand, vehicle.model, vehicle.axleType].filter(Boolean).join(" ");
  const trailerDetail = [vehicle.trailerLength, vehicle.trailerType].filter(Boolean).join(" ").trim();
  const bodyDetail = [vehicle.bodyDimensions, vehicle.bodyType].filter(Boolean).join(" ").trim();

  const title = isTrailerOnly
    ? [vehicle.year, trailerDetail || vehicle.title].filter(Boolean).join(" ").replace(/\s+/g, " ").trim()
    : baseVehicleTitle;

  const subtitle = (() => {
    if (isTrailerOnly) return "";
    if (trailerDetail) return trailerDetail.toLowerCase().includes("trailer") ? trailerDetail : `${trailerDetail} Trailer`;
    if (bodyDetail) return bodyDetail.toLowerCase().includes("body") ? bodyDetail : `${bodyDetail} Body`;
    if (isPrimeMoverOnly) return "";
    return "";
  })();

  const tyreCount = vehicle.currentTyreCount ?? vehicle.tyreCount;
  const transferChip = vehicleMeta.transferType
    ? vehicleMeta.transferType.replace(/_/g, " ").trim()
    : vehicle.nocStatus === "AVAILABLE"
      ? "RC Transfer"
      : vehicle.nocStatus === "NOT_AVAILABLE"
        ? "No RC Transfer"
        : "";
  const emissionChip = (
    vehicleMeta.bsNorm ||
    vehicleMeta.emissionNorms ||
    vehicleMeta.emissionStandard ||
    ""
  )
    .toString()
    .trim();
  const parkingChip = vehicleMeta.noParkingDue
    ? "No Parking Due"
    : vehicleMeta.parkingDue
      ? "Parking Due"
      : "";

  const chips = [
    typeof tyreCount === "number" && tyreCount > 0 ? `${tyreCount} Tyre` : "",
    emissionChip,
    transferChip,
    vehicle.gvwTonnes ? `${vehicle.gvwTonnes} Ton GVW` : "",
    parkingChip,
  ].filter(Boolean);
  const visibleChips = chips.slice(0, 4);
  const hiddenChipCount = Math.max(chips.length - visibleChips.length, 0);

  const handleShare = async () => {
    const shareUrl =
      typeof window !== "undefined" ? `${window.location.origin}/vehicles/${vehicle.id}` : `/vehicles/${vehicle.id}`;
    try {
      if (navigator.share) {
        await navigator.share({ title, text: subtitle || title, url: shareUrl });
        return;
      }
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      }
    } catch {
      // no-op
    }
  };

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
          <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${vehicle.listingType === "REPO" ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}>
            {vehicle.listingType === "REPO" ? "REPO" : "REGULAR"}
          </span>
          <h3 className="mt-1 text-[13.5px] font-semibold leading-tight text-slate-900">
            <Link href={`/vehicles/${vehicle.id}`} className="hover:text-emerald-700">
              {title}
            </Link>
          </h3>
          {subtitle ? <p className="mt-0.5 text-[12px] leading-tight text-slate-500">{subtitle}</p> : null}
        </div>

        <div className="flex items-center gap-1 text-xs text-slate-500">
          <MapPin className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{displayLocation || "Location unavailable"}</span>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {visibleChips.map((chip) => (
            <span key={chip} className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[10.5px] font-medium leading-none text-slate-700">
              {chip}
            </span>
          ))}
          {hiddenChipCount > 0 ? (
            <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[10.5px] font-medium leading-none text-slate-700">
              +{hiddenChipCount} More
            </span>
          ) : null}
          {vehicle.verifiedBadges.slice(0, 1).map((badge) => (
            <VerificationBadge key={badge} label={badge} />
          ))}
        </div>

        <div className="space-y-1">
          <p className="text-[22px] font-semibold leading-tight text-slate-900">{formatCurrency(vehicle.expectedPrice ?? vehicle.price)}</p>
          {!isTrailerOnly ? (
            <p className="text-xs text-slate-500">Running: {vehicle.runningCondition ?? vehicle.condition}</p>
          ) : null}
          {vehicle.listingType === "REPO" ? (
            <>
              <p className="text-xs text-slate-500">Finance: {vehicle.financeCompany}</p>
              <p className="text-xs text-slate-500">Repo Status: {vehicle.repoStatus}</p>
            </>
          ) : null}
          <p className="text-xs text-slate-500">Seller: {vehicle.businessName || vehicle.sellerName} • {vehicle.sellerRole}</p>
        </div>

        <div className="flex items-center gap-2">
          <WhatsAppButton phone={vehicle.sellerPhone} text="WhatsApp" className="w-full" vehicleId={vehicle.id} />
          <button
            type="button"
            onClick={handleShare}
            aria-label="Share listing"
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-700 transition hover:bg-slate-50"
          >
            <Share2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </motion.article>
  );
}
