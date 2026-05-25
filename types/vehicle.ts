export type VerificationFlag = "RC Verified" | "Yard Verified" | "Photos Verified";

export type ListingType = "REGULAR" | "REPO";
export type KmMeterStatus = "WORKING" | "NOT_WORKING" | "UNKNOWN";
export type RunningCondition = "RUNNING" | "NOT_RUNNING" | "UNKNOWN";
export type EngineCondition = "GOOD" | "AVERAGE" | "NEEDS_WORK" | "NOT_CHECKED" | "UNKNOWN";
export type YesNoUnknown = "YES" | "NO" | "UNKNOWN";
export type TyreCondition = "NEW" | "GOOD" | "FAIR" | "AROUND_50" | "POOR" | "MIXED" | "UNKNOWN";
export type AvailabilityStatus = "AVAILABLE" | "NOT_AVAILABLE" | "UNKNOWN";
export type AssetConfiguration =
  | "Complete Vehicle"
  | "Power / Horse / Tractor / Prime Mover Only"
  | "Trailer Only"
  | "Prime Mover + Trailer"
  | "Other";

export type Vehicle = {
  id: string;
  sellerId?: number | null;
  createdByUserId?: number | null;
  listingType: ListingType;
  assetConfiguration?: AssetConfiguration;
  status?: string;
  title: string;
  type:
    | "Mini Truck"
    | "Pickup"
    | "LCV (Light Commercial Vehicle)"
    | "MCV (Medium Commercial Vehicle)"
    | "HCV (Heavy Commercial Vehicle)"
    | "Trailer"
    | "Tanker"
    | "Container Truck"
    | "Tipper"
    | "Bus"
    | "Truck"
    | "Tractor";
  vehicleSubType?: string | null;
  brand: string;
  model: string;
  year: number;
  vehicleRegistrationNumber?: string;
  kmDriven: number | null;
  kmMeterStatus?: KmMeterStatus;
  runningCondition?: RunningCondition;
  fuelType: "Diesel" | "CNG";
  axleType: string;
  numberOfAxles?: number | null;
  bodyType?: string | null;
  bodyDimensions?: string | null;
  trailerType?: string | null;
  trailerLength?: string | null;
  trailerManufacturer?: string | null;
  trailerManufacturingMonthYear?: string | null;
  suspensionType?: string | null;
  tyreInspectionReport?: AvailabilityStatus | null;
  tyreCount?: number | null;
  currentTyreCount?: number | null;
  tyreCondition?: TyreCondition | null;
  registrationState: string;
  city: string;
  state: string;
  vehicleOrYardLocation?: string;
  image: string;
  gallery: string[];
  frontPhoto?: string;
  backPhoto?: string;
  sidePhoto?: string;
  interiorPhoto?: string;
  walkaroundVideo?: string | null;
  engineStartUpVideo?: string | null;
  financeCompany: string;
  bankInstitutionName?: string;
  branchName?: string;
  price: number;
  expectedPrice?: number;
  reservePrice: number;
  repoStatus: "Bank Seized" | "Yard Stock" | "Auction Live" | "Auction Upcoming" | "Ready For Sale" | "Under Settlement";
  sellerType: "Bank Agent" | "Yard Partner";
  sellerName: string;
  sellerRole: string;
  sellerPhone: string;
  alternateContactNumber?: string;
  businessName?: string;
  gstin?: string;
  condition: "Running" | "Non-running" | "Unknown";
  conditionNotes: string;
  engineCondition?: EngineCondition | null;
  needsTowing?: YesNoUnknown | null;
  roadSafeStatus?: "ROAD_SAFE" | "NOT_ROAD_SAFE" | "UNKNOWN" | null;
  accidentNotes: string;
  auctionDate: string;
  yardName?: string;
  yardContact?: string;
  yardLocation: string;
  taxDue?: string;
  challans?: string;
  insuranceExpiry?: string;
  fitnessExpiry?: string;
  permitExpiry?: string;
  nocStatus?: "AVAILABLE" | "NOT_AVAILABLE" | "UNKNOWN" | null;
  engineNumber?: string;
  chassisNumber?: string;
  trailerNumber?: string;
  gvwTonnes?: string;
  gpsInstalled?: YesNoUnknown | null;
  abs?: YesNoUnknown | null;
  fleetManagementSoftwareAvailable?: AvailabilityStatus | null;
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
  soldAt?: string | null;
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
