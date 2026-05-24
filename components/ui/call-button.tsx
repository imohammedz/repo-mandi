"use client";

import Link from "next/link";
import { Phone } from "lucide-react";

type Props = {
  phone: string;
  text?: string;
  className?: string;
  vehicleId?: string;
  sellerId?: number;
};

export function CallButton({ phone, text = "Call", className = "", vehicleId }: Props) {
  const handleClick = async () => {
    if (!vehicleId) return;
    try {
      await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vehicleId,
          source: "CALL",
        }),
      });
    } catch {
      // no-op
    }
  };

  return (
    <Link
      href={`tel:${phone}`}
      onClick={handleClick}
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700 ${className}`}
    >
      <Phone className="h-4 w-4" />
      {text}
    </Link>
  );
}
