export type VehicleType =
  | "LCV"
  | "Truck"
  | "Tipper"
  | "Pickup"
  | "Trailer";

export type ListingStatus = "PENDING" | "VERIFIED" | "REJECTED" | "SOLD";

export type VerificationStatus = "UNVERIFIED" | "VERIFIED" | "REJECTED";

export type Vehicle = {
  id: string;
  title: string;
  vehicleType: VehicleType;
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
  status: ListingStatus;
  verificationStatus: VerificationStatus;
  sellerName: string;
  sellerPhone: string;
  images: string[];
  createdAt: string;
  updatedAt: string;
};

export type VehicleFilters = {
  search?: string;
  vehicleType?: string;
  brand?: string;
  city?: string;
  state?: string;
  financeCompany?: string;
  verificationStatus?: string;
  minPrice?: number;
  maxPrice?: number;
};

export type LeadSource = "CALL" | "WHATSAPP" | "FORM";
