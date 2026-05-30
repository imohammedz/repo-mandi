"use client";

import Link from "next/link";
import { SupportContactCard } from "@/components/ui/support-contact-card";
import { SITE_CONFIG, SUPPORT_SUBJECTS } from "@/lib/config/site";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  if (process.env.NODE_ENV !== "production") {
    console.error(error);
  }

  return (
    <main className="space-y-4 px-4 pb-8 pt-8">
      <h1 className="text-2xl font-semibold text-slate-900">Something went wrong</h1>
      <p className="text-sm text-slate-600">If the problem continues, contact {SITE_CONFIG.supportEmail}.</p>
      <SupportContactCard
        title="Support Email"
        description="If the problem continues, contact support."
        subject={SUPPORT_SUBJECTS.general}
        ctaLabel="Contact Support"
      />
      <div className="flex gap-2">
        <button
          type="button"
          onClick={reset}
          className="inline-flex min-h-11 items-center justify-center rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white"
        >
          Try Again
        </button>
        <Link href="/" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700">
          Back to Home
        </Link>
      </div>
    </main>
  );
}
