"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Play, X } from "lucide-react";
import { resolveImageSrcForRender, VEHICLE_IMAGE_PLACEHOLDER_SRC } from "@/lib/media";
import { SafeImage } from "@/components/ui/safe-image";

export type GalleryMediaItem = {
  kind: "image" | "video";
  thumbnailUrl?: string;
  mediumUrl?: string;
  fullUrl?: string;
  url?: string;
  category?: string;
};

type Props = {
  media: GalleryMediaItem[];
  title: string;
};

type ResolvedGalleryItem = {
  kind: "image" | "video";
  thumbnailUrl: string;
  mediumUrl: string;
  fullUrl: string;
  category?: string;
};

export function ImageGallery({ media, title }: Props) {
  const resolvedMedia = useMemo<ResolvedGalleryItem[]>(() => {
    const seen = new Set<string>();
    const normalized: ResolvedGalleryItem[] = [];

    for (const item of media) {
      if (item.kind === "video") {
        const base = item.url || item.mediumUrl || item.fullUrl || item.thumbnailUrl;
        if (!base) continue;
        const key = `video:${base}`;
        if (seen.has(key)) continue;
        seen.add(key);
        normalized.push({
          kind: "video",
          thumbnailUrl: item.thumbnailUrl || base,
          mediumUrl: item.mediumUrl || base,
          fullUrl: item.fullUrl || base,
          category: item.category,
        });
        continue;
      }

      const thumbnailUrl = resolveImageSrcForRender(item.thumbnailUrl || item.url || item.mediumUrl || item.fullUrl);
      const mediumUrl = resolveImageSrcForRender(item.mediumUrl || item.url || item.fullUrl, thumbnailUrl);
      const fullUrl = resolveImageSrcForRender(item.fullUrl || item.url || item.mediumUrl, mediumUrl);
      if (!mediumUrl) continue;
      const key = `image:${fullUrl || mediumUrl}`;
      if (seen.has(key)) continue;
      seen.add(key);
      normalized.push({
        kind: "image",
        thumbnailUrl: thumbnailUrl || mediumUrl,
        mediumUrl: mediumUrl || thumbnailUrl || VEHICLE_IMAGE_PLACEHOLDER_SRC,
        fullUrl: fullUrl || mediumUrl || thumbnailUrl || VEHICLE_IMAGE_PLACEHOLDER_SRC,
        category: item.category,
      });
    }

    return normalized;
  }, [media]);

  const photoCount = resolvedMedia.filter((item) => item.kind === "image").length;
  const videoCount = resolvedMedia.filter((item) => item.kind === "video").length;
  const [active, setActive] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const activeMedia = resolvedMedia[active] ?? null;
  const hasMedia = resolvedMedia.length > 0;

  const changeActive = useCallback(
    (next: number) => {
      if (!hasMedia) return;
      const length = resolvedMedia.length;
      const normalized = (next + length) % length;
      setActive(normalized);
    },
    [hasMedia, resolvedMedia.length]
  );

  useEffect(() => {
    if (!lightboxOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setLightboxOpen(false);
      }
      if (event.key === "ArrowLeft") {
        changeActive(active - 1);
      }
      if (event.key === "ArrowRight") {
        changeActive(active + 1);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [active, changeActive, lightboxOpen]);

  if (!hasMedia) {
    return (
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="flex aspect-[4/3] items-center justify-center bg-slate-100 px-4 text-center text-sm text-slate-500">
          Photos not uploaded yet
        </div>
      </div>
    );
  }

  const renderMainMedia = (item: ResolvedGalleryItem, isPriority: boolean) => {
    const videoLabel = item.category
      ? `${title} ${item.category.toLowerCase().replace(/_/g, " ")} video`
      : `${title} video`;
    if (item.kind === "video") {
      return (
        <video
          src={item.mediumUrl}
          controls
          preload="metadata"
          className="h-full w-full object-cover"
          aria-label={videoLabel}
        />
      );
    }

    return (
      <SafeImage
        src={item.mediumUrl}
        alt={title}
        fill
        className="object-contain"
        priority={isPriority}
        sizes="(max-width: 768px) 100vw, 768px"
        logContext={{ component: "ImageGallery", imageType: "active", index: active }}
      />
    );
  };

  const renderLightboxMedia = (item: ResolvedGalleryItem) => {
    const videoLabel = item.category
      ? `${title} ${item.category.toLowerCase().replace(/_/g, " ")} video fullscreen`
      : `${title} video fullscreen`;
    if (item.kind === "video") {
      return (
        <video
          src={item.fullUrl}
          controls
          autoPlay
          className="max-h-[85vh] w-full rounded-xl bg-black object-contain"
          aria-label={videoLabel}
        />
      );
    }
    return (
      <SafeImage
        src={item.fullUrl}
        alt={title}
        width={1600}
        height={1000}
        className="max-h-[85vh] w-full object-contain"
        sizes="100vw"
        priority
        logContext={{ component: "ImageGallery", imageType: "lightbox", index: active }}
      />
    );
  };

  const renderThumbnail = (item: ResolvedGalleryItem, index: number) => {
    if (item.kind === "video") {
      return (
        <div className="relative h-16 w-full overflow-hidden rounded-lg bg-black">
          <video
            src={item.thumbnailUrl}
            preload="metadata"
            className="h-full w-full object-cover opacity-80"
            aria-label={`${title} video thumbnail ${index + 1}`}
          />
          <span className="absolute inset-0 flex items-center justify-center">
            <Play className="h-4 w-4 text-white" />
          </span>
        </div>
      );
    }

    return (
      <SafeImage
        src={item.thumbnailUrl}
        alt={`${title} thumbnail ${index + 1}`}
        width={200}
        height={120}
        className="h-16 w-full rounded-lg object-cover"
        sizes="96px"
        loading="lazy"
        logContext={{ component: "ImageGallery", imageType: "thumbnail", index }}
      />
    );
  };

  return (
    <>
      <div className="space-y-3">
        <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
          <div className="pointer-events-none absolute left-3 top-3 z-10 flex flex-wrap gap-2">
            <span className="rounded-full bg-black/65 px-2 py-1 text-[11px] font-medium text-white">
              {photoCount} Photos
            </span>
            {videoCount > 0 ? (
              <span className="rounded-full bg-black/65 px-2 py-1 text-[11px] font-medium text-white">
                {videoCount} Videos
              </span>
            ) : null}
            <span className="rounded-full bg-black/65 px-2 py-1 text-[11px] font-medium text-white">
              {active + 1}/{resolvedMedia.length}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setLightboxOpen(true)}
            className="relative block aspect-[4/3] w-full"
            aria-label="Open gallery fullscreen"
          >
            {activeMedia ? renderMainMedia(activeMedia, active === 0) : null}
          </button>
          {resolvedMedia.length > 1 ? (
            <>
              <button
                type="button"
                onClick={() => changeActive(active - 1)}
                className="absolute left-3 top-1/2 z-10 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/60 text-white"
                aria-label="Previous media"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => changeActive(active + 1)}
                className="absolute right-3 top-1/2 z-10 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/60 text-white"
                aria-label="Next media"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          ) : null}
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {resolvedMedia.map((item, index) => (
            <button
              key={`${item.kind}-${index}`}
              type="button"
              onClick={() => setActive(index)}
              className={`w-24 shrink-0 rounded-xl border p-0.5 ${active === index ? "border-slate-900" : "border-slate-200"}`}
              aria-label={`Select media ${index + 1}`}
            >
              {renderThumbnail(item, index)}
            </button>
          ))}
        </div>
      </div>

      {lightboxOpen && activeMedia ? (
        <div
          className="fixed inset-0 z-50 bg-black/90 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Image viewer"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setLightboxOpen(false);
            }
          }}
        >
          <button
            type="button"
            onClick={() => setLightboxOpen(false)}
            className="absolute right-4 top-4 z-10 inline-flex h-12 w-12 items-center justify-center rounded-full bg-white/20 text-white"
            aria-label="Close image viewer"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="pointer-events-none absolute left-4 top-4 z-10 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white">
            {active + 1} / {resolvedMedia.length}
          </div>
          <div className="mx-auto flex h-full w-full max-w-5xl items-center justify-center">
            {renderLightboxMedia(activeMedia)}
          </div>
          {resolvedMedia.length > 1 ? (
            <>
              <button
                type="button"
                onClick={() => changeActive(active - 1)}
                className="absolute left-4 top-1/2 inline-flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/20 text-white"
                aria-label="Previous media fullscreen"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => changeActive(active + 1)}
                className="absolute right-4 top-1/2 inline-flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/20 text-white"
                aria-label="Next media fullscreen"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
