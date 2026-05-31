"use client";

import { ShieldCheck } from "lucide-react";
import { VehicleContactActions } from "@/components/ui/vehicle-contact-actions";

type Props = {
  vehicleId: string;
  sellerPhone: string;
  vehicleTitle: string;
};

const STICKY_OFFSET = "calc(4.5rem + env(safe-area-inset-bottom, 0px))";

export function VehicleStickyContactCta({ vehicleId, sellerPhone, vehicleTitle }: Props) {
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
      <div className="mt-2 flex items-center justify-center gap-1.5">
        <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden="true" />
        <p className="text-center text-xs text-slate-400">
          Your details are safe and are not shared publicly.
        </p>
      </div>
    </div>
  );
}
