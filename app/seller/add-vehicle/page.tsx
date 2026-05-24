"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, CheckCircle2, Info, X } from "lucide-react";

type ListingType = "REGULAR" | "REPO";
type KmMeterStatus = "WORKING" | "NOT_WORKING" | "UNKNOWN";
type AssetConfiguration =
  | "Complete Vehicle"
  | "Power / Horse / Tractor / Prime Mover Only"
  | "Trailer Only"
  | "Prime Mover + Trailer"
  | "Other";

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

type UploadCategory = "frontPhoto" | "backPhoto" | "sidePhoto" | "interiorPhoto";

type FormData = {
  listingType: ListingType | "";
  assetConfiguration: AssetConfiguration | "";
  vehicleType: string;
  vehicleSubType: string;
  brand: string;
  model: string;
  year: string;
  registrationState: string;
  vehicleRegistrationNumber: string;
  kmDriven: string;
  kmMeterStatus: KmMeterStatus;
  runningCondition: "RUNNING" | "NOT_RUNNING" | "UNKNOWN";
  expectedPrice: string;
  state: string;
  city: string;
  vehicleOrYardLocation: string;
  conditionNotes: string;
  engineCondition: string;
  needsTowing: string;
  roadSafeStatus: string;
  frontPhoto: string;
  backPhoto: string;
  sidePhoto: string;
  interiorPhoto: string;
  walkaroundVideo: string;
  engineStartUpVideo: string;
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
  tyreCount: string;
  currentTyreCount: string;
  tyreCondition: string;
  taxDue: string;
  challans: string;
  insuranceExpiry: string;
  fitnessExpiry: string;
  permitExpiry: string;
  nocStatus: string;
  engineNumber: string;
  chassisNumber: string;
  trailerNumber: string;
  gvwTonnes: string;
  gpsInstalled: string;
  abs: string;
  fleetManagementSoftwareAvailable: string;
  inspectionReport: string;
  rcDocument: string;
  insuranceDocument: string;
  fitnessDocument: string;
  permitDocument: string;
  alternateContactNumber: string;
  gstin: string;
};

const vehicleTypes = [
  "Mini Truck",
  "Pickup",
  "LCV (Light Commercial Vehicle)",
  "MCV (Medium Commercial Vehicle)",
  "HCV (Heavy Commercial Vehicle)",
  "Trailer",
  "Tanker",
  "Container Truck",
  "Tipper",
  "Bus",
];

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

const assetConfigurations: AssetConfiguration[] = [
  "Complete Vehicle",
  "Power / Horse / Tractor / Prime Mover Only",
  "Trailer Only",
  "Other",
];

const assetConfigurationHelperText: Record<AssetConfiguration, string> = {
  "Complete Vehicle": "Includes both the powered truck unit and attached trailer/body.",
  "Power / Horse / Tractor / Prime Mover Only": "Only the powered truck/horse is included.",
  "Trailer Only": "Only the trailer/body is included. No powered unit included.",
  "Prime Mover + Trailer": "Includes both the powered truck unit and trailer.",
  Other: "Use this when your listing does not fit the listed options.",
};

const trailerTypeOptions = [
  "Flatbed Trailer",
  "Semi Trailer",
  "Low Bed Trailer",
  "Body Trailer",
  "Tipper Trailer",
  "Bulker Trailer",
  "Tanker Trailer",
  "Skeletal Trailer",
  "Container Trailer",
  "Other Trailer",
];

const trailerSuspensionOptions = [
  "Leaf Spring",
  "Air Suspension / Balloon",
  "Mixed",
  "Unknown",
];

const financeCompanies = [
  "SBI",
  "HDFC",
  "ICICI",
  "Axis",
  "Tata Capital",
  "Mahindra Finance",
  "Other",
];

const repoStatusOptions = [
  "Bank Seized",
  "Yard Stock",
  "Auction Upcoming",
  "Ready For Sale",
  "Under Settlement",
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

const TOTAL_STEPS = 8;

const STEP_LABELS = ["Listing", "Vehicle", "Condition", "Pricing", "Repo", "Details", "Photos", "Review"];

const STEP_LISTING = 1;
const STEP_VEHICLE = 2;
const STEP_CONDITION = 3;
const STEP_PRICING = 4;
const STEP_REPO = 5;
const STEP_DETAILS = 6;
const STEP_PHOTOS = 7;

const emptyForm: FormData = {
  listingType: "",
  assetConfiguration: "",
  vehicleType: "",
  vehicleSubType: "",
  brand: "",
  model: "",
  year: "",
  registrationState: "",
  vehicleRegistrationNumber: "",
  kmDriven: "",
  kmMeterStatus: "UNKNOWN",
  runningCondition: "UNKNOWN",
  expectedPrice: "",
  state: "",
  city: "",
  vehicleOrYardLocation: "",
  conditionNotes: "",
  engineCondition: "",
  needsTowing: "",
  roadSafeStatus: "",
  frontPhoto: "",
  backPhoto: "",
  sidePhoto: "",
  interiorPhoto: "",
  walkaroundVideo: "",
  engineStartUpVideo: "",
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
  tyreCount: "",
  currentTyreCount: "",
  tyreCondition: "",
  taxDue: "",
  challans: "",
  insuranceExpiry: "",
  fitnessExpiry: "",
  permitExpiry: "",
  nocStatus: "",
  engineNumber: "",
  chassisNumber: "",
  trailerNumber: "",
  gvwTonnes: "",
  gpsInstalled: "",
  abs: "",
  fleetManagementSoftwareAvailable: "",
  inspectionReport: "",
  rcDocument: "",
  insuranceDocument: "",
  fitnessDocument: "",
  permitDocument: "",
  alternateContactNumber: "",
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
  helperTextId,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  required?: boolean;
  labelSuffix?: ReactNode;
  helperText?: string;
  helperTextId?: string;
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
        aria-describedby={helperText ? helperTextId : undefined}
        className="min-h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-800"
      >
        <option value="">Select</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      {helperText ? (
        <p id={helperTextId} className="text-xs text-slate-500">
          {helperText}
        </p>
      ) : null}
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
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  placeholder?: string;
  type?: "text" | "number" | "tel" | "date";
  readOnly?: boolean;
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
        className={`min-h-12 w-full rounded-xl border px-4 text-sm ${
          readOnly
            ? "border-slate-100 bg-slate-50 text-slate-500"
            : "border-slate-200 bg-white text-slate-800"
        }`}
      />
    </label>
  );
}

export default function AddVehiclePage() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [error, setError] = useState("");
  const [uploadingField, setUploadingField] = useState<UploadCategory | "">("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [assetHelpOpen, setAssetHelpOpen] = useState(false);
  const fileRefs = {
    frontPhoto: useRef<HTMLInputElement>(null),
    backPhoto: useRef<HTMLInputElement>(null),
    sidePhoto: useRef<HTMLInputElement>(null),
    interiorPhoto: useRef<HTMLInputElement>(null),
  };

  const update = <T extends keyof FormData>(key: T, value: FormData[T]) => {
    setForm((previous) => ({ ...previous, [key]: value }));
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
        if (data.user.accountType === "BUYER") {
          router.replace("/sell");
          return;
        }
        if (!data.user.isProfileComplete) {
          router.replace("/onboarding");
          return;
        }
        setUser(data.user);

        if (data.user.accountType === "BANK_PARTNER" || data.user.sellerRole === "RECOVERY_AGENT") {
          update("listingType", "REPO");
        } else {
          update("listingType", "REGULAR");
        }
        setAuthChecked(true);
      } catch {
        router.replace("/auth/login");
      }
    };

    loadSession();
  }, [router]);

  const roleRules = useMemo(() => {
    if (!user) return { canRegular: false, canRepo: false };
    if (user.accountType === "BANK_PARTNER") return { canRegular: false, canRepo: true };
    if (user.accountType === "ADMIN") return { canRegular: true, canRepo: true };
    if (user.sellerRole === "BROKER") return { canRegular: true, canRepo: true };
    if (user.sellerRole === "RECOVERY_AGENT") return { canRegular: false, canRepo: true };
    return { canRegular: true, canRepo: false };
  }, [user]);

  const isTrailerOnly = form.assetConfiguration === "Trailer Only";
  const hasTrailerConfiguration =
    form.assetConfiguration === "Trailer Only" || form.assetConfiguration === "Prime Mover + Trailer";
  const appliesTrailerLogic = form.vehicleType === "Trailer" || hasTrailerConfiguration;
  const requiresPoweredFields = !isTrailerOnly;
  const requiresTrailerFields = appliesTrailerLogic;
  const shouldHideTrailerFieldsInStep6 =
    form.listingType !== "REPO" && form.assetConfiguration === "Power / Horse / Tractor / Prime Mover Only";
  // Trailer-focused fields are shown only when trailer logic applies and the non-REPO prime-mover-only override does not hide them.
  const showTrailerFieldsInStep6 = requiresTrailerFields && !shouldHideTrailerFieldsInStep6;
  const requiresInteriorPhoto = !isTrailerOnly;
  const assetConfigurationContext =
    form.assetConfiguration && assetConfigurationHelperText[form.assetConfiguration as AssetConfiguration]
      ? assetConfigurationHelperText[form.assetConfiguration as AssetConfiguration]
      : "";

  useEffect(() => {
    if (!assetHelpOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setAssetHelpOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [assetHelpOpen]);

  const validateStep = (targetStep: number) => {
    // Step 1: Listing Information + Asset Configuration
    if (targetStep === STEP_LISTING) {
      if (!form.listingType) return "Select listing type.";
      if (!form.assetConfiguration) return "Select asset configuration.";
    }

    // Step 2: Vehicle Basics
    if (targetStep === STEP_VEHICLE) {
      if (!form.vehicleType) return "Vehicle type is required.";
      if (requiresPoweredFields && (!form.brand || !form.model || !form.year)) {
        return "Brand, model, and year are required for powered vehicle listings.";
      }
      if (requiresPoweredFields && (!form.registrationState || !form.vehicleRegistrationNumber.trim())) {
        return "Registration state and number are required.";
      }
    }

    // Step 3: Vehicle Condition & Usage
    if (targetStep === STEP_CONDITION) {
      if (!isTrailerOnly) {
        if (!form.kmMeterStatus || !form.runningCondition) return "KM meter status and running condition are required.";
        if (form.kmMeterStatus === "WORKING" && !form.kmDriven.trim()) {
          return "KM driven is required when meter is working.";
        }
      }
      if (!form.conditionNotes.trim()) return "Condition notes are required.";
    }

    // Step 4: Pricing & Location
    if (targetStep === STEP_PRICING) {
      if (!form.expectedPrice || Number(form.expectedPrice) <= 0 || !form.vehicleOrYardLocation.trim()) {
        return "Expected price and vehicle/yard location are required.";
      }
    }

    // Step 5: Repo Details (only validated if REPO)
    if (targetStep === STEP_REPO && form.listingType === "REPO") {
      if (!form.financeCompany || !form.repoStatus || !form.yardName.trim()) {
        return "Finance company, repo status, and yard name are required for REPO listings.";
      }
    }

    // Step 6: Optional Vehicle Details — trailer specs required when applicable
    if (targetStep === STEP_DETAILS && showTrailerFieldsInStep6) {
      if (!form.trailerType || !form.trailerLength.trim() || !form.numberOfAxles.trim() || !form.bodyDimensions.trim()) {
        return "Trailer type, trailer length, number of axles, and body dimensions are required.";
      }
      if (form.assetConfiguration === "Prime Mover + Trailer" && (!form.suspensionType || !form.abs)) {
        return "Suspension type and ABS are required for Prime Mover + Trailer.";
      }
    }

    // Step 7: Photos & Documents
    if (targetStep === STEP_PHOTOS) {
      if (!form.frontPhoto || !form.backPhoto || !form.sidePhoto || (requiresInteriorPhoto && !form.interiorPhoto)) {
        return requiresInteriorPhoto
          ? "Front, back, side, and interior photos are required."
          : "Front, back, and side photos are required.";
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
    setStep((previous) => Math.min(previous + 1, TOTAL_STEPS));
  };

  const back = () => {
    if (step === 1) {
      router.back();
      return;
    }
    setError("");
    setStep((previous) => previous - 1);
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
      update(category, data.urls[0]);
    } catch {
      setError("Failed to upload image.");
    } finally {
      setUploadingField("");
      if (fileRefs[category].current) {
        fileRefs[category].current.value = "";
      }
    }
  };

  const handleSubmit = async () => {
    const stepError = validateStep(STEP_LISTING) || validateStep(STEP_VEHICLE) || validateStep(STEP_CONDITION) || validateStep(STEP_PRICING) || validateStep(STEP_REPO) || validateStep(STEP_DETAILS) || validateStep(STEP_PHOTOS);
    if (stepError) {
      setError(stepError);
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/vehicles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          expectedPrice: form.expectedPrice.replace(/\D/g, ""),
          reservePrice: form.reservePrice.replace(/\D/g, ""),
          kmDriven: form.kmDriven.replace(/\D/g, ""),
          tyreCount: form.tyreCount.replace(/\D/g, ""),
          currentTyreCount: form.currentTyreCount.replace(/\D/g, ""),
          numberOfAxles: form.numberOfAxles.replace(/\D/g, ""),
          vehicleRegistrationNumber: form.vehicleRegistrationNumber.toUpperCase(),
        }),
      });

      if (!response.ok) {
        const data = (await response.json()) as { message?: string };
        setError(data.message ?? "Failed to submit listing.");
        return;
      }

      setSubmitted(true);
    } catch {
      setError("Failed to submit listing.");
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

  if (submitted) {
    return (
      <main className="flex min-h-[calc(100dvh-80px)] flex-col items-center justify-center px-4 py-10 text-center">
        <CheckCircle2 className="h-16 w-16 text-emerald-500" />
        <h1 className="mt-4 text-2xl font-semibold text-slate-900">Vehicle Submitted for Verification</h1>
        <p className="mt-2 text-sm text-slate-500">Our team will review your listing before it goes live.</p>
        <div className="mt-8 w-full max-w-sm space-y-3">
          <Link
            href="/seller/listings"
            className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-slate-900 text-sm font-semibold text-white"
          >
            View My Listings
          </Link>
          <button
            onClick={() => {
              setSubmitted(false);
              setStep(1);
              setForm({
                ...emptyForm,
                listingType: form.listingType,
              });
            }}
            className="inline-flex min-h-12 w-full items-center justify-center rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700"
          >
            Add Another Vehicle
          </button>
        </div>
      </main>
    );
  }

  const canSubmit = step === TOTAL_STEPS && !submitting;

  return (
    <main className="space-y-6 px-4 pb-10 pt-4">
      <div className="flex items-center gap-3">
        <button
          onClick={back}
          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200"
        >
          <ArrowLeft className="h-4 w-4 text-slate-700" />
        </button>
        <div className="flex-1">
          <p className="text-xs font-medium text-slate-500">
            Step {step} of {TOTAL_STEPS} &mdash; <span className="text-slate-700">{STEP_LABELS[step - 1]}</span>
          </p>
          <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-slate-900" style={{ width: `${(step / TOTAL_STEPS) * 100}%` }} />
          </div>
        </div>
      </div>

      {step === 1 ? (
        <section className="space-y-4">
          <h1 className="text-xl font-semibold text-slate-900">Step 1: Listing Information</h1>
          <p className="text-sm text-slate-500">Choose listing type based on your role permissions.</p>
          <div className="grid grid-cols-1 gap-2">
            <button
              type="button"
              disabled={!roleRules.canRegular}
              onClick={() => update("listingType", "REGULAR")}
              className={`min-h-12 rounded-xl border px-4 text-left text-sm ${
                form.listingType === "REGULAR"
                  ? "border-slate-900 bg-slate-900 text-white"
                  : "border-slate-200 bg-white text-slate-700"
              } disabled:opacity-50`}
            >
              Regular Used Vehicle
            </button>
            <button
              type="button"
              disabled={!roleRules.canRepo}
              onClick={() => update("listingType", "REPO")}
              className={`min-h-12 rounded-xl border px-4 text-left text-sm ${
                form.listingType === "REPO"
                  ? "border-slate-900 bg-slate-900 text-white"
                  : "border-slate-200 bg-white text-slate-700"
              } disabled:opacity-50`}
            >
              Bank-Seized / Repo Vehicle
            </button>
          </div>
          <SelectField
            label="Asset Configuration"
            value={form.assetConfiguration}
            options={assetConfigurations}
            onChange={(value) => update("assetConfiguration", value as AssetConfiguration)}
            required
            helperText={assetConfigurationContext}
            helperTextId="asset-configuration-helper-text"
            labelSuffix={
              <>
                <span className="relative hidden md:inline-flex" onMouseEnter={() => setAssetHelpOpen(true)} onMouseLeave={() => setAssetHelpOpen(false)}>
                  <button
                    type="button"
                    aria-label="Asset configuration help"
                    aria-expanded={assetHelpOpen}
                    onClick={() => setAssetHelpOpen((previous) => !previous)}
                    className="inline-flex h-5 w-5 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                  >
                    <Info className="h-4 w-4" />
                  </button>
                  {assetHelpOpen ? (
                    <div role="tooltip" className="absolute left-6 top-6 z-20 w-80 rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-600 shadow-xl">
                      <p className="font-semibold text-slate-800">Asset Configuration Help</p>
                      <div className="mt-2 space-y-2">
                        <p><span className="font-medium text-slate-700">Complete Vehicle:</span> A complete running combination ready for transport use. Example: Tata Signa horse + attached trailer.</p>
                        <p><span className="font-medium text-slate-700">Power / Horse / Tractor / Prime Mover Only:</span> Only the powered truck unit is included. Trailer is not included. Example: Tata Signa 5530 horse only.</p>
                        <p><span className="font-medium text-slate-700">Trailer Only:</span> Only the trailer/body is included. No powered truck/horse included. Examples: 40ft flatbed trailer, low-bed trailer, tanker trailer, tipper trailer.</p>
                        <p><span className="font-medium text-slate-700">Other:</span> Use this if your listing does not fit the above categories.</p>
                      </div>
                    </div>
                  ) : null}
                </span>
                <button
                  type="button"
                  aria-label="Asset configuration help"
                  aria-haspopup="dialog"
                  aria-expanded={assetHelpOpen}
                  onClick={() => setAssetHelpOpen(true)}
                  className="inline-flex h-5 w-5 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 md:hidden"
                >
                  <Info className="h-4 w-4" />
                </button>
              </>
            }
          />
          {assetHelpOpen ? (
            <div className="fixed inset-0 z-40 bg-black/40 md:hidden" onClick={() => setAssetHelpOpen(false)}>
              <div
                role="dialog"
                aria-modal="true"
                aria-label="Asset configuration help"
                className="absolute inset-x-0 bottom-0 max-h-[80vh] overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="mb-3 flex items-start justify-between gap-2">
                  <h2 className="text-base font-semibold text-slate-900">Asset Configuration Help</h2>
                  <button
                    type="button"
                    onClick={() => setAssetHelpOpen(false)}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100"
                    aria-label="Close help"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="space-y-3 text-sm text-slate-600">
                  <p><span className="font-medium text-slate-800">Complete Vehicle</span><br />A complete running combination ready for transport use.<br />Example: Tata Signa horse + attached trailer.</p>
                  <p><span className="font-medium text-slate-800">Power / Horse / Tractor / Prime Mover Only</span><br />Only the powered truck unit is included.<br />Trailer is not included.<br />Example: Tata Signa 5530 horse only.</p>
                  <p><span className="font-medium text-slate-800">Trailer Only</span><br />Only the trailer/body is included.<br />No powered truck/horse included.<br />Examples: 40ft flatbed trailer, low-bed trailer, tanker trailer, tipper trailer.</p>
                  <p><span className="font-medium text-slate-800">Other</span><br />Use this if your listing does not fit the above categories.</p>
                </div>
              </div>
            </div>
          ) : null}
        </section>
      ) : null}

      {step === 2 ? (
        <section className="space-y-4">
          <h1 className="text-xl font-semibold text-slate-900">Step 2: Vehicle Basics</h1>
          <SelectField label="Vehicle Type" value={form.vehicleType} options={vehicleTypes} onChange={(value) => update("vehicleType", value)} required />
          <TextField label="Vehicle Sub-Type" value={form.vehicleSubType} onChange={(value) => update("vehicleSubType", value)} placeholder="Trailer subtype, tanker subtype, etc." />
          {requiresPoweredFields ? (
            <>
              <SelectField label="Brand" value={form.brand} options={brands} onChange={(value) => update("brand", value)} required />
              <TextField label="Model" value={form.model} onChange={(value) => update("model", value)} required placeholder="e.g. 407, 1109" />
              <SelectField label="Year" value={form.year} options={years} onChange={(value) => update("year", value)} required />
              <SelectField label="Registration State" value={form.registrationState} options={indiaStates} onChange={(value) => update("registrationState", value)} required />
              <TextField label="Vehicle Registration Number" value={form.vehicleRegistrationNumber} onChange={(value) => update("vehicleRegistrationNumber", value.toUpperCase())} required placeholder="MH-12-AB-1234" />
            </>
          ) : (
            <p className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-600">
              Powered vehicle registration fields are optional for Trailer Only listings.
            </p>
          )}
        </section>
      ) : null}

      {step === 3 ? (
        <section className="space-y-4">
          <h1 className="text-xl font-semibold text-slate-900">Step 3: Vehicle Condition &amp; Usage</h1>
          {isTrailerOnly ? (
            <p className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-600">
              KM meter and running-condition fields are skipped for Trailer Only listings.
            </p>
          ) : (
            <>
              <SelectField
                label="KM Meter Status"
                value={form.kmMeterStatus}
                options={["WORKING", "NOT_WORKING", "UNKNOWN"]}
                onChange={(value) => update("kmMeterStatus", value as KmMeterStatus)}
                required
              />
              {form.kmMeterStatus === "WORKING" ? (
                <TextField
                  label="KM Driven"
                  value={form.kmDriven}
                  onChange={(value) => update("kmDriven", value.replace(/\D/g, ""))}
                  required
                  placeholder="1,23,456 km"
                  type="tel"
                />
              ) : null}
              <SelectField
                label="Running Condition"
                value={form.runningCondition}
                options={["RUNNING", "NOT_RUNNING", "UNKNOWN"]}
                onChange={(value) => update("runningCondition", value as "RUNNING" | "NOT_RUNNING" | "UNKNOWN")}
                required
              />
              <SelectField
                label="Engine Condition"
                value={form.engineCondition}
                options={["GOOD", "AVERAGE", "NEEDS_WORK", "NOT_CHECKED", "UNKNOWN"]}
                onChange={(value) => update("engineCondition", value)}
              />
            </>
          )}
          <label className="space-y-1.5">
            <span className="text-sm font-medium text-slate-700">Condition Notes <span className="text-rose-500">*</span></span>
            <textarea
              value={form.conditionNotes}
              onChange={(event) => update("conditionNotes", event.target.value)}
              rows={3}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm"
              placeholder="Example: Engine running. Cabin work needed."
            />
          </label>
          <SelectField
            label="Needs Towing"
            value={form.needsTowing}
            options={["YES", "NO", "UNKNOWN"]}
            onChange={(value) => update("needsTowing", value)}
          />
          <SelectField
            label="Road Safe Status"
            value={form.roadSafeStatus}
            options={["ROAD_SAFE", "NOT_ROAD_SAFE", "UNKNOWN"]}
            onChange={(value) => update("roadSafeStatus", value)}
          />
        </section>
      ) : null}

      {step === 4 ? (
        <section className="space-y-4">
          <h1 className="text-xl font-semibold text-slate-900">Step 4: Pricing &amp; Location</h1>
          <TextField
            label="Expected Price"
            value={form.expectedPrice}
            onChange={(value) => update("expectedPrice", value.replace(/\D/g, ""))}
            required
            placeholder="₹5,00,000"
            type="tel"
          />
          <TextField
            label="Vehicle / Yard Location"
            value={form.vehicleOrYardLocation}
            onChange={(value) => update("vehicleOrYardLocation", value)}
            required
            placeholder="e.g. Kompally Yard, Hyderabad"
          />
        </section>
      ) : null}

      {step === 5 ? (
        <section className="space-y-4">
          <h1 className="text-xl font-semibold text-slate-900">Step 5: Repo Details</h1>
          {form.listingType !== "REPO" ? (
            <p className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-600">
              Repo details are only required when listing type is REPO. You can skip to the next step.
            </p>
          ) : (
            <>
              <SelectField label="Finance Company" value={form.financeCompany} options={financeCompanies} onChange={(value) => update("financeCompany", value)} required />
              <SelectField label="Repo Status" value={form.repoStatus} options={repoStatusOptions} onChange={(value) => update("repoStatus", value)} required />
              <TextField label="Yard Name" value={form.yardName} onChange={(value) => update("yardName", value)} required />
              <TextField label="Yard Contact" value={form.yardContact} onChange={(value) => update("yardContact", value)} />
              <TextField label="Reserve Price" value={form.reservePrice} onChange={(value) => update("reservePrice", value.replace(/\D/g, ""))} type="tel" />
              <TextField label="Auction Date" value={form.auctionDate} onChange={(value) => update("auctionDate", value)} type="date" />
            </>
          )}
        </section>
      ) : null}

      {step === 6 ? (
        <section className="space-y-4">
          <h1 className="text-xl font-semibold text-slate-900">Step 6: Optional Vehicle Details</h1>
          {showTrailerFieldsInStep6 ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Trailer specs are required for this asset configuration.
            </div>
          ) : null}
          {showTrailerFieldsInStep6 ? (
            <details className="rounded-xl border border-slate-200 bg-white p-4" open>
              <summary className="cursor-pointer text-sm font-semibold text-slate-800">Trailer Specifications</summary>
              <div className="mt-4 space-y-3">
                <SelectField label="Trailer Type" value={form.trailerType} options={trailerTypeOptions} onChange={(value) => update("trailerType", value)} required />
                <TextField label="Trailer Length" value={form.trailerLength} onChange={(value) => update("trailerLength", value)} required placeholder="e.g. 32 ft" />
                <TextField label="Number of Axles" value={form.numberOfAxles} onChange={(value) => update("numberOfAxles", value.replace(/\D/g, ""))} type="tel" required />
                <TextField label="Body Dimensions" value={form.bodyDimensions} onChange={(value) => update("bodyDimensions", value)} required placeholder="e.g. 32x8x8 ft" />
                <SelectField
                  label="Suspension Type"
                  value={form.suspensionType}
                  options={trailerSuspensionOptions}
                  onChange={(value) => update("suspensionType", value)}
                  required={form.assetConfiguration === "Prime Mover + Trailer"}
                />
                <SelectField
                  label="ABS"
                  value={form.abs}
                  options={["YES", "NO", "UNKNOWN"]}
                  onChange={(value) => update("abs", value)}
                  required={form.assetConfiguration === "Prime Mover + Trailer"}
                />
                <TextField label="Trailer Number" value={form.trailerNumber} onChange={(value) => update("trailerNumber", value)} placeholder="Optional" />
                <TextField label="Trailer Manufacturer" value={form.trailerManufacturer} onChange={(value) => update("trailerManufacturer", value)} placeholder="Optional" />
                <TextField
                  label="Trailer Manufacturing Month-Year"
                  value={form.trailerManufacturingMonthYear}
                  onChange={(value) => update("trailerManufacturingMonthYear", value)}
                  placeholder="e.g. 03/2021"
                />
              </div>
            </details>
          ) : null}
          <details className="rounded-xl border border-slate-200 bg-white p-4" open>
            <summary className="cursor-pointer text-sm font-semibold text-slate-800">Vehicle, Tyre &amp; Roadworthiness</summary>
            <div className="mt-4 space-y-3">
              {!requiresTrailerFields ? (
                <>
                  <TextField label="Number of Axles" value={form.numberOfAxles} onChange={(value) => update("numberOfAxles", value.replace(/\D/g, ""))} type="tel" />
                  <TextField label="Body Dimensions" value={form.bodyDimensions} onChange={(value) => update("bodyDimensions", value)} />
                  {!shouldHideTrailerFieldsInStep6 ? (
                    <TextField label="Suspension Type" value={form.suspensionType} onChange={(value) => update("suspensionType", value)} placeholder="Leaf / Balloon by axle" />
                  ) : null}
                </>
              ) : null}
              <SelectField label="Tyre Inspection Report" value={form.tyreInspectionReport} options={["AVAILABLE", "NOT_AVAILABLE"]} onChange={(value) => update("tyreInspectionReport", value)} />
              <TextField label="Tyre Count" value={form.tyreCount} onChange={(value) => update("tyreCount", value.replace(/\D/g, ""))} type="tel" />
              <TextField label="Current Tyre Count" value={form.currentTyreCount} onChange={(value) => update("currentTyreCount", value.replace(/\D/g, ""))} type="tel" />
              <SelectField label="Tyre Condition" value={form.tyreCondition} options={["NEW", "GOOD", "FAIR", "AROUND_50", "POOR", "MIXED", "UNKNOWN"]} onChange={(value) => update("tyreCondition", value)} />
            </div>
          </details>
          <details className="rounded-xl border border-slate-200 bg-white p-4">
            <summary className="cursor-pointer text-sm font-semibold text-slate-800">Compliance &amp; Technical</summary>
            <div className="mt-4 space-y-3">
              <TextField label="Tax Due" value={form.taxDue} onChange={(value) => update("taxDue", value)} />
              <TextField label="Challans" value={form.challans} onChange={(value) => update("challans", value)} />
              <TextField label="Insurance Expiry" value={form.insuranceExpiry} onChange={(value) => update("insuranceExpiry", value)} type="date" />
              <TextField label="Fitness Expiry" value={form.fitnessExpiry} onChange={(value) => update("fitnessExpiry", value)} type="date" />
              <TextField label="Permit Expiry" value={form.permitExpiry} onChange={(value) => update("permitExpiry", value)} type="date" />
              <SelectField label="NOC Status" value={form.nocStatus} options={["AVAILABLE", "NOT_AVAILABLE", "UNKNOWN"]} onChange={(value) => update("nocStatus", value)} />
              <TextField label="Engine Number" value={form.engineNumber} onChange={(value) => update("engineNumber", value)} />
              <TextField label="Chassis Number" value={form.chassisNumber} onChange={(value) => update("chassisNumber", value)} />
              {!requiresTrailerFields && !shouldHideTrailerFieldsInStep6 ? (
                <TextField label="Trailer Number" value={form.trailerNumber} onChange={(value) => update("trailerNumber", value)} />
              ) : null}
              <TextField label="GVW (Tonnes)" value={form.gvwTonnes} onChange={(value) => update("gvwTonnes", value)} />
              <SelectField label="GPS Installed" value={form.gpsInstalled} options={["YES", "NO", "UNKNOWN"]} onChange={(value) => update("gpsInstalled", value)} />
              {!requiresTrailerFields && !shouldHideTrailerFieldsInStep6 ? (
                <SelectField label="ABS" value={form.abs} options={["YES", "NO", "UNKNOWN"]} onChange={(value) => update("abs", value)} />
              ) : null}
              {!shouldHideTrailerFieldsInStep6 ? (
                <SelectField label="Fleet Management Software" value={form.fleetManagementSoftwareAvailable} options={["AVAILABLE", "NOT_AVAILABLE", "UNKNOWN"]} onChange={(value) => update("fleetManagementSoftwareAvailable", value)} />
              ) : null}
            </div>
          </details>
        </section>
      ) : null}

      {step === 7 ? (
        <section className="space-y-4">
          <h1 className="text-xl font-semibold text-slate-900">Step 7: Photos &amp; Documents</h1>
          <p className="text-sm text-slate-500">
            {requiresInteriorPhoto
              ? "Front, back, side, and interior photos are required."
              : "Front, back, and side photos are required. Interior photo is optional for Trailer Only."}
          </p>

          {(
            [
              { key: "frontPhoto", label: "Front Photo", required: true },
              { key: "backPhoto", label: "Back Photo", required: true },
              { key: "sidePhoto", label: "Side Photo", required: true },
              { key: "interiorPhoto", label: "Interior Photo", required: requiresInteriorPhoto },
            ] as { key: UploadCategory; label: string; required: boolean }[]
          ).map((item) => (
            <div key={item.key} className="space-y-2 rounded-xl border border-slate-200 bg-white p-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-slate-700">
                  {item.label} {item.required ? <span className="text-rose-500">*</span> : <span className="text-slate-400">(Optional)</span>}
                </p>
                <button
                  type="button"
                  onClick={() => fileRefs[item.key].current?.click()}
                  disabled={uploadingField === item.key}
                  className="inline-flex min-h-9 items-center rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-700"
                >
                  {uploadingField === item.key ? "Uploading..." : form[item.key] ? "Replace" : "Upload"}
                </button>
              </div>
              <input
                ref={fileRefs[item.key]}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => uploadSinglePhoto(item.key, event.target.files?.[0] ?? null)}
              />
              {form[item.key] ? (
                <Image src={form[item.key]} alt={item.label} width={600} height={360} className="h-32 w-full rounded-lg object-cover" />
              ) : (
                <div className="flex h-32 items-center justify-center rounded-lg border border-dashed border-slate-200 text-xs text-slate-400">
                  No image uploaded
                </div>
              )}
            </div>
          ))}

          <TextField label="Walkaround Video URL" value={form.walkaroundVideo} onChange={(value) => update("walkaroundVideo", value)} placeholder="Optional" />
          <TextField label="Engine Start-up Video URL" value={form.engineStartUpVideo} onChange={(value) => update("engineStartUpVideo", value)} placeholder="Optional" />

          <details className="rounded-xl border border-slate-200 bg-white p-4">
            <summary className="cursor-pointer text-sm font-semibold text-slate-800">Documents (optional URLs)</summary>
            <div className="mt-4 space-y-3">
              <TextField label="Inspection Report" value={form.inspectionReport} onChange={(value) => update("inspectionReport", value)} />
              <TextField label="RC" value={form.rcDocument} onChange={(value) => update("rcDocument", value)} />
              <TextField label="Insurance" value={form.insuranceDocument} onChange={(value) => update("insuranceDocument", value)} />
              <TextField label="Fitness" value={form.fitnessDocument} onChange={(value) => update("fitnessDocument", value)} />
              <TextField label="Permit" value={form.permitDocument} onChange={(value) => update("permitDocument", value)} />
            </div>
          </details>
        </section>
      ) : null}

      {step === 8 ? (
        <section className="space-y-4">
          <h1 className="text-xl font-semibold text-slate-900">Step 8: Seller Info &amp; Review</h1>
          <p className="text-sm text-slate-500">Profile data is auto-filled and read-only. Review before submitting.</p>
          <TextField label="Seller Name" value={user?.fullName ?? ""} onChange={() => {}} required readOnly />
          <TextField label="Seller Phone" value={user?.phone ?? ""} onChange={() => {}} required readOnly />
          <TextField label="Seller Role" value={user?.sellerRole ?? user?.bankRole ?? ""} onChange={() => {}} required readOnly />
          <TextField label="City" value={user?.city ?? ""} onChange={() => {}} readOnly />
          <TextField label="State" value={user?.state ?? ""} onChange={() => {}} readOnly />
          <TextField label="Business Name" value={user?.businessName ?? ""} onChange={() => {}} readOnly />
          <TextField label="Alternate Contact Number" value={form.alternateContactNumber} onChange={(value) => update("alternateContactNumber", value)} />
          <TextField label="GSTIN" value={form.gstin} onChange={(value) => update("gstin", value)} />
        </section>
      ) : null}

      {error ? <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}

      <div className="flex gap-3">
        {step > 1 ? (
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
          disabled={submitting || uploadingField !== ""}
          className="inline-flex min-h-12 flex-1 items-center justify-center rounded-xl bg-slate-900 text-sm font-semibold text-white disabled:opacity-50"
        >
          {step === TOTAL_STEPS ? (submitting ? "Submitting..." : "Submit Listing") : "Next"}
        </button>
      </div>
    </main>
  );
}
