"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { categories } from "@/components/ui/category-selector";

const CHIP_LABELS: Record<string, string> = {
  q: "Search",
  category: "Category",
  listingType: "Type",
  listingMode: "Mode",
  assetStructure: "Structure",
  detachableType: "Detachable",
  bodyType: "Body",
  brand: "Brand",
  model: "Model",
  city: "City",
  state: "State",
  location: "Location",
  repoStatus: "Repo",
  sellerRole: "Seller",
  financeCompany: "Finance",
  sort: "Sort",
};

const SKIP_KEYS = new Set(["page", "limit", "minPrice", "maxPrice"]);

type ActiveChip = {
  id: string;
  label: string;
  removeKeys: string[];
};

function formatPrice(val: string): string {
  const n = Number(val);
  if (isNaN(n)) return val;
  if (n >= 100_000) return `${(n / 100_000).toFixed(0)}L`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return val;
}

function buildChips(searchParams: URLSearchParams): ActiveChip[] {
  const chips: ActiveChip[] = [];
  const seen = new Set<string>();

  // Combined price range chip
  const minPrice = searchParams.get("minPrice");
  const maxPrice = searchParams.get("maxPrice");
  if (minPrice || maxPrice) {
    let priceLabel: string;
    if (minPrice && maxPrice) {
      priceLabel = `₹${formatPrice(minPrice)} - ₹${formatPrice(maxPrice)}`;
    } else if (minPrice) {
      priceLabel = `Min ₹${formatPrice(minPrice)}`;
    } else {
      priceLabel = `Max ₹${formatPrice(maxPrice ?? "")}`;
    }
    chips.push({ id: "price", label: priceLabel, removeKeys: ["minPrice", "maxPrice"] });
    seen.add("minPrice");
    seen.add("maxPrice");
  }

  for (const [key, value] of searchParams.entries()) {
    if (seen.has(key) || SKIP_KEYS.has(key) || !value) continue;
    const chipLabel = CHIP_LABELS[key];
    if (!chipLabel) continue;

    let displayValue = value;
    if (key === "category") {
      displayValue = categories.find((c) => c.id === value)?.label ?? value;
    }

    chips.push({ id: `${key}-${value}`, label: `${chipLabel}: ${displayValue}`, removeKeys: [key] });
    seen.add(key);
  }

  return chips;
}

const RESIZE_DEBOUNCE_MS = 150;
const MOBILE_BREAKPOINT = 768;
const MOBILE_COLLAPSED_COUNT = 2;
const DESKTOP_COLLAPSED_COUNT = 4;

const getCollapsedCount = (width: number) =>
  width < MOBILE_BREAKPOINT ? MOBILE_COLLAPSED_COUNT : DESKTOP_COLLAPSED_COUNT;

export function ActiveFilterChips() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [expanded, setExpanded] = useState(false);
  const [collapsedCount, setCollapsedCount] = useState(MOBILE_COLLAPSED_COUNT);
  const resizeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const update = () => setCollapsedCount(getCollapsedCount(window.innerWidth));
    update();

    const onResize = () => {
      if (resizeTimerRef.current !== null) clearTimeout(resizeTimerRef.current);
      resizeTimerRef.current = setTimeout(update, RESIZE_DEBOUNCE_MS);
    };

    window.addEventListener("resize", onResize);
    return () => {
      if (resizeTimerRef.current !== null) clearTimeout(resizeTimerRef.current);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  const chips = useMemo(() => buildChips(searchParams), [searchParams]);

  const hiddenCount = Math.max(0, chips.length - collapsedCount);
  const visibleChips = expanded || hiddenCount === 0 ? chips : chips.slice(0, collapsedCount);

  const removeFilter = (removeKeys: string[]) => {
    const next = new URLSearchParams(searchParams.toString());
    for (const key of removeKeys) next.delete(key);
    next.delete("page");
    const query = next.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
    setExpanded(false);
  };

  const clearAll = () => {
    router.push(pathname);
    setExpanded(false);
  };

  if (!chips.length) return null;

  return (
    <div className="mt-2 flex flex-wrap items-center gap-2">
      {visibleChips.map((chip) => (
        <button
          key={chip.id}
          type="button"
          onClick={() => removeFilter(chip.removeKeys)}
          className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-muted px-2.5 py-1 text-xs text-slate-700"
        >
          {chip.label}
          <X className="h-3 w-3" />
        </button>
      ))}

      {hiddenCount > 0 ? (
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          className="inline-flex items-center rounded-full border border-slate-300 bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600"
        >
          {expanded ? "Show Less" : `+${hiddenCount} More`}
        </button>
      ) : null}

      {chips.length > 1 ? (
        <button
          type="button"
          onClick={clearAll}
          className="text-xs font-medium text-slate-500 underline-offset-2 hover:underline"
        >
          Clear All
        </button>
      ) : null}
    </div>
  );
}
