"use client";

import { useMemo, useState } from "react";
import { resolveImageSrcForRender, VEHICLE_IMAGE_PLACEHOLDER_SRC } from "@/lib/media";
import { SafeImage } from "@/components/ui/safe-image";

type Props = {
  images: string[];
  title: string;
  videoCount?: number;
};

export function ImageGallery({ images, title, videoCount = 0 }: Props) {
  const normalizedImages = useMemo(() => {
    const resolved = images.map((image) => resolveImageSrcForRender(image));
    const deduped = Array.from(new Set(resolved.filter(Boolean)));
    return deduped.length > 0 ? deduped : [VEHICLE_IMAGE_PLACEHOLDER_SRC];
  }, [images]);
  const [active, setActive] = useState(0);
  const activeImage = normalizedImages[active] ?? normalizedImages[0] ?? VEHICLE_IMAGE_PLACEHOLDER_SRC;

  return (
    <div className="space-y-3">
      <div className="relative overflow-hidden rounded-2xl bg-slate-100 md:hidden">
        <div className="pointer-events-none absolute left-3 top-3 z-10 flex flex-wrap gap-2">
          <span className="rounded-full bg-black/65 px-2 py-1 text-[11px] font-medium text-white">
            {normalizedImages.length} Photos
          </span>
          {videoCount > 0 ? (
            <span className="rounded-full bg-black/65 px-2 py-1 text-[11px] font-medium text-white">
              {videoCount} Videos
            </span>
          ) : null}
        </div>
        <div className="flex snap-x snap-mandatory overflow-x-auto">
          {normalizedImages.map((image, index) => (
            <div key={`${image}-${index}`} className="w-full shrink-0 snap-center">
              <SafeImage
                src={image}
                alt={`${title} photo ${index + 1}`}
                width={1200}
                height={720}
                className="h-64 w-full object-cover"
                priority={index === 0}
                logContext={{ component: "ImageGallery", imageType: "swipe", index }}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="hidden space-y-3 md:block">
        <div className="relative overflow-hidden rounded-2xl bg-slate-100">
          <div className="pointer-events-none absolute left-3 top-3 z-10 flex flex-wrap gap-2">
            <span className="rounded-full bg-black/65 px-2 py-1 text-[11px] font-medium text-white">
              {normalizedImages.length} Photos
            </span>
            {videoCount > 0 ? (
              <span className="rounded-full bg-black/65 px-2 py-1 text-[11px] font-medium text-white">
                {videoCount} Videos
              </span>
            ) : null}
          </div>
          <SafeImage
            src={activeImage}
            alt={title}
            width={1200}
            height={720}
            className="h-[28rem] w-full object-cover"
            priority
            logContext={{ component: "ImageGallery", imageType: "active" }}
          />
        </div>
        <div className="grid grid-cols-6 gap-2">
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
    </div>
  );
}
