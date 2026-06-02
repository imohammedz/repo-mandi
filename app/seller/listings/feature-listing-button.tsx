"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

interface FeatureListingButtonProps {
  listingId: string;
  isFeatured: boolean;
  featuredUntil?: string | null;
  className?: string;
}

export function FeatureListingButton({ listingId, isFeatured, featuredUntil, className }: FeatureListingButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const buttonClassName = [
    "inline-flex min-h-10 items-center justify-center rounded-lg px-3 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60",
    isFeatured
      ? "border border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100"
      : "bg-amber-500 text-white hover:bg-amber-600",
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      type="button"
      disabled={isPending}
      className={buttonClassName}
      onClick={() => {
        if (isFeatured) {
          window.alert(
            featuredUntil
              ? "Your listing is already featured. Reach out to support if you need to update featured duration."
              : "Your listing is already featured.",
          );
          return;
        }

        startTransition(async () => {
          const response = await fetch("/api/seller/dashboard", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "update-featured",
              listingId,
              isFeatured: true,
            }),
          });

          if (!response.ok) {
            let message = "Please try again.";
            try {
              const body = (await response.json()) as { message?: string };
              const apiMessage = body.message?.trim();
              if (apiMessage) message = apiMessage;
            } catch {}

            window.alert(`Unable to feature listing. ${message}`);
            return;
          }

          window.alert("Listing featured successfully.");
          router.refresh();
        });
      }}
    >
      {isPending ? "Updating..." : isFeatured ? "Manage" : "⭐ Feature Listing"}
    </button>
  );
}
