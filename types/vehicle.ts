export type VerificationFlag = "RC Verified" | "Yard Verified" | "Photos Verified";

export type ListingType = "REGULAR" | "REPO";
export type ListingMode = "NORMAL" | "BULK";
export type KmMeterStatus = "WORKING" | "NOT_WORKING" | "UNKNOWN";
export type RunningCondition = "RUNNING" | "NOT_RUNNING" | "UNKNOWN";
export type EngineCondition = "EXCELLENT" | "GOOD" | "AVERAGE" | "NEEDS_WORK" | "NOT_CHECKED" | "UNKNOWN";
export type YesNoUnknown = "YES" | "NO" | "UNKNOWN";
export type TyreCondition = "NEW" | "GOOD" | "FAIR" | "AROUND_50" | "POOR" | "MIXED" | "UNKNOWN";
export type AvailabilityStatus = "AVAILABLE" | "NOT_AVAILABLE" | "UNKNOWN";
export type TransferType = "RC_TRANSFER" | "RTO_NOC" | "OPEN_NOC" | "UNKNOWN";
export type TyreMountStatus =
  | "ON_DISC"
  | "WITH_TYRES"
  | "WITHOUT_DISC_AND_TYRES"
  | "PARTIAL"
  | "UNKNOWN";
export type AssetStructure = "STANDALONE" | "DETACHABLE" | "EQUIPMENT";
export type DetachableType = "PRIME_MOVER" | "TRAILER";
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
  listingMode?: ListingMode;
  assetConfiguration?: AssetConfiguration;
  assetStructure?: AssetStructure | null;
  detachableType?: DetachableType | null;
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
    | "Tractor"
    | "Equipment";
  assetCategory?: string | null;
  vehicleSubType?: string | null;
  bodyApplicationType?: string | null;
  brand: string;
  model: string;
  year: number;
  isRegistered?: boolean | null;
  vehicleRegistrationNumber?: string;
  kmDriven: number | null;
  kmMeterStatus?: KmMeterStatus;
  runningCondition?: RunningCondition;
  fuelType: "Diesel" | "CNG";
  bsNorm?: string | null;
  transmission?: string | null;
  axleConfiguration?: string | null;
  horsepower?: number | null;
  odometerReading?: number | null;
  hourMeterReading?: number | null;
  axleType: string;
  numberOfAxles?: number | null;
  bodyType?: string | null;
  bodyLength?: string | null;
  bodyDimensions?: string | null;
  payloadCapacity?: string | null;
  bodyAttached?: YesNoUnknown | null;
  bodyCondition?: string | null;
  trailerType?: string | null;
  trailerLength?: string | null;
  trailerManufacturer?: string | null;
  trailerManufacturingMonthYear?: string | null;
  suspensionType?: string | null;
  tyreInspectionReport?: AvailabilityStatus | null;
  totalTyres?: number | null;
  tyreCount?: number | null;
  currentTyreCount?: number | null;
  tyreMountStatus?: TyreMountStatus | null;
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
  leftSidePhoto?: string;
  rightSidePhoto?: string;
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
  alternateContactNumberVerified?: boolean;
  businessName?: string;
  gstin?: string;
  condition: "Running" | "Non-running" | "Unknown";
  description?: string;
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
  transferType?: TransferType | null;
  nocStatus?: "AVAILABLE" | "NOT_AVAILABLE" | "UNKNOWN" | null;
  machineSerialNumber?: string | null;
  engineNumber?: string;
  chassisNumber?: string;
  trailerNumber?: string;
  gvwTonnes?: string;
  gpsInstalled?: YesNoUnknown | null;
  abs?: YesNoUnknown | null;
  batteryAvailable?: YesNoUnknown | null;
  keyAvailable?: YesNoUnknown | null;
  acCabin?: YesNoUnknown | null;
  tyresIncluded?: YesNoUnknown | null;
  rimsDiscsIncluded?: YesNoUnknown | null;
  batteryIncluded?: YesNoUnknown | null;
  cabinAvailable?: YesNoUnknown | null;
  engineAvailable?: YesNoUnknown | null;
  documentsAvailable?: YesNoUnknown | null;
  remarks?: string | null;
  fleetManagementSoftwareAvailable?: AvailabilityStatus | null;
  insuranceValidity?: string | null;
  permitValidity?: string | null;
  fitnessStatus?: string | null;
  taxValidity?: string | null;
  parkingDue?: number | null;
  verifiedBadges: VerificationFlag[];
  rcVerified?: boolean;
  photosVerified?: boolean;
  yardVerified?: boolean;
  sellerVerified?: boolean;
  isPublished?: boolean;
  isFeatured?: boolean;
  featuredAt?: string | null;
  featuredExpiresAt?: string | null;
  featuredBy?: number | null;
  verificationStatus?: "PENDING_VERIFICATION" | "VERIFIED" | "REJECTED";
  rejectionReason?: string;
  verifiedBy?: number | null;
  verifiedAt?: string | null;
  soldAt?: string | null;
  deletedAt?: string | null;
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
