"use client";

import Link from "next/link";
import { MapPin } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { SaveHeartButton } from "@/components/ui/save-heart-button";
import { VerificationBadge } from "@/components/ui/verification-badge";
import { useSavedListings } from "@/components/providers/saved-listings-provider";
import { formatCurrency } from "@/data/vehicles";
import { resolveImageSrcForRender } from "@/lib/media";
import { SafeImage } from "@/components/ui/safe-image";

function formatSavedTime(timestamp: string) {
  const diff = Date.now() - new Date(timestamp).getTime();
  if (Number.isNaN(diff)) return "Recently";
  if (diff < 0) {
    console.warn("Saved listing has future timestamp", timestamp);
    return "Recently";
  }

  const minute = 60_000;
  const hour = minute * 60;
  const day = hour * 24;

  if (diff < hour) {
    const mins = Math.max(1, Math.floor(diff / minute));
    return `${mins}m ago`;
  }
  if (diff < day) {
    return `${Math.floor(diff / hour)}h ago`;
  }
  return `${Math.floor(diff / day)}d ago`;
}

export function SavedListingsPanel() {
  const { savedListings, isLoading, isAuthenticated } = useSavedListings();

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="h-28 animate-pulse rounded-2xl bg-slate-100" />
        <div className="h-28 animate-pulse rounded-2xl bg-slate-100" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <EmptyState
        title="Sign in to view saved listings"
        description="Log in and tap the heart icon on any listing to save it."
      />
    );
  }

  if (savedListings.length === 0) {
    return (
      <EmptyState
        title="You haven’t saved any listings yet."
        description="Tap the heart icon on any listing to save it."
      />
    );
  }

  return (
    <section className="space-y-3">
      {savedListings.map((item) => {
        const location =
          item.vehicle.vehicleOrYardLocation ||
          [item.vehicle.city, item.vehicle.state].filter(Boolean).join(", ");
        const imageSrc = resolveImageSrcForRender(item.vehicle.image || item.vehicle.gallery[0]);

        return (
          <article key={item.vehicleId} className="rounded-2xl border border-slate-100 bg-white p-3 shadow-sm">
            <div className="flex gap-3">
              <Link href={`/vehicles/${item.vehicleId}`} className="relative h-24 w-28 overflow-hidden rounded-xl bg-slate-100">
                <SafeImage
                  src={imageSrc}
                  alt={item.vehicle.title}
                  fill
                  className="object-cover"
                  sizes="112px"
                  logContext={{ component: "SavedListingsPanel", vehicleId: item.vehicleId }}
                />
              </Link>

              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <Link href={`/vehicles/${item.vehicleId}`} className="line-clamp-2 text-sm font-semibold text-slate-900">
                      {item.vehicle.title}
                    </Link>
                    <p className="mt-1 text-sm font-semibold text-slate-900">
                      {formatCurrency(item.vehicle.expectedPrice ?? item.vehicle.price)}
                    </p>
                  </div>
                  <SaveHeartButton vehicleId={item.vehicleId} vehicle={item.vehicle} className="bg-white" />
                </div>

                <div className="mt-2 flex items-center gap-1 text-xs text-slate-500">
                  <MapPin className="h-3.5 w-3.5" />
                  <span className="truncate">{location || "Location unavailable"}</span>
                </div>

                <div className="mt-2 flex items-center gap-2">
                  {item.vehicle.rcVerified ? <VerificationBadge label="RC Verified" /> : null}
                  <span className="text-xs text-slate-500">Saved {formatSavedTime(item.createdAt)}</span>
                </div>
              </div>
            </div>
          </article>
        );
      })}
    </section>
  );
}
