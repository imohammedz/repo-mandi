"use client";

import { ChevronDown } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { SellerListingSort } from "@/lib/seller-listings";

type Props = {
  value: SellerListingSort;
};

export function SellerListingsSort({ value }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return (
    <label className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 shadow-sm">
      Sort
      <ChevronDown className="h-4 w-4 text-slate-400" />
      <select
        value={value}
        className="bg-transparent text-sm outline-none"
        onChange={(event) => {
          const next = new URLSearchParams(searchParams.toString());
          const selected = event.target.value;
          if (selected === "newest") next.delete("sort");
          else next.set("sort", selected);
          next.delete("page");
          const query = next.toString();
          router.push(query ? `${pathname}?${query}` : pathname);
        }}
      >
        <option value="newest">Newest First</option>
        <option value="oldest">Oldest First</option>
        <option value="mostViewed">Most Viewed</option>
        <option value="mostInquiries">Most Inquiries</option>
        <option value="priceDesc">Highest Price</option>
        <option value="priceAsc">Lowest Price</option>
      </select>
    </label>
  );
}
