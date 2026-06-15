"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Eye, ExternalLink, Loader2, MessageSquareMore } from "lucide-react";
import { resolveImageSrcForRender, VEHICLE_IMAGE_PLACEHOLDER_SRC } from "@/lib/media";
import type { SellerListingItem, SellerListingPagination } from "@/lib/seller-listings";
import { formatCurrency } from "@/data/vehicles";
import { SafeImage } from "@/components/ui/safe-image";
import type { Vehicle } from "@/types/vehicle";
import { CancelFeatureRequestButton } from "./cancel-feature-request-button";
import { ListingActionsMenu } from "./listing-actions-menu";

interface SellerListingsSectionProps {
  initialItems: SellerListingItem[];
  initialPagination: SellerListingPagination;
}

function SellerStatusBadge({ status }: { status: Vehicle["listingStatus"] }) {
  if (!status) return null;
  const map: Record<string, { label: string; className: string }> = {
    PENDING: { label: "Pending", className: "border-amber-200 bg-amber-50 text-amber-700" },
    VERIFIED: { label: "Active", className: "border-slate-200 bg-slate-100 text-slate-700" },
    REJECTED: { label: "Rejected", className: "border-rose-200 bg-rose-50 text-rose-700" },
    SOLD: { label: "Sold", className: "border-sky-200 bg-sky-50 text-sky-700" },
    BANK_PENDING_REVIEW: { label: "Bank Review", className: "border-indigo-200 bg-indigo-50 text-indigo-700" },
    SUBMITTED_TO_REPOMANDI: { label: "Submitted", className: "border-violet-200 bg-violet-50 text-violet-700" },
  };
  const entry = map[status];
  if (!entry) return null;
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${entry.className}`}
      aria-label={`Listing status: ${entry.label}`}
    >
      {entry.label}
    </span>
  );
}

function FeatureStatusCard({ item }: { item: SellerListingItem }) {
  const { featureStatus, featuredUntil, vehicle } = item;
  const baseClassName = "rounded-2xl border px-4 py-3";

  if (featureStatus === "FEATURED") {
    return (
      <div className={`${baseClassName} border-amber-200 bg-amber-50/80`}>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">
          Feature Status
        </p>
        <p className="mt-2 text-sm font-semibold text-amber-950">⭐ Featured</p>
        <p className="mt-1 text-xs text-amber-800">
          {featuredUntil
            ? `Featured until ${new Date(featuredUntil).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}`
            : "Visible in premium placements across RepoMandi."}
        </p>
      </div>
    );
  }

  if (featureStatus === "PENDING") {
    return (
      <div className={`${baseClassName} border-yellow-200 bg-yellow-50/80`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-yellow-700">
              Feature Status
            </p>
            <p className="mt-2 text-sm font-semibold text-yellow-950">
              ⏳ Feature Request Pending
            </p>
            <p className="mt-1 text-xs text-yellow-800">
              Your request is under review by the RepoMandi team.
            </p>
          </div>
          <CancelFeatureRequestButton listingId={vehicle.id} />
        </div>
      </div>
    );
  }

  if (featureStatus === "REJECTED") {
    return (
      <div className={`${baseClassName} border-rose-200 bg-rose-50/80`}>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-rose-700">
          Feature Status
        </p>
        <p className="mt-2 text-sm font-semibold text-rose-950">❌ Feature Request Rejected</p>
        <p className="mt-1 text-xs text-rose-800">
          You can update this listing and submit a fresh feature request.
        </p>
      </div>
    );
  }

  return (
    <div className={`${baseClassName} border-slate-200 bg-slate-50`}>
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
        Feature Status
      </p>
      <p className="mt-2 text-sm font-semibold text-slate-900">⚪ Not Featured</p>
      <p className="mt-1 text-xs text-slate-600">Feature this listing to reach more buyers.</p>
    </div>
  );
}

function formatPostedDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const date = new Date(iso);
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function formatCount(value: number) {
  return new Intl.NumberFormat("en-IN").format(value);
}

function ListingImage({ item }: { item: SellerListingItem }) {
  const { vehicle } = item;
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
    <div className="relative h-28 overflow-hidden rounded-2xl bg-slate-100 sm:h-32 md:h-full">
      <SafeImage
        src={previewImage}
        alt={vehicle.title}
        fill
        sizes="(max-width: 768px) 100vw, 160px"
        className="object-cover"
      />
    </div>
  );
}

function ListingCard({ item }: { item: SellerListingItem }) {
  const { vehicle, featureStatus, featuredUntil } = item;
  const isFeatured = featureStatus === "FEATURED";
  const canMarkSold = vehicle.listingStatus === "VERIFIED" || vehicle.listingStatus === "PENDING";

  return (
    <article
      className={`relative overflow-hidden rounded-[28px] border bg-white shadow-sm transition ${
        isFeatured
          ? "border-amber-300 bg-gradient-to-br from-amber-50/80 via-white to-white"
          : "border-slate-200"
      }`}
    >
      {isFeatured ? (
        <span className="absolute left-4 top-4 z-10 rounded-full bg-amber-500 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white">
          Featured
        </span>
      ) : null}

      <div className="grid gap-4 p-4 md:grid-cols-[160px,minmax(0,1fr)] md:p-5">
        <ListingImage item={item} />

        <div className="min-w-0 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="text-base font-semibold text-slate-900 sm:text-lg">{vehicle.title}</h3>
              <p className="mt-2 text-xl font-bold text-slate-950">
                {formatCurrency(vehicle.expectedPrice ?? vehicle.price)}
              </p>
            </div>
            <ListingActionsMenu
              vehicleId={vehicle.id}
              title={vehicle.title}
              price={vehicle.expectedPrice ?? vehicle.price}
              location={[vehicle.city, vehicle.state].filter(Boolean).join(", ")}
              canMarkSold={canMarkSold}
              featureStatus={featureStatus}
              featuredUntil={featuredUntil}
            />
          </div>

          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                Posted Date
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-900">
                {formatPostedDate(vehicle.createdAt)}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                Views
              </p>
              <p className="mt-1 flex items-center gap-2 text-sm font-semibold text-slate-900">
                <Eye className="size-4 text-slate-500" /> {formatCount(vehicle.viewCount ?? 0)}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                Inquiries
              </p>
              <p className="mt-1 flex items-center gap-2 text-sm font-semibold text-slate-900">
                <MessageSquareMore className="size-4 text-slate-500" />{" "}
                {formatCount(vehicle.inquiries)}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                Status
              </p>
              <div className="mt-2">
                <SellerStatusBadge status={vehicle.listingStatus} />
              </div>
            </div>
          </div>

          <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_240px]">
            <FeatureStatusCard item={item} />
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
              <Link
                href={`/vehicles/${vehicle.id}`}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                <ExternalLink className="size-4" /> View Listing
              </Link>
              <Link
                href={`/seller/leads?listing=${vehicle.id}`}
                className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-800"
              >
                View Leads
              </Link>
            </div>
          </div>

          {vehicle.rejectionReason ? (
            <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              Rejection reason: {vehicle.rejectionReason}
            </p>
          ) : null}
        </div>
      </div>
    </article>
  );
}

export function SellerListingsSection({
  initialItems,
  initialPagination,
}: SellerListingsSectionProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [items, setItems] = useState(initialItems);
  const [pagination, setPagination] = useState(initialPagination);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLoadMore = async () => {
    if (loading || !pagination.hasNextPage) return;

    const nextPage = pagination.page + 1;
    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.set("page", String(nextPage));
    nextParams.set("limit", String(pagination.limit));

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/seller/listings?${nextParams.toString()}`, {
        method: "GET",
        cache: "no-store",
      });
      const data = (await response.json()) as {
        items: SellerListingItem[];
        pagination: SellerListingPagination;
        message?: string;
      };

      if (!response.ok) {
        throw new Error(data.message ?? "Failed to load more listings.");
      }

      setItems((current) => {
        const seen = new Set(current.map((entry) => entry.vehicle.id));
        const appended = data.items.filter((entry) => !seen.has(entry.vehicle.id));
        return [...current, ...appended];
      });
      setPagination(data.pagination);
      router.replace(`${pathname}?${nextParams.toString()}`, { scroll: false });
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : "Failed to load more listings.");
    } finally {
      setLoading(false);
    }
  };

  if (!items.length) {
    return (
      <div className="rounded-[28px] border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm">
        <p className="text-lg font-semibold text-slate-900">
          You have not added any vehicles yet.
        </p>
        <p className="mt-2 text-sm text-slate-500">
          Start building your RepoMandi inventory to track performance here.
        </p>
        <Link
          href="/seller/listings/new"
          className="mt-5 inline-flex min-h-11 items-center rounded-2xl bg-slate-900 px-5 text-sm font-semibold text-white"
        >
          Add Vehicle
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <ListingCard key={item.vehicle.id} item={item} />
      ))}

      {error ? <p className="text-center text-sm text-red-600">{error}</p> : null}

      {pagination.hasNextPage ? (
        <button
          type="button"
          onClick={handleLoadMore}
          disabled={loading}
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm disabled:opacity-70"
        >
          {loading ? <Loader2 className="size-4 animate-spin" /> : null}
          {loading ? "Loading Listings..." : "Load More Listings"}
        </button>
      ) : null}
    </div>
  );
}
