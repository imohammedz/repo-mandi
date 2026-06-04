"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

interface FeatureListingButtonProps {
  listingId: string;
  isFeatured: boolean;
  hasPendingRequest?: boolean;
  featuredUntil?: string | null;
  className?: string;
}

export function FeatureListingButton({
  listingId,
  isFeatured,
  hasPendingRequest = false,
  featuredUntil,
  className,
}: FeatureListingButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showModal, setShowModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const buttonClassName = [
    "inline-flex min-h-10 items-center justify-center rounded-lg px-3 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60",
    isFeatured || hasPendingRequest
      ? "border border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100"
      : "bg-amber-500 text-white hover:bg-amber-600",
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");

  const handleOpen = () => {
    if (isFeatured) {
      window.alert(
        featuredUntil
          ? "Your listing is already featured. Reach out to support if you need to update featured duration."
          : "Your listing is already featured.",
      );
      return;
    }
    if (hasPendingRequest) return;
    setSuccessMessage("");
    setErrorMessage("");
    setShowModal(true);
  };

  const handleClose = () => {
    if (isPending) return;
    setShowModal(false);
  };

  const handleSubmit = () => {
    startTransition(async () => {
      setErrorMessage("");
      try {
        const response = await fetch(`/api/seller/vehicles/${listingId}/feature-request`, {
          method: "POST",
        });
        const body = (await response.json().catch(() => null)) as { message?: string } | null;
        if (!response.ok) {
          setErrorMessage(body?.message?.trim() || "Unable to submit feature request. Please try again.");
          return;
        }
        setSuccessMessage(
          body?.message?.trim() ||
            "Feature request submitted. RepoMandi will review and feature your listing.",
        );
        setShowModal(false);
        router.refresh();
      } catch {
        setErrorMessage("Unable to submit feature request. Please try again.");
      }
    });
  };

  return (
    <>
      <button
        type="button"
        disabled={isPending || hasPendingRequest}
        className={buttonClassName}
        onClick={handleOpen}
      >
        {isPending
          ? "Submitting..."
          : hasPendingRequest
            ? "Feature Requested"
            : isFeatured
              ? "Manage"
              : "⭐ Feature Listing"}
      </button>

      {successMessage ? (
        <p className="mt-1 w-full text-xs text-emerald-600">{successMessage}</p>
      ) : null}

      {showModal ? (
        <div className="fixed inset-0 z-50">
          <button
            aria-label="Close feature request modal"
            onClick={handleClose}
            className="absolute inset-0 bg-slate-900/50"
          />
          <section className="absolute inset-x-0 bottom-0 rounded-t-3xl bg-white p-5 shadow-2xl">
            <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-slate-200" />
            <h3 className="mb-2 text-base font-semibold text-slate-900">⭐ Feature This Listing</h3>
            <p className="mb-4 text-sm text-slate-600">
              Featured listings appear on the home page, at the top of search results, and in the Featured
              Listings section. Your request will be reviewed by the RepoMandi team.
            </p>
            {errorMessage ? (
              <p className="mb-3 text-sm text-rose-600">{errorMessage}</p>
            ) : null}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleClose}
                disabled={isPending}
                className="min-h-11 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-700 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isPending}
                className="min-h-11 rounded-xl bg-amber-500 text-sm font-semibold text-white hover:bg-amber-600 disabled:opacity-50"
              >
                {isPending ? "Submitting..." : "Submit Request"}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
