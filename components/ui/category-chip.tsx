"use client";

import { X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

const CATEGORY_LABELS: Record<string, string> = {
  "prime-mover": "Prime Mover",
  trailers: "Trailers",
  tippers: "Tippers",
  container: "Container",
  buses: "Buses",
  equipment: "Equipment",
};

export function CategoryChip() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const category = searchParams.get("category");
  const label = category ? CATEGORY_LABELS[category] : null;

  if (!label) return null;

  const handleRemove = () => {
    const next = new URLSearchParams(searchParams.toString());
    next.delete("category");
    next.delete("page");
    const qs = next.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  };

  return (
    <div className="mt-2 flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={handleRemove}
        className="inline-flex min-h-8 items-center gap-1 rounded-full border border-slate-200 bg-white px-3 text-xs text-slate-700"
      >
        <span className="font-medium">Category:</span> {label}
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
