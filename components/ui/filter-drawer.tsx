"use client";

import { FormEvent, useMemo, useState } from "react";
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

export function FilterDrawer() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

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

      {open ? (
        <div className="fixed inset-0 z-50 bg-black/40">
          <aside className="absolute right-0 top-0 h-full w-[92%] max-w-md overflow-y-auto bg-white p-5">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">Filter vehicles</h3>
              <button
                onClick={() => setOpen(false)}
                className="rounded-lg border border-slate-200 p-2"
                aria-label="Close filter drawer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={onSubmit} className="space-y-4">
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

              <div className="sticky bottom-0 mt-6 grid grid-cols-2 gap-2 bg-white pt-4">
                <button
                  type="button"
                  onClick={() => {
                    router.push(pathname);
                    setOpen(false);
                  }}
                  className="min-h-11 rounded-xl border border-slate-200 text-sm font-medium text-slate-700"
                >
                  Clear filters
                </button>
                <button
                  type="submit"
                  className="min-h-11 rounded-xl bg-slate-900 text-sm font-semibold text-white"
                >
                  Apply
                </button>
              </div>
            </form>
          </aside>
        </div>
      ) : null}
    </>
  );
}
