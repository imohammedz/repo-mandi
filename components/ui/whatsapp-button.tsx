"use client";

import Link from "next/link";
import { MessageCircle } from "lucide-react";

type Props = {
  phone: string;
  text?: string;
  className?: string;
  vehicleId?: string;
};

export function WhatsAppButton({ phone, text = "WhatsApp", className = "", vehicleId }: Props) {
  const normalizedPhone = phone.replace(/[^\d+]/g, "");
  const handleClick = async () => {
    if (!vehicleId) return;
    try {
      await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vehicleId,
          source: "WHATSAPP",
        }),
      });
    } catch {
      // no-op
    }
  };

  return (
    <Link
      href={`https://wa.me/${normalizedPhone}`}
      onClick={handleClick}
      className={`inline-flex min-h-11 min-w-0 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-600 ${className}`}
      target="_blank"
      rel="noopener noreferrer"
    >
      <MessageCircle className="h-4 w-4" />
      <span className="truncate">{text}</span>
    </Link>
  );
}
