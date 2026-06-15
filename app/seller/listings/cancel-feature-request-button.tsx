"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

interface CancelFeatureRequestButtonProps {
  listingId: string;
  className?: string;
}

export function CancelFeatureRequestButton({ listingId, className }: CancelFeatureRequestButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showConfirm, setShowConfirm] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleCancel = () => {
    setErrorMessage("");
    startTransition(async () => {
      try {
        const response = await fetch(`/api/seller/vehicles/${listingId}/cancel-feature-request`, {
          method: "POST",
        });
        const body = (await response.json().catch(() => null)) as { message?: string } | null;
        if (!response.ok) {
          setErrorMessage(body?.message?.trim() || "Unable to cancel feature request. Please try again.");
          return;
        }
        setShowConfirm(false);
        router.refresh();
      } catch {
        setErrorMessage("Unable to cancel feature request. Please try again.");
      }
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setShowConfirm(true)}
        className={
          className ??
          "text-xs font-medium text-rose-600 hover:text-rose-700 underline-offset-2 hover:underline"
        }
      >
        Cancel Request
      </button>

      {showConfirm ? (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            aria-label="Close cancel confirmation"
            onClick={() => {
              if (isPending) return;
              setShowConfirm(false);
              setErrorMessage("");
            }}
            className="absolute inset-0 bg-slate-900/50"
          />
          <section className="absolute inset-x-0 bottom-0 rounded-t-3xl bg-white p-5 shadow-2xl">
            <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-slate-200" />
            <h3 className="mb-2 text-base font-semibold text-slate-900">Cancel Feature Request?</h3>
            <p className="mb-4 text-sm text-slate-600">
              Are you sure you want to cancel the feature request for this listing?
            </p>
            {errorMessage ? (
              <p className="mb-3 text-sm text-rose-600">{errorMessage}</p>
            ) : null}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  if (isPending) return;
                  setShowConfirm(false);
                  setErrorMessage("");
                }}
                disabled={isPending}
                className="min-h-11 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-700 disabled:opacity-50"
              >
                Keep Request
              </button>
              <button
                type="button"
                onClick={handleCancel}
                disabled={isPending}
                className="min-h-11 rounded-xl bg-rose-600 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
              >
                {isPending ? "Cancelling..." : "Cancel Request"}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
