"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function MarkSoldButton({ vehicleId }: { vehicleId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const onClick = async () => {
    if (loading) return;
    const confirmed = window.confirm(
      "Are you sure this vehicle is sold? This will remove it from public listings."
    );
    if (!confirmed) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/seller/vehicles/${vehicleId}/mark-sold`, {
        method: "PATCH",
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as unknown;
        const message =
          typeof data === "object" &&
          data !== null &&
          "message" in data &&
          typeof data.message === "string"
            ? data.message
            : "Failed to mark vehicle as sold.";
        throw new Error(message);
      }

      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to mark vehicle as sold.";
      window.alert(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="inline-flex min-h-10 items-center rounded-lg border border-slate-200 px-3 text-xs font-medium text-slate-700 disabled:opacity-50"
    >
      {loading ? "Updating..." : "Mark as Sold"}
    </button>
  );
}
