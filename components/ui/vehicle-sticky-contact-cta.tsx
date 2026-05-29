"use client";

import { useEffect, useRef, useState } from "react";
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
  const sellerCardRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    let observer: IntersectionObserver | null = null;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let mounted = true;
    let attempts = 0;

    const setupObserver = () => {
      if (!mounted) return;
      if (!sellerCardRef.current) {
        sellerCardRef.current = document.getElementById(sellerCardId);
      }

      if (!sellerCardRef.current) {
        attempts += 1;
        if (attempts > 10) {
          setShowStickyCta(true);
          return;
        }
        retryTimer = setTimeout(setupObserver, 100);
        return;
      }

      observer = new IntersectionObserver(
        (entries) => {
          const entry = entries[0];
          const sellerCardVisible = entry.isIntersecting && entry.intersectionRatio > 0;
          setShowStickyCta(!sellerCardVisible);
        },
        { threshold: [0, 0.01, 0.05] }
      );

      observer.observe(sellerCardRef.current);
    };

    setupObserver();

    return () => {
      mounted = false;
      if (retryTimer !== null) clearTimeout(retryTimer);
      observer?.disconnect();
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
