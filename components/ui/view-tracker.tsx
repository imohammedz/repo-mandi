"use client";

import { useEffect } from "react";

interface ViewTrackerProps {
  vehicleId: string;
}

const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

export function ViewTracker({ vehicleId }: ViewTrackerProps) {
  useEffect(() => {
    if (!vehicleId) return;

    try {
      const key = `vehicle_viewed_${vehicleId}`;
      const stored = localStorage.getItem(key);
      const now = Date.now();

      if (stored) {
        const lastViewed = parseInt(stored, 10);
        if (!Number.isNaN(lastViewed) && now - lastViewed < TWENTY_FOUR_HOURS_MS) {
          // Already tracked within the last 24 hours — skip
          return;
        }
      }

      // Mark as viewed now before the fetch to prevent race conditions on re-renders
      localStorage.setItem(key, String(now));

      fetch(`/api/vehicles/${vehicleId}/view`, { method: "POST" }).catch(() => {
        // Fire-and-forget; ignore network errors
      });
    } catch {
      // localStorage may not be available (e.g. private browsing restrictions)
    }
  }, [vehicleId]);

  return null;
}
