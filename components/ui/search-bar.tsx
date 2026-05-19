import { Search } from "lucide-react";

type Props = {
  placeholder?: string;
  compact?: boolean;
};

export function SearchBar({
  placeholder = "Search by vehicle type, city or brand",
  compact = false,
}: Props) {
  return (
    <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
      <Search className="h-4 w-4 text-slate-400" />
      <input
        className={`w-full bg-transparent text-slate-800 outline-none placeholder:text-slate-400 ${compact ? "text-sm" : "text-base"}`}
        placeholder={placeholder}
      />
      <button className="min-h-10 rounded-xl bg-slate-900 px-4 text-xs font-semibold text-white">
        Search
      </button>
    </div>
  );
}
