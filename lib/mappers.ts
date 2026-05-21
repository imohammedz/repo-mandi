import type { DbVehicle } from "./schema";
import type { Vehicle } from "@/types/vehicle";

/**
 * Maps a database row (DbVehicle) to the application's Vehicle shape,
 * converting numeric string fields from postgres to numbers.
 */
export function dbToVehicle(row: DbVehicle): Vehicle {
  const trustBadges: Vehicle["verifiedBadges"] = [];
  if (row.rcVerified) trustBadges.push("RC Verified");
  if (row.photosVerified) trustBadges.push("Photos Verified");
  if (row.yardVerified) trustBadges.push("Yard Verified");

  return {
    id: row.id,
    sellerId: row.sellerId,
    createdByUserId: row.createdByUserId,
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
    bankInstitutionName: row.bankInstitutionName,
    branchName: row.branchName,
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
    verifiedBadges: trustBadges,
    rcVerified: row.rcVerified,
    photosVerified: row.photosVerified,
    yardVerified: row.yardVerified,
    sellerVerified: row.sellerVerified,
    isPublished: row.isPublished,
    verificationStatus: row.verificationStatus,
    rejectionReason: row.rejectionReason,
    verifiedBy: row.verifiedBy,
    verifiedAt: row.verifiedAt ? row.verifiedAt.toISOString() : null,
    missingPhotos: row.missingPhotos,
    priceTooLow: row.priceTooLow,
    duplicateRegistration: row.duplicateRegistration,
    newSeller: row.newSeller,
    missingYardLocation: row.missingYardLocation,
    inspectionNotes: row.inspectionNotes as string[],
    inquiries: row.inquiries,
    listingStatus: row.listingStatus as Vehicle["listingStatus"],
  };
}
