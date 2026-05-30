import Link from "next/link";
import { getSupportMailto, SITE_CONFIG } from "@/lib/config/site";

type SupportContactCardProps = {
  title?: string;
  description?: string;
  subject?: string;
  ctaLabel?: string;
  className?: string;
};

export function SupportContactCard({
  title = "Support Email",
  description,
  subject,
  ctaLabel,
  className = "",
}: SupportContactCardProps) {
  const classes = ["rounded-2xl border border-slate-200 bg-white p-4 shadow-sm", className]
    .filter(Boolean)
    .join(" ");

  return (
    <section className={classes}>
      <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
      {description ? <p className="mt-1 text-sm text-slate-600">{description}</p> : null}
      <Link
        href={getSupportMailto(subject)}
        className="mt-3 inline-flex text-sm font-medium text-slate-900 underline underline-offset-2"
      >
        {SITE_CONFIG.supportEmail}
      </Link>
      {ctaLabel ? (
        <div>
          <Link
            href={getSupportMailto(subject)}
            className="mt-3 inline-flex min-h-10 items-center rounded-lg border border-slate-200 px-3 text-sm font-medium text-slate-700"
          >
            {ctaLabel}
          </Link>
        </div>
      ) : null}
    </section>
  );
}
