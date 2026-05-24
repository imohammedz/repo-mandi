"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, MapPin } from "lucide-react";
import { motion } from "framer-motion";
import { formatCurrency } from "@/data/vehicles";
import { Vehicle } from "@/types/vehicle";
import { VerificationBadge } from "@/components/ui/verification-badge";
import { WhatsAppButton } from "@/components/ui/whatsapp-button";

type Props = {
  vehicle: Vehicle;
  compact?: boolean;
};

export function VehicleCard({ vehicle, compact = false }: Props) {
  const displayLocation =
    vehicle.vehicleOrYardLocation ||
    [vehicle.city, vehicle.state].filter(Boolean).join(", ");
  const isTrailerOnly = vehicle.assetConfiguration === "Trailer Only";
  const assetConfigurationLabel = vehicle.assetConfiguration ?? "Complete Vehicle";

  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm"
    >
      <div className="relative">
        <Image
          src={vehicle.image}
          alt={vehicle.title}
          width={1200}
          height={800}
          className={compact ? "h-40 w-full object-cover" : "h-52 w-full object-cover"}
        />
        <button className="absolute right-3 top-3 rounded-full bg-white/90 p-2 text-slate-600 shadow-sm">
          <Heart className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-3 p-4">
        <div>
          <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${vehicle.listingType === "REPO" ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}>
            {vehicle.listingType === "REPO" ? "REPO" : "REGULAR"}
          </span>
          <span className="ml-2 inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
            {assetConfigurationLabel}
          </span>
          <h3 className="text-base font-semibold text-slate-900">{vehicle.title}</h3>
          <p className="mt-1 text-sm text-slate-500">
            {[vehicle.type, vehicle.vehicleSubType].filter(Boolean).join(" • ")}
          </p>
          <p className="text-sm text-slate-500">
            {vehicle.brand} • {vehicle.model} • {vehicle.year}
          </p>
        </div>

        <div className="flex items-center gap-1 text-sm text-slate-500">
          <MapPin className="h-4 w-4" />
          {displayLocation || "Location unavailable"}
        </div>

        <div className="flex flex-wrap gap-2">
          {vehicle.verifiedBadges.slice(0, 1).map((badge) => (
            <VerificationBadge key={badge} label={badge} />
          ))}
        </div>

        <div className="space-y-1">
          <p className="text-lg font-semibold text-slate-900">{formatCurrency(vehicle.expectedPrice ?? vehicle.price)}</p>
          {typeof vehicle.kmDriven === "number" ? (
            <p className="text-xs text-slate-500">KM: {vehicle.kmDriven.toLocaleString("en-IN")}</p>
          ) : null}
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
