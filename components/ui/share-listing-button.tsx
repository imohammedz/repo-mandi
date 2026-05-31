"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Share2, X } from "lucide-react";
import {
  buildEmailShareUrl,
  buildListingSharePayload,
  buildListingPublicUrl,
  buildTelegramShareUrl,
  buildWhatsAppShareUrl,
} from "@/lib/listing-share";

type Props = {
  listingId?: string;
  title?: string;
  location?: string | null;
  price?: number | null;
  url?: string;
  className?: string;
  variant?: "icon" | "button";
  label?: string;
  onShareClick?: () => void;
};

const MOBILE_SHARE_MEDIA_QUERY = "(max-width: 768px)";
const TOAST_DURATION_MS = 2200;

const canUseNativeShare = () =>
  typeof navigator !== "undefined" &&
  typeof navigator.share === "function" &&
  (navigator.maxTouchPoints > 0 ||
    window.matchMedia(MOBILE_SHARE_MEDIA_QUERY).matches ||
    /android|iphone|ipad|ipod/i.test(navigator.userAgent));

async function copyText(value: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "absolute";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();
  // Legacy fallback for older browsers without Clipboard API support.
  const copied = document.execCommand("copy");
  document.body.removeChild(textarea);
  if (!copied) {
    throw new Error("Unable to copy text");
  }
}

export function ShareListingButton({
  listingId,
  title,
  location,
  price,
  url,
  className = "",
  variant = "button",
  label = "Share",
  onShareClick,
}: Props) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const toastTimerRef = useRef<number | null>(null);
  const safeListingId = listingId?.trim() || "unknown";
  const safeTitle = title?.trim() || "Commercial Vehicle Listing";
  const safeLocation = location?.trim() || "Location unavailable";
  const safeUrl = url || buildListingPublicUrl(safeListingId);
  const sharePayload = useMemo(
    () =>
      buildListingSharePayload({
        listingId: safeListingId,
        title: safeTitle,
        location: safeLocation,
        price,
        url: safeUrl,
      }),
    [safeListingId, safeTitle, safeLocation, price, safeUrl]
  );

  const showToast = (message: string) => {
    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current);
    }
    setToastMessage(message);
    toastTimerRef.current = window.setTimeout(() => setToastMessage(""), TOAST_DURATION_MS);
  };

  useEffect(
    () => () => {
      if (toastTimerRef.current) {
        window.clearTimeout(toastTimerRef.current);
      }
    },
    []
  );

  const openFallback = () => {
    // TODO: Persist shareCount updates through onShareClick into backend analytics once shareCount is added to schema.
    onShareClick?.();
    setIsModalOpen(true);
  };

  const handlePrimaryShare = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();

    if (!canUseNativeShare()) {
      openFallback();
      return;
    }

    try {
      onShareClick?.();
      await navigator.share(sharePayload);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setIsModalOpen(true);
    }
  };

  const handleCopyLink = async () => {
    try {
      await copyText(sharePayload.url);
      onShareClick?.();
      showToast("Link copied successfully");
      setIsModalOpen(false);
    } catch {
      showToast("Unable to copy link");
    }
  };

  const openExternal = (target: "whatsapp" | "telegram" | "email") => {
    onShareClick?.();
    const shareData = { listingId: safeListingId, title: safeTitle, location: safeLocation, price, url: sharePayload.url };
    if (target === "email") {
      window.location.href = buildEmailShareUrl(shareData);
      return;
    }

    const shareUrl = target === "whatsapp" ? buildWhatsAppShareUrl(shareData) : buildTelegramShareUrl(shareData);
    window.open(shareUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <>
      <button
        type="button"
        onClick={handlePrimaryShare}
        aria-label="Share listing"
        className={
          variant === "icon"
            ? `inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/90 p-2 text-gray-800 shadow transition hover:bg-white ${className}`
            : `inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 ${className}`
        }
      >
        <Share2 className="h-4 w-4" />
        {variant === "button" ? <span>{label}</span> : null}
      </button>

      {isModalOpen ? (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            aria-label="Close share options"
            onClick={() => setIsModalOpen(false)}
            className="absolute inset-0 bg-slate-900/45"
          />
          <section className="absolute inset-x-0 bottom-0 rounded-t-3xl bg-white p-4 shadow-2xl">
            <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-slate-200" />
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-900">Share listing</h3>
              <button
                type="button"
                aria-label="Close share sheet"
                onClick={() => setIsModalOpen(false)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleCopyLink}
                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-700"
              >
                Copy Link
              </button>
              <button
                type="button"
                onClick={() => openExternal("whatsapp")}
                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-700"
              >
                WhatsApp
              </button>
              <button
                type="button"
                onClick={() => openExternal("telegram")}
                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-700"
              >
                Telegram
              </button>
              <button
                type="button"
                onClick={() => openExternal("email")}
                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-700"
              >
                Email
              </button>
            </div>
            {/* TODO: Add QR code share action in this share sheet after listing QR generation API/UI is added. */}
          </section>
        </div>
      ) : null}

      {toastMessage ? (
        <div className="pointer-events-none fixed bottom-24 left-1/2 z-[60] -translate-x-1/2 rounded-full bg-slate-900 px-4 py-2 text-xs font-medium text-white shadow-lg">
          {toastMessage}
        </div>
      ) : null}
    </>
  );
}
