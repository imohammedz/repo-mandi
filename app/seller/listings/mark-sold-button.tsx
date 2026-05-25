"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";

type SoldThroughPlatform = "YES" | "NO" | "NOT_SURE";
type BuyerContactMethod =
  | "PHONE_CALL"
  | "WHATSAPP"
  | "DIRECT_VISIT"
  | "EXISTING_CONTACT"
  | "REQUEST_DETAILS"
  | "OTHER";
type TimeToSell = "LESS_THAN_1_WEEK" | "ONE_TO_TWO_WEEKS" | "TWO_TO_FOUR_WEEKS" | "MORE_THAN_1_MONTH";

const soldThroughPlatformOptions: { value: SoldThroughPlatform; label: string }[] = [
  { value: "YES", label: "Yes" },
  { value: "NO", label: "No" },
  { value: "NOT_SURE", label: "Not Sure" },
];

const buyerContactMethodOptions: { value: BuyerContactMethod; label: string }[] = [
  { value: "PHONE_CALL", label: "Phone Call" },
  { value: "WHATSAPP", label: "WhatsApp" },
  { value: "DIRECT_VISIT", label: "Direct Visit" },
  { value: "EXISTING_CONTACT", label: "Existing Contact" },
  { value: "REQUEST_DETAILS", label: "RepoMandi Inquiry Form" },
  { value: "OTHER", label: "Other" },
];

const timeToSellOptions: { value: TimeToSell; label: string }[] = [
  { value: "LESS_THAN_1_WEEK", label: "Less than 1 week" },
  { value: "ONE_TO_TWO_WEEKS", label: "1–2 weeks" },
  { value: "TWO_TO_FOUR_WEEKS", label: "2–4 weeks" },
  { value: "MORE_THAN_1_MONTH", label: "More than 1 month" },
];

export function MarkSoldButton({ vehicleId }: { vehicleId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"idle" | "confirm" | "feedback">("idle");
  const [soldThroughPlatform, setSoldThroughPlatform] = useState<SoldThroughPlatform | "">("");
  const [buyerContactMethod, setBuyerContactMethod] = useState<BuyerContactMethod | "">("");
  const [timeToSell, setTimeToSell] = useState<TimeToSell | "">("");
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const closeSheet = () => {
    if (loading) return;
    setStep("idle");
    setError("");
  };

  const openConfirm = () => {
    if (loading) return;
    setSuccess("");
    setError("");
    setStep("confirm");
  };

  const submit = async () => {
    if (loading) return;
    if (!soldThroughPlatform) {
      setError("Please answer question 1 before submitting.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/vehicles/${vehicleId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "SOLD",
          saleFeedback: {
            soldThroughPlatform,
            buyerContactMethod: buyerContactMethod || undefined,
            timeToSell: timeToSell || undefined,
            feedback: feedback.trim() || undefined,
          },
        }),
      });
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { message?: string } | null;
        throw new Error(payload?.message || "Failed to mark as sold.");
      }
      setStep("idle");
      setSuccess("Vehicle marked as sold successfully.");
      router.refresh();
      setSoldThroughPlatform("");
      setBuyerContactMethod("");
      setTimeToSell("");
      setFeedback("");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Failed to mark as sold.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={openConfirm}
        disabled={loading}
        className="inline-flex min-h-10 items-center rounded-lg border border-slate-200 px-3 text-xs font-medium text-slate-700 disabled:opacity-50"
      >
        {loading ? "Updating..." : "Mark as Sold"}
      </button>

      {success ? <p className="w-full text-xs text-emerald-600">{success}</p> : null}

      {step !== "idle" ? (
        <div className="fixed inset-0 z-50">
          <button
            aria-label="Close mark as sold sheet"
            onClick={closeSheet}
            className="absolute inset-0 bg-slate-900/50"
          />
          <section className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-3xl bg-white p-4 shadow-2xl">
            <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-slate-200" />
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-900">
                {step === "confirm" ? "Mark Vehicle as Sold?" : "Sale Feedback"}
              </h3>
              <button
                onClick={closeSheet}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-600"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {step === "confirm" ? (
              <div className="space-y-4">
                <p className="text-sm text-slate-600">This listing will be removed from public marketplace results.</p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={closeSheet}
                    className="min-h-11 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => setStep("feedback")}
                    className="min-h-11 rounded-xl bg-slate-900 text-sm font-semibold text-white"
                  >
                    Continue
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    1. Was this vehicle sold through a lead from RepoMandi? <span className="text-rose-600">*</span>
                  </p>
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    {soldThroughPlatformOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setSoldThroughPlatform(option.value)}
                        className={`min-h-10 rounded-xl border px-2 text-xs font-medium ${
                          soldThroughPlatform === option.value
                            ? "border-slate-900 bg-slate-900 text-white"
                            : "border-slate-200 bg-white text-slate-700"
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-slate-900">2. How did the buyer contact you? (Optional)</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {buyerContactMethodOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() =>
                          setBuyerContactMethod((current) => (current === option.value ? "" : option.value))
                        }
                        className={`min-h-10 rounded-full border px-3 text-xs font-medium ${
                          buyerContactMethod === option.value
                            ? "border-slate-900 bg-slate-900 text-white"
                            : "border-slate-200 bg-white text-slate-700"
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-slate-900">3. Approximately how long did it take to sell? (Optional)</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {timeToSellOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setTimeToSell((current) => (current === option.value ? "" : option.value))}
                        className={`min-h-10 rounded-full border px-3 text-xs font-medium ${
                          timeToSell === option.value
                            ? "border-slate-900 bg-slate-900 text-white"
                            : "border-slate-200 bg-white text-slate-700"
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-slate-900">4. Optional feedback</p>
                  <textarea
                    value={feedback}
                    onChange={(event) => setFeedback(event.target.value)}
                    rows={3}
                    placeholder="Anything RepoMandi can improve?"
                    className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-900"
                  />
                </div>

                {error ? <p className="text-sm text-rose-600">{error}</p> : null}

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setStep("confirm")}
                    disabled={loading}
                    className="min-h-11 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-700 disabled:opacity-50"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={submit}
                    disabled={loading}
                    className="min-h-11 rounded-xl bg-slate-900 text-sm font-semibold text-white disabled:opacity-50"
                  >
                    {loading ? "Saving..." : "Submit & Mark Sold"}
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>
      ) : null}
    </>
  );
}
