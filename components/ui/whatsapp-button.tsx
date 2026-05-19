import Link from "next/link";
import { MessageCircle } from "lucide-react";

type Props = {
  phone: string;
  text?: string;
  className?: string;
};

export function WhatsAppButton({ phone, text = "WhatsApp", className = "" }: Props) {
  const normalizedPhone = phone.replace(/[^\d+]/g, "");

  return (
    <Link
      href={`https://wa.me/${normalizedPhone}`}
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-600 ${className}`}
      target="_blank"
      rel="noopener noreferrer"
    >
      <MessageCircle className="h-4 w-4" />
      {text}
    </Link>
  );
}
