"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { CheckCircle2, Edit, Eye, Loader2, MoreVertical, Share2, Trash2 } from "lucide-react";

interface ListingActionsMenuProps {
  vehicleId: string;
  title: string;
  price: number;
  location?: string;
  canMarkSold: boolean;
}

export function ListingActionsMenu({ vehicleId, title, price, location, canMarkSold }: ListingActionsMenuProps) {
  const router = useRouter();
  const [isMarkingSold, startMarkSoldTransition] = useTransition();
  const [isDeleting, startDeleteTransition] = useTransition();
  const [isSharing, setIsSharing] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPlacement, setMenuPlacement] = useState<"down" | "up">("down");
  const rootRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const listingPath = `/vehicles/${vehicleId}`;
  const listingUrl = typeof window === "undefined" ? listingPath : `${window.location.origin}${listingPath}`;

  useEffect(() => {
    if (!menuOpen) return;
    const handleOutsideClick = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [menuOpen]);

  useEffect(() => {
    if (!menuOpen) return;
    const updatePlacement = () => {
      const buttonRect = buttonRef.current?.getBoundingClientRect();
      const menuRect = menuRef.current?.getBoundingClientRect();
      if (!buttonRect || !menuRect) return;
      const hasBottomSpace = buttonRect.bottom + 8 + menuRect.height <= window.innerHeight;
      const hasTopSpace = buttonRect.top - 8 - menuRect.height >= 0;
      if (!hasBottomSpace && hasTopSpace) {
        setMenuPlacement("up");
      } else {
        setMenuPlacement("down");
      }
    };
    updatePlacement();
    window.addEventListener("resize", updatePlacement);
    window.addEventListener("scroll", updatePlacement, true);
    return () => {
      window.removeEventListener("resize", updatePlacement);
      window.removeEventListener("scroll", updatePlacement, true);
    };
  }, [menuOpen]);

  const handleShare = async () => {
    const text = `${title} • ₹${price.toLocaleString("en-IN")}${location ? ` • ${location}` : ""}\n${listingUrl}`;

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        setIsSharing(true);
        await navigator.share({
          title: `${title} | RepoMandi`,
          text,
          url: listingUrl,
        });
        return;
      } catch (error) {
        if ((error as DOMException)?.name === "AbortError") return;
      } finally {
        setIsSharing(false);
      }
    }

    try {
      setIsSharing(true);
      await navigator.clipboard.writeText(text);
      window.alert("Listing link copied to clipboard.");
    } catch {
      window.alert("Unable to share. Please copy the listing URL manually from the browser.");
    } finally {
      setIsSharing(false);
    }
  };

  const handleMarkSold = () => {
    if (!canMarkSold) return;
    if (!window.confirm("Mark this listing as sold?")) return;
    setMenuOpen(false);
    startMarkSoldTransition(async () => {
      try {
        const response = await fetch(`/api/seller/vehicles/${vehicleId}/mark-sold`, { method: "PATCH" });
        if (!response.ok) {
          let message = "Please try again.";
          try {
            const body = (await response.json()) as { message?: string };
            message = body.message?.trim() || message;
          } catch {}
          window.alert(`Unable to mark listing as sold. ${message}`);
          return;
        }
        router.refresh();
      } catch {
        window.alert("Unable to mark listing as sold. Please try again.");
      }
    });
  };

  const handleDelete = () => {
    if (!window.confirm("Are you sure you want to delete this listing?")) return;
    setMenuOpen(false);
    startDeleteTransition(async () => {
      try {
        const response = await fetch(`/api/seller/vehicles/${vehicleId}`, { method: "DELETE" });
        if (!response.ok) {
          let message = "Please try again.";
          try {
            const body = (await response.json()) as { message?: string };
            message = body.message?.trim() || message;
          } catch {}
          window.alert(`Unable to delete listing. ${message}`);
          return;
        }
        router.refresh();
      } catch {
        window.alert("Unable to delete listing. Please try again.");
      }
    });
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900"
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        aria-label="Listing actions"
        onClick={() => setMenuOpen((open) => !open)}
        onKeyDown={(event) => {
          if (event.key === "Escape") setMenuOpen(false);
        }}
      >
        <MoreVertical className="size-4" />
      </button>

      {menuOpen ? (
        <div
          ref={menuRef}
          role="menu"
          aria-label="Manage listing"
          className={`absolute right-0 z-30 w-52 rounded-lg border border-slate-200 bg-white p-1 shadow-lg ${
            menuPlacement === "up" ? "bottom-full mb-2" : "top-full mt-2"
          }`}
          onKeyDown={(event) => {
            if (event.key === "Escape") setMenuOpen(false);
          }}
        >
          <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Manage listing</p>
          <div className="h-px bg-slate-100" />
          <Link
            href={listingPath}
            role="menuitem"
            className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
            onClick={() => setMenuOpen(false)}
          >
              <Eye className="size-4" />
              View Listing
          </Link>
          <Link
            href={`/seller/listings/${vehicleId}/edit`}
            role="menuitem"
            className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
            onClick={() => setMenuOpen(false)}
          >
              <Edit className="size-4" />
              Edit Listing
          </Link>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setMenuOpen(false);
              void handleShare();
            }}
            disabled={isSharing}
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          >
            <Share2 className="size-4" />
            {isSharing ? "Sharing..." : "Share Listing"}
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={handleMarkSold}
            disabled={isMarkingSold || !canMarkSold}
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isMarkingSold ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
            {isMarkingSold ? "Marking..." : "Mark Sold"}
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={handleDelete}
            disabled={isDeleting}
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 disabled:opacity-60"
          >
            {isDeleting ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
            {isDeleting ? "Deleting..." : "Delete Listing"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
