"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { CheckCircle2, Edit, Eye, Loader2, MoreVertical, Share2, Trash2 } from "lucide-react";
import { markVehicleSold, softDeleteVehicle } from "./[id]/actions";
import { buildPublicListingUrl } from "@/lib/listing-url";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ListingActionsMenuProps {
  vehicleId: string;
  title: string;
  price: number;
  location?: string;
  canMarkSold: boolean;
}

export function ListingActionsMenu({ vehicleId, title, price, location, canMarkSold }: ListingActionsMenuProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isMarkingSold, startMarkSoldTransition] = useTransition();
  const [isDeleting, startDeleteTransition] = useTransition();
  const [isSharing, setIsSharing] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  const handleShare = async () => {
    const listingUrl = buildPublicListingUrl(vehicleId, title, { absolute: true });
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
      toast({
        title: "Link copied",
        description: "Listing details copied. Share with potential buyers.",
      });
    } catch {
      toast({
        title: "Unable to share",
        description: "Please copy the listing URL manually from the browser.",
        variant: "destructive",
      });
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            aria-label="Listing actions"
          >
            <MoreVertical className="size-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuLabel>Manage listing</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href={buildPublicListingUrl(vehicleId, title)} className="flex items-center gap-2">
              <Eye className="size-4" />
              View Listing
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href={`/seller/listings/${vehicleId}/edit`} className="flex items-center gap-2">
              <Edit className="size-4" />
              Edit Listing
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => void handleShare()} disabled={isSharing} className="flex items-center gap-2">
            <Share2 className="size-4" />
            {isSharing ? "Sharing..." : "Share Listing"}
          </DropdownMenuItem>
          {canMarkSold ? (
            <DropdownMenuItem
              onClick={() => {
                startMarkSoldTransition(async () => {
                  await markVehicleSold(vehicleId);
                  router.refresh();
                });
              }}
              disabled={isMarkingSold}
              className="flex items-center gap-2"
            >
              {isMarkingSold ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
              {isMarkingSold ? "Marking..." : "Mark Sold"}
            </DropdownMenuItem>
          ) : null}
          <DropdownMenuItem
            variant="destructive"
            onSelect={(event) => {
              event.preventDefault();
              setConfirmDeleteOpen(true);
            }}
            className="flex items-center gap-2"
          >
            <Trash2 className="size-4" />
            Delete Listing
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete listing?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The listing and related leads will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={(event) => {
                event.preventDefault();
                startDeleteTransition(async () => {
                  await softDeleteVehicle(vehicleId);
                  setConfirmDeleteOpen(false);
                  router.refresh();
                });
              }}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
