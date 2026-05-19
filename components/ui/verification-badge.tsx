import { ShieldCheck } from "lucide-react";

export function VerificationBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
      <ShieldCheck className="h-3.5 w-3.5" />
      {label}
    </span>
  );
}
