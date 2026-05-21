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
          <h3 className="text-base font-semibold text-slate-900">{vehicle.title}</h3>
          <p className="mt-1 text-sm text-slate-500">
            {vehicle.year} • {vehicle.brand}
          </p>
        </div>

        <div className="flex items-center gap-1 text-sm text-slate-500">
          <MapPin className="h-4 w-4" />
          {vehicle.city}, {vehicle.state}
        </div>

        <div className="flex flex-wrap gap-2">
          {vehicle.verifiedBadges.slice(0, 1).map((badge) => (
            <VerificationBadge key={badge} label={badge} />
          ))}
        </div>

        <div className="space-y-1">
          <p className="text-xs text-slate-500">Finance: {vehicle.financeCompany}</p>
          <p className="text-lg font-semibold text-slate-900">{formatCurrency(vehicle.price)}</p>
          <p className="text-xs text-slate-500">Reserve: {formatCurrency(vehicle.reservePrice)}</p>
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
