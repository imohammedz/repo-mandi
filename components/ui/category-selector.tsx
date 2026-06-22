"use client";

import { useRouter, useSearchParams } from "next/navigation";

export type CategoryId = "prime-mover" | "trailers" | "tippers" | "container" | "buses" | "equipment";

type Category = {
  id: CategoryId;
  label: string;
};

export const PRIME_MOVER_IMAGE_URL =
  "https://github.com/user-attachments/assets/8a1739ef-5acc-41b0-8493-f5fc95a85bf7";
export const TRAILER_IMAGE_URL =
  "https://github.com/user-attachments/assets/82d8eef0-04b9-490f-9aa4-6d587b9b136d";
export const TIPPER_IMAGE_URL =
  "https://github.com/user-attachments/assets/99e2ea3e-7896-469d-9f5d-05d0f2bfe8d6";
const CONTAINER_IMAGE_URL =
  "https://github.com/user-attachments/assets/76a11527-9e12-46aa-9104-5d33a8b3c140";
const BUS_IMAGE_URL =
  "https://github.com/user-attachments/assets/a9cbe926-8ee9-4c31-8b52-b3357c745dff";
export const EQUIPMENT_IMAGE_URL =
  "https://github.com/user-attachments/assets/72ebe64b-7363-4cf0-9854-35b75021c31f";
const SELECTED_IMAGE_STYLE = {
  filter: "drop-shadow(0 1px 1px rgba(234,88,12,0.2))",
} as const;

export const categories: Category[] = [
  { id: "prime-mover", label: "Prime Mover" },
  { id: "trailers", label: "Trailers" },
  { id: "tippers", label: "Tippers" },
  { id: "container", label: "Container" },
  { id: "buses", label: "Buses" },
  { id: "equipment", label: "Equipment" },
];

/* ───────── SVG vehicle illustrations (facing right) ───────── */

function PrimeMoverIcon({ tint }: { tint: boolean }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={PRIME_MOVER_IMAGE_URL}
      alt="Prime Mover"
      width={52}
      height={34}
      className="h-full w-full object-contain"
      style={tint ? SELECTED_IMAGE_STYLE : undefined}
    />
  );
}

function TrailerIcon({ tint }: { tint: boolean }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={TRAILER_IMAGE_URL}
      alt="Trailer"
      width={52}
      height={34}
      className="h-full w-full object-contain"
      style={tint ? SELECTED_IMAGE_STYLE : undefined}
    />
  );
}

function TipperIcon({ tint }: { tint: boolean }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={TIPPER_IMAGE_URL}
      alt="Tipper"
      width={52}
      height={34}
      className="h-full w-full object-contain"
      style={tint ? SELECTED_IMAGE_STYLE : undefined}
    />
  );
}

function ContainerIcon({ tint }: { tint: boolean }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={CONTAINER_IMAGE_URL}
      alt="Container"
      width={52}
      height={34}
      className="h-full w-full object-contain"
      style={tint ? SELECTED_IMAGE_STYLE : undefined}
    />
  );
}

function BusIcon({ tint }: { tint: boolean }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={BUS_IMAGE_URL}
      alt="Bus"
      width={52}
      height={34}
      className="h-full w-full object-contain"
      style={tint ? SELECTED_IMAGE_STYLE : undefined}
    />
  );
}

function EquipmentIcon({ tint }: { tint: boolean }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={EQUIPMENT_IMAGE_URL}
      alt="Equipment"
      width={52}
      height={34}
      className="h-full w-full object-contain"
      style={tint ? SELECTED_IMAGE_STYLE : undefined}
    />
  );
}

const iconComponents: Record<CategoryId, (props: { tint: boolean }) => React.JSX.Element> = {
  "prime-mover": PrimeMoverIcon,
  trailers: TrailerIcon,
  tippers: TipperIcon,
  container: ContainerIcon,
  buses: BusIcon,
  equipment: EquipmentIcon,
};

export function CategorySelector({ activeCategory }: { activeCategory?: CategoryId }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selected = activeCategory ?? null;

  function buildUrl(categoryId: CategoryId | null): string {
    const params = new URLSearchParams(searchParams.toString());
    // Always reset pagination on category change
    params.delete("page");
    if (categoryId === null) {
      params.delete("category");
    } else {
      params.set("category", categoryId);
    }
    const qs = params.toString();
    return qs ? `/vehicles?${qs}` : "/vehicles";
  }

  return (
    <div className="grid w-full grid-cols-6 gap-1 overflow-hidden">
      {categories.map((cat) => {
        const isSelected = selected === cat.id;
        const Icon = iconComponents[cat.id];
        return (
          <button
            key={cat.id}
            type="button"
            onClick={() => {
              // Toggle: clicking selected category deselects it
              router.push(buildUrl(isSelected ? null : cat.id));
            }}
            className={[
              "flex h-[68px] min-w-0 flex-col items-center justify-center gap-0.5 rounded-[12px] border px-1 py-1 transition-all",
              isSelected
                ? "border-orange-300 bg-orange-50 shadow-[0_1px_2px_rgba(249,115,22,0.12)]"
                : "border-gray-200 bg-white shadow-none",
            ].join(" ")}
          >
            <div className="flex h-[38px] w-full items-center justify-center">
              <div className="h-[34px] w-full max-w-[52px]">
                <Icon tint={isSelected} />
              </div>
            </div>
            <span
              className={[
                "line-clamp-1 max-w-full text-center text-[10px] font-medium leading-[1.05]",
                isSelected ? "text-orange-600" : "text-gray-700",
              ].join(" ")}
            >
              {cat.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
