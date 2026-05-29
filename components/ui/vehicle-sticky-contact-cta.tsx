"use client";

import { useEffect, useState } from "react";
import { VehicleContactActions } from "@/components/ui/vehicle-contact-actions";

type Props = {
  sellerCardId: string;
  vehicleId: string;
  sellerPhone: string;
  vehicleTitle: string;
};

export function VehicleStickyContactCta({ sellerCardId, vehicleId, sellerPhone, vehicleTitle }: Props) {
  const [showStickyCta, setShowStickyCta] = useState(false);

  useEffect(() => {
    const element = document.getElementById(sellerCardId);
    if (!element) {
      setShowStickyCta(true);
      return;
    }

    const updateFromRect = () => {
      const rect = element.getBoundingClientRect();
      const isVisible = rect.top < window.innerHeight && rect.bottom > 0;
      setShowStickyCta(!isVisible);
    };

    updateFromRect();

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        setShowStickyCta(!entry.isIntersecting);
      },
      { threshold: 0.05 }
    );

    observer.observe(element);
    window.addEventListener("resize", updateFromRect);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateFromRect);
    };
  }, [sellerCardId]);

  if (!showStickyCta) return null;

  return (
    <div
      className="fixed inset-x-0 z-30 mx-auto w-full max-w-xl border-t border-slate-200 bg-white/95 p-3 backdrop-blur"
      style={{ bottom: "calc(4.5rem + env(safe-area-inset-bottom, 0px))" }}
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
