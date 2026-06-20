"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { SlidersHorizontal, X } from "lucide-react";
import { createPortal } from "react-dom";

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

export function FilterDrawer() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const bodyOverflowRef = useRef<string | null>(null);

  useEffect(() => {
    const { body } = document;

    if (!open) {
      delete body.dataset.filtersOpen;
      return;
    }

    bodyOverflowRef.current = body.style.overflow;
    body.dataset.filtersOpen = "true";
    body.style.overflow = "hidden";

    return () => {
      delete body.dataset.filtersOpen;
      if (bodyOverflowRef.current !== null) body.style.overflow = bodyOverflowRef.current;
      else body.style.removeProperty("overflow");
      bodyOverflowRef.current = null;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

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

    next.delete("verifiedOnly");

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

      {open
        ? createPortal(
            <div className="fixed inset-0 z-[1000] isolate">
              <button
                type="button"
                aria-label="Close filter drawer"
                className="absolute inset-0 bg-black/50"
                onClick={() => setOpen(false)}
              />
              <aside
                role="dialog"
                aria-modal="true"
                aria-labelledby="vehicle-filter-title"
                className="absolute right-0 top-0 z-[1001] flex h-full w-[92%] max-w-md flex-col overflow-hidden bg-white shadow-2xl"
              >
                <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                  <h3 id="vehicle-filter-title" className="text-lg font-semibold text-slate-900">
                    Filter vehicles
                  </h3>
                  <button
                    onClick={() => setOpen(false)}
                    className="rounded-lg border border-slate-200 p-2"
                    aria-label="Close filter drawer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
                  <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">
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

                  </div>

                  <div className="sticky bottom-0 z-[1002] grid grid-cols-2 gap-2 border-t border-slate-200 bg-white px-5 py-4">
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
            </div>,
            document.body
          )
        : null}
    </>
  );
}
