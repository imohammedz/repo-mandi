export const LISTING_MODE_VALUES = ["NORMAL", "BULK"] as const;
export type ListingMode = (typeof LISTING_MODE_VALUES)[number];

export const ASSET_STRUCTURE_VALUES = ["STANDALONE", "DETACHABLE", "EQUIPMENT"] as const;
export type AssetStructure = (typeof ASSET_STRUCTURE_VALUES)[number];

export const DETACHABLE_TYPE_VALUES = ["PRIME_MOVER", "TRAILER"] as const;
export type DetachableType = (typeof DETACHABLE_TYPE_VALUES)[number];

export const LEGACY_ASSET_CONFIGURATION_VALUES = [
  "Complete Vehicle",
  "Power / Horse / Tractor / Prime Mover Only",
  "Trailer Only",
  "Prime Mover + Trailer",
  "Other",
] as const;
export type LegacyAssetConfiguration = (typeof LEGACY_ASSET_CONFIGURATION_VALUES)[number];

export const LISTING_MODE_LABELS: Record<ListingMode, string> = {
  NORMAL: "Single",
  BULK: "Bulk",
};

export const ASSET_STRUCTURE_LABELS: Record<AssetStructure, string> = {
  STANDALONE: "Standalone Vehicle",
  DETACHABLE: "Detachable Vehicle",
  EQUIPMENT: "Equipment / Machinery",
};

export const DETACHABLE_TYPE_LABELS: Record<DetachableType, string> = {
  PRIME_MOVER: "Prime Mover / Horse / Tractor Head",
  TRAILER: "Trailer",
};

export const STANDALONE_ASSET_CATEGORIES = [
  "Pickup",
  "Mini Truck",
  "LCV",
  "HCV",
  "Tipper",
  "Tanker",
  "Bus",
  "Crane Truck",
  "Recovery Truck",
] as const;

export const STANDALONE_BODY_APPLICATION_OPTIONS = [
  "Open Body",
  "Container Body",
  "Closed Body",
  "Refrigerated",
  "Tanker",
  "Tipper",
  "Garbage Body",
  "Crane Mounted",
  "Recovery Body",
  "Other",
] as const;

export const PRIME_MOVER_ASSET_CATEGORIES = ["Prime Mover", "Heavy Puller"] as const;

export const PRIME_MOVER_BODY_APPLICATION_OPTIONS = [
  "4x2",
  "6x2",
  "6x4",
  "Multi Axle",
  "Heavy Haulage",
  "Other",
] as const;

export const TRAILER_ASSET_CATEGORIES = ["Trailer"] as const;

export const TRAILER_BODY_APPLICATION_OPTIONS = [
  "Flatbed",
  "Low Bed",
  "Semi Low Bed",
  "Skeletal Trailer",
  "Tanker Trailer",
  "Tip Trailer",
  "Car Carrier",
  "Container Trailer",
  "Side Wall Trailer",
  "Bulker Trailer",
  "Other",
] as const;

export const EQUIPMENT_ASSET_CATEGORIES = [
  "Excavator",
  "Backhoe Loader",
  "Hydra Crane",
  "Forklift",
  "Wheel Loader",
  "Road Roller",
  "Transit Mixer",
  "Concrete Pump",
  "Paver",
  "Motor Grader",
  "Other",
] as const;

const LEGACY_CLASSIFICATION_MAP: Record<
  string,
  { assetStructure: AssetStructure; detachableType: DetachableType | null }
> = {
  "Complete Vehicle": { assetStructure: "STANDALONE", detachableType: null },
  "Power / Horse / Tractor / Prime Mover Only": {
    assetStructure: "DETACHABLE",
    detachableType: "PRIME_MOVER",
  },
  "Trailer Only": { assetStructure: "DETACHABLE", detachableType: "TRAILER" },
  "Prime Mover + Trailer": { assetStructure: "STANDALONE", detachableType: null },
  Other: { assetStructure: "EQUIPMENT", detachableType: null },
};

export function normalizeListingMode(value: string | null | undefined): ListingMode {
  return value === "BULK" ? "BULK" : "NORMAL";
}

export function normalizeClassification(input: {
  assetStructure?: string | null;
  detachableType?: string | null;
  assetConfiguration?: string | null;
}) {
  const assetStructure = ASSET_STRUCTURE_VALUES.includes(input.assetStructure as AssetStructure)
    ? (input.assetStructure as AssetStructure)
    : null;
  const detachableType = DETACHABLE_TYPE_VALUES.includes(input.detachableType as DetachableType)
    ? (input.detachableType as DetachableType)
    : null;

  if (assetStructure) {
    return {
      assetStructure,
      detachableType: assetStructure === "DETACHABLE" ? detachableType : null,
    };
  }

  const fallback = LEGACY_CLASSIFICATION_MAP[input.assetConfiguration ?? ""] ?? LEGACY_CLASSIFICATION_MAP["Complete Vehicle"];
  return fallback;
}

export function toLegacyAssetConfiguration(
  assetStructure: AssetStructure,
  detachableType?: DetachableType | null
): LegacyAssetConfiguration {
  if (assetStructure === "STANDALONE") return "Complete Vehicle";
  if (assetStructure === "DETACHABLE" && detachableType === "PRIME_MOVER") {
    return "Power / Horse / Tractor / Prime Mover Only";
  }
  if (assetStructure === "DETACHABLE" && detachableType === "TRAILER") {
    return "Trailer Only";
  }
  return "Other";
}

export function hasEngineOrPowertrain(input: {
  assetStructure?: string | null;
  detachableType?: string | null;
  assetConfiguration?: string | null;
}) {
  const classification = normalizeClassification(input);
  return (
    classification.assetStructure === "STANDALONE" ||
    classification.assetStructure === "EQUIPMENT" ||
    classification.detachableType === "PRIME_MOVER"
  );
}

export function getAssetCategoryOptions(
  assetStructure: AssetStructure,
  detachableType?: DetachableType | null
) {
  if (assetStructure === "STANDALONE") return [...STANDALONE_ASSET_CATEGORIES];
  if (assetStructure === "EQUIPMENT") return [...EQUIPMENT_ASSET_CATEGORIES];
  if (detachableType === "PRIME_MOVER") return [...PRIME_MOVER_ASSET_CATEGORIES];
  return [...TRAILER_ASSET_CATEGORIES];
}

export function getBodyApplicationOptions(
  assetStructure: AssetStructure,
  detachableType?: DetachableType | null
) {
  if (assetStructure === "STANDALONE") return [...STANDALONE_BODY_APPLICATION_OPTIONS];
  if (assetStructure === "DETACHABLE" && detachableType === "PRIME_MOVER") {
    return [...PRIME_MOVER_BODY_APPLICATION_OPTIONS];
  }
  if (assetStructure === "DETACHABLE" && detachableType === "TRAILER") {
    return [...TRAILER_BODY_APPLICATION_OPTIONS];
  }
  return [];
}

export function isValidAssetCategory(
  assetCategory: string,
  assetStructure: AssetStructure,
  detachableType?: DetachableType | null
) {
  return getAssetCategoryOptions(assetStructure, detachableType).includes(assetCategory);
}

export function isValidBodyApplicationType(
  bodyApplicationType: string,
  assetStructure: AssetStructure,
  detachableType?: DetachableType | null
) {
  const options = getBodyApplicationOptions(assetStructure, detachableType);
  return options.length === 0 || options.includes(bodyApplicationType);
}

export function toLegacyVehicleType(
  assetCategory: string,
  assetStructure: AssetStructure,
  detachableType?: DetachableType | null
) {
  if (assetStructure === "EQUIPMENT") return "Truck";
  if (assetStructure === "DETACHABLE" && detachableType === "TRAILER") return "Trailer";
  if (assetStructure === "DETACHABLE" && detachableType === "PRIME_MOVER") return "Tractor";

  switch (assetCategory) {
    case "Pickup":
      return "Pickup";
    case "Mini Truck":
      return "Mini Truck";
    case "LCV":
      return "LCV (Light Commercial Vehicle)";
    case "HCV":
    case "Crane Truck":
    case "Recovery Truck":
      return "HCV (Heavy Commercial Vehicle)";
    case "Tipper":
      return "Tipper";
    case "Tanker":
      return "Tanker";
    case "Bus":
      return "Bus";
    default:
      return "Truck";
  }
}

export function getAssetStructureLabel(value: string | null | undefined) {
  if (!value || !ASSET_STRUCTURE_VALUES.includes(value as AssetStructure)) return "";
  return ASSET_STRUCTURE_LABELS[value as AssetStructure];
}

export function getDetachableTypeLabel(value: string | null | undefined) {
  if (!value || !DETACHABLE_TYPE_VALUES.includes(value as DetachableType)) return "";
  return DETACHABLE_TYPE_LABELS[value as DetachableType];
}

export function getListingModeLabel(value: string | null | undefined) {
  return LISTING_MODE_LABELS[normalizeListingMode(value)];
}
