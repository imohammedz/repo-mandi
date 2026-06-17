"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { SlidersHorizontal, X } from "lucide-react";

type FilterField = {
  key: string;
  label: string;
  options?: Array<{ label: string; value: string }>;
  type?: "text" | "number";
};

const FILTER_FIELDS: FilterField[] = [
  {
    key: "listingType",
    label: "Listing Type",
    options: [
      { label: "Regular", value: "REGULAR" },
      { label: "Repo", value: "REPO" },
    ],
  },
  {
    key: "listingMode",
    label: "Listing Mode",
    options: [
      { label: "Single", value: "NORMAL" },
      { label: "Bulk", value: "BULK" },
    ],
  },
  {
    key: "assetStructure",
    label: "Asset Structure",
    options: [
      { label: "Standalone", value: "STANDALONE" },
      { label: "Detachable", value: "DETACHABLE" },
      { label: "Equipment", value: "EQUIPMENT" },
    ],
  },
  {
    key: "detachableType",
    label: "Detachable Type",
    options: [
      { label: "Prime Mover", value: "PRIME_MOVER" },
      { label: "Trailer", value: "TRAILER" },
    ],
  },
  { key: "assetCategory", label: "Vehicle Class / Category", type: "text" },
  { key: "bodyType", label: "Body Type", type: "text" },
  { key: "bodyApplicationType", label: "Body Application", type: "text" },
  { key: "brand", label: "Brand / Make", type: "text" },
  { key: "model", label: "Model", type: "text" },
  { key: "location", label: "Location / Yard", type: "text" },
  {
    key: "runningCondition",
    label: "Running Condition",
    options: [
      { label: "Running", value: "RUNNING" },
      { label: "Not Running", value: "NOT_RUNNING" },
      { label: "Unknown", value: "UNKNOWN" },
    ],
  },
  { key: "repoStatus", label: "Repo Status", type: "text" },
  { key: "sellerRole", label: "Seller Role", type: "text" },
  { key: "minPrice", label: "Min Price", type: "number" },
  { key: "maxPrice", label: "Max Price", type: "number" },
];

const CHIP_LABELS: Record<string, string> = {
  q: "Search",
  listingType: "Type",
  listingMode: "Mode",
  assetStructure: "Structure",
  detachableType: "Detachable",
  assetCategory: "Category",
  bodyType: "Body Type",
  bodyApplicationType: "Body App",
  brand: "Brand",
  model: "Model",
  location: "Location",
  runningCondition: "Running",
  repoStatus: "Repo",
  sellerRole: "Seller Role",
  verifiedOnly: "Verified",
  minPrice: "Min ₹",
  maxPrice: "Max ₹",
  sort: "Sort",
};

// Keeps the scrollable filter form within the viewport after accounting for the
// drawer header block and the bottom actions row spacing.
const FILTER_DRAWER_CONTENT_OFFSET = 100;

export function FilterDrawer() {
  const [open, setOpen] = useState(false);
  const drawerRef = useRef<HTMLElement | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!open) return;

    const { body } = document;
    const previousOverflow = body.style.overflow;
    body.style.overflow = "hidden";

    return () => {
      body.style.overflow = previousOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    drawerRef.current?.focus();
  }, [open]);

  const activeEntries = useMemo(
    () =>
      Array.from(searchParams.entries()).filter(([key, value]) => {
        if (!value || key === "page") return false;
        return Boolean(CHIP_LABELS[key]);
      }),
    [searchParams]
  );

  const submitFilters = (next: URLSearchParams) => {
    next.delete("page");
    const query = next.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
    setOpen(false);
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const next = new URLSearchParams(searchParams.toString());

    for (const field of FILTER_FIELDS) {
      const value = String(data.get(field.key) ?? "").trim();
      if (value) next.set(field.key, value);
      else next.delete(field.key);
    }

    const verifiedOnly = data.get("verifiedOnly") === "on";
    if (verifiedOnly) next.set("verifiedOnly", "1");
    else next.delete("verifiedOnly");

    submitFilters(next);
  };

  const drawer = open ? (
    <div
      className="fixed inset-0 z-[1000] isolate bg-black/40"
      onClick={() => setOpen(false)}
    >
      <aside
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="vehicle-filter-title"
        tabIndex={-1}
        className="absolute inset-y-0 right-0 h-full w-[92%] max-w-md overflow-y-auto overscroll-contain bg-white p-5 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            setOpen(false);
          }
        }}
      >
        <div className="mb-5 flex items-center justify-between">
          <h3 id="vehicle-filter-title" className="text-lg font-semibold text-slate-900">
            Filter vehicles
          </h3>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-lg border border-slate-200 p-2 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2"
            aria-label="Close filter drawer"
          >
            <X className="h-5 w-5 text-slate-700" />
          </button>
        </div>

        <form
          onSubmit={onSubmit}
          className="flex flex-col"
          style={{ height: `calc(100vh - ${FILTER_DRAWER_CONTENT_OFFSET}px)` }}
        >
          <div className="flex-1 space-y-4 overflow-y-auto pb-4">
            <div className="grid grid-cols-1 gap-3">
              {FILTER_FIELDS.map((field) => (
                <label key={field.key} className="space-y-1">
                  <span className="text-xs font-semibold text-slate-600">{field.label}</span>
                  {field.options ? (
                    <select
                      name={field.key}
                      defaultValue={searchParams.get(field.key) ?? ""}
                      className="min-h-11 w-full rounded-xl border border-slate-200 px-3 text-sm text-slate-700 outline-none"
                    >
                      <option value="">All</option>
                      {field.options.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      name={field.key}
                      type={field.type ?? "text"}
                      defaultValue={searchParams.get(field.key) ?? ""}
                      className="min-h-11 w-full rounded-xl border border-slate-200 px-3 text-sm text-slate-700 outline-none"
                    />
                  )}
                </label>
              ))}
            </div>

            <label className="inline-flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                name="verifiedOnly"
                defaultChecked={searchParams.get("verifiedOnly") === "1"}
                className="h-4 w-4 rounded border-slate-300"
              />
              Verified sellers only
            </label>
          </div>

          <div className="grid grid-cols-2 gap-2 border-t border-slate-100 pt-4 pb-2">
            <button
              type="button"
              onClick={() => {
                router.push(pathname);
                setOpen(false);
              }}
              className="min-h-11 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2"
            >
              Clear filters
            </button>
            <button
              type="submit"
              className="min-h-11 rounded-xl bg-slate-900 text-sm font-semibold text-white hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2"
            >
              Apply
            </button>
          </div>
        </form>
      </aside>
    </div>
  ) : null;
  const portalTarget = typeof document !== "undefined" ? document.body : null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 shadow-sm"
      >
        <SlidersHorizontal className="h-4 w-4" />
        Filters
      </button>

      {activeEntries.length ? (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {activeEntries.map(([key, value]) => (
            <button
              key={`${key}-${value}`}
              type="button"
              onClick={() => {
                const next = new URLSearchParams(searchParams.toString());
                next.delete(key);
                submitFilters(next);
              }}
              className="inline-flex min-h-8 items-center gap-1 rounded-full border border-slate-200 bg-white px-3 text-xs text-slate-700"
            >
              <span className="font-medium">{CHIP_LABELS[key] || key}:</span> {value}
              <X className="h-3.5 w-3.5" />
            </button>
          ))}
        </div>
      ) : null}

      {portalTarget && drawer ? createPortal(drawer, portalTarget) : null}
    </>
  );
}
