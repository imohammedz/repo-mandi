"use client";

import Image, { type ImageProps } from "next/image";
import { useEffect, useState } from "react";
import { resolveImageSrcForRender, shouldLogMediaDebug, VEHICLE_IMAGE_PLACEHOLDER_SRC } from "@/lib/media";

type SafeImageProps = Omit<ImageProps, "src"> & {
  src: string;
  alt: string;
  fallbackSrc?: string;
  logContext?: Record<string, unknown>;
};

export function SafeImage({
  src,
  alt,
  fallbackSrc = VEHICLE_IMAGE_PLACEHOLDER_SRC,
  logContext,
  onError,
  ...props
}: SafeImageProps) {
  const normalizedSrc = resolveImageSrcForRender(src, fallbackSrc);
  const [failedSource, setFailedSource] = useState<string | null>(null);
  const displaySrc = failedSource === normalizedSrc ? fallbackSrc : normalizedSrc;
  const serializedLogContext = JSON.stringify(logContext ?? {});

  useEffect(() => {
    if (!shouldLogMediaDebug()) return;
    console.info("Rendered frontend image URL", {
      component: "SafeImage",
      src: displaySrc,
      ...JSON.parse(serializedLogContext),
    });
  }, [displaySrc, serializedLogContext]);

  return (
    <Image
      key={normalizedSrc}
      src={displaySrc}
      alt={alt}
      onError={(event) => {
        setFailedSource(normalizedSrc);
        onError?.(event);
      }}
      {...props}
    />
  );
}
