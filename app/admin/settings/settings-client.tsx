"use client";

import { useState } from "react";

type OtpProvider = "MSG91_SMS" | "WHATSAPP";

type AdminSettingsClientProps = {
  autoApproveListings: boolean;
  otpProvider: OtpProvider;
};

const OTP_PROVIDER_OPTIONS: { value: OtpProvider; label: string; description: string }[] = [
  {
    value: "MSG91_SMS",
    label: "MSG91 SMS",
    description: "Use SMS OTP through MSG91. Requires DLT approval for production.",
  },
  {
    value: "WHATSAPP",
    label: "WhatsApp OTP",
    description: "Use WhatsApp template message OTP while SMS DLT is pending.",
  },
];

// These are checked at runtime on the server; we expose missing status via a
// dedicated endpoint rather than exposing secret values to the client.
const WHATSAPP_ENV_VARS = ["WHATSAPP_ACCESS_TOKEN", "WHATSAPP_PHONE_NUMBER_ID", "WHATSAPP_TEMPLATE_NAME"];

export default function AdminSettingsClient({
  autoApproveListings,
  otpProvider,
}: AdminSettingsClientProps) {
  const [autoApprove, setAutoApprove] = useState(autoApproveListings);
  const [selectedOtpProvider, setSelectedOtpProvider] = useState<OtpProvider>(otpProvider);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  // Warn the user when WhatsApp is selected but env vars are likely missing.
  // We detect this via a separate lightweight endpoint.
  const [whatsAppEnvMissing, setWhatsAppEnvMissing] = useState<string[]>([]);

  const checkWhatsAppEnv = async () => {
    try {
      const response = await fetch("/api/admin/settings/whatsapp-env-check");
      if (!response.ok) return;
      const data = (await response.json()) as { missing?: string[] };
      setWhatsAppEnvMissing(data.missing ?? []);
    } catch {
      // non-critical
    }
  };

  const handleOtpProviderChange = async (value: OtpProvider) => {
    setSelectedOtpProvider(value);
    if (value === "WHATSAPP") {
      await checkWhatsAppEnv();
    } else {
      setWhatsAppEnvMissing([]);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      const response = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          AUTO_APPROVE_LISTINGS: autoApprove,
          OTP_PROVIDER: selectedOtpProvider,
        }),
      });
      if (!response.ok) {
        const data = (await response.json()) as { message?: string };
        setError(data.message ?? "Failed to save settings.");
        return;
      }
      setSaved(true);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="space-y-6 px-4 pb-8 pt-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">Admin Settings</h1>
        <a
          href="/admin/dashboard"
          className="inline-flex min-h-10 items-center rounded-lg border border-slate-200 px-3 text-xs font-medium text-slate-700"
        >
          ← Dashboard
        </a>
      </div>

      {/* Auto-approve listings */}
      <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-slate-900">Auto-approve new listings</p>
            <p className="text-xs text-slate-500">
              When enabled, new vehicle listings will go live immediately without manual admin review.
            </p>
            <p className={`text-xs font-medium ${autoApprove ? "text-emerald-600" : "text-slate-400"}`}>
              {autoApprove ? "Auto approval ON" : "Auto approval OFF"}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setAutoApprove((prev) => !prev)}
            disabled={saving}
            aria-pressed={autoApprove}
            aria-label={`Auto-approve listings is currently ${autoApprove ? "on" : "off"}. Click to ${autoApprove ? "disable" : "enable"}.`}
            className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none disabled:opacity-50 ${
              autoApprove ? "bg-emerald-600" : "bg-slate-200"
            }`}
          >
            <span
              className={`inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ${
                autoApprove ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>
      </section>

      {/* OTP Delivery Provider */}
      <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
        <div className="space-y-3">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-slate-900">OTP Delivery Provider</p>
            <p className="text-xs text-slate-500">
              Choose how users receive OTP codes for login and phone verification.
            </p>
          </div>

          <div className="space-y-2 pt-1">
            {OTP_PROVIDER_OPTIONS.map((option) => (
              <label
                key={option.value}
                className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors ${
                  selectedOtpProvider === option.value
                    ? "border-slate-900 bg-slate-50"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <input
                  type="radio"
                  name="otp_provider"
                  value={option.value}
                  checked={selectedOtpProvider === option.value}
                  onChange={() => void handleOtpProviderChange(option.value)}
                  disabled={saving}
                  className="mt-0.5 h-4 w-4 accent-slate-900"
                />
                <div className="space-y-0.5">
                  <p className="text-sm font-medium text-slate-900">{option.label}</p>
                  <p className="text-xs text-slate-500">{option.description}</p>
                </div>
              </label>
            ))}
          </div>

          {selectedOtpProvider === "WHATSAPP" && whatsAppEnvMissing.length > 0 && (
            <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700" role="alert">
              ⚠ WhatsApp OTP is selected, but the following credentials are missing:{" "}
              <span className="font-medium">{whatsAppEnvMissing.join(", ")}</span>. OTP delivery
              will fail until these are configured.
            </p>
          )}

          {selectedOtpProvider === "WHATSAPP" && whatsAppEnvMissing.length === 0 && (
            <p className="mt-2 text-xs text-slate-400">
              Uses: {WHATSAPP_ENV_VARS.join(", ")} (server-side only, not exposed to client).
            </p>
          )}
        </div>
      </section>

      {/* Save button */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={saveSettings}
          disabled={saving}
          className="inline-flex min-h-10 items-center rounded-xl bg-slate-900 px-5 text-sm font-semibold text-white disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save Settings"}
        </button>

        {saved && (
          <p className="text-xs font-medium text-emerald-600" role="status" aria-live="polite">
            Settings saved successfully.
          </p>
        )}
        {error && (
          <p className="text-xs font-medium text-rose-600" role="alert" aria-live="assertive">
            {error}
          </p>
        )}
      </div>
    </main>
  );
}
