import Link from "next/link";
import { getSupportMailto, SITE_CONFIG } from "@/lib/config/site";

export const metadata = {
  title: "Contact – RepoMandi",
};

export default function ContactPage() {
  return (
    <main className="mx-auto w-full max-w-xl px-4 py-10">
      <h1 className="text-xl font-semibold text-slate-900">Contact Us</h1>
      <p className="mt-4 text-sm text-slate-600">
        For any questions, partnerships, or assistance, contact us at:
      </p>
      <Link
        href={getSupportMailto()}
        className="mt-2 inline-block text-sm font-medium text-slate-900 underline underline-offset-2 hover:text-[#E8651A] transition-colors"
      >
        {SITE_CONFIG.supportEmail}
      </Link>
    </main>
  );
}
