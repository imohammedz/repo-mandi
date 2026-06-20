import { SavedListingsPanel } from "@/components/ui/saved-listings-panel";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function SavedPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) redirect("/auth/login");

  return (
    <main className="px-4 pb-8 pt-4">
      <h1 className="mb-4 text-2xl font-semibold text-slate-900">Saved Vehicles</h1>
      <SavedListingsPanel />
    </main>
  );
}
