"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { Vehicle } from "@/types/vehicle";

type SavedListing = {
  id: number;
  userId: number;
  vehicleId: string;
  createdAt: string;
  updatedAt: string;
  vehicle: Vehicle;
};

type SaveResult = { ok: boolean; message?: string };

type SavedListingsContextValue = {
  savedListings: SavedListing[];
  savedCount: number;
  isSaved: (vehicleId: string) => boolean;
  isPending: (vehicleId: string) => boolean;
  isLoading: boolean;
  isAuthenticated: boolean;
  toggleSaved: (vehicleId: string, vehicle?: Vehicle) => Promise<SaveResult>;
  refreshSavedListings: () => Promise<void>;
};

const SavedListingsContext = createContext<SavedListingsContextValue | null>(null);

async function fetchSavedListings() {
  const response = await fetch("/api/saved", {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
  });

  if (response.status === 401) {
    return { unauthorized: true as const, items: [] as SavedListing[] };
  }

  const data = (await response.json()) as { message?: string; items?: SavedListing[] };

  if (!response.ok) {
    throw new Error(data.message ?? "Failed to load saved listings.");
  }

  return { unauthorized: false as const, items: data.items ?? [] };
}

export function SavedListingsProvider({ children }: { children: React.ReactNode }) {
  const [savedListings, setSavedListings] = useState<SavedListing[]>([]);
  const [pendingVehicleIds, setPendingVehicleIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(true);

  const refreshSavedListings = useCallback(async () => {
    const result = await fetchSavedListings();
    setIsAuthenticated(!result.unauthorized);
    setSavedListings(result.items);
  }, []);

  useEffect(() => {
    let active = true;

    const bootstrap = async () => {
      setIsLoading(true);
      try {
        const result = await fetchSavedListings();
        if (!active) return;
        setIsAuthenticated(!result.unauthorized);
        setSavedListings(result.items);
      } catch {
        if (!active) return;
        setIsAuthenticated(true);
        setSavedListings([]);
      } finally {
        if (!active) return;
        setIsLoading(false);
      }
    };

    void bootstrap();

    return () => {
      active = false;
    };
  }, []);

  const isSaved = useCallback(
    (vehicleId: string) => savedListings.some((item) => item.vehicleId === vehicleId),
    [savedListings]
  );

  const isPending = useCallback(
    (vehicleId: string) => pendingVehicleIds.includes(vehicleId),
    [pendingVehicleIds]
  );

  const toggleSaved = useCallback(
    async (vehicleId: string, vehicle?: Vehicle): Promise<SaveResult> => {
      if (pendingVehicleIds.includes(vehicleId)) return { ok: false };

      const currentlySaved = savedListings.some((item) => item.vehicleId === vehicleId);
      const optimisticCreatedAt = new Date().toISOString();

      setPendingVehicleIds((prev) => [...prev, vehicleId]);
      if (currentlySaved) {
        setSavedListings((prev) => prev.filter((entry) => entry.vehicleId !== vehicleId));
      } else if (vehicle) {
        setSavedListings((prev) => [
          {
            id: -Date.now(),
            userId: -1,
            vehicleId,
            createdAt: optimisticCreatedAt,
            updatedAt: optimisticCreatedAt,
            vehicle,
          },
          ...prev.filter((entry) => entry.vehicleId !== vehicleId),
        ]);
      }

      try {
        const response = currentlySaved
          ? await fetch(`/api/saved/${vehicleId}`, { method: "DELETE" })
          : await fetch("/api/saved", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ listingId: vehicleId }),
            });

        const data = (await response.json()) as {
          message?: string;
          item?: SavedListing | null;
        };

        if (!response.ok) {
          throw new Error(data.message ?? "Failed to update saved listing.");
        }

        if (!currentlySaved) {
          if (data.item) {
            setSavedListings((prev) => [
              data.item as SavedListing,
              ...prev.filter((entry) => entry.vehicleId !== vehicleId),
            ]);
          } else {
            await refreshSavedListings();
          }
          return { ok: true, message: "Added to Saved" };
        }

        return { ok: true, message: "Removed from Saved" };
      } catch (error) {
        await refreshSavedListings();
        return {
          ok: false,
          message: error instanceof Error ? error.message : "Failed to update saved listing.",
        };
      } finally {
        setPendingVehicleIds((prev) => prev.filter((id) => id !== vehicleId));
      }
    },
    [pendingVehicleIds, refreshSavedListings, savedListings]
  );

  const value = useMemo<SavedListingsContextValue>(
    () => ({
      savedListings,
      savedCount: savedListings.length,
      isSaved,
      isPending,
      isLoading,
      isAuthenticated,
      toggleSaved,
      refreshSavedListings,
    }),
    [savedListings, isSaved, isPending, isLoading, isAuthenticated, toggleSaved, refreshSavedListings]
  );

  return <SavedListingsContext.Provider value={value}>{children}</SavedListingsContext.Provider>;
}

export function useSavedListings() {
  const context = useContext(SavedListingsContext);
  if (!context) {
    throw new Error("useSavedListings must be used within SavedListingsProvider.");
  }
  return context;
}
