"use client";

import { useEffect, useState } from "react";

type SessionUser = {
  accountType?: string;
  isProfileComplete?: boolean;
};

/**
 * Returns the correct destination URL when a user taps "Sell":
 * - Signed-in SELLER / BANK_PARTNER / ADMIN with complete profile → /seller/add-vehicle
 * - Signed-in SELLER / BANK_PARTNER / ADMIN with incomplete profile → /onboarding
 * - Not signed in or non-SELLER → /sell
 */
export function useSellDestination(): string {
  const [destination, setDestination] = useState("/sell");

  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => {
        if (!r.ok) return null;
        return r.json() as Promise<{ user?: SessionUser }>;
      })
      .then((data) => {
        if (!data?.user) return;
        const { accountType, isProfileComplete } = data.user;
        if (accountType === "SELLER" || accountType === "BANK_PARTNER" || accountType === "ADMIN") {
          setDestination(isProfileComplete ? "/seller/add-vehicle" : "/onboarding");
        }
      })
      .catch(() => {});
  }, []);

  return destination;
}
