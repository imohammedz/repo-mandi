"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, FileImage, FileText, X } from "lucide-react";
import { SafeImage } from "@/components/ui/safe-image";
import { shouldLogMediaDebug } from "@/lib/media";
import {
  ASSET_STRUCTURE_LABELS,
  DETACHABLE_TYPE_HELPER_TEXT,
  DETACHABLE_TYPE_LABELS,
  getAssetCategoryOptions,
  getBodyApplicationOptions,
  hasEngineOrPowertrain,
  toLegacyAssetConfiguration,
  type AssetStructure,
  type DetachableType,
} from "@/lib/vehicle-classification";
import { formatEnumLabel } from "@/lib/formatting";

type ListingType = "REGULAR" | "REPO";
type ListingMode = "NORMAL" | "BULK";
type KmMeterStatus = "WORKING" | "NOT_WORKING" | "UNKNOWN";
type Msg91InitConfig = {
  widgetId: string;
  tokenAuth: string;
  identifier: string;
  exposeMethods?: boolean;
  captchaRenderId?: string;
  success?: (payload: unknown) => void;
  failure?: (payload: unknown) => void;
};

declare global {
  interface Window {
    initSendOTP?: (config: Msg91InitConfig) => void;
  }
}

const MSG91_WIDGET_ID = process.env.NEXT_PUBLIC_MSG91_WIDGET_ID ?? "";
const MSG91_WIDGET_TOKEN = process.env.NEXT_PUBLIC_MSG91_WIDGET_TOKEN ?? "";

type SessionUser = {
  id: number;
  phone: string;
  fullName: string;
  accountType: "BUYER" | "SELLER" | "BANK_PARTNER" | "ADMIN";
  sellerRole: string | null;
  bankRole: string | null;
  businessName: string;
  city: string;
  state: string;
  isProfileComplete: boolean;
};

type UploadCategory =
  | "frontPhoto"
  | "backPhoto"
  | "leftSidePhoto"
  | "rightSidePhoto"
  | "interiorPhoto";

type AdditionalPhoto = { url: string; category: string };
type UploadedVideo = { url: string; category: string; mimeType: string; sizeBytes: number };
type DocumentCategory = "RC" | "INSURANCE" | "FITNESS" | "PERMIT" | "INSPECTION_REPORT" | "OTHER";
type UploadedDocument = {
  url: string;
  category: DocumentCategory;
  customName: string;
  mimeType: string;
  sizeBytes: number;
  originalFileName: string;
};

function getString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function getObject(value: unknown) {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function looksLikeMsg91Token(value: string) {
  return value.length >= 20 && !/\s/.test(value);
}

function extractMsg91Token(payload: unknown) {
  const roots = [getObject(payload), getObject(getObject(payload)?.data)];
  for (const root of roots) {
    if (!root) continue;
    for (const key of ["access-token", "accessToken", "token"]) {
      const candidate = getString(root[key]);
      if (candidate) return candidate;
    }
    const messageToken = getString(root.message);
    if (messageToken && looksLikeMsg91Token(messageToken)) {
      return messageToken;
    }
  }
  return null;
}

function extractErrorMessage(payload: unknown) {
  const roots = [getObject(payload), getObject(getObject(payload)?.error), getObject(getObject(payload)?.data)];
  for (const root of roots) {
    if (!root) continue;
    for (const key of ["message", "error", "details", "type"]) {
      const candidate = getString(root[key]);
      if (candidate) return candidate;
    }
  }
  return null;
}

async function waitForMsg91Widget(timeoutMs = 5000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (typeof window !== "undefined" && typeof window.initSendOTP === "function") {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error("OTP service is unavailable right now. Please try again.");
}

let msg91ScriptLoadPromise: Promise<void> | null = null;

function loadMsg91ScriptWithFallback() {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("OTP service is unavailable right now. Please try again."));
  }
  if (typeof window.initSendOTP === "function") {
    return Promise.resolve();
  }
  if (msg91ScriptLoadPromise) {
    return msg91ScriptLoadPromise;
  }

  const urls = ["https://verify.msg91.com/otp-provider.js", "https://verify.phone91.com/otp-provider.js"];
  msg91ScriptLoadPromise = new Promise<void>((resolve, reject) => {
    const attempt = (index: number) => {
      if (index >= urls.length) {
        reject(new Error("Unable to load OTP widget. Please check your network and try again."));
        return;
      }
      const script = document.createElement("script");
      script.src = urls[index];
      script.async = true;
      script.onload = () => {
        waitForMsg91Widget(6000).then(resolve).catch(() => attempt(index + 1));
      };
      script.onerror = () => attempt(index + 1);
      document.head.appendChild(script);
    };

    attempt(0);
  }).catch((error: unknown) => {
    msg91ScriptLoadPromise = null;
    throw error instanceof Error ? error : new Error("Unable to load OTP widget right now.");
  });

  return msg91ScriptLoadPromise;
}

type FormData = {
  listingType: ListingType | "";
  listingMode: ListingMode;
  assetStructure: AssetStructure | "";
  detachableType: DetachableType | "";
  assetCategory: string;
  bodyApplicationType: string;
  brand: string;
  model: string;
  year: string;
  isRegistered: "YES" | "NO" | "";
  registrationState: string;
  vehicleRegistrationNumber: string;
  machineSerialNumber: string;
  kmDriven: string;
  kmMeterStatus: KmMeterStatus;
  runningCondition: "RUNNING" | "NOT_RUNNING" | "UNKNOWN";
  expectedPrice: string;
  state: string;
  city: string;
  vehicleOrYardLocation: string;
  description: string;
  engineCondition: string;
  needsTowing: string;
  roadSafeStatus: string;
  fuelType: string;
  bsNorm: string;
  transmission: string;
  axleConfiguration: string;
  horsepower: string;
  odometerReading: string;
  hourMeterReading: string;
  batteryAvailable: string;
  keyAvailable: string;
  acCabin: string;
  frontPhoto: string;
  backPhoto: string;
  leftSidePhoto: string;
  rightSidePhoto: string;
  interiorPhoto: string;
  financeCompany: string;
  repoStatus: string;
  yardName: string;
  yardContact: string;
  reservePrice: string;
  auctionDate: string;
  numberOfAxles: string;
  bodyDimensions: string;
  trailerType: string;
  trailerLength: string;
  trailerManufacturer: string;
  trailerManufacturingMonthYear: string;
  suspensionType: string;
  tyreInspectionReport: string;
  totalTyres: string;
  currentTyreCount: string;
  tyreMountStatus: string;
  tyreCondition: string;
  trailerNumber: string;
  bodyType: string;
  bodyLength: string;
  payloadCapacity: string;
  gvwTonnes: string;
  bodyAttached: string;
  bodyCondition: string;
  tyresIncluded: string;
  rimsDiscsIncluded: string;
  batteryIncluded: string;
  cabinAvailable: string;
  engineAvailable: string;
  documentsAvailable: string;
  remarks: string;
  taxDue: string;
  challans: string;
  insuranceExpiry: string;
  fitnessExpiry: string;
  permitExpiry: string;
  transferType: string;
  engineNumber: string;
  chassisNumber: string;
  gpsInstalled: string;
  abs: string;
  fleetManagementSoftwareAvailable: string;
  insuranceValidity: string;
  permitValidity: string;
  fitnessStatus: string;
  taxValidity: string;
  parkingDue: string;
  alternateContactNumber: string;
  alternateContactNumberVerified: boolean;
  gstin: string;
};

const brands = [
  "Tata Motors",
  "Ashok Leyland",
  "BharatBenz",
  "Eicher",
  "Mahindra",
  "Volvo",
  "Scania",
  "AMW",
  "SML Isuzu",
  "Force Motors",
  "MAN",
  "VE Commercial Vehicles",
  "Others",
];

const ATTACHED_TRAILER_TYPE_OPTIONS = [
  "Flatbed",
  "Low Bed",
  "Semi Low Bed",
  "Side Wall",
  "Skeletal / Container Trailer",
  "Tanker Trailer",
  "Tip Trailer",
  "Car Carrier Trailer",
];

const trailerTypeOptions = [
  "Flatbed",
  "Low Bed",
  "Semi Low Bed",
  "Skeletal Trailer",
  "Tanker Trailer",
  "Tip Trailer",
  "Car Carrier",
  "Container Trailer",
  "Side Wall Trailer",
  "Bulker Trailer",
  "Other",
];

const trailerSuspensionOptions = ["Leaf Spring", "Air Suspension / Balloon", "Mixed", "Unknown"];
const financeCompanies = ["SBI", "HDFC", "ICICI", "Axis", "Tata Capital", "Mahindra Finance", "Other"];
const repoStatusOptions = [
  "Bank Seized",
  "Yard Stock",
  "Auction Upcoming",
  "Ready For Sale",
  "Under Settlement",
];
const fuelTypeOptions = ["Diesel", "CNG"];
const bsNormOptions = ["BS3", "BS4", "BS6", "UNKNOWN"];
const yesNoUnknownOptions = ["YES", "NO", "UNKNOWN"] as const;
const yesNoOptions = ["YES", "NO"] as const;
const engineConditionOptions = ["EXCELLENT", "GOOD", "UNKNOWN"];
const axleConfigurationOptions = ["4x2", "6x2", "6x4", "8x4", "Multi Axle", "Other"];
const bodyConditionOptions = ["GOOD", "AVERAGE", "NEEDS_REPAIR", "UNKNOWN"];
const transferTypeOptions = ["RC_TRANSFER", "RTO_NOC", "OPEN_NOC", "UNKNOWN"];
const transferTypeLabels: Record<string, string> = {
  RC_TRANSFER: "RC Transfer",
  RTO_NOC: "RTO NOC",
  OPEN_NOC: "Open NOC",
  UNKNOWN: "Unknown",
};
const transferTypeDescriptions: Record<string, string> = {
  RC_TRANSFER: "Vehicle can be transferred directly through RC transfer process.",
  RTO_NOC: "Seller can provide RTO NOC for transfer.",
  OPEN_NOC: "Vehicle is being sold with open NOC.",
  UNKNOWN: "Seller is unsure.",
};
const tyreMountStatusOptions = [
  "ON_DISC",
  "WITH_TYRES",
  "WITHOUT_DISC_AND_TYRES",
  "PARTIAL",
  "UNKNOWN",
];
const tyreConditionOptions = ["NEW", "GOOD", "AROUND_50", "POOR", "MIXED", "UNKNOWN"];
const videoCategoryOptions = [
  { value: "WALKAROUND", label: "Walkaround Video" },
  { value: "ENGINE_STARTUP", label: "Engine Start Video" },
  { value: "DAMAGE", label: "Damage Video" },
  { value: "OTHER", label: "Other Video" },
] as const;

const MAX_PHOTOS = 20;
const MAX_VIDEOS = 3;
const MAX_DOCUMENTS = 15;
const MAX_DOCUMENTS_PER_GROUP = 4;
const DOCUMENT_CATEGORIES: Array<{ value: DocumentCategory; label: string }> = [
  { value: "RC", label: "RC" },
  { value: "INSURANCE", label: "Insurance" },
  { value: "FITNESS", label: "Fitness" },
  { value: "PERMIT", label: "Permit" },
  { value: "INSPECTION_REPORT", label: "Inspection Report" },
  { value: "OTHER", label: "Other" },
];

const ADDITIONAL_PHOTO_CATEGORIES: { value: string; label: string }[] = [
  { value: "TYRES", label: "Tyres" },
  { value: "ENGINE", label: "Engine" },
  { value: "CABIN", label: "Cabin" },
  { value: "CHASSIS", label: "Chassis" },
  { value: "SUSPENSION", label: "Suspension" },
  { value: "AXLES", label: "Axles" },
  { value: "DASHBOARD", label: "Dashboard" },
  { value: "RC", label: "RC" },
  { value: "INSURANCE", label: "Insurance" },
  { value: "DAMAGE", label: "Damage" },
  { value: "TRAILER_BODY", label: "Trailer Body" },
  { value: "LOAD_BODY", label: "Load Body" },
  { value: "HYDRAULIC_SYSTEM", label: "Hydraulic System" },
  { value: "OTHER", label: "Other" },
];

const MIN_YEAR = 2000;
const years = Array.from({ length: new Date().getFullYear() - MIN_YEAR + 1 }, (_, i) => String(MIN_YEAR + i)).reverse();
const indiaStates = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
  "Puducherry",
  "Chandigarh",
  "Andaman and Nicobar Islands",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Lakshadweep",
];

const STEP_LISTING = 1;
const STEP_BASICS = 2;
const STEP_PRICING = 3;
const STEP_REPO = 4;
const STEP_TECHNICAL = 5;
const STEP_PHOTOS = 6;
const STEP_REVIEW = 7;
const ALL_STEPS: number[] = [STEP_LISTING, STEP_BASICS, STEP_PRICING, STEP_REPO, STEP_TECHNICAL, STEP_PHOTOS, STEP_REVIEW];
const STEP_LABELS: Record<number, string> = {
  [STEP_LISTING]: "Listing Information",
  [STEP_BASICS]: "Asset Basics",
  [STEP_PRICING]: "Pricing & Ownership Information",
  [STEP_REPO]: "Repo Details",
  [STEP_TECHNICAL]: "Technical Details",
  [STEP_PHOTOS]: "Photos & Documents",
  [STEP_REVIEW]: "Seller Info & Review",
};

const emptyForm: FormData = {
  listingType: "",
  listingMode: "NORMAL",
  assetStructure: "",
  detachableType: "",
  assetCategory: "",
  bodyApplicationType: "",
  brand: "",
  model: "",
  year: "",
  isRegistered: "",
  registrationState: "",
  vehicleRegistrationNumber: "",
  machineSerialNumber: "",
  kmDriven: "",
  kmMeterStatus: "UNKNOWN",
  runningCondition: "UNKNOWN",
  expectedPrice: "",
  state: "",
  city: "",
  vehicleOrYardLocation: "",
  description: "",
  engineCondition: "",
  needsTowing: "",
  roadSafeStatus: "",
  fuelType: "Diesel",
  bsNorm: "",
  transmission: "",
  axleConfiguration: "",
  horsepower: "",
  odometerReading: "",
  hourMeterReading: "",
  batteryAvailable: "",
  keyAvailable: "",
  acCabin: "",
  frontPhoto: "",
  backPhoto: "",
  leftSidePhoto: "",
  rightSidePhoto: "",
  interiorPhoto: "",
  financeCompany: "",
  repoStatus: "",
  yardName: "",
  yardContact: "",
  reservePrice: "",
  auctionDate: "",
  numberOfAxles: "",
  bodyDimensions: "",
  trailerType: "",
  trailerLength: "",
  trailerManufacturer: "",
  trailerManufacturingMonthYear: "",
  suspensionType: "",
  tyreInspectionReport: "",
  totalTyres: "",
  currentTyreCount: "",
  tyreMountStatus: "",
  tyreCondition: "",
  trailerNumber: "",
  bodyType: "",
  bodyLength: "",
  payloadCapacity: "",
  gvwTonnes: "",
  bodyAttached: "",
  bodyCondition: "",
  tyresIncluded: "",
  rimsDiscsIncluded: "",
  batteryIncluded: "",
  cabinAvailable: "",
  engineAvailable: "",
  documentsAvailable: "",
  remarks: "",
  taxDue: "",
  challans: "",
  insuranceExpiry: "",
  fitnessExpiry: "",
  permitExpiry: "",
  transferType: "UNKNOWN",
  engineNumber: "",
  chassisNumber: "",
  gpsInstalled: "",
  abs: "",
  fleetManagementSoftwareAvailable: "",
  insuranceValidity: "",
  permitValidity: "",
  fitnessStatus: "",
  taxValidity: "",
  parkingDue: "0",
  alternateContactNumber: "",
  alternateContactNumberVerified: false,
  gstin: "",
};

function SelectField({
  label,
  value,
  options,
  onChange,
  required = false,
  labelSuffix,
  helperText,
  optionLabels,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  required?: boolean;
  labelSuffix?: ReactNode;
  helperText?: string;
  optionLabels?: Record<string, string>;
}) {
  return (
    <label className="space-y-1.5">
      <span className="flex items-center gap-1 text-sm font-medium text-slate-700">
        {label}
        {required ? <span className="text-rose-500">*</span> : null}
        {labelSuffix}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-800"
      >
        <option value="">Select</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {optionLabels?.[option] ?? formatEnumLabel(option)}
          </option>
        ))}
      </select>
      {helperText ? <p className="text-xs text-slate-500">{helperText}</p> : null}
    </label>
  );
}

function TextField({
  label,
  value,
  onChange,
  required = false,
  placeholder,
  type = "text",
  readOnly = false,
  min,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  placeholder?: string;
  type?: "text" | "number" | "tel" | "date";
  readOnly?: boolean;
  min?: number;
}) {
  return (
    <label className="space-y-1.5">
      <span className="text-sm font-medium text-slate-700">
        {label} {required ? <span className="text-rose-500">*</span> : null}
      </span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        readOnly={readOnly}
        min={min}
        className={`min-h-12 w-full rounded-xl border px-4 text-sm ${
          readOnly ? "border-slate-100 bg-slate-50 text-slate-500" : "border-slate-200 bg-white text-slate-800"
        }`}
      />
    </label>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
  required = false,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="space-y-1.5">
      <span className="text-sm font-medium text-slate-700">
        {label} {required ? <span className="text-rose-500">*</span> : null}
      </span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={3}
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800"
      />
    </label>
  );
}

function UploadPreviewImage({ src, alt }: { src: string; alt: string }) {
  return (
    <SafeImage
      src={src}
      alt={alt}
      width={600}
      height={360}
      className="h-32 w-full rounded-lg object-cover"
      logContext={{ component: "AddVehiclePage", alt }}
    />
  );
}

function documentGroupKey(item: Pick<UploadedDocument, "category" | "customName">) {
  if (item.category !== "OTHER") return item.category;
  return `OTHER:${item.customName.trim().toUpperCase() || "OTHER"}`;
}

function getDocumentGroupCount(documents: UploadedDocument[], item: Pick<UploadedDocument, "category" | "customName">) {
  const key = documentGroupKey(item);
  return documents.filter((doc) => documentGroupKey(doc) === key).length;
}

type VehicleFormMode = "create" | "edit";

type VehicleFormPageProps = {
  mode?: VehicleFormMode;
  listingId?: string;
};

type VehicleDetailsResponse = {
  id: string;
  [key: string]: unknown;
  media?: Array<{
    type: string;
    category: string;
    url: string;
    mimeType?: string;
    sizeBytes?: number | null;
    customName?: string | null;
    originalFileName?: string | null;
  }>;
};

const formatDateForInput = (value: unknown) => {
  if (typeof value !== "string") return "";
  const raw = value.trim();
  if (!raw) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return "";
  const yyyy = parsed.getFullYear();
  const mm = String(parsed.getMonth() + 1).padStart(2, "0");
  const dd = String(parsed.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const toStringValue = (value: unknown) => (value === null || value === undefined ? "" : String(value));

const toYesNoUnknownValue = (value: unknown) => {
  const normalized = toStringValue(value).trim().toUpperCase();
  if (normalized === "YES" || normalized === "NO" || normalized === "UNKNOWN") return normalized;
  return "";
};

const toKmMeterStatusValue = (value: unknown): KmMeterStatus => {
  const normalized = toStringValue(value).trim().toUpperCase();
  if (normalized === "WORKING" || normalized === "NOT_WORKING") return normalized;
  return "UNKNOWN";
};

const toRunningConditionValue = (value: unknown): FormData["runningCondition"] => {
  const normalized = toStringValue(value).trim().toUpperCase();
  if (normalized === "NON-RUNNING") return "NOT_RUNNING";
  if (normalized === "RUNNING" || normalized === "NOT_RUNNING") return normalized;
  return "UNKNOWN";
};

const toTransferTypeValue = (transferType: unknown, nocStatus: unknown) => {
  const normalizedTransferType = toStringValue(transferType).trim().toUpperCase();
  if (["RC_TRANSFER", "RTO_NOC", "OPEN_NOC", "UNKNOWN"].includes(normalizedTransferType)) {
    return normalizedTransferType;
  }
  const normalizedNocStatus = toStringValue(nocStatus).trim().toUpperCase();
  if (normalizedNocStatus === "AVAILABLE") return "RC_TRANSFER";
  if (normalizedNocStatus === "NOT_AVAILABLE") return "RTO_NOC";
  return "UNKNOWN";
};

const toBooleanAsYesNo = (value: unknown): FormData["isRegistered"] => {
  if (value === true) return "YES";
  if (value === false) return "NO";
  const normalized = toStringValue(value).trim().toUpperCase();
  if (normalized === "YES" || normalized === "NO") return normalized;
  return "";
};

const deriveAssetCategoryFromLegacyType = (
  legacyType: string,
  assetStructure: FormData["assetStructure"],
  detachableType: FormData["detachableType"],
  allowedCategories: string[]
) => {
  if (!legacyType || allowedCategories.length === 0) return "";

  if (assetStructure === "DETACHABLE" && detachableType === "PRIME_MOVER") {
    return allowedCategories.includes("Prime Mover") ? "Prime Mover" : "";
  }
  if (assetStructure === "DETACHABLE" && detachableType === "TRAILER") {
    return allowedCategories.includes("Trailer") ? "Trailer" : "";
  }
  if (assetStructure === "EQUIPMENT") {
    return allowedCategories[0] ?? "";
  }

  if (["MINI TRUCK", "PICKUP", "LCV (LIGHT COMMERCIAL VEHICLE)"].includes(legacyType)) {
    return allowedCategories.includes("SCV / LCV") ? "SCV / LCV" : "";
  }
  if (
    [
      "MCV (MEDIUM COMMERCIAL VEHICLE)",
      "HCV (HEAVY COMMERCIAL VEHICLE)",
      "CONTAINER TRUCK",
      "TANKER",
      "TRUCK",
      "TIPPER",
    ].includes(legacyType)
  ) {
    return allowedCategories.includes("Rigid Trucks") ? "Rigid Trucks" : "";
  }
  if (legacyType === "BUS") {
    return allowedCategories.includes("Bus / Passenger Commercial") ? "Bus / Passenger Commercial" : "";
  }
  if (legacyType === "TRACTOR") {
    return allowedCategories.includes("Prime Mover + Trailer") ? "Prime Mover + Trailer" : "";
  }

  return "";
};

export function VehicleFormPage({ mode = "create", listingId }: VehicleFormPageProps) {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [loadingEditData, setLoadingEditData] = useState(mode === "edit");
  const [user, setUser] = useState<SessionUser | null>(null);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [error, setError] = useState("");
  const [uploadingField, setUploadingField] = useState<UploadCategory | "">("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [additionalPhotos, setAdditionalPhotos] = useState<AdditionalPhoto[]>([]);
  const [videos, setVideos] = useState<UploadedVideo[]>([]);
  const [documents, setDocuments] = useState<UploadedDocument[]>([]);
  const [uploadingAdditional, setUploadingAdditional] = useState(false);
  const [pendingAdditionalAction, setPendingAdditionalAction] = useState<"new" | number>("new");
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [pendingVideoAction, setPendingVideoAction] = useState<"new" | number>("new");
  const [uploadingDocuments, setUploadingDocuments] = useState(false);
  const [selectedDocumentCategory, setSelectedDocumentCategory] = useState<DocumentCategory>("RC");
  const [selectedOtherDocumentName, setSelectedOtherDocumentName] = useState("");
  const [verifyingAlternatePhone, setVerifyingAlternatePhone] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const fileRefs = {
    frontPhoto: useRef<HTMLInputElement>(null),
    backPhoto: useRef<HTMLInputElement>(null),
    leftSidePhoto: useRef<HTMLInputElement>(null),
    rightSidePhoto: useRef<HTMLInputElement>(null),
    interiorPhoto: useRef<HTMLInputElement>(null),
  };
  const additionalFileRef = useRef<HTMLInputElement>(null);
  const videoFileRef = useRef<HTMLInputElement>(null);
  const documentFileRef = useRef<HTMLInputElement>(null);

  const update = <T extends keyof FormData>(key: T, value: FormData[T]) => {
    setForm((previous) => {
      const next = { ...previous, [key]: value };

      if (key === "assetStructure") {
       next.assetCategory = "";
       next.bodyApplicationType = "";
       if (value !== "DETACHABLE") next.detachableType = "";
      }

      if (key === "detachableType") {
       next.assetCategory = "";
       next.bodyApplicationType = "";
      }

      if (key === "assetCategory") {
       next.bodyApplicationType = "";
      }

      if (key === "alternateContactNumber") {
       const sanitized = String(value).replace(/\D/g, "").slice(0, 10);
       next.alternateContactNumber = sanitized;
       next.alternateContactNumberVerified = false;
      }

      return next;
    });

    if (key === "listingType" && value !== "REPO" && step === STEP_REPO) {
      setStep(STEP_TECHNICAL);
    }
  };

  useEffect(() => {
    const loadSession = async () => {
      try {
        const response = await fetch("/api/auth/session");
        if (!response.ok) {
          router.replace("/auth/login");
          return;
        }
        const data = (await response.json()) as { user?: SessionUser };
        if (!data.user) {
          router.replace("/auth/login");
          return;
        }
        const sessionUser = data.user;
        if (sessionUser.accountType === "BUYER") {
          router.replace("/sell");
          return;
        }
        if (!sessionUser.isProfileComplete) {
          router.replace("/onboarding");
          return;
        }
        setUser(sessionUser);
        if (mode === "create") {
          setForm((previous) => ({
            ...previous,
            listingType:
              sessionUser.accountType === "BANK_PARTNER" || sessionUser.sellerRole === "RECOVERY_AGENT"
                ? "REPO"
                : "REGULAR",
            listingMode: "NORMAL",
          }));
        }
        setAuthChecked(true);
      } catch {
        router.replace("/auth/login");
      }
    };

    loadSession();
  }, [mode, router]);

  useEffect(() => {
    if (!authChecked || mode !== "edit") return;
    if (!listingId) {
      router.replace("/seller/listings");
      return;
    }

    const loadListing = async () => {
      setLoadingEditData(true);
      setError("");
      try {
        const response = await fetch(`/api/vehicles/${listingId}`);
        const data = (await response.json()) as VehicleDetailsResponse & { message?: string };
        if (!response.ok) {
          setError(data.message ?? "Failed to load listing details.");
          return;
        }

        const editableData = data;
        const parsedAssetStructure =
          (toStringValue(editableData.assetStructure).toUpperCase() as FormData["assetStructure"]) || "";
        const parsedDetachableType =
          (toStringValue(editableData.detachableType).toUpperCase() as FormData["detachableType"]) || "";
        const allowedAssetCategories =
          parsedAssetStructure
            ? getAssetCategoryOptions(
                parsedAssetStructure,
                parsedDetachableType || undefined
              )
            : [];
        const providedAssetCategory = toStringValue(editableData.assetCategory);
        const resolvedAssetCategory = allowedAssetCategories.includes(providedAssetCategory)
          ? providedAssetCategory
          : deriveAssetCategoryFromLegacyType(
              toStringValue(editableData.type).trim().toUpperCase(),
              parsedAssetStructure,
              parsedDetachableType,
              allowedAssetCategories
            );
        setForm((previous) => ({
          ...previous,
          listingType: (toStringValue(editableData.listingType).toUpperCase() as FormData["listingType"]) || previous.listingType,
          listingMode: (toStringValue(editableData.listingMode).toUpperCase() as ListingMode) || "NORMAL",
          assetStructure: parsedAssetStructure,
          detachableType: parsedDetachableType,
          assetCategory: resolvedAssetCategory,
          bodyApplicationType: toStringValue(
            editableData.bodyApplicationType || editableData.vehicleSubType || editableData.bodyType
          ),
          brand: toStringValue(editableData.brand),
          model: toStringValue(editableData.model),
          year: toStringValue(editableData.year),
          isRegistered: toBooleanAsYesNo(editableData.isRegistered),
          registrationState: toStringValue(editableData.registrationState),
          vehicleRegistrationNumber: toStringValue(editableData.vehicleRegistrationNumber),
          machineSerialNumber: toStringValue(editableData.machineSerialNumber),
          kmDriven: toStringValue(editableData.kmDriven),
          kmMeterStatus: toKmMeterStatusValue(editableData.kmMeterStatus),
          runningCondition: toRunningConditionValue(editableData.runningCondition),
          expectedPrice: toStringValue(editableData.expectedPrice || editableData.price),
          state: toStringValue(editableData.state),
          city: toStringValue(editableData.city),
          vehicleOrYardLocation: toStringValue(editableData.vehicleOrYardLocation || editableData.yardLocation),
          description: toStringValue(editableData.conditionNotes || editableData.description),
          engineCondition: toStringValue(editableData.engineCondition),
          needsTowing: toStringValue(editableData.needsTowing),
          roadSafeStatus: toStringValue(editableData.roadSafeStatus),
          fuelType: toStringValue(editableData.fuelType || "Diesel"),
          bsNorm: toStringValue(editableData.bsNorm),
          transmission: toStringValue(editableData.transmission),
          axleConfiguration: toStringValue(editableData.axleConfiguration),
          horsepower: toStringValue(editableData.horsepower),
          odometerReading: toStringValue(editableData.odometerReading),
          hourMeterReading: toStringValue(editableData.hourMeterReading),
          batteryAvailable: toYesNoUnknownValue(editableData.batteryAvailable),
          keyAvailable: toYesNoUnknownValue(editableData.keyAvailable),
          acCabin: toYesNoUnknownValue(editableData.acCabin),
          frontPhoto: toStringValue(editableData.frontPhoto),
          backPhoto: toStringValue(editableData.backPhoto),
          leftSidePhoto: toStringValue(editableData.leftSidePhoto || editableData.sidePhoto),
          rightSidePhoto: toStringValue(editableData.rightSidePhoto),
          interiorPhoto: toStringValue(editableData.interiorPhoto),
          financeCompany: toStringValue(editableData.financeCompany),
          repoStatus: toStringValue(editableData.repoStatus),
          yardName: toStringValue(editableData.yardName),
          yardContact: toStringValue(editableData.yardContact),
          reservePrice: toStringValue(editableData.reservePrice),
          auctionDate: formatDateForInput(editableData.auctionDate),
          numberOfAxles: toStringValue(editableData.numberOfAxles),
          bodyDimensions: toStringValue(editableData.bodyDimensions),
          trailerType: toStringValue(editableData.trailerType),
          trailerLength: toStringValue(editableData.trailerLength),
          trailerManufacturer: toStringValue(editableData.trailerManufacturer),
          trailerManufacturingMonthYear: toStringValue(editableData.trailerManufacturingMonthYear),
          suspensionType: toStringValue(editableData.suspensionType),
          tyreInspectionReport: toStringValue(editableData.tyreInspectionReport),
          totalTyres: toStringValue(editableData.totalTyres || editableData.tyreCount),
          currentTyreCount: toStringValue(editableData.currentTyreCount),
          tyreMountStatus: toStringValue(editableData.tyreMountStatus),
          tyreCondition: toStringValue(editableData.tyreCondition),
          trailerNumber: toStringValue(editableData.trailerNumber),
          bodyType: toStringValue(editableData.bodyType),
          bodyLength: toStringValue(editableData.bodyLength),
          payloadCapacity: toStringValue(editableData.payloadCapacity),
          gvwTonnes: toStringValue(editableData.gvwTonnes),
          bodyAttached: toYesNoUnknownValue(editableData.bodyAttached),
          bodyCondition: toStringValue(editableData.bodyCondition),
          tyresIncluded: toYesNoUnknownValue(editableData.tyresIncluded),
          rimsDiscsIncluded: toYesNoUnknownValue(editableData.rimsDiscsIncluded),
          batteryIncluded: toYesNoUnknownValue(editableData.batteryIncluded),
          cabinAvailable: toYesNoUnknownValue(editableData.cabinAvailable),
          engineAvailable: toYesNoUnknownValue(editableData.engineAvailable),
          documentsAvailable: toYesNoUnknownValue(editableData.documentsAvailable),
          remarks: toStringValue(editableData.remarks),
          taxDue: toStringValue(editableData.taxDue),
          challans: toStringValue(editableData.challans),
          insuranceExpiry: toStringValue(editableData.insuranceExpiry),
          fitnessExpiry: toStringValue(editableData.fitnessExpiry),
          permitExpiry: toStringValue(editableData.permitExpiry),
          transferType: toTransferTypeValue(editableData.transferType, editableData.nocStatus),
          engineNumber: toStringValue(editableData.engineNumber),
          chassisNumber: toStringValue(editableData.chassisNumber),
          gpsInstalled: toYesNoUnknownValue(editableData.gpsInstalled),
          abs: toYesNoUnknownValue(editableData.abs),
          fleetManagementSoftwareAvailable: toStringValue(editableData.fleetManagementSoftwareAvailable),
          insuranceValidity: formatDateForInput(editableData.insuranceValidity),
          permitValidity: formatDateForInput(editableData.permitValidity),
          fitnessStatus: formatDateForInput(editableData.fitnessStatus),
          taxValidity: formatDateForInput(editableData.taxValidity),
          parkingDue: toStringValue(editableData.parkingDue),
          alternateContactNumber: toStringValue(editableData.alternateContactNumber),
          alternateContactNumberVerified: editableData.alternateContactNumberVerified === true,
          gstin: toStringValue(editableData.gstin),
        }));

        const media = Array.isArray(editableData.media) ? editableData.media : [];
        const normalizedRequiredPhotoUrls = new Set(
          [
            toStringValue(editableData.frontPhoto),
            toStringValue(editableData.backPhoto),
            toStringValue(editableData.leftSidePhoto || editableData.sidePhoto),
            toStringValue(editableData.rightSidePhoto),
            toStringValue(editableData.interiorPhoto),
          ].filter(Boolean)
        );

        setAdditionalPhotos(
          media
            .filter((item) => item.type === "PHOTO")
            .map((item) => ({
              url: toStringValue(item.url),
              category: toStringValue(item.category || "OTHER"),
            }))
            .filter((item) => item.url && !normalizedRequiredPhotoUrls.has(item.url))
        );
        setVideos(
          media
            .filter((item) => item.type === "VIDEO")
            .map((item) => ({
              url: toStringValue(item.url),
              category: toStringValue(item.category || "OTHER"),
              mimeType: toStringValue(item.mimeType),
              sizeBytes: Number(item.sizeBytes || 0),
            }))
            .filter((item) => item.url)
        );
        setDocuments(
          media
            .filter((item) => item.type === "DOCUMENT")
            .map((item) => ({
              url: toStringValue(item.url),
              category: (toStringValue(item.category || "OTHER").toUpperCase() as DocumentCategory) || "OTHER",
              customName: toStringValue(item.customName),
              mimeType: toStringValue(item.mimeType),
              sizeBytes: Number(item.sizeBytes || 0),
              originalFileName: toStringValue(item.originalFileName),
            }))
            .filter((item) => item.url)
        );
      } catch {
        setError("Failed to load listing details.");
      } finally {
        setLoadingEditData(false);
      }
    };

    void loadListing();
  }, [authChecked, listingId, mode, router]);

  const roleRules = useMemo(() => {
    if (!user) return { canRegular: false, canRepo: false };
    if (user.accountType === "BANK_PARTNER") return { canRegular: false, canRepo: true };
    if (user.accountType === "ADMIN") return { canRegular: true, canRepo: true };
    if (user.sellerRole === "BROKER") return { canRegular: true, canRepo: true };
    if (user.sellerRole === "RECOVERY_AGENT") return { canRegular: false, canRepo: true };
    return { canRegular: true, canRepo: false };
  }, [user]);

  const isDetachable = form.assetStructure === "DETACHABLE";
  const isTrailerAsset = isDetachable && form.detachableType === "TRAILER";
  const isPrimeMover = isDetachable && form.detachableType === "PRIME_MOVER";
  const isStandalone = form.assetStructure === "STANDALONE";
  const isEquipment = form.assetStructure === "EQUIPMENT";
  const poweredAsset = hasEngineOrPowertrain({
    assetStructure: form.assetStructure || undefined,
    detachableType: form.detachableType || undefined,
  });
  const assetCategoryOptions =
    form.assetStructure && (!isDetachable || form.detachableType)
      ? getAssetCategoryOptions(form.assetStructure, form.detachableType || undefined)
      : [];
  const bodyApplicationOptions =
    form.assetStructure && (!isDetachable || form.detachableType)
      ? getBodyApplicationOptions(
          form.assetStructure,
          form.detachableType || undefined,
          form.assetCategory || undefined
        )
      : [];
  const uploadedRequiredPhotoCount = [
    form.frontPhoto,
    form.backPhoto,
    form.leftSidePhoto,
    form.rightSidePhoto,
  ].filter(Boolean).length;
  const totalPhotosCount = uploadedRequiredPhotoCount + (form.interiorPhoto ? 1 : 0) + additionalPhotos.length;
  const canAddMorePhotos = totalPhotosCount < MAX_PHOTOS;
  const canAddMoreVideos = videos.length < MAX_VIDEOS;
  const selectedDocumentTemplate = {
    category: selectedDocumentCategory,
    customName: selectedDocumentCategory === "OTHER" ? selectedOtherDocumentName : "",
  };
  const selectedDocumentGroupCount = getDocumentGroupCount(documents, selectedDocumentTemplate);
  const canAddMoreDocumentsTotal = documents.length < MAX_DOCUMENTS;
  const canAddMoreDocumentsInGroup = selectedDocumentGroupCount < MAX_DOCUMENTS_PER_GROUP;
  const documentUploadCounterClass = documents.length >= MAX_DOCUMENTS ? "text-rose-600" : "text-slate-900";
  const standaloneShowsSuspension =
    isStandalone &&
    (!form.bodyApplicationType ||
      form.assetCategory === "Prime Mover + Trailer" ||
      form.assetCategory === "Rigid Trucks");
  const visibleSteps = useMemo(
    () => (form.listingType === "REPO" ? [...ALL_STEPS] : ALL_STEPS.filter((stepId) => stepId !== STEP_REPO)),
    [form.listingType]
  );
  const currentStepIndex = visibleSteps.indexOf(step);
  const currentStepNumber = currentStepIndex >= 0 ? currentStepIndex + 1 : 1;
  const totalSteps = visibleSteps.length;
  const currentStepLabel = STEP_LABELS[step];
  const lastVisibleStep = visibleSteps[visibleSteps.length - 1] ?? STEP_REVIEW;
  const canSubmit = step === lastVisibleStep && !submitting;
  const getVisibleStepNumber = (stepId: number) => {
    const stepIndex = visibleSteps.indexOf(stepId);
    return stepIndex >= 0 ? stepIndex + 1 : stepId;
  };

  const validateStep = (targetStep: number) => {
    if (targetStep === STEP_LISTING) {
      if (!form.listingType) return "Select listing type.";
      if (!form.listingMode) return "Select listing mode.";
      if (!form.assetStructure) return "Select asset structure.";
      if (form.assetStructure === "DETACHABLE" && !form.detachableType) return "Select detachable type.";
    }

    if (targetStep === STEP_BASICS) {
      if (!form.assetCategory) return "Vehicle class is required.";
      const availableBodyOptions = form.assetStructure
        ? getBodyApplicationOptions(
            form.assetStructure as AssetStructure,
            (form.detachableType || null) as DetachableType | null,
            form.assetCategory || null
          )
        : [];
      if (availableBodyOptions.length > 0 && !form.bodyApplicationType) return "Body type is required.";
      if (!form.year) return "Year is required.";
      if ((isStandalone || isPrimeMover || isEquipment) && !form.brand) return "Brand / make is required.";
      if ((isStandalone || isPrimeMover || isEquipment) && !form.model) return "Model is required.";
      if (poweredAsset && !form.registrationState.trim()) {
        return "Registered state / RTO is required.";
      }
    }

    if (targetStep === STEP_PRICING) {
      if (!form.expectedPrice || Number(form.expectedPrice) <= 0) return "Expected price is required.";
      if (!form.vehicleOrYardLocation.trim()) return "Vehicle / yard location is required.";
      if (!form.transferType) return "Transfer type is required.";
    }

    if (targetStep === STEP_REPO && form.listingType === "REPO") {
      if (!form.financeCompany || !form.repoStatus || !form.yardName.trim() || !form.yardContact.trim()) {
        return "Finance company, repo status, yard name, and yard contact are required for repo listings.";
      }
    }

    if (targetStep === STEP_TECHNICAL && isTrailerAsset) {
      if (!form.trailerType || !form.trailerLength.trim() || !form.numberOfAxles.trim()) {
        return "Trailer type, trailer length, and number of axles are required for trailer listings.";
      }
    }
    return "";
  };

  const next = () => {
    const validationError = validateStep(step);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError("");
    const nextIndex = visibleSteps.indexOf(step);
    if (nextIndex === -1) {
      setStep(STEP_LISTING);
      return;
    }
    setStep(visibleSteps[Math.min(nextIndex + 1, visibleSteps.length - 1)] ?? lastVisibleStep);
  };

  const back = () => {
    if (step === STEP_LISTING) {
      router.back();
      return;
    }
    setError("");
    const previousIndex = visibleSteps.indexOf(step);
    if (previousIndex <= 0) {
      setStep(STEP_LISTING);
      return;
    }
    setStep(visibleSteps[previousIndex - 1] ?? STEP_LISTING);
  };

  const uploadSinglePhoto = async (category: UploadCategory, file: File | null) => {
    if (!file) return;
    setUploadingField(category);
    setError("");

    try {
      const payload = new FormData();
      payload.append("files", file);
      const response = await fetch("/api/uploads", { method: "POST", body: payload });
      const data = (await response.json()) as { urls?: string[]; message?: string };
      if (!response.ok || !data.urls?.[0]) {
        setError(data.message ?? "Failed to upload image.");
        return;
      }
      if (shouldLogMediaDebug()) {
        console.info("Upload response", { category, urls: data.urls });
      }
      update(category, data.urls[0]);
    } catch {
      setError("Failed to upload image.");
    } finally {
      setUploadingField("");
      if (fileRefs[category].current) fileRefs[category].current.value = "";
    }
  };

  const deleteSinglePhoto = (category: UploadCategory) => {
    update(category, "");
    if (fileRefs[category].current) fileRefs[category].current.value = "";
  };

  const uploadAdditionalPhotos = async (files: File[]) => {
    if (files.length === 0) return;
    setUploadingAdditional(true);
    setError("");
    const baseAdditionalCount = additionalPhotos.length;
    const baseRequiredCount = [
      form.frontPhoto,
      form.backPhoto,
      form.leftSidePhoto,
      form.rightSidePhoto,
      form.interiorPhoto,
    ].filter(Boolean).length;
    const results: AdditionalPhoto[] = [];

    for (const file of files) {
      if (baseRequiredCount + baseAdditionalCount + results.length >= MAX_PHOTOS) {
        setError("Maximum 20 photos allowed.");
        break;
      }
      try {
        const payload = new FormData();
        payload.append("files", file);
        const response = await fetch("/api/uploads", { method: "POST", body: payload });
        const data = (await response.json()) as { urls?: string[]; message?: string };
        if (!response.ok || !data.urls?.[0]) {
          setError(data.message ?? "Failed to upload image.");
          break;
        }
        if (shouldLogMediaDebug()) {
          console.info("Upload response", { category: "additional", urls: data.urls });
        }
        results.push({ url: data.urls[0], category: "" });
      } catch {
        setError("Failed to upload image.");
        break;
      }
    }

    if (results.length > 0) {
      setAdditionalPhotos((previous) => [...previous, ...results]);
    }
    setUploadingAdditional(false);
    if (additionalFileRef.current) additionalFileRef.current.value = "";
  };

  const replaceAdditionalPhoto = async (index: number, file: File) => {
    setUploadingAdditional(true);
    setError("");
    try {
      const payload = new FormData();
      payload.append("files", file);
      const response = await fetch("/api/uploads", { method: "POST", body: payload });
      const data = (await response.json()) as { urls?: string[]; message?: string };
      if (!response.ok || !data.urls?.[0]) {
        setError(data.message ?? "Failed to upload image.");
        return;
      }
      const nextUrl = data.urls[0];
      setAdditionalPhotos((previous) => previous.map((photo, i) => (i === index ? { ...photo, url: nextUrl } : photo)));
    } catch {
      setError("Failed to upload image.");
    } finally {
      setUploadingAdditional(false);
      if (additionalFileRef.current) additionalFileRef.current.value = "";
    }
  };

  const handleAdditionalFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    if (pendingAdditionalAction === "new") {
      await uploadAdditionalPhotos(Array.from(files));
    } else {
      await replaceAdditionalPhoto(pendingAdditionalAction as number, files[0]);
    }
    if (additionalFileRef.current) additionalFileRef.current.value = "";
  };

  const uploadVideos = async (files: File[]) => {
    if (!files.length) return;
    setUploadingVideo(true);
    setError("");
    const results: UploadedVideo[] = [];

    for (const file of files) {
      if (videos.length + results.length >= MAX_VIDEOS) {
        setError(`Maximum ${MAX_VIDEOS} videos allowed.`);
        break;
      }

      try {
        const payload = new FormData();
        payload.append("files", file);
        payload.append("mediaType", "video");
        const response = await fetch("/api/uploads", { method: "POST", body: payload });
        const data = (await response.json()) as {
          files?: Array<{ url: string; mimeType: string; sizeBytes: number }>;
          message?: string;
        };
        const uploaded = data.files?.[0];
        if (!response.ok || !uploaded?.url) {
          setError(data.message ?? "Failed to upload video.");
          break;
        }
        results.push({
          url: uploaded.url,
          category: "WALKAROUND",
          mimeType: uploaded.mimeType,
          sizeBytes: uploaded.sizeBytes,
        });
      } catch {
        setError("Failed to upload video.");
        break;
      }
    }

    if (results.length) {
      setVideos((previous) => [...previous, ...results]);
    }
    setUploadingVideo(false);
    if (videoFileRef.current) videoFileRef.current.value = "";
  };

  const replaceVideo = async (index: number, file: File) => {
    setUploadingVideo(true);
    setError("");
    try {
      const payload = new FormData();
      payload.append("files", file);
      payload.append("mediaType", "video");
      const response = await fetch("/api/uploads", { method: "POST", body: payload });
      const data = (await response.json()) as {
        files?: Array<{ url: string; mimeType: string; sizeBytes: number }>;
        message?: string;
      };
      const uploaded = data.files?.[0];
      if (!response.ok || !uploaded?.url) {
        setError(data.message ?? "Failed to upload video.");
        return;
      }
      setVideos((previous) =>
        previous.map((video, i) =>
          i === index
            ? {
                ...video,
                url: uploaded.url,
                mimeType: uploaded.mimeType,
                sizeBytes: uploaded.sizeBytes,
              }
            : video
        )
      );
    } catch {
      setError("Failed to upload video.");
    } finally {
      setUploadingVideo(false);
      if (videoFileRef.current) videoFileRef.current.value = "";
    }
  };

  const handleVideoFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files?.length) return;
    if (pendingVideoAction === "new") {
      await uploadVideos(Array.from(files));
    } else {
      await replaceVideo(pendingVideoAction, files[0]);
    }
  };

  const uploadDocuments = async (files: File[]) => {
    if (!files.length) return;
    const customName = selectedDocumentCategory === "OTHER" ? selectedOtherDocumentName.trim() : "";
    if (selectedDocumentCategory === "OTHER" && !customName) {
      setError("Document name is required for Other documents.");
      return;
    }

    setUploadingDocuments(true);
    setError("");
    const results: UploadedDocument[] = [];

    for (const file of files) {
      const nextTemplate = { category: selectedDocumentCategory, customName };
      const groupCount = getDocumentGroupCount([...documents, ...results], nextTemplate);
      if (documents.length + results.length >= MAX_DOCUMENTS) {
        setError(`Maximum ${MAX_DOCUMENTS} document files allowed per listing.`);
        break;
      }
      if (groupCount >= MAX_DOCUMENTS_PER_GROUP) {
        setError("Maximum 4 files allowed for this document type.");
        break;
      }

      try {
        const payload = new FormData();
        payload.append("files", file);
        payload.append("mediaType", "document");
        const response = await fetch("/api/uploads", { method: "POST", body: payload });
        const data = (await response.json()) as {
          files?: Array<{ url: string; mimeType: string; sizeBytes: number; originalFileName?: string }>;
          message?: string;
        };
        const uploaded = data.files?.[0];
        if (!response.ok || !uploaded?.url) {
          setError(data.message ?? "Failed to upload document.");
          break;
        }
        results.push({
          url: uploaded.url,
          category: selectedDocumentCategory,
          customName,
          mimeType: uploaded.mimeType,
          sizeBytes: uploaded.sizeBytes,
          originalFileName: uploaded.originalFileName || file.name,
        });
      } catch {
        setError("Failed to upload document.");
        break;
      }
    }

    if (results.length) {
      setDocuments((previous) => [...previous, ...results]);
    }
    setUploadingDocuments(false);
    if (documentFileRef.current) {
      documentFileRef.current.value = "";
    }
  };

  const handleDocumentFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files?.length) return;
    await uploadDocuments(Array.from(files));
  };

  const handleVerifyAlternatePhone = async () => {
    const phone = form.alternateContactNumber.replace(/\D/g, "").slice(0, 10);
    if (phone.length !== 10) {
      setError("Enter a valid 10-digit alternate contact number.");
      return;
    }
    if (!MSG91_WIDGET_ID || !MSG91_WIDGET_TOKEN) {
      setError("OTP service is not configured. Contact support.");
      return;
    }

    setVerifyingAlternatePhone(true);
    setError("");

    try {
      const existingResponse = await fetch("/api/seller/verified-phones/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const existingData = (await existingResponse.json()) as { alreadyVerified?: boolean; message?: string };
      if (!existingResponse.ok) {
        setError(existingData.message ?? "Unable to verify alternate number.");
        return;
      }
      if (existingData.alreadyVerified) {
        setForm((previous) => ({ ...previous, alternateContactNumberVerified: true }));
        return;
      }

      await loadMsg91ScriptWithFallback();
      await new Promise<void>((resolve, reject) => {
        window.initSendOTP?.({
          widgetId: MSG91_WIDGET_ID,
          tokenAuth: MSG91_WIDGET_TOKEN,
          identifier: `91${phone}`,
          exposeMethods: false,
          captchaRenderId: "",
          success: (payload) => {
            const verifiedToken = extractMsg91Token(payload);
            if (!verifiedToken) {
              reject(new Error("Failed to read verification token from MSG91."));
              return;
            }
            void (async () => {
              const response = await fetch("/api/seller/verified-phones/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ phone, accessToken: verifiedToken }),
              });
              const data = (await response.json()) as { verified?: boolean; message?: string };
              if (!response.ok || !data.verified) {
                reject(new Error(data.message ?? "Failed to verify alternate number."));
                return;
              }
              setForm((previous) => ({ ...previous, alternateContactNumberVerified: true }));
              resolve();
            })().catch(reject);
          },
          failure: (payload) => reject(new Error(extractErrorMessage(payload) ?? "OTP verification failed.")),
        });
      });
    } catch (verificationError) {
      setError(
        verificationError instanceof Error
          ? verificationError.message
          : "Unable to verify alternate number right now."
      );
    } finally {
      setVerifyingAlternatePhone(false);
    }
  };

  const handleSubmit = async () => {
    const stepError =
      validateStep(STEP_LISTING) ||
      validateStep(STEP_BASICS) ||
      validateStep(STEP_PRICING) ||
      validateStep(STEP_REPO) ||
      validateStep(STEP_TECHNICAL) ||
      validateStep(STEP_PHOTOS);

    if (stepError) {
      setError(stepError);
      return;
    }

    const normalizedDetachableType =
      form.assetStructure === "DETACHABLE" &&
      (form.detachableType === "PRIME_MOVER" || form.detachableType === "TRAILER")
        ? form.detachableType
        : null;
    if (form.assetStructure === "DETACHABLE" && !normalizedDetachableType) {
      setError("Detachable type is required for detachable assets.");
      return;
    }
    const toNullableEnum = (value: string) => {
      const normalized = value.trim();
      return normalized ? normalized : null;
    };

    setSubmitting(true);
    setError("");
    setSuccessMessage("");

    try {
      const response = await fetch(
        mode === "edit" && listingId ? `/api/seller/vehicles/${listingId}` : "/api/vehicles",
        {
        method: mode === "edit" ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          detachableType: normalizedDetachableType,
          conditionNotes: form.description,
          assetConfiguration: toLegacyAssetConfiguration(
            form.assetStructure as AssetStructure,
            normalizedDetachableType as DetachableType | null
          ),
          vehicleSubType: form.bodyApplicationType,
          isRegistered: null,
          leftSidePhoto: form.leftSidePhoto,
          rightSidePhoto: form.rightSidePhoto,
          sidePhoto: form.leftSidePhoto,
          additionalPhotos: additionalPhotos.map((photo) => ({ url: photo.url, category: photo.category || null })),
          videos: videos.map((video) => ({
            url: video.url,
            category: video.category,
            mimeType: video.mimeType,
            sizeBytes: video.sizeBytes,
          })),
          documents: documents.map((document) => ({
            url: document.url,
            category: document.category,
            customName: document.category === "OTHER" ? document.customName : null,
            mimeType: document.mimeType,
            sizeBytes: document.sizeBytes,
            originalFileName: document.originalFileName,
          })),
          expectedPrice: form.expectedPrice.replace(/\D/g, ""),
          reservePrice: form.reservePrice.replace(/\D/g, ""),
          parkingDue: form.parkingDue.replace(/\D/g, ""),
          kmDriven: form.kmDriven.replace(/\D/g, ""),
          odometerReading: form.odometerReading.replace(/\D/g, ""),
          hourMeterReading: form.hourMeterReading.replace(/\D/g, ""),
          totalTyres: form.totalTyres.replace(/\D/g, ""),
          tyreCount: form.totalTyres.replace(/\D/g, ""),
          currentTyreCount: form.currentTyreCount.replace(/\D/g, ""),
          bodyType: form.bodyApplicationType || form.bodyType,
          bodyLength: form.bodyDimensions || form.bodyLength,
          transferType: toNullableEnum(form.transferType),
          nocStatus:
            form.transferType === "RC_TRANSFER"
              ? "AVAILABLE"
              : form.transferType === "RTO_NOC" || form.transferType === "OPEN_NOC"
                ? "NOT_AVAILABLE"
                : "UNKNOWN",
          numberOfAxles: form.numberOfAxles.replace(/\D/g, ""),
          horsepower: form.horsepower.replace(/\D/g, ""),
          vehicleRegistrationNumber: form.vehicleRegistrationNumber.toUpperCase(),
          alternateContactNumber: form.alternateContactNumberVerified ? form.alternateContactNumber : "",
          alternateContactNumberVerified: form.alternateContactNumberVerified,
          repoStatus: form.listingType === "REPO" ? toNullableEnum(form.repoStatus) : null,
          bodyAttached: toNullableEnum(form.bodyAttached),
          needsTowing: toNullableEnum(form.needsTowing),
          abs: toNullableEnum(form.abs),
          acCabin: toNullableEnum(form.acCabin),
        }),
      });

      if (!response.ok) {
        const data = (await response.json()) as { message?: string };
        setError(data.message ?? (mode === "edit" ? "Failed to update listing." : "Failed to submit listing."));
        return;
      }

      const data = (await response.json()) as { message?: string; sentForReverification?: boolean };
      if (mode === "edit") {
        setSuccessMessage(
          data.sentForReverification
            ? "Your updated listing has been sent for re-verification."
            : "Listing updated successfully."
        );
      }
      setSubmitted(true);
    } catch {
      setError(mode === "edit" ? "Failed to update listing." : "Failed to submit listing.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!authChecked) {
    return (
      <main className="flex min-h-[calc(100dvh-80px)] items-center justify-center px-4 text-sm text-slate-500">
        Checking access...
      </main>
    );
  }

  if (mode === "edit" && loadingEditData) {
    return (
      <main className="flex min-h-[calc(100dvh-80px)] items-center justify-center px-4 text-sm text-slate-500">
        Loading listing details...
      </main>
    );
  }

  if (submitted) {
    return (
      <main className="flex min-h-[calc(100dvh-80px)] flex-col items-center justify-center px-4 py-10 text-center">
        <CheckCircle2 className="h-16 w-16 text-emerald-500" />
        <h1 className="mt-4 text-2xl font-semibold text-slate-900">
          {mode === "edit" ? "Listing Updated Successfully" : "Vehicle Submitted for Verification"}
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          {mode === "edit"
            ? successMessage || "Listing updated successfully."
            : "Our team will review your listing before it goes live."}
        </p>
        <div className="mt-8 w-full max-w-sm space-y-3">
          <Link
            href="/seller/listings"
            className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-slate-900 text-sm font-semibold text-white"
          >
            View My Listings
          </Link>
          <button
            onClick={() => {
              if (mode === "edit") {
                router.push("/seller/listings");
                return;
              }
              setSubmitted(false);
              setStep(1);
              setAdditionalPhotos([]);
              setVideos([]);
              setDocuments([]);
              setForm({
                ...emptyForm,
                listingType: form.listingType,
                listingMode: "NORMAL",
              });
            }}
            className="inline-flex min-h-12 w-full items-center justify-center rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700"
          >
            {mode === "edit" ? "Back to Listings" : "Add Another Vehicle"}
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="space-y-6 px-4 pb-10 pt-4">
      <div className="flex items-center gap-3">
        <button onClick={back} className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200">
          <ArrowLeft className="h-4 w-4 text-slate-700" />
        </button>
        <div className="flex-1">
          <p className="text-xs font-medium text-slate-500">
            Step {currentStepNumber} of {totalSteps} &mdash; <span className="text-slate-700">{currentStepLabel}</span>
          </p>
          <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-slate-900" style={{ width: `${(currentStepNumber / totalSteps) * 100}%` }} />
          </div>
        </div>
      </div>

      {step === STEP_LISTING ? (
        <section className="space-y-4">
          <h1 className="text-xl font-semibold text-slate-900">
            {mode === "edit" ? "Edit Listing: Listing Information" : "Step 1: Listing Information"}
          </h1>
          <p className="text-sm text-slate-500">Choose the listing classification before entering asset details.</p>

          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-700">Listing Type <span className="text-rose-500">*</span></p>
            <div className="grid grid-cols-1 gap-2">
              <button
                type="button"
                disabled={!roleRules.canRegular}
                onClick={() => update("listingType", "REGULAR")}
                className={`min-h-12 rounded-xl border px-4 text-left text-sm ${
                  form.listingType === "REGULAR" ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-700"
                } disabled:opacity-50`}
              >
                Regular Used Vehicle
              </button>
              <button
                type="button"
                disabled={!roleRules.canRepo}
                onClick={() => update("listingType", "REPO")}
                className={`min-h-12 rounded-xl border px-4 text-left text-sm ${
                  form.listingType === "REPO" ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-700"
                } disabled:opacity-50`}
              >
                Bank-Seized / Repo Vehicle
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-700">What are you listing? <span className="text-rose-500">*</span></p>
            <div className="grid gap-3 md:grid-cols-2">
              <button
                type="button"
                onClick={() => update("listingMode", "NORMAL")}
                className={`rounded-2xl border p-4 text-left ${
                  form.listingMode === "NORMAL" ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-700"
                }`}
              >
                <p className="text-sm font-semibold">Single Listing</p>
                <p className="mt-1 text-xs opacity-80">One vehicle, trailer, prime mover, or equipment item.</p>
              </button>
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-left text-slate-500">
                <p className="text-sm font-semibold text-slate-700">Bulk Lot / Group Listing</p>
                <p className="mt-1 text-xs">Bulk lot listings are coming soon. Contact RepoMandi to list multiple vehicles.</p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-700">Asset Structure <span className="text-rose-500">*</span></p>
            <div className="grid gap-2 md:grid-cols-3">
              {(Object.entries(ASSET_STRUCTURE_LABELS) as Array<[AssetStructure, string]>).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => update("assetStructure", value)}
                  className={`rounded-2xl border p-4 text-left text-sm ${
                    form.assetStructure === value ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-700"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {form.assetStructure === "DETACHABLE" ? (
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-700">Detachable Type <span className="text-rose-500">*</span></p>
              <div className="grid gap-2 md:grid-cols-2">
                {(Object.entries(DETACHABLE_TYPE_LABELS) as Array<[DetachableType, string]>).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => update("detachableType", value)}
                    className={`rounded-2xl border p-4 text-left text-sm ${
                      form.detachableType === value ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-700"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              {form.detachableType && DETACHABLE_TYPE_HELPER_TEXT[form.detachableType] ? (
                <p className="text-xs text-slate-500">{DETACHABLE_TYPE_HELPER_TEXT[form.detachableType]}</p>
              ) : null}
            </div>
          ) : null}
        </section>
      ) : null}

      {step === STEP_BASICS ? (
        <section className="space-y-4">
          <h1 className="text-xl font-semibold text-slate-900">Step 2: Asset Basics</h1>
          <SelectField
            label="Vehicle Class"
            value={form.assetCategory}
            options={assetCategoryOptions}
            onChange={(value) => update("assetCategory", value)}
            required
            helperText={!assetCategoryOptions.length ? "Select asset structure first." : undefined}
          />
          {bodyApplicationOptions.length > 0 ? (
            <SelectField
              label="Body Type"
              value={form.bodyApplicationType}
              options={bodyApplicationOptions}
              onChange={(value) => update("bodyApplicationType", value)}
              required
            />
          ) : null}

          {isStandalone && form.assetCategory === "Prime Mover + Trailer" ? (
            <SelectField
              label="Attached Trailer Type"
              value={form.trailerType}
              options={ATTACHED_TRAILER_TYPE_OPTIONS}
              onChange={(value) => update("trailerType", value)}
              helperText="Optional — select the type of trailer attached to this combination."
            />
          ) : null}

          {(isStandalone || isPrimeMover || isEquipment) ? (
            <>
              <SelectField label="Brand / Make" value={form.brand} options={brands} onChange={(value) => update("brand", value)} required />
              <TextField label="Model" value={form.model} onChange={(value) => update("model", value)} required placeholder="e.g. 407, 5530, PC210" />
            </>
          ) : (
            <TextField label="Manufacturer / Brand" value={form.brand} onChange={(value) => update("brand", value)} placeholder="Optional but recommended" />
          )}

          <SelectField label="Year" value={form.year} options={years} onChange={(value) => update("year", value)} required />

          {(isStandalone || isPrimeMover || isEquipment) ? (
            <>
              <label className="space-y-1.5">
                <span className="text-sm font-medium text-slate-700">
                  Registered State / RTO <span className="text-rose-500">*</span>
                </span>
                <input
                  list="registered-state-rto-options"
                  value={form.registrationState}
                  onChange={(event) => update("registrationState", event.target.value.toUpperCase())}
                  placeholder="e.g. HR, HR67, TS07, Maharashtra"
                  className="min-h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-800"
                />
                <datalist id="registered-state-rto-options">
                  {indiaStates.map((stateOption) => (
                    <option key={stateOption} value={stateOption} />
                  ))}
                </datalist>
              </label>
              <TextField
                label="Registration Number"
                value={form.vehicleRegistrationNumber}
                onChange={(value) => update("vehicleRegistrationNumber", value.toUpperCase())}
                placeholder="Optional"
              />
            </>
          ) : null}

          {isTrailerAsset ? (
            <>
              <TextField
                label="Registration Number"
                value={form.vehicleRegistrationNumber}
                onChange={(value) => update("vehicleRegistrationNumber", value.toUpperCase())}
                placeholder="Optional"
              />
              <TextField
                label="Registered State / RTO"
                value={form.registrationState}
                onChange={(value) => update("registrationState", value.toUpperCase())}
                placeholder="e.g. HR67"
              />
              <p className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                Manufacturer, trailer number, and registration details are optional for trailer-only listings.
              </p>
            </>
          ) : null}

          {isEquipment ? (
            <TextField
              label="Machine Serial Number"
              value={form.machineSerialNumber}
              onChange={(value) => update("machineSerialNumber", value)}
              placeholder="Optional but recommended"
            />
          ) : null}
        </section>
      ) : null}

      {step === STEP_PRICING ? (
        <section className="space-y-4">
          <h1 className="text-xl font-semibold text-slate-900">Step {getVisibleStepNumber(STEP_PRICING)}: Pricing &amp; Ownership Information</h1>
          <TextField label="Expected Price" value={form.expectedPrice} onChange={(value) => update("expectedPrice", value.replace(/\D/g, ""))} required placeholder="₹5,00,000" type="tel" />
          <TextField label="Vehicle / Yard Location" value={form.vehicleOrYardLocation} onChange={(value) => update("vehicleOrYardLocation", value)} required placeholder="e.g. Kompally Yard, Hyderabad" />
          <SelectField
            label="Transfer Type"
            value={form.transferType}
            options={transferTypeOptions}
            onChange={(value) => update("transferType", value)}
            required
            optionLabels={transferTypeLabels}
            helperText={transferTypeDescriptions[form.transferType] ?? undefined}
          />
        </section>
      ) : null}

      {step === STEP_REPO ? (
        <section className="space-y-4">
          <h1 className="text-xl font-semibold text-slate-900">Step {getVisibleStepNumber(STEP_REPO)}: Repo Details</h1>
          {form.listingType !== "REPO" ? (
            <p className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-600">
              Repo details are only required for REPO listings.
            </p>
          ) : (
            <>
              <SelectField label="Finance Company" value={form.financeCompany} options={financeCompanies} onChange={(value) => update("financeCompany", value)} required />
              <SelectField label="Repo Status" value={form.repoStatus} options={repoStatusOptions} onChange={(value) => update("repoStatus", value)} required />
              <TextField label="Yard Name" value={form.yardName} onChange={(value) => update("yardName", value)} required />
              <TextField label="Yard Contact" value={form.yardContact} onChange={(value) => update("yardContact", value)} required type="tel" />
              <TextField label="Reserve Price" value={form.reservePrice} onChange={(value) => update("reservePrice", value.replace(/\D/g, ""))} type="tel" />
              <TextField label="Auction Date" value={form.auctionDate} onChange={(value) => update("auctionDate", value)} type="date" />
            </>
          )}
        </section>
      ) : null}

      {step === STEP_TECHNICAL ? (
        <section className="space-y-4">
          <h1 className="text-xl font-semibold text-slate-900">Step {getVisibleStepNumber(STEP_TECHNICAL)}: Vehicle Condition &amp; Technical Details</h1>

          {poweredAsset ? (
            <details className="rounded-xl border border-slate-200 bg-white p-4" open>
              <summary className="cursor-pointer text-sm font-semibold text-slate-800">Vehicle Condition</summary>
              <div className="mt-4 space-y-3">
                <SelectField label="Engine Condition" value={form.engineCondition} options={engineConditionOptions} onChange={(value) => update("engineCondition", value)} />
                <SelectField label="Needs Towing" value={form.needsTowing} options={[...yesNoUnknownOptions]} onChange={(value) => update("needsTowing", value)} />
              </div>
            </details>
          ) : null}

          {poweredAsset ? (
            <details className="rounded-xl border border-slate-200 bg-white p-4" open>
              <summary className="cursor-pointer text-sm font-semibold text-slate-800">Powertrain Details</summary>
              <div className="mt-4 space-y-3">
                <SelectField label="Fuel Type" value={form.fuelType} options={fuelTypeOptions} onChange={(value) => update("fuelType", value)} />
                <SelectField label="BS Norm / Emission Norm" value={form.bsNorm} options={bsNormOptions} onChange={(value) => update("bsNorm", value)} />
                <SelectField label="Axle Configuration" value={form.axleConfiguration} options={axleConfigurationOptions} onChange={(value) => update("axleConfiguration", value)} />
                <TextField label="Odometer Reading" value={form.odometerReading} onChange={(value) => update("odometerReading", value.replace(/\D/g, ""))} type="tel" />
                <SelectField label="AC Cabin" value={form.acCabin} options={[...yesNoUnknownOptions]} onChange={(value) => update("acCabin", value)} />
              </div>
            </details>
          ) : null}

          {isTrailerAsset ? (
            <details className="rounded-xl border border-slate-200 bg-white p-4" open>
              <summary className="cursor-pointer text-sm font-semibold text-slate-800">Trailer / Detachable Specs</summary>
              <div className="mt-4 space-y-3">
                <SelectField label="Trailer Type" value={form.trailerType} options={trailerTypeOptions} onChange={(value) => update("trailerType", value)} required />
                <TextField label="Trailer Length" value={form.trailerLength} onChange={(value) => update("trailerLength", value)} required placeholder="e.g. 40 ft" />
                <TextField label="Number of Axles" value={form.numberOfAxles} onChange={(value) => update("numberOfAxles", value.replace(/\D/g, ""))} type="tel" required />
                <TextField label="Body Dimensions" value={form.bodyDimensions} onChange={(value) => update("bodyDimensions", value)} placeholder="Optional" />
                <SelectField label="Suspension Type" value={form.suspensionType} options={trailerSuspensionOptions} onChange={(value) => update("suspensionType", value)} />
                <SelectField label="ABS" value={form.abs} options={[...yesNoUnknownOptions]} onChange={(value) => update("abs", value)} />
                <TextField label="Manufacturer" value={form.trailerManufacturer} onChange={(value) => update("trailerManufacturer", value)} />
                <TextField label="Trailer Number" value={form.trailerNumber} onChange={(value) => update("trailerNumber", value)} />
                <TextField label="Trailer Manufacturing Month-Year" value={form.trailerManufacturingMonthYear} onChange={(value) => update("trailerManufacturingMonthYear", value)} placeholder="e.g. 03/2021" />
              </div>
            </details>
          ) : null}

          {isStandalone ? (
            <details className="rounded-xl border border-slate-200 bg-white p-4" open>
              <summary className="cursor-pointer text-sm font-semibold text-slate-800">Body / Attachment Details</summary>
              <div className="mt-4 space-y-3">
                <div className="space-y-1.5">
                  <span className="text-sm font-medium text-slate-700">Body Type</span>
                  <p className="min-h-12 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700">
                    {form.bodyApplicationType || "Not selected"}
                  </p>
                </div>
                <TextField label="Body Dimensions" value={form.bodyDimensions} onChange={(value) => update("bodyDimensions", value)} placeholder="e.g. 20 ft x 8 ft" />
                <TextField label="GVW (Tonnes)" value={form.gvwTonnes} onChange={(value) => update("gvwTonnes", value)} />
                {standaloneShowsSuspension ? (
                  <SelectField label="Suspension Type" value={form.suspensionType} options={trailerSuspensionOptions} onChange={(value) => update("suspensionType", value)} />
                ) : null}
                <SelectField label="Body Attached" value={form.bodyAttached} options={[...yesNoOptions]} onChange={(value) => update("bodyAttached", value)} />
                <SelectField label="Body Condition" value={form.bodyCondition} options={bodyConditionOptions} onChange={(value) => update("bodyCondition", value)} />
              </div>
            </details>
          ) : null}

          <details className="rounded-xl border border-slate-200 bg-white p-4" open>
            <summary className="cursor-pointer text-sm font-semibold text-slate-800">Tyre Information</summary>
            <div className="mt-4 space-y-3">
              <TextField
                label="Total Tyres"
                value={form.totalTyres}
                onChange={(value) => update("totalTyres", value.replace(/\D/g, ""))}
                placeholder="e.g. 4, 6, 10, 12, 18, 22"
                type="tel"
              />
              <SelectField
                label="Tyre Mount Status"
                value={form.tyreMountStatus}
                options={tyreMountStatusOptions}
                onChange={(value) => update("tyreMountStatus", value)}
              />
              <SelectField
                label="Tyre Condition"
                value={form.tyreCondition}
                options={tyreConditionOptions}
                onChange={(value) => update("tyreCondition", value)}
              />
            </div>
          </details>

          <details className="rounded-xl border border-slate-200 bg-white p-4">
            <summary className="cursor-pointer text-sm font-semibold text-slate-800">Documentation Details</summary>
            <p className="mt-1 text-xs text-slate-500">Optional information about vehicle paperwork and compliance.</p>
            <div className="mt-4 space-y-3">
              <TextField
                label="Insurance Validity"
                value={form.insuranceValidity}
                type="date"
                placeholder="DD/MM/YYYY"
                onChange={(value) => update("insuranceValidity", value)}
              />
              <TextField
                label="Permit Validity"
                value={form.permitValidity}
                type="date"
                placeholder="DD/MM/YYYY"
                onChange={(value) => update("permitValidity", value)}
              />
              <TextField
                label="Fitness Validity"
                value={form.fitnessStatus}
                type="date"
                placeholder="DD/MM/YYYY"
                onChange={(value) => update("fitnessStatus", value)}
              />
              <TextField
                label="Tax Validity"
                value={form.taxValidity}
                type="date"
                placeholder="DD/MM/YYYY"
                onChange={(value) => update("taxValidity", value)}
              />
              <TextField
                label="Parking Due (₹)"
                value={form.parkingDue}
                type="number"
                placeholder="0"
                min={0}
                onChange={(value) => update("parkingDue", value.replace(/\D/g, ""))}
              />
            </div>
          </details>

          <details className="rounded-xl border border-slate-200 bg-white p-4" open>
            <summary className="cursor-pointer text-sm font-semibold text-slate-800">Description / Remarks</summary>
            <div className="mt-4">
              <TextAreaField
                label="Description / Remarks"
                value={form.description}
                onChange={(value) => update("description", value)}
                placeholder="Add key condition, documents, or transfer notes."
              />
            </div>
          </details>
        </section>
      ) : null}

      {step === STEP_PHOTOS ? (
        <section className="space-y-4">
          <h1 className="text-xl font-semibold text-slate-900">Step {getVisibleStepNumber(STEP_PHOTOS)}: Photos &amp; Documents</h1>
          <p className="text-sm text-slate-500">Photos are optional for now. Listings with photos get more buyer trust and leads.</p>

          <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5">
            <span className="text-sm text-slate-600">Photos uploaded</span>
            <span className={`text-sm font-semibold ${totalPhotosCount >= MAX_PHOTOS ? "text-rose-600" : "text-slate-900"}`}>
              {totalPhotosCount} / {MAX_PHOTOS}
            </span>
          </div>

          {(
            [
              { key: "frontPhoto", label: "Front Photo", required: false },
              { key: "backPhoto", label: "Rear Photo", required: false },
              { key: "leftSidePhoto", label: "Left Side Photo", required: false },
              { key: "rightSidePhoto", label: "Right Side Photo", required: false },
              { key: "interiorPhoto", label: "Interior Photo", required: false },
            ] as { key: UploadCategory; label: string; required: boolean }[]
          ).map((item) => {
            const photoValue = form[item.key];
            return (
              <div key={item.key} className="space-y-2 rounded-xl border border-slate-200 bg-white p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-slate-700">
                    {item.label} {item.required ? <span className="text-rose-500">*</span> : <span className="text-slate-400">(Optional)</span>}
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileRefs[item.key].current?.click()}
                      disabled={uploadingField === item.key}
                      className="inline-flex min-h-9 items-center rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-700"
                    >
                      {uploadingField === item.key ? "Uploading..." : photoValue ? "Replace" : "Upload"}
                    </button>
                    {photoValue ? (
                      <button
                        type="button"
                        onClick={() => deleteSinglePhoto(item.key)}
                        disabled={uploadingField === item.key}
                        aria-label="Delete photo"
                        className="inline-flex min-h-9 items-center rounded-lg border border-rose-200 bg-rose-50 px-3 text-xs font-semibold text-rose-600"
                      >
                        Delete
                      </button>
                    ) : null}
                  </div>
                </div>
                <input ref={fileRefs[item.key]} type="file" accept="image/*" className="hidden" onChange={(event) => uploadSinglePhoto(item.key, event.target.files?.[0] ?? null)} />
                {photoValue ? <UploadPreviewImage src={photoValue} alt={item.label} /> : <div className="flex h-32 items-center justify-center rounded-lg border border-dashed border-slate-200 text-center text-xs text-slate-400">No image uploaded</div>}
              </div>
            );
          })}

          <div className="space-y-3">
            <div className="flex items-baseline gap-2">
              <h2 className="text-base font-semibold text-slate-900">Additional Photos</h2>
              <span className="text-sm text-slate-400">(Optional)</span>
            </div>

            {additionalPhotos.map((photo, index) => (
              <div key={index} className="space-y-2 rounded-xl border border-slate-200 bg-white p-3">
                <div className="flex items-center gap-2">
                  <select
                    value={photo.category}
                    onChange={(event) =>
                      setAdditionalPhotos((previous) =>
                        previous.map((item, i) => (i === index ? { ...item, category: event.target.value } : item))
                      )
                    }
                    className="min-h-10 flex-1 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800"
                  >
                    <option value="">Category (optional)</option>
                    {ADDITIONAL_PHOTO_CATEGORIES.map((category) => (
                      <option key={category.value} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => {
                      setPendingAdditionalAction(index);
                      additionalFileRef.current?.click();
                    }}
                    disabled={uploadingAdditional || uploadingField !== ""}
                    className="inline-flex min-h-9 items-center rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-700 disabled:opacity-50"
                  >
                    Replace
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdditionalPhotos((previous) => previous.filter((_, i) => i !== index))}
                    aria-label="Delete photo"
                    className="inline-flex min-h-9 items-center rounded-lg border border-rose-200 bg-rose-50 px-3 text-xs font-semibold text-rose-600"
                  >
                    Delete
                  </button>
                </div>
                <UploadPreviewImage src={photo.url} alt={`Additional photo ${index + 1}`} />
              </div>
            ))}

            {canAddMorePhotos ? (
              <button
                type="button"
                onClick={() => {
                  setPendingAdditionalAction("new");
                  if (additionalFileRef.current) {
                    additionalFileRef.current.multiple = true;
                    additionalFileRef.current.click();
                  }
                }}
                disabled={uploadingAdditional || uploadingField !== ""}
                className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 text-sm font-medium text-slate-600 disabled:opacity-50"
              >
                {uploadingAdditional && pendingAdditionalAction === "new" ? "Uploading..." : "+ Add Photo"}
              </button>
            ) : (
              <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-700">Maximum 20 photos allowed.</p>
            )}

            <input ref={additionalFileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleAdditionalFileChange} />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5">
              <span className="text-sm text-slate-600">Videos uploaded</span>
              <span className={`text-sm font-semibold ${videos.length >= MAX_VIDEOS ? "text-rose-600" : "text-slate-900"}`}>
                {videos.length} / {MAX_VIDEOS}
              </span>
            </div>

            {videos.map((video, index) => (
              <div key={`${video.url}-${index}`} className="space-y-2 rounded-xl border border-slate-200 bg-white p-3">
                <div className="flex items-center gap-2">
                  <select
                    value={video.category}
                    onChange={(event) =>
                      setVideos((previous) =>
                        previous.map((item, i) => (i === index ? { ...item, category: event.target.value } : item))
                      )
                    }
                    className="min-h-10 flex-1 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800"
                  >
                    {videoCategoryOptions.map((category) => (
                      <option key={category.value} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => {
                      setPendingVideoAction(index);
                      if (videoFileRef.current) {
                        videoFileRef.current.multiple = false;
                        videoFileRef.current.click();
                      }
                    }}
                    disabled={uploadingVideo}
                    className="inline-flex min-h-9 items-center rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-700 disabled:opacity-50"
                  >
                    Replace
                  </button>
                  <button
                    type="button"
                    onClick={() => setVideos((previous) => previous.filter((_, i) => i !== index))}
                    aria-label="Remove video"
                    className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-rose-200 bg-rose-50 text-rose-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <video src={video.url} controls className="w-full rounded-lg bg-black" />
                <p className="text-xs text-slate-500">
                  {(video.sizeBytes / (1024 * 1024)).toFixed(1)} MB • {video.mimeType || "video"}
                </p>
              </div>
            ))}

            {canAddMoreVideos ? (
              <button
                type="button"
                onClick={() => {
                  setPendingVideoAction("new");
                  if (videoFileRef.current) {
                    videoFileRef.current.multiple = true;
                    videoFileRef.current.click();
                  }
                }}
                disabled={uploadingVideo}
                className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 text-sm font-medium text-slate-600 disabled:opacity-50"
              >
                {uploadingVideo && pendingVideoAction === "new" ? "Uploading..." : "+ Add Video"}
              </button>
            ) : null}

            <input ref={videoFileRef} type="file" accept="video/*" multiple className="hidden" onChange={handleVideoFileChange} />
          </div>

          <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
            <div className="space-y-1">
              <h2 className="text-sm font-semibold text-slate-800">Documents Uploads (Optional)</h2>
              <p className="text-xs text-slate-500">
                Upload RC, insurance, fitness, permit or inspection documents as PDF or images.
              </p>
              <p className="text-xs text-slate-500">Allowed: PDF, JPG, JPEG, PNG, WEBP</p>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5">
              <span className="text-sm text-slate-600">Documents uploaded</span>
              <span className={`text-sm font-semibold ${documentUploadCounterClass}`}>
                {documents.length} / {MAX_DOCUMENTS}
              </span>
            </div>

            <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
              <label className="space-y-1.5">
                <span className="text-sm font-medium text-slate-700">Document Type</span>
                <select
                  value={selectedDocumentCategory}
                  onChange={(event) => setSelectedDocumentCategory(event.target.value as DocumentCategory)}
                  className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800"
                >
                  {DOCUMENT_CATEGORIES.map((category) => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-1.5">
                <span className="text-sm font-medium text-slate-700">Document Name (for Other)</span>
                <input
                  type="text"
                  value={selectedOtherDocumentName}
                  onChange={(event) => setSelectedOtherDocumentName(event.target.value)}
                  disabled={selectedDocumentCategory !== "OTHER"}
                  placeholder="e.g. NOC Letter"
                  className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 disabled:bg-slate-50 disabled:text-slate-400"
                />
              </label>

              <button
                type="button"
                onClick={() => documentFileRef.current?.click()}
                disabled={!canAddMoreDocumentsTotal || !canAddMoreDocumentsInGroup || uploadingDocuments}
                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 disabled:opacity-50"
              >
                {uploadingDocuments ? "Uploading..." : "Upload"}
              </button>
            </div>

            <div
              className="rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-xs text-slate-500"
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                void uploadDocuments(Array.from(event.dataTransfer.files || []));
              }}
            >
              Drag & drop files here or use Upload.
            </div>

            {documents.length ? (
              <div className="space-y-2">
                {documents.map((document, index) => (
                  <div key={`${document.url}-${index}`} className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-3">
                    {document.mimeType.startsWith("image/") ? (
                      <SafeImage
                        src={document.url}
                        alt={document.originalFileName || "Document image"}
                        width={72}
                        height={72}
                        className="h-14 w-14 rounded-md object-cover"
                        logContext={{ component: "AddVehicleDocuments" }}
                      />
                    ) : (
                      <span className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-slate-100 text-slate-600">
                        {document.mimeType === "application/pdf" ? <FileText className="h-5 w-5" /> : <FileImage className="h-5 w-5" />}
                      </span>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-slate-700">
                        {document.category === "OTHER" ? `Other: ${document.customName || "Other"}` : formatEnumLabel(document.category)}
                      </p>
                      <p className="truncate text-sm text-slate-800">{document.originalFileName || "Document file"}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setDocuments((previous) => previous.filter((_, docIndex) => docIndex !== index))}
                      className="inline-flex min-h-9 items-center rounded-lg border border-rose-200 bg-rose-50 px-3 text-xs font-semibold text-rose-600"
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="rounded-xl bg-slate-50 px-4 py-3 text-xs text-slate-500">No documents uploaded.</p>
            )}

            {!canAddMoreDocumentsInGroup ? (
              <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-700">
                Maximum 4 files allowed for this document type.
              </p>
            ) : null}
            {!canAddMoreDocumentsTotal ? (
              <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-700">
                Maximum 15 document files allowed per listing.
              </p>
            ) : null}

            <input
              ref={documentFileRef}
              type="file"
              accept=".pdf,image/jpeg,image/jpg,image/png,image/webp"
              multiple
              className="hidden"
              onChange={handleDocumentFileChange}
            />
          </section>
        </section>
      ) : null}

      {step === STEP_REVIEW ? (
        <section className="space-y-4">
          <h1 className="text-xl font-semibold text-slate-900">Step {getVisibleStepNumber(STEP_REVIEW)}: Seller Info &amp; Review</h1>
          <p className="text-sm text-slate-500">Profile data is auto-filled and read-only. Review before submitting.</p>
          <TextField label="Seller Name" value={user?.fullName ?? ""} onChange={() => {}} required readOnly />
          <TextField label="Seller Contact" value={user?.phone ?? ""} onChange={() => {}} required readOnly />
          <TextField label="Seller Role" value={user?.sellerRole ?? user?.bankRole ?? ""} onChange={() => {}} required readOnly />
          <TextField label="City" value={user?.city ?? ""} onChange={() => {}} readOnly />
          <TextField label="State" value={user?.state ?? ""} onChange={() => {}} readOnly />
          <TextField label="Business Name" value={user?.businessName ?? ""} onChange={() => {}} readOnly />
          <div className="space-y-1.5">
            <span className="text-sm font-medium text-slate-700">Alternate Contact Number</span>
            <div className="flex gap-2">
              <input
                type="tel"
                inputMode="numeric"
                maxLength={10}
                value={form.alternateContactNumber}
                onChange={(event) => update("alternateContactNumber", event.target.value.replace(/\D/g, "") as FormData["alternateContactNumber"])}
                className="min-h-12 flex-1 rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-800"
                placeholder="Optional"
              />
              <button
                type="button"
                onClick={handleVerifyAlternatePhone}
                disabled={!form.alternateContactNumber || form.alternateContactNumber.length !== 10 || verifyingAlternatePhone}
                className="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 disabled:opacity-50"
              >
                {form.alternateContactNumberVerified ? "Verified" : verifyingAlternatePhone ? "Verifying..." : "Verify"}
              </button>
            </div>
            <p className="text-xs text-slate-500">
              If provided, verify this number before it can be used publicly on the listing.
            </p>
          </div>
          <TextField label="GSTIN" value={form.gstin} onChange={(value) => update("gstin", value)} />
        </section>
      ) : null}

      {error ? <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}

      <div className="flex gap-3">
        {step > STEP_LISTING ? (
          <button
            type="button"
            onClick={back}
            className="inline-flex min-h-12 flex-1 items-center justify-center rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700"
          >
            Back
          </button>
        ) : null}
        <button
          type="button"
          onClick={canSubmit ? handleSubmit : next}
          disabled={
            submitting || uploadingField !== "" || uploadingAdditional || uploadingVideo || uploadingDocuments || verifyingAlternatePhone
          }
          className="inline-flex min-h-12 flex-1 items-center justify-center rounded-xl bg-slate-900 text-sm font-semibold text-white disabled:opacity-50"
        >
          {canSubmit
            ? submitting
              ? mode === "edit"
                ? "Saving..."
                : "Submitting..."
              : mode === "edit"
                ? "Save Changes"
                : "Submit Listing"
            : "Next"}
        </button>
      </div>
    </main>
  );
}

export default function AddVehiclePage() {
  return <VehicleFormPage mode="create" />;
}
