"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function MarkSoldButton({ vehicleId }: { vehicleId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const onClick = async () => {
    if (loading) return;
    setLoading(true);
    try {
      await fetch(`/api/vehicles/${vehicleId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "SOLD" }),
      });
      router.refresh();
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
      {loading ? "Updating..." : "Mark Sold"}
    </button>
  );
}

