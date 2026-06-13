"use client";

import { Eye, Heart, Calendar, Clock } from "lucide-react";

interface ListingActivityCardProps {
  viewCount: number;
  saveCount: number;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}

function formatListedDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function formatUpdatedAgo(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const now = Date.now();
  const diffMs = now - d.getTime();
  const diffMins = Math.floor(diffMs / 60_000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 14) return "1w ago";
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, "")}k`;
  return n.toLocaleString("en-IN");
}

export function ListingActivityCard({
  viewCount,
  saveCount,
  createdAt,
  updatedAt,
}: ListingActivityCardProps) {
  const items = [
    {
      icon: <Eye className="h-3.5 w-3.5 shrink-0 text-blue-500" />,
      label: `${formatCount(viewCount)} Views`,
    },
    {
      icon: <Heart className="h-3.5 w-3.5 shrink-0 text-rose-500" />,
      label: `${formatCount(saveCount)} Saves`,
    },
    {
      icon: <Calendar className="h-3.5 w-3.5 shrink-0 text-emerald-600" />,
      label: `Listed ${formatListedDate(createdAt)}`,
    },
    {
      icon: <Clock className="h-3.5 w-3.5 shrink-0 text-orange-500" />,
      label: `Updated ${formatUpdatedAgo(updatedAt)}`,
    },
  ];

  return (
    <div className="flex items-center gap-4 overflow-x-auto rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
      {items.map((item) => (
        <div
          key={item.label}
          className="flex shrink-0 items-center gap-1.5"
        >
          {item.icon}
          <span className="whitespace-nowrap text-xs font-medium text-slate-600">
            {item.label}
          </span>
        </div>
      ))}
    </div>
  );
}
