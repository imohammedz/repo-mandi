export type VerificationFlag = "RC Verified" | "Yard Verified" | "Photos Verified";

export type Vehicle = {
  id: string;
  sellerId?: number | null;
  createdByUserId?: number | null;
  title: string;
  type: "Truck" | "Tipper" | "Pickup" | "Bus" | "Trailer" | "Tractor";
  brand: string;
  model: string;
  year: number;
  kmDriven: number;
  fuelType: "Diesel" | "CNG";
  axleType: string;
  registrationState: string;
  city: string;
  state: string;
  image: string;
  gallery: string[];
  financeCompany: string;
  bankInstitutionName?: string;
  branchName?: string;
  price: number;
  reservePrice: number;
  repoStatus: "Bank Seized" | "Auction Live" | "Ready For Sale";
  sellerType: "Bank Agent" | "Yard Partner";
  sellerName: string;
  sellerRole: string;
  sellerPhone: string;
  condition: "Running" | "Non-running";
  conditionNotes: string;
  accidentNotes: string;
  auctionDate: string;
  yardLocation: string;
  verifiedBadges: VerificationFlag[];
  rcVerified?: boolean;
  photosVerified?: boolean;
  yardVerified?: boolean;
  sellerVerified?: boolean;
  isPublished?: boolean;
  verificationStatus?: "PENDING_VERIFICATION" | "VERIFIED" | "REJECTED";
  rejectionReason?: string;
  verifiedBy?: number | null;
  verifiedAt?: string | null;
  missingPhotos?: boolean;
  priceTooLow?: boolean;
  duplicateRegistration?: boolean;
  newSeller?: boolean;
  missingYardLocation?: boolean;
  inspectionNotes: string[];
  inquiries: number;
  listingStatus?:
    | "PENDING"
    | "VERIFIED"
    | "REJECTED"
    | "SOLD"
    | "BANK_PENDING_REVIEW"
    | "SUBMITTED_TO_REPOMANDI";
};
