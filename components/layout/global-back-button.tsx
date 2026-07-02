"use client";

import { ArrowLeft } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

export function GlobalBackButton() {
  const pathname = usePathname();
  const router = useRouter();

  if (pathname === "/") {
    return null;
  }

  const goBack = () => {
    let navigated = false;
    const handlePopState = () => {
      navigated = true;
    };
    window.addEventListener("popstate", handlePopState, { once: true });
    router.back();
    window.setTimeout(() => {
      if (!navigated) {
        router.push("/");
      }
    }, 150);
  };

  return (
    <button
      type="button"
      aria-label="Go back"
      onClick={goBack}
      className="fixed left-4 top-16 z-40 inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white/95 text-slate-700 shadow-sm backdrop-blur transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2"
    >
      <ArrowLeft className="h-4 w-4" />
    </button>
  );
}
