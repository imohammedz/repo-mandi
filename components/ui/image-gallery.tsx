"use client";

import Image from "next/image";
import { useState } from "react";

export function ImageGallery({ images, title }: { images: string[]; title: string }) {
  const [active, setActive] = useState(0);
  const activeImage = images[active] ?? images[0];

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
        />
      </div>
      <div className="grid grid-cols-4 gap-2">
        {images.map((image, index) => (
          <button
            key={image}
            onClick={() => setActive(index)}
            className={`overflow-hidden rounded-xl border ${active === index ? "border-slate-900" : "border-slate-200"}`}
          >
            <Image
              src={image}
              alt={`${title} ${index + 1}`}
              width={300}
              height={200}
              className="h-16 w-full object-cover"
            />
          </button>
        ))}
      </div>
    </div>
  );
}
