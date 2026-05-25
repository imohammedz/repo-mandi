"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { resolveImageSrcForRender, VEHICLE_IMAGE_PLACEHOLDER_SRC } from "@/lib/media";

export function ImageGallery({ images, title }: { images: string[]; title: string }) {
  const normalizedImages = useMemo(() => {
    const resolved = images.map((image) => resolveImageSrcForRender(image));
    const deduped = Array.from(new Set(resolved.filter(Boolean)));
    return deduped.length > 0 ? deduped : [VEHICLE_IMAGE_PLACEHOLDER_SRC];
  }, [images]);
  const [active, setActive] = useState(0);
  const [activeImage, setActiveImage] = useState(normalizedImages[0]);

  useEffect(() => {
    const nextImage = normalizedImages[active] ?? normalizedImages[0] ?? VEHICLE_IMAGE_PLACEHOLDER_SRC;
    setActiveImage(nextImage);
  }, [active, normalizedImages]);

  useEffect(() => {
    console.info("Rendered frontend image URL", {
      component: "ImageGallery",
      activeImage,
    });
  }, [activeImage]);

  return (
    <div className="space-y-3">
      <div className="relative overflow-hidden rounded-2xl bg-slate-100">
        <Image
          src={activeImage}
          alt={title}
          width={1200}
          height={720}
          className="h-64 w-full object-cover"
          priority
          onError={() => setActiveImage(VEHICLE_IMAGE_PLACEHOLDER_SRC)}
        />
      </div>
      <div className="grid grid-cols-4 gap-2">
        {normalizedImages.map((image, index) => (
          <button
            key={`${image}-${index}`}
            onClick={() => setActive(index)}
            className={`overflow-hidden rounded-xl border ${active === index ? "border-slate-900" : "border-slate-200"}`}
          >
            <Image
              src={image}
              alt={`${title} ${index + 1}`}
              width={300}
              height={200}
              className="h-16 w-full object-cover"
              onError={() => setActiveImage(VEHICLE_IMAGE_PLACEHOLDER_SRC)}
            />
          </button>
        ))}
      </div>
    </div>
  );
}
