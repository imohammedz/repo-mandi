import { SITE_CONFIG } from "@/lib/config/site";

type ListingShareInput = {
  listingId: string;
  title: string;
  location?: string | null;
  price?: number | null;
  url?: string;
};

const formatSharePrice = (price?: number | null) => {
  if (typeof price !== "number" || Number.isNaN(price)) return "Price on request";
  if (price < 0) return "Price on request";
  return `₹${Math.round(price).toLocaleString("en-IN")}`;
};

export const buildListingPublicUrl = (listingId: string) => {
  const base = SITE_CONFIG.primaryDomain.replace(/\/+$/, "");
  return `${base}/vehicles/${listingId}`;
};

export const formatListingShareText = (input: ListingShareInput) => {
  const shareUrl = input.url || buildListingPublicUrl(input.listingId);
  const lines = [
    input.title,
    "",
    `Location: ${input.location?.trim() || "Location unavailable"}`,
    `Price: ${formatSharePrice(input.price)}`,
    "",
    "View Listing:",
    shareUrl,
    "",
    `Shared via ${SITE_CONFIG.name}`,
  ];

  return lines.join("\n");
};

export const buildListingSharePayload = (input: ListingShareInput) => {
  const url = input.url || buildListingPublicUrl(input.listingId);
  return {
    title: input.title,
    text: formatListingShareText({ ...input, url }),
    url,
  };
};

export const buildWhatsAppShareUrl = (input: ListingShareInput) =>
  `https://wa.me/?text=${encodeURIComponent(formatListingShareText(input))}`;

export const buildTelegramShareUrl = (input: ListingShareInput) => {
  const url = input.url || buildListingPublicUrl(input.listingId);
  const text = `Check this commercial vehicle listing on ${SITE_CONFIG.name}: ${input.title}`;
  return `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
};

export const buildEmailShareUrl = (input: ListingShareInput) => {
  const subject = "Commercial Vehicle Listing";
  const body = formatListingShareText(input);
  return `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
};
