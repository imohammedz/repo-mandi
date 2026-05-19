"use client";

import { useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";

const filterGroups = {
  "Vehicle Type": ["Truck", "Tipper", "Pickup", "Bus", "Trailer", "Tractor"],
  Brand: ["Tata", "Ashok Leyland", "BharatBenz", "Mahindra", "Eicher"],
  State: ["Maharashtra", "Karnataka", "Tamil Nadu", "Gujarat", "Uttar Pradesh"],
  "Finance Company": ["HDFC Bank", "ICICI Bank", "Axis Bank", "SBI Commercial Finance"],
};

export function FilterDrawer() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 shadow-sm"
      >
        <SlidersHorizontal className="h-4 w-4" />
        Filters
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 bg-black/40">
          <aside className="absolute right-0 top-0 h-full w-[85%] max-w-sm overflow-y-auto bg-white p-5">
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

            <div className="space-y-5">
              {Object.entries(filterGroups).map(([group, values]) => (
                <section key={group}>
                  <h4 className="text-sm font-semibold text-slate-800">{group}</h4>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {values.map((value) => (
                      <button
                        key={value}
                        className="min-h-10 rounded-full border border-slate-200 px-3 text-xs text-slate-600"
                      >
                        {value}
                      </button>
                    ))}
                  </div>
                </section>
              ))}
            </div>

            <div className="sticky bottom-0 mt-6 grid grid-cols-2 gap-2 bg-white pt-4">
              <button className="min-h-11 rounded-xl border border-slate-200 text-sm font-medium text-slate-700">
                Reset
              </button>
              <button className="min-h-11 rounded-xl bg-slate-900 text-sm font-semibold text-white">
                Apply
              </button>
            </div>
          </aside>
        </div>
      ) : null}
    </>
  );
}
