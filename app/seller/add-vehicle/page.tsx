"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Camera, CheckCircle2, ImagePlus } from "lucide-react";

// ─── Constants ───────────────────────────────────────────────────────────────

const vehicleTypes = ["Truck", "Tipper", "Pickup", "Bus", "Trailer", "Tractor"];
const brands = ["Tata", "Ashok Leyland", "Mahindra", "Eicher", "BharatBenz", "Other"];
const years = Array.from({ length: 10 }, (_, i) => String(2025 - i));
const indiaStates = [
  "Maharashtra", "Gujarat", "Rajasthan", "Uttar Pradesh", "Punjab",
  "Haryana", "Karnataka", "Tamil Nadu", "Andhra Pradesh", "Telangana",
  "Madhya Pradesh", "Bihar", "West Bengal", "Delhi", "Other",
];
const financeCompanies = ["SBI", "HDFC", "ICICI", "Axis", "Other"];

const TOTAL_STEPS = 5;

// ─── Shared sub-components ───────────────────────────────────────────────────

function ChipSelect({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt === value ? "" : opt)}
          className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
            value === opt
              ? "border-slate-900 bg-slate-900 text-white"
              : "border-slate-200 bg-white text-slate-700"
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

function ToggleSelect({
  options,
  value,
  onChange,
  gridClass = "grid-cols-2",
}: {
  options: string[];
  value: string;
  onChange: (v: string) => void;
  gridClass?: string;
}) {
  return (
    <div className={`grid gap-2 ${gridClass}`}>
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          className={`min-h-12 rounded-xl border text-sm font-medium transition-colors ${
            value === opt
              ? "border-slate-900 bg-slate-900 text-white"
              : "border-slate-200 bg-white text-slate-700"
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

// ─── Form data type ───────────────────────────────────────────────────────────

type FormData = {
  vehicleType: string;
  brand: string;
  model: string;
  year: string;
  state: string;
  city: string;
  yardLocation: string;
  price: string;
  financeCompany: string;
  running: string;
  condition: string;
  conditionNotes: string;
  hasAccident: string;
};

const emptyForm: FormData = {
  vehicleType: "",
  brand: "",
  model: "",
  year: "",
  state: "",
  city: "",
  yardLocation: "",
  price: "",
  financeCompany: "",
  running: "",
  condition: "",
  conditionNotes: "",
  hasAccident: "",
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AddVehiclePage() {
  const router = useRouter();
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [photoError, setPhotoError] = useState("");
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [form, setForm] = useState<FormData>(emptyForm);

  const set = (key: keyof FormData) => (val: string) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  const next = () => setStep((s) => Math.min(s + 1, TOTAL_STEPS));
  const back = () => {
    if (step === 1) router.back();
    else setStep((s) => s - 1);
  };

  const uploadFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setPhotoError("");
    setUploading(true);
    try {
      const payload = new FormData();
      Array.from(files).forEach((file) => payload.append("files", file));

      const response = await fetch("/api/uploads", {
        method: "POST",
        body: payload,
      });

      const data = (await response.json()) as { message?: string; urls?: string[] };
      if (!response.ok) {
        setPhotoError(data.message ?? "Failed to upload photo(s).");
        return;
      }

      setPhotoUrls((prev) => [...prev, ...(data.urls ?? [])].slice(0, 12));
    } catch {
      setPhotoError("Unable to upload right now. Please try again.");
    } finally {
      setUploading(false);
      if (cameraInputRef.current) cameraInputRef.current.value = "";
      if (uploadInputRef.current) uploadInputRef.current.value = "";
    }
  };

  const removePhoto = (url: string) => {
    setPhotoUrls((prev) => prev.filter((item) => item !== url));
  };

  const handleSubmit = async () => {
    if (photoUrls.length < 3) {
      setStep(4);
      setSubmitError("Please add at least 3 photos before submitting.");
      return;
    }

    setSubmitting(true);
    setSubmitError("");
    try {
      const body = {
        title: [form.vehicleType, form.brand, form.model, form.year].filter(Boolean).join(" "),
        type: form.vehicleType,
        brand: form.brand,
        model: form.model,
        year: Number(form.year),
        city: form.city,
        state: form.state,
        yardLocation: form.yardLocation,
        price: form.price,
        financeCompany: form.financeCompany,
        repoStatus: "Ready For Sale",
        sellerType: "Bank Agent",
        condition: (form.running as "Running" | "Non-running") || "Running",
        conditionNotes: form.conditionNotes,
        accidentNotes: form.hasAccident === "Yes" ? "Accident history reported." : "No accident history reported.",
        image: photoUrls[0],
        gallery: photoUrls,
      };
      const response = await fetch("/api/vehicles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        const data = (await response.json()) as { message?: string };
        setSubmitError(data.message ?? "Failed to submit vehicle.");
        return;
      }
      setSubmitted(true);
    } catch {
      setSubmitError("Unable to submit right now. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Success screen ─────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <main className="flex min-h-[calc(100dvh-80px)] flex-col items-center justify-center px-4 py-10 text-center">
        <CheckCircle2 className="h-16 w-16 text-emerald-500" />
        <h1 className="mt-4 text-2xl font-semibold text-slate-900">Vehicle Submitted!</h1>
        <p className="mt-2 text-sm text-slate-500">
          Our team will verify your listing shortly.
        </p>
        <span className="mt-4 inline-flex items-center rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
          Status: Pending Verification
        </span>
        <div className="mt-8 w-full space-y-3">
          <Link
            href="/seller/dashboard"
            className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-slate-900 text-sm font-semibold text-white"
          >
            View My Listings
          </Link>
          <button
            onClick={() => {
              setSubmitted(false);
              setStep(1);
              setForm(emptyForm);
              setPhotoUrls([]);
              setPhotoError("");
              setSubmitError("");
            }}
            className="inline-flex min-h-12 w-full items-center justify-center rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700"
          >
            Add Another Vehicle
          </button>
        </div>
      </main>
    );
  }

  // ── Step form ──────────────────────────────────────────────────────────────
  return (
    <main className="space-y-6 px-4 pb-8 pt-4">
      {/* Progress header */}
      <div className="flex items-center gap-3">
        <button
          onClick={back}
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200"
        >
          <ArrowLeft className="h-4 w-4 text-slate-700" />
        </button>
        <div className="flex-1">
          <p className="text-xs font-medium text-slate-500">
            Step {step} of {TOTAL_STEPS}
          </p>
          <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-slate-900 transition-all duration-300"
              style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* ── Step 1: Vehicle Details ── */}
      {step === 1 && (
        <section className="space-y-5">
          <h1 className="text-2xl font-semibold text-slate-900">Vehicle Details</h1>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Vehicle Type</label>
            <ChipSelect options={vehicleTypes} value={form.vehicleType} onChange={set("vehicleType")} />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Brand</label>
            <ChipSelect options={brands} value={form.brand} onChange={set("brand")} />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Model</label>
            <input
              type="text"
              placeholder="e.g. 407, 1109, 3516"
              value={form.model}
              onChange={(e) => set("model")(e.target.value)}
              className="min-h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-800 outline-none placeholder:text-slate-400"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Year</label>
            <ChipSelect options={years} value={form.year} onChange={set("year")} />
          </div>
        </section>
      )}

      {/* ── Step 2: Location & Pricing ── */}
      {step === 2 && (
        <section className="space-y-5">
          <h1 className="text-2xl font-semibold text-slate-900">Location &amp; Pricing</h1>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">State</label>
            <select
              value={form.state}
              onChange={(e) => set("state")(e.target.value)}
              className="min-h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-800 outline-none"
            >
              <option value="">Select state</option>
              {indiaStates.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">City</label>
            <input
              type="text"
              placeholder="e.g. Mumbai"
              value={form.city}
              onChange={(e) => set("city")(e.target.value)}
              className="min-h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-800 outline-none placeholder:text-slate-400"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Yard Location</label>
            <input
              type="text"
              placeholder="e.g. Bhiwandi Yard, NH48"
              value={form.yardLocation}
              onChange={(e) => set("yardLocation")(e.target.value)}
              className="min-h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-800 outline-none placeholder:text-slate-400"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Expected Price</label>
            <div className="flex">
              <span className="inline-flex min-h-12 items-center rounded-l-xl border border-r-0 border-slate-200 bg-slate-50 px-3 text-sm text-slate-600">
                ₹
              </span>
              <input
                type="tel"
                inputMode="numeric"
                placeholder="5,00,000"
                value={form.price}
                onChange={(e) => set("price")(e.target.value.replace(/\D/g, ""))}
                className="min-h-12 w-full rounded-r-xl border border-slate-200 bg-white px-4 text-sm text-slate-800 outline-none placeholder:text-slate-400"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Finance Company</label>
            <ChipSelect options={financeCompanies} value={form.financeCompany} onChange={set("financeCompany")} />
          </div>
        </section>
      )}

      {/* ── Step 3: Condition ── */}
      {step === 3 && (
        <section className="space-y-5">
          <h1 className="text-2xl font-semibold text-slate-900">Vehicle Condition</h1>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Running Status</label>
            <ToggleSelect
              options={["Running", "Non-running"]}
              value={form.running}
              onChange={set("running")}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Overall Condition</label>
            <ToggleSelect
              options={["Good", "Fair", "Poor"]}
              value={form.condition}
              onChange={set("condition")}
              gridClass="grid-cols-3"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Condition Notes</label>
            <textarea
              placeholder="Any visible damages, missing parts…"
              value={form.conditionNotes}
              onChange={(e) => set("conditionNotes")(e.target.value)}
              rows={3}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none placeholder:text-slate-400"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Accident History</label>
            <ToggleSelect
              options={["No", "Yes"]}
              value={form.hasAccident}
              onChange={set("hasAccident")}
            />
          </div>
        </section>
      )}

      {/* ── Step 4: Photos ── */}
      {step === 4 && (
        <section className="space-y-5">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold text-slate-900">Add Photos</h1>
            <p className="text-sm text-slate-500">Good photos get 3× more inquiries.</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              disabled={uploading}
              className="flex min-h-28 flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-200 bg-white text-slate-500 disabled:opacity-50"
            >
              <Camera className="h-6 w-6" />
              <span className="text-xs font-medium">{uploading ? "Uploading…" : "Take Photo"}</span>
            </button>
            <button
              type="button"
              onClick={() => uploadInputRef.current?.click()}
              disabled={uploading}
              className="flex min-h-28 flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-200 bg-white text-slate-500 disabled:opacity-50"
            >
              <ImagePlus className="h-6 w-6" />
              <span className="text-xs font-medium">{uploading ? "Uploading…" : "Upload Photo"}</span>
            </button>
          </div>

          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => uploadFiles(e.target.files)}
          />
          <input
            ref={uploadInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => uploadFiles(e.target.files)}
          />

          {photoUrls.length > 0 ? (
            <div className="grid grid-cols-3 gap-2">
              {photoUrls.map((url, index) => (
                <div key={url} className="relative overflow-hidden rounded-xl border border-slate-200">
                  <Image
                    src={url}
                    alt={`Vehicle photo ${index + 1}`}
                    width={300}
                    height={200}
                    className="h-24 w-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removePhoto(url)}
                    className="absolute right-1 top-1 rounded bg-black/65 px-1.5 py-0.5 text-[10px] font-medium text-white"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          ) : null}

          <p className="text-xs text-slate-500">{photoUrls.length} photo(s) added</p>
          {photoError ? <p className="text-sm text-red-600">{photoError}</p> : null}
          <p className="text-xs text-slate-400">
            Add at least 3 photos — front, rear, and interior views.
          </p>
        </section>
      )}

      {/* ── Step 5: Review & Submit ── */}
      {step === 5 && (
        <section className="space-y-5">
          <h1 className="text-2xl font-semibold text-slate-900">Review &amp; Submit</h1>

          <div className="space-y-2">
            {(
              [
                {
                  label: "Vehicle",
                  value: [form.vehicleType, form.brand, form.model, form.year]
                    .filter(Boolean)
                    .join(" "),
                },
                { label: "Location", value: [form.city, form.state].filter(Boolean).join(", ") },
                { label: "Yard", value: form.yardLocation },
                {
                  label: "Price",
                  value: form.price
                    ? `₹${Number(form.price).toLocaleString("en-IN")}`
                    : "",
                },
                { label: "Finance Co.", value: form.financeCompany },
                { label: "Running", value: form.running },
                { label: "Condition", value: form.condition },
                { label: "Photos", value: photoUrls.length ? `${photoUrls.length} uploaded` : "" },
              ] as { label: string; value: string }[]
            )
              .filter(({ value }) => value)
              .map(({ label, value }) => (
                <div
                  key={label}
                  className="flex items-center justify-between rounded-xl border border-slate-100 bg-white px-4 py-3"
                >
                  <span className="text-xs text-slate-500">{label}</span>
                  <span className="text-sm font-medium text-slate-800">{value}</span>
                </div>
              ))}
          </div>

          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-xs text-slate-500">
            By submitting, your vehicle listing will be reviewed by our team within 24 hours.
          </div>
        </section>
      )}

      {/* Navigation */}
      <div className="flex gap-3">
        {step > 1 && (
          <button
            onClick={back}
            className="inline-flex min-h-12 flex-1 items-center justify-center rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700"
          >
            Back
          </button>
        )}
        <button
          onClick={step === TOTAL_STEPS ? handleSubmit : next}
          disabled={submitting}
          className="inline-flex min-h-12 flex-1 items-center justify-center rounded-xl bg-slate-900 text-sm font-semibold text-white disabled:opacity-50"
        >
          {step === TOTAL_STEPS ? (submitting ? "Submitting…" : "Submit Listing") : "Next"}
        </button>
      </div>

      {submitError ? (
        <p className="text-center text-sm text-red-600">{submitError}</p>
      ) : null}
    </main>
  );
}
