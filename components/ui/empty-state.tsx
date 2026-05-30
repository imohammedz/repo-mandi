import { Inbox } from "lucide-react";
import Link from "next/link";
import { getSupportMailto, SITE_CONFIG, SUPPORT_SUBJECTS } from "@/lib/config/site";

export function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center">
      <Inbox className="mx-auto h-6 w-6 text-slate-400" />
      <h3 className="mt-3 text-base font-semibold text-slate-900">{title}</h3>
      <p className="mt-1 text-sm text-slate-500">{description}</p>
      <p className="mt-3 text-xs text-slate-500">
        Need help?{" "}
        <Link href={getSupportMailto(SUPPORT_SUBJECTS.general)} className="font-medium text-slate-700 underline underline-offset-2">
          {SITE_CONFIG.supportEmail}
        </Link>
      </p>
    </div>
  );
}
