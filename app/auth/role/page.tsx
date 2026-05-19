"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

const roles = [
  { id: "broker", label: "Broker", desc: "Connecting buyers and sellers" },
  { id: "dealer", label: "Dealer", desc: "Buying and selling vehicles" },
  { id: "truck_owner", label: "Truck Owner", desc: "Listing your own vehicles" },
  { id: "yard_owner", label: "Yard Owner", desc: "Managing a vehicle yard" },
  { id: "recovery_agent", label: "Recovery Agent", desc: "Repossessed vehicle listings" },
];

export default function RolePage() {
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(null);

  const handleContinue = () => {
    if (!selected) return;
    localStorage.setItem("rm_logged_in", "true");
    localStorage.setItem("rm_role", selected);
    router.push("/seller/add-vehicle");
  };

  return (
    <main className="space-y-5 px-4 pb-8 pt-10">
      <Link href="/auth/otp" className="inline-flex items-center gap-1 text-sm text-slate-500">
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>

      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-slate-900">Select Role</h1>
        <p className="text-sm text-slate-500">Choose how you&apos;ll be using RepoMandi.</p>
      </div>

      <div className="space-y-3">
        {roles.map((role) => (
          <button
            key={role.id}
            onClick={() => setSelected(role.id)}
            className={`min-h-14 w-full rounded-2xl border px-4 py-3 text-left transition-colors ${
              selected === role.id
                ? "border-slate-900 bg-slate-900 text-white"
                : "border-slate-200 bg-white text-slate-800"
            }`}
          >
            <p className="text-sm font-semibold">{role.label}</p>
            <p
              className={`mt-0.5 text-xs ${
                selected === role.id ? "text-slate-300" : "text-slate-500"
              }`}
            >
              {role.desc}
            </p>
          </button>
        ))}
      </div>

      <button
        onClick={handleContinue}
        disabled={!selected}
        className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-slate-900 text-sm font-semibold text-white disabled:opacity-50"
      >
        Continue
      </button>
    </main>
  );
}
