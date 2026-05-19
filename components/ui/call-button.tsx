import Link from "next/link";
import { Phone } from "lucide-react";

type Props = {
  phone: string;
  text?: string;
  className?: string;
};

export function CallButton({ phone, text = "Call", className = "" }: Props) {
  return (
    <Link
      href={`tel:${phone}`}
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700 ${className}`}
    >
      <Phone className="h-4 w-4" />
      {text}
    </Link>
  );
}
