export function LoadingSkeleton() {
  return (
    <div className="space-y-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
      <div className="h-44 animate-pulse rounded-xl bg-slate-100" />
      <div className="h-4 w-2/3 animate-pulse rounded bg-slate-100" />
      <div className="h-3 w-1/2 animate-pulse rounded bg-slate-100" />
      <div className="h-10 animate-pulse rounded-xl bg-slate-100" />
    </div>
  );
}
