"use client";

import { useEffect, useState } from "react";
import { VehicleContactActions } from "@/components/ui/vehicle-contact-actions";

type Props = {
  sellerCardId: string;
  vehicleId: string;
  sellerPhone: string;
  vehicleTitle: string;
};

const STICKY_OFFSET = "calc(4.5rem + env(safe-area-inset-bottom, 0px))";

export function VehicleStickyContactCta({ sellerCardId, vehicleId, sellerPhone, vehicleTitle }: Props) {
  const [showStickyCta, setShowStickyCta] = useState(false);

  useEffect(() => {
    let observer: IntersectionObserver | null = null;
    let retryTimer: number | null = null;
    let mounted = true;
    let attempts = 0;
    let resizeHandler: (() => void) | null = null;

    const setupObserver = () => {
      if (!mounted) return;
      const element = document.getElementById(sellerCardId);
      if (!element) {
        attempts += 1;
        if (attempts > 10) {
          retryTimer = window.setTimeout(() => mounted && setShowStickyCta(true), 0);
          return;
        }
        retryTimer = window.setTimeout(setupObserver, 100);
        return;
      }

      resizeHandler = () => {
        const rect = element.getBoundingClientRect();
        const isVisible = rect.top < window.innerHeight && rect.bottom > 0;
        setShowStickyCta(!isVisible);
      };

      observer = new IntersectionObserver(
        (entries) => {
          const entry = entries[0];
          setShowStickyCta(!entry.isIntersecting);
        },
        { threshold: 0.05 }
      );

      observer.observe(element);
      window.addEventListener("resize", resizeHandler);
      window.setTimeout(() => {
        if (!mounted) return;
        if (resizeHandler) resizeHandler();
      }, 0);
    };

    setupObserver();

    return () => {
      mounted = false;
      if (retryTimer !== null) window.clearTimeout(retryTimer);
      observer?.disconnect();
      if (resizeHandler) window.removeEventListener("resize", resizeHandler);
    };
  }, [sellerCardId]);

  if (!showStickyCta) return null;

  return (
    <div
      className="fixed inset-x-0 z-30 mx-auto w-full max-w-xl border-t border-slate-200 bg-white/95 p-3 backdrop-blur"
      style={{ bottom: STICKY_OFFSET }}
    >
      <VehicleContactActions
        vehicleId={vehicleId}
        sellerPhone={sellerPhone}
        vehicleTitle={vehicleTitle}
        className="w-full"
        showRequestDetails
        layout="inline"
      />
    </div>
  );
}
