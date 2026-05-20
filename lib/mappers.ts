import type { DbVehicle } from "./schema";
import type { Vehicle } from "@/types/vehicle";

/**
 * Maps a database row (DbVehicle) to the application's Vehicle shape,
 * converting numeric string fields from postgres to numbers.
 */
export function dbToVehicle(row: DbVehicle): Vehicle {
  return {
    id: row.id,
    title: row.title,
    type: row.type as Vehicle["type"],
    brand: row.brand,
    model: row.model,
    year: row.year,
    kmDriven: row.kmDriven,
    fuelType: row.fuelType as Vehicle["fuelType"],
    axleType: row.axleType,
    registrationState: row.registrationState,
    city: row.city,
    state: row.state,
    image: row.image,
    gallery: row.gallery as string[],
    financeCompany: row.financeCompany,
    price: Number(row.price),
    reservePrice: Number(row.reservePrice),
    repoStatus: row.repoStatus as Vehicle["repoStatus"],
    sellerType: row.sellerType as Vehicle["sellerType"],
    sellerName: row.sellerName,
    sellerRole: row.sellerRole,
    sellerPhone: row.sellerPhone,
    condition: row.condition as Vehicle["condition"],
    conditionNotes: row.conditionNotes,
    accidentNotes: row.accidentNotes,
    auctionDate: row.auctionDate,
    yardLocation: row.yardLocation,
    verifiedBadges: (row.verifiedBadges as string[]) as Vehicle["verifiedBadges"],
    inspectionNotes: row.inspectionNotes as string[],
    inquiries: row.inquiries,
    listingStatus: row.listingStatus as Vehicle["listingStatus"],
  };
}
