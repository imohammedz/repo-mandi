"use client";

import { useMemo, useState } from "react";
import { resolveImageSrcForRender, VEHICLE_IMAGE_PLACEHOLDER_SRC } from "@/lib/media";
import { SafeImage } from "@/components/ui/safe-image";

export function ImageGallery({ images, title }: { images: string[]; title: string }) {
  const normalizedImages = useMemo(() => {
    const resolved = images.map((image) => resolveImageSrcForRender(image));
    const deduped = Array.from(new Set(resolved.filter(Boolean)));
    return deduped.length > 0 ? deduped : [VEHICLE_IMAGE_PLACEHOLDER_SRC];
  }, [images]);
  const [active, setActive] = useState(0);
  const activeImage = normalizedImages[active] ?? normalizedImages[0] ?? VEHICLE_IMAGE_PLACEHOLDER_SRC;

  return (
    <div className="space-y-3">
      <div className="relative overflow-hidden rounded-2xl bg-slate-100">
        <SafeImage
          src={activeImage}
          alt={title}
          width={1200}
          height={720}
          className="h-64 w-full object-cover"
          priority
          logContext={{ component: "ImageGallery", imageType: "active" }}
        />
      </div>
      <div className="grid grid-cols-4 gap-2">
        {normalizedImages.map((image, index) => (
          <button
            key={`${image}-${index}`}
            onClick={() => setActive(index)}
            className={`overflow-hidden rounded-xl border ${active === index ? "border-slate-900" : "border-slate-200"}`}
          >
            <SafeImage
              src={image}
              alt={`${title} ${index + 1}`}
              width={300}
              height={200}
              className="h-16 w-full object-cover"
              logContext={{ component: "ImageGallery", imageType: "thumbnail", index }}
            />
          </button>
        ))}
      </div>
    </div>
  );
}
