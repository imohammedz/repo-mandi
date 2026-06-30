"use client";

import { FormEvent, useState } from "react";

type FormState = {
  bankName: string;
  branchName: string;
  branchLocation: string;
  contactPersonName: string;
  contactNumber: string;
  bankEmail: string;
  designation: string;
  message: string;
};

const initialFormState: FormState = {
  bankName: "",
  branchName: "",
  branchLocation: "",
  contactPersonName: "",
  contactNumber: "",
  bankEmail: "",
  designation: "",
  message: "",
};

const successText =
  "Thank you. Your inquiry has been submitted successfully.\nRepoMandi team will contact you soon from support@repomandi.com.";

const safetyNote =
  "RepoMandi never asks for sensitive banking credentials, OTPs, passwords, customer account details, or advance payments through this form.\nWe will only contact you through official RepoMandi communication channels.";

export default function BankInquiryPage() {
  const [form, setForm] = useState<FormState>(initialFormState);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setErrorMessage("");
    try {
      const response = await fetch("/api/bank-inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = (await response.json()) as { message?: string };
      if (!response.ok) {
        setErrorMessage(data.message ?? "Failed to submit inquiry.");
        return;
      }
      setSubmitted(true);
      setForm(initialFormState);
    } catch (error) {
      console.error("Failed to submit bank inquiry", error);
      setErrorMessage("Unable to submit inquiry right now. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="mx-auto w-full max-w-3xl space-y-6 px-4 pb-10 pt-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Bank Partner Inquiry</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Share your branch details and RepoMandi team will connect with you to discuss partnership opportunities.
        </p>
      </section>

      <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
        <p className="whitespace-pre-line text-sm leading-6 text-amber-900">{safetyNote}</p>
      </section>

      {submitted ? (
        <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="whitespace-pre-line text-sm font-medium leading-6 text-emerald-800">{successText}</p>
        </section>
      ) : null}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <form onSubmit={onSubmit} className="space-y-3">
          <input
            value={form.bankName}
            onChange={(event) => setForm((prev) => ({ ...prev, bankName: event.target.value }))}
            placeholder="Bank Name *"
            required
            className="min-h-12 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-slate-900"
          />
          <input
            value={form.branchName}
            onChange={(event) => setForm((prev) => ({ ...prev, branchName: event.target.value }))}
            placeholder="Branch Name *"
            required
            className="min-h-12 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-slate-900"
          />
          <input
            value={form.branchLocation}
            onChange={(event) => setForm((prev) => ({ ...prev, branchLocation: event.target.value }))}
            placeholder="Branch Location *"
            required
            className="min-h-12 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-slate-900"
          />
          <input
            value={form.contactPersonName}
            onChange={(event) => setForm((prev) => ({ ...prev, contactPersonName: event.target.value }))}
            placeholder="Contact Person Name *"
            required
            className="min-h-12 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-slate-900"
          />
          <input
            value={form.contactNumber}
            onChange={(event) => setForm((prev) => ({ ...prev, contactNumber: event.target.value }))}
            placeholder="Contact Number *"
            inputMode="tel"
            required
            className="min-h-12 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-slate-900"
          />
          <input
            value={form.bankEmail}
            onChange={(event) => setForm((prev) => ({ ...prev, bankEmail: event.target.value }))}
            placeholder="Bank Email *"
            type="email"
            required
            className="min-h-12 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-slate-900"
          />
          <input
            value={form.designation}
            onChange={(event) => setForm((prev) => ({ ...prev, designation: event.target.value }))}
            placeholder="Designation *"
            required
            className="min-h-12 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-slate-900"
          />
          <textarea
            value={form.message}
            onChange={(event) => setForm((prev) => ({ ...prev, message: event.target.value }))}
            placeholder="Message / Requirement (optional)"
            rows={4}
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-900"
          />
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-slate-900 text-sm font-semibold text-white disabled:opacity-60"
          >
            {submitting ? "Submitting..." : "Submit Inquiry"}
          </button>
        </form>
        {errorMessage ? <p className="mt-3 text-sm text-rose-600">{errorMessage}</p> : null}
      </section>
    </main>
  );
}
