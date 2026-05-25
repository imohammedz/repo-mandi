export type ApiMessageResponse = {
  message?: string;
};

export type AuthVerifyResponse = ApiMessageResponse & {
  success?: boolean;
  needsOnboarding?: boolean;
  user?: {
    id?: number;
    accountType?: "BUYER" | "SELLER" | "BANK_PARTNER" | "ADMIN";
    isProfileComplete?: boolean;
  };
};
