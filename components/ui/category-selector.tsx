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
  const body = tint ? "#c2410c" : "#475569";
  const glass = tint ? "#fed7aa" : "#bae6fd";
  const dark = tint ? "#9a3412" : "#1e293b";
  const mid = tint ? "#ea580c" : "#64748b";
  const box = tint ? "#fb923c" : "#94a3b8";
  return (
    <svg viewBox="0 0 58 30" fill="none" className="h-full w-full">
      {/* chassis */}
      <rect x="2" y="19" width="52" height="4" rx="1" fill={body} />
      {/* cab */}
      <rect x="2" y="7" width="14" height="14" rx="2" fill={body} />
      {/* windshield */}
      <rect x="9" y="9" width="6" height="8" rx="1" fill={glass} />
      {/* container box */}
      <rect x="18" y="5" width="36" height="16" rx="1" fill={box} />
      {/* container ribs */}
      <line x1="26" y1="5" x2="26" y2="21" stroke={dark} strokeWidth="1" />
      <line x1="34" y1="5" x2="34" y2="21" stroke={dark} strokeWidth="1" />
      <line x1="42" y1="5" x2="42" y2="21" stroke={dark} strokeWidth="1" />
      {/* container door frame */}
      <rect x="48" y="7" width="5" height="12" rx="1" fill={mid} />
      {/* front wheel */}
      <circle cx="10" cy="25" r="5" fill={dark} />
      <circle cx="10" cy="25" r="2" fill={mid} />
      {/* rear wheels */}
      <circle cx="36" cy="25" r="5" fill={dark} />
      <circle cx="36" cy="25" r="2" fill={mid} />
      <circle cx="47" cy="25" r="5" fill={dark} />
      <circle cx="47" cy="25" r="2" fill={mid} />
    </svg>
  );
}

function BusIcon({ tint }: { tint: boolean }) {
  const body = tint ? "#c2410c" : "#475569";
  const glass = tint ? "#fed7aa" : "#bae6fd";
  const dark = tint ? "#9a3412" : "#1e293b";
  const mid = tint ? "#ea580c" : "#64748b";
  return (
    <svg viewBox="0 0 58 30" fill="none" className="h-full w-full">
      {/* bus body */}
      <rect x="2" y="5" width="54" height="17" rx="3" fill={body} />
      {/* front windshield */}
      <rect x="47" y="8" width="8" height="10" rx="1" fill={glass} />
      {/* windows row */}
      <rect x="5" y="8" width="7" height="7" rx="1" fill={glass} />
      <rect x="15" y="8" width="7" height="7" rx="1" fill={glass} />
      <rect x="25" y="8" width="7" height="7" rx="1" fill={glass} />
      <rect x="35" y="8" width="7" height="7" rx="1" fill={glass} />
      {/* door */}
      <rect x="6" y="16" width="5" height="5" rx="0.5" fill={dark} />
      {/* chassis rail */}
      <rect x="4" y="21" width="50" height="2" fill={dark} />
      {/* front wheel */}
      <circle cx="48" cy="25" r="5" fill={dark} />
      <circle cx="48" cy="25" r="2" fill={mid} />
      {/* rear wheel */}
      <circle cx="12" cy="25" r="5" fill={dark} />
      <circle cx="12" cy="25" r="2" fill={mid} />
    </svg>
  );
}

function ExcavatorIcon({ tint }: { tint: boolean }) {
  const body = tint ? "#c2410c" : "#475569";
  const glass = tint ? "#fed7aa" : "#bae6fd";
  const dark = tint ? "#9a3412" : "#1e293b";
  const mid = tint ? "#ea580c" : "#64748b";
  const arm = tint ? "#fb923c" : "#94a3b8";
  return (
    <svg viewBox="0 0 58 30" fill="none" className="h-full w-full">
      {/* tracks */}
      <rect x="6" y="20" width="36" height="8" rx="4" fill={dark} />
      <rect x="9" y="22" width="30" height="4" rx="2" fill={mid} />
      {/* track wheels */}
      <circle cx="12" cy="24" r="3" fill={dark} />
      <circle cx="36" cy="24" r="3" fill={dark} />
      {/* body */}
      <rect x="8" y="11" width="24" height="12" rx="2" fill={body} />
      {/* cab */}
      <rect x="10" y="8" width="16" height="8" rx="2" fill={mid} />
      {/* windshield */}
      <rect x="20" y="9" width="5" height="5" rx="1" fill={glass} />
      {/* main boom (goes up-right) */}
      <rect
        x="30"
        y="9"
        width="18"
        height="4"
        rx="2"
        fill={arm}
        transform="rotate(-35 30 13)"
      />
      {/* arm (goes down-right from boom) */}
      <rect
        x="43"
        y="2"
        width="14"
        height="3"
        rx="1.5"
        fill={arm}
        transform="rotate(20 43 4)"
      />
      {/* bucket */}
      <path
        d="M52 10 L58 13 L55 18 L50 16 Z"
        fill={dark}
        stroke={mid}
        strokeWidth="0.5"
      />
    </svg>
  );
}

const iconComponents: Record<CategoryId, (props: { tint: boolean }) => React.JSX.Element> = {
  "prime-mover": PrimeMoverIcon,
  trailers: TrailerIcon,
  tippers: TipperIcon,
  container: ContainerIcon,
  buses: BusIcon,
  equipment: ExcavatorIcon,
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
