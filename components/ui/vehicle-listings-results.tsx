"use client";

import Link from "next/link";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { SupportContactInline } from "@/components/ui/support-contact-inline";
import { VehicleCard } from "@/components/ui/vehicle-card";
import { SUPPORT_SUBJECTS } from "@/lib/config/site";
import type { ListingPagination, PaginatedVehicleListings } from "@/lib/vehicle-listings";
import type { Vehicle } from "@/types/vehicle";

type Props = {
  initialItems: Vehicle[];
  initialPagination: ListingPagination;
};

export function VehicleListingsResults({ initialItems, initialPagination }: Props) {
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
      const response = await fetch(`/api/vehicles?${nextParams.toString()}`, {
        method: "GET",
        cache: "no-store",
      });
      const data = (await response.json()) as PaginatedVehicleListings & { message?: string };

      if (!response.ok) {
        throw new Error(data.message ?? "Failed to load more listings.");
      }

      setItems((current) => {
        const seen = new Set(current.map((vehicle) => vehicle.id));
        const appended = data.items.filter((vehicle) => !seen.has(vehicle.id));
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
      <section className="space-y-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center">
          <p className="text-base font-semibold text-slate-900">No vehicles found</p>
          <SupportContactInline className="mt-2 text-xs text-slate-500" subject={SUPPORT_SUBJECTS.general} />
          <Link
            href="/vehicles"
            className="mt-3 inline-flex min-h-10 items-center rounded-xl border border-slate-200 px-4 text-sm font-medium text-slate-700"
          >
            Clear filters
          </Link>
        </div>
      </section>
    );
  }

  return (
    <>
      <section className="w-full max-w-full space-y-2 overflow-x-hidden">
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-600">
            <span className="font-semibold text-slate-900">{pagination.total}</span> listings found
          </p>
        </div>
      </section>

      <section className="space-y-2">
        {items.map((vehicle) => (
          <VehicleCard key={vehicle.id} vehicle={vehicle} compact />
        ))}
      </section>

      {error ? <p className="text-center text-sm text-red-600">{error}</p> : null}

      {pagination.hasNextPage ? (
        <div className="pb-2 pt-2">
          <button
            type="button"
            onClick={handleLoadMore}
            disabled={loading}
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 text-sm font-semibold text-white disabled:opacity-70"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {loading ? "Loading..." : "Load More Listings"}
          </button>
        </div>
      ) : null}
    </>
  );
}
