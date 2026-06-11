"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";

type VehicleDetailChipsProps = {
  chips: string[];
};

const getCollapsedChipCount = (width: number) => {
  if (width < 640) return 5;
  return 4;
};

export function VehicleDetailChips({ chips }: VehicleDetailChipsProps) {
  const [expanded, setExpanded] = useState(false);
  const [collapsedChipCount, setCollapsedChipCount] = useState(5);

  useEffect(() => {
    const setCount = () => setCollapsedChipCount(getCollapsedChipCount(window.innerWidth));
    setCount();
    window.addEventListener("resize", setCount);
    return () => window.removeEventListener("resize", setCount);
  }, []);

  const hiddenCount = Math.max(0, chips.length - collapsedChipCount);
  const visibleChips = useMemo(
    () => (expanded || hiddenCount === 0 ? chips : chips.slice(0, collapsedChipCount)),
    [chips, collapsedChipCount, expanded, hiddenCount]
  );

  if (!chips.length) return null;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
      <motion.div layout transition={{ duration: 0.2, ease: "easeInOut" }} className="overflow-hidden">
        <div className="flex flex-wrap gap-2">
          {visibleChips.map((chip) => (
            <span key={chip} className="inline-flex rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700">
              {chip}
            </span>
          ))}
          {hiddenCount > 0 ? (
            <button
              type="button"
              onClick={() => setExpanded((current) => !current)}
              className="inline-flex rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-100"
            >
              {expanded ? "Show Less" : `+${hiddenCount} More`}
            </button>
          ) : null}
        </div>
      </motion.div>
    </section>
  );
}
