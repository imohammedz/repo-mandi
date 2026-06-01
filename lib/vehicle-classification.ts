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
  PRIME_MOVER: "Prime Mover",
  TRAILER: "Trailer",
};

export const DETACHABLE_TYPE_HELPER_TEXT: Partial<Record<DetachableType, string>> = {
  PRIME_MOVER:
    "Prime mover refers to the powered truck head also commonly called horse, tractor head, or puller.",
};

export const STANDALONE_ASSET_CATEGORIES = [
  "SCV / LCV",
  "Rigid Trucks",
  "Prime Mover + Trailer",
  "Bus / Passenger Commercial",
] as const;

const STANDALONE_BODY_APPLICATION_MAP: Record<string, readonly string[]> = {
  "SCV / LCV": ["Pickup", "Mini Truck", "Van"],
  "Rigid Trucks": [
    "Open Body",
    "Container Body",
    "Tipper",
    "Tanker",
    "Reefer",
    "Garbage Truck",
    "Crane-Mounted Truck",
  ],
  "Prime Mover + Trailer": [
    "4x2 Prime Mover + Trailer",
    "6x2 Prime Mover + Trailer",
    "6x4 Prime Mover + Trailer",
    "Heavy Haulage Puller + Trailer",
  ],
  "Bus / Passenger Commercial": ["School Bus", "Staff Bus", "Tourist Bus", "Mini Bus"],
};

export const PRIME_MOVER_ASSET_CATEGORIES = ["Prime Mover"] as const;

export const PRIME_MOVER_BODY_APPLICATION_OPTIONS = [
  "4x2 Prime Mover",
  "6x2 Prime Mover",
  "6x4 Prime Mover",
  "Heavy Haulage Puller",
] as const;

export const TRAILER_ASSET_CATEGORIES = ["Trailer"] as const;

export const TRAILER_BODY_APPLICATION_OPTIONS = [
  "Flatbed 20ft",
  "Flatbed 40ft",
  "Low Bed",
  "Semi Low Bed",
  "Side Wall",
  "Skeletal / Container Trailer",
  "Tanker Trailer",
  "Tip Trailer",
  "Car Carrier Trailer",
] as const;

export const EQUIPMENT_ASSET_CATEGORIES = [
  "Construction Equipment",
  "Material Handling / Special Equipment",
] as const;

const EQUIPMENT_BODY_APPLICATION_MAP: Record<string, readonly string[]> = {
  "Construction Equipment": [
    "Excavator",
    "Backhoe Loader",
    "Wheel Loader",
    "Motor Grader",
    "Road Roller",
    "Paver",
    "Transit Mixer",
    "Concrete Pump",
  ],
  "Material Handling / Special Equipment": [
    "Crane",
    "Forklift",
    "Hydra",
    "Boom Lift",
    "Recovery Vehicle",
    "Fire Truck",
    "Ambulance",
  ],
};

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
const DEFAULT_LEGACY_ASSET_CONFIGURATION: LegacyAssetConfiguration = "Complete Vehicle";

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

  const fallback =
    LEGACY_CLASSIFICATION_MAP[input.assetConfiguration ?? ""] ??
    LEGACY_CLASSIFICATION_MAP[DEFAULT_LEGACY_ASSET_CONFIGURATION];
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
): string[] {
  if (assetStructure === "STANDALONE") return [...STANDALONE_ASSET_CATEGORIES];
  if (assetStructure === "EQUIPMENT") return [...EQUIPMENT_ASSET_CATEGORIES];
  if (detachableType === "PRIME_MOVER") return [...PRIME_MOVER_ASSET_CATEGORIES];
  return [...TRAILER_ASSET_CATEGORIES];
}

export function getBodyApplicationOptions(
  assetStructure: AssetStructure,
  detachableType?: DetachableType | null,
  assetCategory?: string | null
): string[] {
  if (assetStructure === "STANDALONE") {
    return assetCategory && STANDALONE_BODY_APPLICATION_MAP[assetCategory]
      ? [...STANDALONE_BODY_APPLICATION_MAP[assetCategory]]
      : [];
  }
  if (assetStructure === "EQUIPMENT") {
    return assetCategory && EQUIPMENT_BODY_APPLICATION_MAP[assetCategory]
      ? [...EQUIPMENT_BODY_APPLICATION_MAP[assetCategory]]
      : [];
  }
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
  detachableType?: DetachableType | null,
  assetCategory?: string | null
) {
  const options = getBodyApplicationOptions(assetStructure, detachableType, assetCategory);
  return options.length === 0 || options.includes(bodyApplicationType);
}

export function mapAssetCategoryToLegacyVehicleType(
  assetStructure: AssetStructure,
  assetCategory: string,
  detachableType?: DetachableType | null
) {
  if (assetStructure === "EQUIPMENT") return "Equipment";
  if (assetStructure === "DETACHABLE" && detachableType === "TRAILER") return "Trailer";
  if (assetStructure === "DETACHABLE" && detachableType === "PRIME_MOVER") return "Tractor";

  switch (assetCategory) {
    case "SCV / LCV":
      return "LCV (Light Commercial Vehicle)";
    case "Rigid Trucks":
      return "HCV (Heavy Commercial Vehicle)";
    case "Prime Mover + Trailer":
      return "HCV (Heavy Commercial Vehicle)";
    case "Bus / Passenger Commercial":
      return "Bus";
    default:
      return "Truck";
  }
}

export function toLegacyVehicleType(
  assetCategory: string,
  assetStructure: AssetStructure,
  detachableType?: DetachableType | null
) {
  return mapAssetCategoryToLegacyVehicleType(assetStructure, assetCategory, detachableType);
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
