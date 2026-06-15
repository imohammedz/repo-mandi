"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

interface FeatureListingButtonProps {
  listingId: string;
  isFeatured: boolean;
  hasPendingRequest?: boolean;
  featuredUntil?: string | null;
  className?: string;
  menuItem?: boolean;
  onAction?: () => void;
}

export function FeatureListingButton({
  listingId,
  isFeatured,
  hasPendingRequest = false,
  featuredUntil,
  className,
  menuItem = false,
  onAction,
}: FeatureListingButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showModal, setShowModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const isDisabled = isPending || (!menuItem && isFeatured);

  const buttonClassName = [
    menuItem
      ? "flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm disabled:opacity-60"
      : "inline-flex min-h-10 items-center justify-center rounded-lg px-3 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60",
    menuItem
      ? isFeatured
        ? "bg-amber-50 text-amber-800 hover:bg-amber-100"
        : "text-slate-700 hover:bg-slate-50"
      : isFeatured
        ? "border border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100"
        : "bg-amber-500 text-white hover:bg-amber-600",
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");

  const handleOpen = () => {
    onAction?.();
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

  // When there's a pending request, don't show this button — the parent shows Cancel instead
  if (hasPendingRequest) return null;

  return (
    <>
      <button
        type="button"
        disabled={isDisabled}
        className={buttonClassName}
        onClick={handleOpen}
      >
        {isPending
          ? "Submitting..."
          : isFeatured
            ? "⭐ Featured"
            : "⭐ Feature Listing"}
      </button>

      {!menuItem && successMessage ? (
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
