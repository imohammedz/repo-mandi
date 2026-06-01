import Link from "next/link";
import { getSupportMailto, SITE_CONFIG } from "@/lib/config/site";

export function SiteFooter() {
  return (
    <footer className="mx-auto w-full max-w-xl px-4 pb-24 pt-2">
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900">Contact</h2>
        <div className="mt-3 space-y-3 text-sm text-slate-600">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Support Email</p>
            <Link href={getSupportMailto()} className="font-medium text-slate-900 underline underline-offset-2">
              {SITE_CONFIG.supportEmail}
            </Link>
          </div>
        </div>
      </section>
    </footer>
  );
}
