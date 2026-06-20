"use client";

import { useEffect, useState } from "react";

type SessionUser = {
  accountType?: string;
  isProfileComplete?: boolean;
};

/** Account types that have seller access. */
export const SELLER_ACCOUNT_TYPES = ["SELLER", "BANK_PARTNER", "ADMIN"] as const;

export function isSellerAccountType(accountType: string | undefined): boolean {
  return SELLER_ACCOUNT_TYPES.includes(accountType as (typeof SELLER_ACCOUNT_TYPES)[number]);
}

/**
 * Returns the correct destination URL when a user taps "Sell":
 * - Signed-in SELLER / BANK_PARTNER / ADMIN with complete profile → /seller/add-vehicle
 * - Signed-in SELLER / BANK_PARTNER / ADMIN with incomplete profile → /onboarding
 * - Not signed in or non-SELLER → /sell
 */
export function useSellDestination(): string {
  const [destination, setDestination] = useState("/sell");

  useEffect(() => {
    let cancelled = false;

    fetch("/api/auth/session")
      .then((r) => {
        if (!r.ok) return null;
        return r.json() as Promise<{ user?: SessionUser }>;
      })
      .then((data) => {
        if (cancelled) return;
        if (!data?.user) return;
        const { accountType, isProfileComplete } = data.user;
        if (isSellerAccountType(accountType)) {
          setDestination(isProfileComplete ? "/seller/add-vehicle" : "/onboarding");
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, []);

  return destination;
}
