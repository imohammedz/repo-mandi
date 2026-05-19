import { CallButton } from "@/components/ui/call-button";
import { WhatsAppButton } from "@/components/ui/whatsapp-button";

type Props = {
  name: string;
  role: string;
  phone: string;
};

export function SellerCard({ name, role, phone }: Props) {
  return (
    <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-900">Seller Contact</h3>
      <p className="mt-2 text-base font-semibold text-slate-800">{name}</p>
      <p className="text-sm text-slate-500">{role}</p>
      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
        <CallButton phone={phone} text="Call Seller" className="w-full" />
        <WhatsAppButton phone={phone} text="WhatsApp" className="w-full" />
        <button className="min-h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm">
          Request Details
        </button>
      </div>
    </section>
  );
}
