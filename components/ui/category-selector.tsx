"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type CategoryId = "prime-mover" | "trailers" | "tippers" | "container" | "buses" | "equipment";

type Category = {
  id: CategoryId;
  label: string;
  href: string;
};

const PRIME_MOVER_IMAGE_URL =
  "https://github.com/user-attachments/assets/3263e16e-a3f8-456c-ba9a-fd482fe39486";
const TRAILER_IMAGE_URL =
  "https://github.com/user-attachments/assets/2259ee2f-5714-4f3b-bc4b-f817d362f083";
const TIPPER_IMAGE_URL =
  "https://github.com/user-attachments/assets/5736baad-97f9-4d3c-b513-2595dff5cceb";
const CONTAINER_IMAGE_URL =
  "https://github.com/user-attachments/assets/76a11527-9e12-46aa-9104-5d33a8b3c140";
const BUS_IMAGE_URL =
  "https://github.com/user-attachments/assets/a9cbe926-8ee9-4c31-8b52-b3357c745dff";
const EQUIPMENT_IMAGE_URL =
  "https://github.com/user-attachments/assets/99b52711-0c50-4b90-a48c-808696099194";
const SELECTED_IMAGE_STYLE = {
  filter: "drop-shadow(0 1px 1px rgba(234,88,12,0.2))",
} as const;

const categories: Category[] = [
  {
    id: "prime-mover",
    label: "Prime Mover",
    href: "/vehicles?assetStructure=DETACHABLE&detachableType=PRIME_MOVER",
  },
  {
    id: "trailers",
    label: "Trailers",
    href: "/vehicles?assetStructure=DETACHABLE&detachableType=TRAILER",
  },
  {
    id: "tippers",
    label: "Tippers",
    href: "/vehicles?assetStructure=STANDALONE&bodyApplicationType=Tipper",
  },
  {
    id: "container",
    label: "Container",
    href: "/vehicles?bodyApplicationType=Container+Truck",
  },
  {
    id: "buses",
    label: "Buses",
    href: "/vehicles?assetStructure=STANDALONE&assetCategory=Bus+%2F+Passenger+Commercial",
  },
  {
    id: "equipment",
    label: "Equipment",
    href: "/vehicles?assetStructure=EQUIPMENT",
  },
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

export function CategorySelector() {
  const [selected, setSelected] = useState<CategoryId | null>(null);
  const router = useRouter();

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
              setSelected(cat.id);
              router.push(cat.href);
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
