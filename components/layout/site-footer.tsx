"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Check, Copy } from "lucide-react";
import { useEffect, useState } from "react";
import { getSupportMailto, SITE_CONFIG, SITE_COPYRIGHT } from "@/lib/config/site";

const TOAST_DURATION_MS = 2200;
const DEFAULT_BOTTOM_PADDING = "calc(10rem + env(safe-area-inset-bottom, 0px))";
const DETAIL_PAGE_BOTTOM_PADDING = "calc(11rem + env(safe-area-inset-bottom, 0px))";

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
  // Legacy fallback when the Clipboard API is unavailable, kept for older mobile browser compatibility.
  const copied = document.execCommand("copy");
  document.body.removeChild(textarea);

  if (!copied) {
    throw new Error("Unable to copy text");
  }
}

export function SiteFooter() {
  const pathname = usePathname();
  const [copied, setCopied] = useState(false);

  const footerPaddingBottom = pathname.startsWith("/vehicles/") ? DETAIL_PAGE_BOTTOM_PADDING : DEFAULT_BOTTOM_PADDING;

  useEffect(() => {
    if (!copied) {
      return;
    }

    const timer = window.setTimeout(() => setCopied(false), TOAST_DURATION_MS);
    return () => window.clearTimeout(timer);
  }, [copied]);

  const handleCopy = async () => {
    try {
      await copyText(SITE_CONFIG.supportEmail);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <footer className="mx-auto w-full max-w-xl px-4 pt-2" style={{ paddingBottom: footerPaddingBottom }}>
      <section className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-slate-900">Contact</h2>
            <Link
              href={getSupportMailto()}
              className="mt-1 block truncate text-sm font-medium text-slate-900 underline underline-offset-2"
            >
              {SITE_CONFIG.supportEmail}
            </Link>
          </div>
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex shrink-0 items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
            aria-label={copied ? "Support email copied" : `Copy support email ${SITE_CONFIG.supportEmail}`}
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      </section>
      <div className="mt-4 text-center text-xs text-slate-500">
        <p>{SITE_COPYRIGHT}</p>
      </div>
      <span className="sr-only" aria-live="polite">
        {copied ? "Support email copied" : ""}
      </span>
    </footer>
  );
}
