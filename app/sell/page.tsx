"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

const benefits = [
  "Reach transport buyers",
  "Verified listings",
  "Direct inquiries",
  "Faster vehicle sale",
];

export default function SellPage() {
  const router = useRouter();

  useEffect(() => {
    const check = async () => {
      try {
        const response = await fetch("/api/auth/session");
        if (!response.ok) return;
        const data = (await response.json()) as { user?: { accountType?: string; isProfileComplete?: boolean } };
        if (
          data.user?.accountType === "SELLER" ||
          data.user?.accountType === "BANK_PARTNER" ||
          data.user?.accountType === "ADMIN"
        ) {
          router.replace(data.user.isProfileComplete ? "/seller/add-vehicle" : "/onboarding");
        }
      } catch {
        // If session is unavailable, keep users on this screen.
      }
    };
    check();
  }, [router]);

  return (
    <main className="flex min-h-[calc(100dvh-80px)] flex-col px-4 pb-8 pt-12">
      <div className="flex-1 space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold leading-tight text-slate-900">
            List Your Commercial Vehicle
          </h1>
          <p className="text-sm leading-6 text-slate-500">
            Sell repossessed commercial vehicles faster. Reach buyers across India.
          </p>
        </div>

        <ul className="space-y-4">
          {benefits.map((benefit) => (
            <li key={benefit} className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />
              <span className="text-sm font-medium text-slate-700">{benefit}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-10 space-y-3">
        <Link
          href="/auth/login"
          className="inline-flex min-h-14 w-full items-center justify-center rounded-2xl bg-slate-900 text-base font-semibold text-white"
        >
          Continue with Mobile
        </Link>
        <p className="text-center text-xs text-slate-400">
          No password needed · OTP verification only
        </p>
      </div>
    </main>
  );
}
