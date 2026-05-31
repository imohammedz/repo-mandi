"use client";

import { useMemo, useState } from "react";
import { Heart } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import type { Vehicle } from "@/types/vehicle";
import { useSavedListings } from "@/components/providers/saved-listings-provider";

type Props = {
  vehicleId: string;
  vehicle?: Vehicle;
  className?: string;
};

const floatingHeartVariants = [
  { x: -16, y: -24 },
  { x: 0, y: -30 },
  { x: 14, y: -22 },
];

export function SaveHeartButton({ vehicleId, vehicle, className = "" }: Props) {
  const { isSaved, isPending, toggleSaved } = useSavedListings();
  const [showBurst, setShowBurst] = useState(false);

  const saved = isSaved(vehicleId);
  const pending = isPending(vehicleId);

  const iconClass = useMemo(
    () => (saved ? "text-[#FF3B30]" : "text-gray-800"),
    [saved]
  );

  const handleClick = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (pending) return;

    const result = await toggleSaved(vehicleId, vehicle);
    if (result.ok && !saved) {
      setShowBurst(true);
      window.setTimeout(() => setShowBurst(false), 500);
    }
  };

  return (
    <motion.button
      type="button"
      onClick={handleClick}
      whileTap={{ scale: 0.86 }}
      disabled={pending}
      aria-label={saved ? "Remove from saved listings" : "Save listing"}
      className={`inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/90 shadow transition hover:bg-white disabled:opacity-60 ${className}`}
    >
      <span className="relative block">
        <motion.span
          key={saved ? "saved" : "unsaved"}
          initial={{ scale: 0.85 }}
          animate={{ scale: [0.85, saved ? 1.28 : 0.9, 1] }}
          transition={{ duration: 0.24, ease: "easeOut" }}
          className="block"
        >
          <Heart
            className={`h-5 w-5 ${iconClass}`}
            fill={saved ? "#FF3B30" : "none"}
            strokeWidth={2}
          />
        </motion.span>

        <AnimatePresence>
          {showBurst ? (
            <>
              {floatingHeartVariants.map((variant, index) => (
                <motion.span
                  key={`${vehicleId}-${index}`}
                  className="pointer-events-none absolute left-1/2 top-1/2"
                  initial={{ x: 0, y: 0, opacity: 0.8, scale: 0.4 }}
                  animate={{ x: variant.x, y: variant.y, opacity: 0, scale: 0.9 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.45, ease: "easeOut" }}
                >
                  <Heart className="h-2.5 w-2.5 text-[#FF3B30]" fill="#FF3B30" />
                </motion.span>
              ))}
            </>
          ) : null}
        </AnimatePresence>
      </span>
    </motion.button>
  );
}
