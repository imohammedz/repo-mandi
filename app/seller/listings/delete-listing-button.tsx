"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function DeleteListingButton({ vehicleId }: { vehicleId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleDelete = async () => {
    if (loading) return;
    if (
      !window.confirm(
        "Are you sure you want to delete this listing? This action will remove it from public listings."
      )
    )
      return;

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/seller/vehicles/${vehicleId}`, {
        method: "DELETE",
      });
      const payload = (await response.json().catch(() => null)) as { message?: string } | null;
      if (!response.ok) {
        throw new Error(payload?.message || "Failed to delete listing.");
      }
      router.refresh();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Failed to delete listing.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleDelete}
        disabled={loading}
        className="inline-flex min-h-10 items-center rounded-lg border border-rose-200 bg-rose-50 px-3 text-xs font-medium text-rose-700 disabled:opacity-50"
      >
        {loading ? "Deleting..." : "Delete"}
      </button>
      {error ? <p className="w-full text-xs text-rose-600">{error}</p> : null}
    </>
  );
}
