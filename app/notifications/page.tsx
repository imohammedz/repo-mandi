import { BellOff } from "lucide-react";

export default function NotificationsPage() {
  return (
    <main className="space-y-4 px-4 pb-8 pt-4">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Notifications</h1>
        <p className="mt-1 text-sm text-slate-500">
          Stay updated on your listings, inquiries, and account activity.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-100 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-50">
          <BellOff className="h-8 w-8 text-slate-400" />
        </div>
        <h2 className="mt-4 text-lg font-semibold text-slate-900">No New Notifications</h2>
        <p className="mt-1 text-sm text-slate-500">You&apos;re all caught up.</p>
        <p className="mt-2 text-sm text-slate-400">
          New notifications will appear here when there is activity on your account.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
        <p className="text-sm font-medium text-slate-700">You&apos;ll receive notifications for:</p>
        <ul className="mt-2 space-y-1 text-sm text-slate-500">
          <li className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
            New buyer inquiries
          </li>
          <li className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
            Listing updates
          </li>
          <li className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
            Feature listing approvals
          </li>
          <li className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
            Account updates
          </li>
          <li className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
            Finance inquiry activity
          </li>
        </ul>
      </div>
    </main>
  );
}
