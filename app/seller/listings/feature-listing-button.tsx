"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface FeatureListingButtonProps {
  listingId: string;
  isFeatured: boolean;
  featuredUntil?: string | null;
  className?: string;
}

export function FeatureListingButton({ listingId, isFeatured, featuredUntil, className }: FeatureListingButtonProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      className={cn(
        "inline-flex min-h-10 items-center justify-center rounded-lg px-3 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60",
        isFeatured
          ? "border border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100"
          : "bg-amber-500 text-white hover:bg-amber-600",
        className,
      )}
      onClick={() => {
        if (isFeatured) {
          toast({
            title: "Featured listing",
            description: featuredUntil
              ? "Your listing is already featured. Reach out to support if you need to update featured duration."
              : "Your listing is already featured.",
          });
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

            toast({
              title: "Unable to feature listing",
              description: message,
              variant: "destructive",
            });
            return;
          }

          toast({
            title: "Listing featured",
            description: "Your listing is now promoted to more buyers.",
          });
          router.refresh();
        });
      }}
    >
      {isPending ? "Updating..." : isFeatured ? "Manage" : "⭐ Feature Listing"}
    </button>
  );
}
