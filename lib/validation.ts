import type { ListingStatus } from "@/lib/types";

const listingStatuses: ListingStatus[] = ["PENDING", "VERIFIED", "REJECTED", "SOLD"];

const requiredText = [
  "vehicleType",
  "brand",
  "model",
  "registrationState",
  "financeCompany",
  "city",
  "state",
  "yardLocation",
  "condition",
  "sellerName",
  "sellerPhone",
] as const;

export type ListingPayload = {
  vehicleType: string;
  brand: string;
  model: string;
  year: number;
  registrationState: string;
  price: number;
  financeCompany: string;
  city: string;
  state: string;
  yardLocation: string;
  condition: string;
  sellerName: string;
  sellerPhone: string;
};

const normalizeText = (value: unknown) => String(value ?? "").trim();

export function parseListingPayload(input: Record<string, unknown>): ListingPayload {
  for (const field of requiredText) {
    if (!normalizeText(input[field])) {
      throw new Error(`Missing required field: ${field}`);
    }
  }

  const year = Number(input.year);
  const price = Number(input.price);

  if (!Number.isInteger(year) || year < 1990 || year > new Date().getFullYear() + 1) {
    throw new Error("Invalid year");
  }

  if (!Number.isFinite(price) || price <= 0) {
    throw new Error("Invalid price");
  }

  return {
    vehicleType: normalizeText(input.vehicleType),
    brand: normalizeText(input.brand),
    model: normalizeText(input.model),
    year,
    registrationState: normalizeText(input.registrationState),
    price,
    financeCompany: normalizeText(input.financeCompany),
    city: normalizeText(input.city),
    state: normalizeText(input.state),
    yardLocation: normalizeText(input.yardLocation),
    condition: normalizeText(input.condition),
    sellerName: normalizeText(input.sellerName),
    sellerPhone: normalizeText(input.sellerPhone),
  };
}

export function parseListingStatus(status: unknown): ListingStatus {
  if (typeof status !== "string" || !listingStatuses.includes(status as ListingStatus)) {
    throw new Error("Invalid listing status");
  }

  return status as ListingStatus;
}
