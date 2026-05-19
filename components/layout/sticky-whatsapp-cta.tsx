"use client";

import { usePathname } from "next/navigation";
import { WhatsAppButton } from "@/components/ui/whatsapp-button";

export function StickyWhatsAppCTA() {
  const pathname = usePathname();

  if (pathname.startsWith("/auth") || pathname.startsWith("/admin") || pathname.startsWith("/seller") || pathname === "/sell") {
    return null;
  }

  return (
    <div className="fixed bottom-20 right-4 z-40">
      <WhatsAppButton phone="+919876543210" text="Need Help?" className="rounded-full px-5" />
    </div>
  );
}
