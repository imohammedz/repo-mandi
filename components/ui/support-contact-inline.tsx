import Link from "next/link";
import { getSupportMailto, SITE_CONFIG, SUPPORT_SUBJECTS } from "@/lib/config/site";

type SupportContactInlineProps = {
  prompt?: string;
  subject?: string;
  className?: string;
};

export function SupportContactInline({
  prompt = "Need help?",
  subject = SUPPORT_SUBJECTS.general,
  className = "text-xs text-slate-500",
}: SupportContactInlineProps) {
  return (
    <p className={className}>
      {prompt}{" "}
      <Link href={getSupportMailto(subject)} className="font-medium text-slate-700 underline underline-offset-2">
        {SITE_CONFIG.supportEmail}
      </Link>
    </p>
  );
}
