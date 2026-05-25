import { SavedListingsPanel } from "@/components/ui/saved-listings-panel";

export default function SavedPage() {
  return (
    <main className="px-4 pb-8 pt-4">
      <h1 className="mb-4 text-2xl font-semibold text-slate-900">Saved Vehicles</h1>
      <SavedListingsPanel />
    </main>
  );
}
