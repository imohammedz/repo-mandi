"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type AccountType = "BUYER" | "SELLER" | "BANK_PARTNER";

const sellerRoles = [
  { value: "BROKER", label: "Broker" },
  { value: "DEALER", label: "Dealer" },
  { value: "YARD_OWNER", label: "Yard Owner" },
  { value: "RECOVERY_AGENT", label: "Recovery Agent" },
  { value: "TRUCK_OWNER", label: "Truck Owner" },
  { value: "FLEET_OWNER", label: "Fleet Owner" },
];

const bankRoles = [
  { value: "BANK_MANAGER", label: "Bank Manager" },
  { value: "COLLECTION_AGENT", label: "Collection Agent" },
  { value: "RECOVERY_OFFICER", label: "Recovery Officer" },
  { value: "BRANCH_ADMIN", label: "Branch Admin" },
  { value: "NBFC_PARTNER", label: "NBFC Partner" },
];

type Props = {
  currentUser: {
    accountType: "BUYER" | "SELLER" | "BANK_PARTNER" | "ADMIN";
    fullName: string;
    email: string | null;
    sellerRole: string | null;
    bankRole: string | null;
    city: string;
    state: string;
    businessName: string;
    institutionName: string;
    branchName: string;
    employeeId: string | null;
  };
};

export default function OnboardingClient({ currentUser }: Props) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [accountType, setAccountType] = useState<AccountType>(
    currentUser.accountType === "BANK_PARTNER" ? "BANK_PARTNER" : currentUser.accountType === "SELLER" ? "SELLER" : "BUYER"
  );
  const [fullName, setFullName] = useState(currentUser.fullName);
  const [email, setEmail] = useState(currentUser.email ?? "");
  const [sellerRole, setSellerRole] = useState(currentUser.sellerRole ?? "");
  const [bankRole, setBankRole] = useState(currentUser.bankRole ?? "");
  const [businessName, setBusinessName] = useState(currentUser.businessName);
  const [institutionName, setInstitutionName] = useState(currentUser.institutionName);
  const [branchName, setBranchName] = useState(currentUser.branchName);
  const [employeeId, setEmployeeId] = useState(currentUser.employeeId ?? "");
  const [city, setCity] = useState(currentUser.city);
  const [state, setState] = useState(currentUser.state);

  const canChooseBank = currentUser.accountType === "BANK_PARTNER";

  const submitDisabled = useMemo(() => {
    if (!fullName.trim()) return true;
    if (accountType === "SELLER") {
      return !sellerRole || !city.trim() || !state.trim();
    }
    if (accountType === "BANK_PARTNER") {
      return !email.trim() || !bankRole || !institutionName.trim() || !branchName.trim() || !city.trim() || !state.trim();
    }
    return false;
  }, [accountType, bankRole, branchName, city, email, fullName, institutionName, sellerRole, state]);

  const onSubmit = async () => {
    if (submitDisabled || submitting) return;
    setSubmitting(true);
    setError("");
    try {
      const response = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountType,
          fullName,
          email,
          sellerRole: accountType === "SELLER" ? sellerRole : undefined,
          bankRole: accountType === "BANK_PARTNER" ? bankRole : undefined,
          businessName,
          institutionName,
          branchName,
          employeeId,
          city,
          state,
        }),
      });
      const data = (await response.json()) as { message?: string; accountType?: string };
      if (!response.ok) {
        setError(data.message ?? "Failed to complete onboarding.");
        return;
      }
      if (data.accountType === "SELLER") {
        router.replace("/seller/dashboard");
      } else if (data.accountType === "BANK_PARTNER") {
        router.replace("/bank/dashboard");
      } else {
        router.replace("/vehicles");
      }
    } catch {
      setError("Unable to save profile right now.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="space-y-5 px-4 pb-8 pt-10">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Complete your profile</h1>
        <p className="text-sm text-slate-500">Set account type and basic details to continue.</p>
      </div>

      <section className="space-y-3">
        <p className="text-sm font-medium text-slate-700">Join as</p>
        <div className="grid grid-cols-1 gap-2">
          {[
            { id: "BUYER", label: "Buyer" },
            { id: "SELLER", label: "Seller" },
            { id: "BANK_PARTNER", label: "Bank / Finance Partner" },
          ].map((item) => {
            const disabled = item.id === "BANK_PARTNER" && !canChooseBank;
            return (
              <button
                key={item.id}
                type="button"
                disabled={disabled}
                onClick={() => setAccountType(item.id as AccountType)}
                className={`min-h-12 rounded-xl border px-4 text-left text-sm ${
                  accountType === item.id ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-700"
                } disabled:cursor-not-allowed disabled:opacity-50`}
              >
                {item.label}
                {disabled ? <span className="ml-2 text-xs">Admin controlled</span> : null}
              </button>
            );
          })}
        </div>
      </section>

      <section className="space-y-2">
        <label className="text-sm font-medium text-slate-700">Full Name</label>
        <input value={fullName} onChange={(e) => setFullName(e.target.value)} className="min-h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm" />
      </section>

      {accountType === "SELLER" ? (
        <>
          <section className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Seller Role</label>
            <select value={sellerRole} onChange={(e) => setSellerRole(e.target.value)} className="min-h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm">
              <option value="">Select role</option>
              {sellerRoles.map((role) => (
                <option key={role.value} value={role.value}>{role.label}</option>
              ))}
            </select>
          </section>
          <section className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Business Name (optional)</label>
            <input value={businessName} onChange={(e) => setBusinessName(e.target.value)} className="min-h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm" />
          </section>
        </>
      ) : null}

      {accountType === "BANK_PARTNER" ? (
        <>
          <section className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Official Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="min-h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm" />
          </section>
          <section className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Role</label>
            <select value={bankRole} onChange={(e) => setBankRole(e.target.value)} className="min-h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm">
              <option value="">Select role</option>
              {bankRoles.map((role) => (
                <option key={role.value} value={role.value}>{role.label}</option>
              ))}
            </select>
          </section>
          <section className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Institution Name</label>
            <input value={institutionName} onChange={(e) => setInstitutionName(e.target.value)} className="min-h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm" />
          </section>
          <section className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Branch Name</label>
            <input value={branchName} onChange={(e) => setBranchName(e.target.value)} className="min-h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm" />
          </section>
          <section className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Employee ID (optional)</label>
            <input value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} className="min-h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm" />
          </section>
        </>
      ) : null}

      <section className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">City</label>
          <input value={city} onChange={(e) => setCity(e.target.value)} className="min-h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">State</label>
          <input value={state} onChange={(e) => setState(e.target.value)} className="min-h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm" />
        </div>
      </section>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <button
        type="button"
        onClick={onSubmit}
        disabled={submitDisabled || submitting}
        className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-slate-900 text-sm font-semibold text-white disabled:opacity-50"
      >
        {submitting ? "Saving..." : "Continue"}
      </button>
    </main>
  );
}

