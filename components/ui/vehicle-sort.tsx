"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronDown } from "lucide-react";

type Props = {
  value: string;
};

export function VehicleSort({ value }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return (
    <label className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 shadow-sm">
      Sort
      <ChevronDown className="h-4 w-4" />
      <select
        value={value}
        className="bg-transparent text-sm outline-none"
        onChange={(event) => {
          const next = new URLSearchParams(searchParams.toString());
          const selected = event.target.value;
          if (selected === "newest") next.delete("sort");
          else next.set("sort", selected);
          const query = next.toString();
          router.push(query ? `${pathname}?${query}` : pathname);
        }}
      >
        <option value="newest">Newest first</option>
        <option value="priceAsc">Price low to high</option>
        <option value="priceDesc">Price high to low</option>
      </select>
    </label>
  );
}
