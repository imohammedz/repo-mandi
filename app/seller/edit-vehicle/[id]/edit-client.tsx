"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, FileImage, FileText, Trash2 } from "lucide-react";
import type { Vehicle } from "@/types/vehicle";
import { SafeImage } from "@/components/ui/safe-image";

type Props = {
  vehicle: Vehicle;
};

type DocumentCategory = "RC" | "INSURANCE" | "FITNESS" | "PERMIT" | "INSPECTION_REPORT" | "OTHER";
type UploadedDocument = {
  url: string;
  category: DocumentCategory;
  customName: string;
  mimeType: string;
  sizeBytes: number;
  originalFileName: string;
};

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

function documentGroupKey(item: Pick<UploadedDocument, "category" | "customName">) {
  if (item.category !== "OTHER") return item.category;
  return `OTHER:${item.customName.trim().toUpperCase() || "OTHER"}`;
}

export default function EditVehicleClient({ vehicle }: Props) {
  const router = useRouter();
  const [form, setForm] = useState({
    title: vehicle.title,
    price: String(vehicle.price),
    yardLocation: vehicle.yardLocation,
    description: vehicle.description ?? vehicle.conditionNotes,
    auctionDate: vehicle.auctionDate,
  });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [documents, setDocuments] = useState<UploadedDocument[]>([]);
  const [documentsLoading, setDocumentsLoading] = useState(true);
  const [uploadingDocuments, setUploadingDocuments] = useState(false);
  const [selectedDocumentCategory, setSelectedDocumentCategory] = useState<DocumentCategory>("RC");
  const [selectedOtherDocumentName, setSelectedOtherDocumentName] = useState("");
  const [saved, setSaved] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [error, setError] = useState("");
  const documentFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadDocuments = async () => {
      try {
        const response = await fetch(`/api/vehicles/${vehicle.id}`);
        if (!response.ok) return;
        const data = (await response.json()) as {
          media?: Array<{
            type: string;
            category: string;
            customName?: string | null;
            url: string;
            mimeType?: string;
            sizeBytes?: number | null;
            originalFileName?: string;
          }>;
        };
        const parsed = (data.media || [])
          .filter((item) => item.type === "DOCUMENT")
          .map((item) => ({
            url: item.url,
            category: (item.category || "OTHER") as DocumentCategory,
            customName: item.customName || "",
            mimeType: item.mimeType || "",
            sizeBytes: Number(item.sizeBytes || 0),
            originalFileName: item.originalFileName || "",
          }));
        setDocuments(parsed);
      } finally {
        setDocumentsLoading(false);
      }
    };
    void loadDocuments();
  }, [vehicle.id]);

  const selectedDocumentTemplate = {
    category: selectedDocumentCategory,
    customName: selectedDocumentCategory === "OTHER" ? selectedOtherDocumentName : "",
  };
  const selectedDocumentGroupCount = documents.filter(
    (doc) => documentGroupKey(doc) === documentGroupKey(selectedDocumentTemplate)
  ).length;

  const set = (key: keyof typeof form) => (val: string) =>
    setForm((prev) => ({ ...prev, [key]: val }));

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
      const groupCount = [...documents, ...results].filter(
        (doc) =>
          documentGroupKey(doc) ===
          documentGroupKey({ category: selectedDocumentCategory, customName })
      ).length;
      if (documents.length + results.length >= MAX_DOCUMENTS) {
        setError("Maximum 15 document files allowed per listing.");
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
          mimeType: uploaded.mimeType || file.type,
          sizeBytes: uploaded.sizeBytes || file.size,
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
    if (documentFileRef.current) documentFileRef.current.value = "";
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      const response = await fetch(`/api/seller/vehicles/${vehicle.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          expectedPrice: form.price,
          vehicleOrYardLocation: form.yardLocation,
          documents: documents.map((document) => ({
            url: document.url,
            category: document.category,
            customName: document.category === "OTHER" ? document.customName : null,
            mimeType: document.mimeType,
            sizeBytes: document.sizeBytes,
            originalFileName: document.originalFileName,
          })),
        }),
      });
      if (!response.ok) {
        const data = (await response.json()) as { message?: string };
        setError(data.message ?? "Failed to save changes.");
        return;
      }
      const data = (await response.json()) as { message?: string };
      setSuccessMessage(data.message ?? "Changes saved.");
      setSaved(true);
      setTimeout(() => {
        router.push("/seller/listings");
      }, 1200);
    } catch {
      setError("Unable to save right now. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (
      !window.confirm(
        "Are you sure you want to delete this listing? This action will remove it from public listings."
      )
    )
      return;
    setDeleting(true);
    setError("");
    try {
      const response = await fetch(`/api/seller/vehicles/${vehicle.id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const data = (await response.json()) as { message?: string };
        setError(data.message ?? "Failed to delete vehicle.");
        return;
      }
      router.push("/seller/listings");
    } catch {
      setError("Unable to delete right now. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  if (saved) {
    return (
      <main className="flex min-h-[calc(100dvh-80px)] flex-col items-center justify-center px-4 py-10 text-center">
        <CheckCircle2 className="h-16 w-16 text-emerald-500" />
        <h1 className="mt-4 text-xl font-semibold text-slate-900">Changes Saved!</h1>
        <p className="mt-2 text-sm text-slate-500">{successMessage || "Redirecting to your listings…"}</p>
      </main>
    );
  }

  return (
    <main className="space-y-6 px-4 pb-8 pt-4">
      <div className="flex items-center gap-3">
        <Link href="/seller/dashboard" className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200">
          <ArrowLeft className="h-4 w-4 text-slate-700" />
        </Link>
        <h1 className="text-xl font-semibold text-slate-900">Edit Listing</h1>
      </div>

      <p className="text-sm text-slate-500">{vehicle.id}</p>

      <div className="space-y-4">
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700">Title</label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => set("title")(e.target.value)}
            className="min-h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-800 outline-none"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700">Expected Price (₹)</label>
          <input
            type="tel"
            inputMode="numeric"
            value={form.price}
            onChange={(e) => set("price")(e.target.value.replace(/\D/g, ""))}
            className="min-h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-800 outline-none"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700">Yard Location</label>
          <input
            type="text"
            value={form.yardLocation}
            onChange={(e) => set("yardLocation")(e.target.value)}
            className="min-h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-800 outline-none"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700">Auction Date</label>
          <input
            type="date"
            value={form.auctionDate}
            onChange={(e) => set("auctionDate")(e.target.value)}
            className="min-h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-800 outline-none"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700">Description / Remarks</label>
          <textarea
            value={form.description}
            onChange={(e) => set("description")(e.target.value)}
            rows={3}
            placeholder="Add key condition, documents, or transfer notes."
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none"
          />
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
            <span className={`text-sm font-semibold ${documents.length >= MAX_DOCUMENTS ? "text-rose-600" : "text-slate-900"}`}>
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
              disabled={uploadingDocuments || documents.length >= MAX_DOCUMENTS || selectedDocumentGroupCount >= MAX_DOCUMENTS_PER_GROUP}
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 disabled:opacity-50"
            >
              {uploadingDocuments ? "Uploading…" : "Upload"}
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
          {documentsLoading ? <p className="text-xs text-slate-500">Loading existing documents…</p> : null}
          {documents.map((document, index) => (
            <div key={`${document.url}-${index}`} className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-3">
              {document.mimeType.startsWith("image/") ? (
                <SafeImage
                  src={document.url}
                  alt={document.originalFileName || "Document image"}
                  width={72}
                  height={72}
                  className="h-14 w-14 rounded-md object-cover"
                  logContext={{ component: "EditVehicleDocuments" }}
                />
              ) : (
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-slate-100 text-slate-600">
                  {document.mimeType === "application/pdf" ? <FileText className="h-5 w-5" /> : <FileImage className="h-5 w-5" />}
                </span>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-slate-700">
                  {document.category === "OTHER" ? `Other: ${document.customName || "Other"}` : DOCUMENT_CATEGORIES.find((item) => item.value === document.category)?.label || "Document"}
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
          {!documents.length && !documentsLoading ? (
            <p className="rounded-xl bg-slate-50 px-4 py-3 text-xs text-slate-500">No documents uploaded.</p>
          ) : null}
          {selectedDocumentGroupCount >= MAX_DOCUMENTS_PER_GROUP ? (
            <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-700">
              Maximum 4 files allowed for this document type.
            </p>
          ) : null}
          {documents.length >= MAX_DOCUMENTS ? (
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
            onChange={(event) => void uploadDocuments(Array.from(event.target.files || []))}
          />
        </section>
      </div>

      {error ? <p className="text-center text-sm text-red-600">{error}</p> : null}

      <div className="space-y-3">
        <button
          onClick={handleSave}
          disabled={saving || deleting || uploadingDocuments}
          className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-slate-900 text-sm font-semibold text-white disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save Changes"}
        </button>

        <button
          onClick={handleDelete}
          disabled={saving || deleting}
          className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 text-sm font-semibold text-rose-700 disabled:opacity-50"
        >
          <Trash2 className="h-4 w-4" />
          {deleting ? "Deleting…" : "Delete Listing"}
        </button>
      </div>
    </main>
  );
}
