import { seedVehicles } from "@/lib/mock-data";
import type { ListingStatus, Vehicle, VehicleFilters, VehicleType } from "@/lib/types";

let vehicles = [...seedVehicles];

const normalize = (value?: string) => value?.toLowerCase().trim() ?? "";

export function listVehicles(filters: VehicleFilters = {}) {
  return vehicles
    .filter((vehicle) => {
      const search = normalize(filters.search);
      if (search) {
        const haystack = [
          vehicle.title,
          vehicle.brand,
          vehicle.model,
          vehicle.city,
          vehicle.state,
          vehicle.financeCompany,
        ]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(search)) return false;
      }

      if (filters.vehicleType && vehicle.vehicleType !== filters.vehicleType) return false;
      if (filters.brand && vehicle.brand !== filters.brand) return false;
      if (filters.city && vehicle.city !== filters.city) return false;
      if (filters.state && vehicle.state !== filters.state) return false;
      if (filters.financeCompany && vehicle.financeCompany !== filters.financeCompany) return false;
      if (filters.verificationStatus && vehicle.verificationStatus !== filters.verificationStatus) {
        return false;
      }
      if (typeof filters.minPrice === "number" && vehicle.price < filters.minPrice) return false;
      if (typeof filters.maxPrice === "number" && vehicle.price > filters.maxPrice) return false;

      return true;
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getVehicleById(id: string) {
  return vehicles.find((vehicle) => vehicle.id === id);
}

export function getFilterOptions() {
  const unique = <T,>(items: T[]) => Array.from(new Set(items)).sort();

  return {
    vehicleTypes: unique(vehicles.map((vehicle) => vehicle.vehicleType)),
    brands: unique(vehicles.map((vehicle) => vehicle.brand)),
    cities: unique(vehicles.map((vehicle) => vehicle.city)),
    states: unique(vehicles.map((vehicle) => vehicle.state)),
    financeCompanies: unique(vehicles.map((vehicle) => vehicle.financeCompany)),
  };
}

type SubmissionInput = {
  vehicleType: string;
  brand: string;
  model: string;
  year: number;
  registrationState: string;
  price: number;
  financeCompany: string;
  city: string;
  state: string;
  yardLocation: string;
  condition: string;
  sellerName: string;
  sellerPhone: string;
};

export function submitVehicleListing(input: SubmissionInput) {
  const timestamp = new Date().toISOString();
  const id = `user-${Date.now()}`;

  const listing: Vehicle = {
    id,
    title: `${input.brand} ${input.model} - ${input.year}`,
    vehicleType: input.vehicleType as VehicleType,
    brand: input.brand,
    model: input.model,
    year: input.year,
    registrationState: input.registrationState,
    price: input.price,
    financeCompany: input.financeCompany,
    city: input.city,
    state: input.state,
    yardLocation: input.yardLocation,
    condition: input.condition,
    status: "PENDING",
    verificationStatus: "UNVERIFIED",
    sellerName: input.sellerName,
    sellerPhone: input.sellerPhone,
    images: ["/vehicles/truck-placeholder.svg"],
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  vehicles = [listing, ...vehicles];
  return listing;
}

export function updateListingStatus(id: string, status: ListingStatus) {
  const updatedAt = new Date().toISOString();

  vehicles = vehicles.map((vehicle) => {
    if (vehicle.id !== id) return vehicle;

    const verificationStatus =
      status === "VERIFIED" || status === "SOLD"
        ? "VERIFIED"
        : status === "REJECTED"
          ? "REJECTED"
          : "UNVERIFIED";

    return { ...vehicle, status, verificationStatus, updatedAt };
  });

  return getVehicleById(id);
}
