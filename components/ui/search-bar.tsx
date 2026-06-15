 "use client";

import { Search } from "lucide-react";
import { FormEvent, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

type Props = {
  placeholder?: string;
  compact?: boolean;
};

export function SearchBar({
  placeholder = "Search by vehicle type, city or brand",
  compact = false,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [query, setQuery] = useState("");

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const isMarketplacePage = pathname === "/vehicles";
    const next = new URLSearchParams(
      typeof window === "undefined" || !isMarketplacePage ? "" : window.location.search
    );
    const normalized = query.trim();
    if (normalized) next.set("q", normalized);
    else next.delete("q");
    next.delete("page");
    const destinationPath = isMarketplacePage ? pathname : "/vehicles";
    const queryString = next.toString();
    router.push(queryString ? `${destinationPath}?${queryString}` : destinationPath);
  };

  return (
    <form onSubmit={onSubmit} className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
      <Search className="h-4 w-4 text-slate-400" />
      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        className={`w-full bg-transparent text-slate-800 outline-none placeholder:text-slate-400 ${compact ? "text-sm" : "text-base"}`}
        placeholder={placeholder}
      />
      <button type="submit" className="min-h-10 rounded-xl bg-slate-900 px-4 text-xs font-semibold text-white">
        Search
      </button>
    </form>
  );
}
