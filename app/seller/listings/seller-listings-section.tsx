"use client";

import Link from "next/link";
import { useState } from "react";
import { formatCurrency } from "@/data/vehicles";
import { SafeImage } from "@/components/ui/safe-image";
import { resolveImageSrcForRender, VEHICLE_IMAGE_PLACEHOLDER_SRC } from "@/lib/media";
import type { Vehicle } from "@/types/vehicle";
import { FeatureListingButton } from "./feature-listing-button";
import { CancelFeatureRequestButton } from "./cancel-feature-request-button";
import { ListingActionsMenu } from "./listing-actions-menu";

const PAGE_SIZE = 10;

type FeatureStatus = "FEATURED" | "PENDING" | "REJECTED" | "NONE";

interface ListingItem {
  vehicle: Vehicle;
  featureStatus: FeatureStatus;
  featuredUntil: string | null;
}

interface SellerListingsSectionProps {
  listings: ListingItem[];
}

function SellerStatusBadge({ status }: { status: Vehicle["listingStatus"] }) {
  if (!status) return null;
  const map: Record<string, { label: string; className: string }> = {
    PENDING: { label: "Pending", className: "bg-amber-50 text-amber-700" },
    VERIFIED: { label: "Active", className: "bg-emerald-50 text-emerald-700" },
    REJECTED: { label: "Rejected", className: "bg-rose-50 text-rose-700" },
    SOLD: { label: "Sold", className: "bg-sky-50 text-sky-700" },
    BANK_PENDING_REVIEW: { label: "Bank Review", className: "bg-indigo-50 text-indigo-700" },
    SUBMITTED_TO_REPOMANDI: { label: "Submitted", className: "bg-violet-50 text-violet-700" },
  };
  const entry = map[status];
  if (!entry) return null;
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${entry.className}`}
      aria-label={`Listing status: ${entry.label}`}
    >
      {entry.label}
    </span>
  );
}

function FeatureStatusRow({
  featureStatus,
  featuredUntil,
  vehicleId,
}: {
  featureStatus: FeatureStatus;
  featuredUntil: string | null;
  vehicleId: string;
}) {
  if (featureStatus === "FEATURED") {
    const label = featuredUntil
      ? `Featured until ${new Date(featuredUntil).toLocaleDateString("en-GB")}`
      : "Featured";
    return (
      <span
        className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700"
        aria-label={`Feature status: ${label}`}
      >
        <span aria-hidden="true">⭐</span> {label}
      </span>
    );
  }
  if (featureStatus === "PENDING") {
    return (
      <div className="flex items-center gap-3">
        <span
          className="inline-flex items-center gap-1 rounded-full bg-yellow-50 px-2.5 py-1 text-xs font-medium text-yellow-700"
          aria-label="Feature status: Feature Request Pending"
        >
          <span aria-hidden="true">⏳</span> Feature Request Pending
        </span>
        <CancelFeatureRequestButton listingId={vehicleId} />
      </div>
    );
  }
  if (featureStatus === "REJECTED") {
    return (
      <span
        className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-700"
        aria-label="Feature status: Feature Request Rejected"
      >
        <span aria-hidden="true">❌</span> Feature Request Rejected
      </span>
    );
  }
  return null;
}

function formatPostedDate(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  return `Posted ${d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`;
}

export function SellerListingsSection({ listings }: SellerListingsSectionProps) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const visible = listings.slice(0, visibleCount);
  const hasMore = visibleCount < listings.length;

  if (listings.length === 0) {
    return (
      <p className="rounded-2xl border border-slate-100 bg-white p-6 text-center text-sm text-slate-500">
        No listings yet.{" "}
        <Link href="/seller/listings/new" className="font-medium text-slate-900 underline">
          Add your first vehicle
        </Link>
        .
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {visible.map(({ vehicle, featureStatus, featuredUntil }) => {
        const isFeatured = featureStatus === "FEATURED";
        const hasPendingRequest = featureStatus === "PENDING";
        const canMarkSold = vehicle.listingStatus === "VERIFIED" || vehicle.listingStatus === "PENDING";
        const imageCandidates = [
          vehicle.image,
          vehicle.frontPhoto,
          vehicle.leftSidePhoto,
          vehicle.rightSidePhoto,
          vehicle.backPhoto,
          vehicle.sidePhoto,
          ...(vehicle.gallery ?? []),
        ];
        let previewImage = VEHICLE_IMAGE_PLACEHOLDER_SRC;
        for (const candidate of imageCandidates) {
          const resolvedImage = resolveImageSrcForRender(candidate);
          if (resolvedImage !== VEHICLE_IMAGE_PLACEHOLDER_SRC) {
            previewImage = resolvedImage;
            break;
          }
        }

        return (
          <article
            key={vehicle.id}
            className="rounded-2xl border border-slate-100 bg-white shadow-sm"
          >
            {/* Card top: thumbnail + details + actions */}
            <div className="flex items-start gap-3 p-4">
              {/* Thumbnail */}
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                <SafeImage
                  src={previewImage}
                  alt={vehicle.title}
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              </div>

              {/* Info */}
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-semibold text-slate-900">{vehicle.title}</h3>
                    <p className="mt-0.5 text-sm font-medium text-slate-800">
                      {formatCurrency(vehicle.expectedPrice ?? vehicle.price)}
                    </p>
                    {vehicle.createdAt ? (
                      <p className="mt-0.5 text-xs text-slate-400">{formatPostedDate(vehicle.createdAt)}</p>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <SellerStatusBadge status={vehicle.listingStatus} />
                    <ListingActionsMenu
                      vehicleId={vehicle.id}
                      title={vehicle.title}
                      price={vehicle.expectedPrice ?? vehicle.price}
                      location={[vehicle.city, vehicle.state].filter(Boolean).join(", ")}
                      canMarkSold={canMarkSold}
                    />
                  </div>
                </div>

                {/* Quick insights */}
                <div className="mt-2 flex items-center gap-3 text-xs text-slate-500">
                  <span>
                    <span aria-hidden="true">👁</span> {vehicle.viewCount ?? 0} Views
                  </span>
                  <span>
                    <span aria-hidden="true">📩</span> {vehicle.inquiries} Inquiries
                  </span>
                </div>
              </div>
            </div>

            {/* Feature status row */}
            {featureStatus !== "NONE" ? (
              <div className="px-4 py-2.5">
                <FeatureStatusRow
                  featureStatus={featureStatus}
                  featuredUntil={featuredUntil}
                  vehicleId={vehicle.id}
                />
              </div>
            ) : null}

            {/* Action buttons */}
            <div className="grid grid-cols-2 gap-2 px-4 py-3">
              {!isFeatured && !hasPendingRequest ? (
                <FeatureListingButton
                  listingId={vehicle.id}
                  isFeatured={false}
                  hasPendingRequest={false}
                  featuredUntil={null}
                  className="w-full"
                />
              ) : isFeatured ? (
                <FeatureListingButton
                  listingId={vehicle.id}
                  isFeatured={true}
                  hasPendingRequest={false}
                  featuredUntil={featuredUntil}
                  className="w-full"
                />
              ) : (
                <CancelFeatureRequestButton
                  listingId={vehicle.id}
                  className="inline-flex min-h-10 w-full items-center justify-center rounded-lg border border-rose-200 bg-rose-50 px-3 text-sm font-medium text-rose-700 hover:bg-rose-100"
                />
              )}
              <Link
                href={`/seller/leads?listing=${vehicle.id}`}
                className="inline-flex min-h-10 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                View Leads
              </Link>
            </div>
          </article>
        );
      })}

      {hasMore ? (
        <button
          type="button"
          onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
          className="w-full rounded-xl border border-slate-200 bg-white py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Load More Listings
        </button>
      ) : null}
    </div>
  );
}
