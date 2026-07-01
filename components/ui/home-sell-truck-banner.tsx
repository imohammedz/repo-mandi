"use client";

import { useEffect, useRef, useState } from "react";
import SellTruckCard from "@/components/ui/SellTruckCard";

const FIXED_BOTTOM_OFFSET = "72px";
const SLOT_VISIBILITY_THRESHOLD = 0.15;

export function HomeSellTruckBanner() {
  const slotRef = useRef<HTMLDivElement | null>(null);
  const slotVisibleRef = useRef(false);
  const [showFixedBanner, setShowFixedBanner] = useState(false);

  useEffect(() => {
    const slot = slotRef.current;

    if (!slot) {
      return;
    }

    let previousScrollY = window.scrollY;
    let animationFrameId = 0;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];

        if (!entry) {
          return;
        }

        slotVisibleRef.current = entry.isIntersecting;

        if (entry.isIntersecting) {
          setShowFixedBanner(false);
        }
      },
      {
        threshold: SLOT_VISIBILITY_THRESHOLD,
      },
    );

    const handleScroll = () => {
      if (animationFrameId) {
        window.cancelAnimationFrame(animationFrameId);
      }

      animationFrameId = window.requestAnimationFrame(() => {
        const currentScrollY = window.scrollY;
        const scrollingUp = currentScrollY < previousScrollY;
        const scrollingDown = currentScrollY > previousScrollY;

        previousScrollY = currentScrollY;

        // Hide the fixed banner when the user is back at the top, when they are
        // scrolling down toward the banner's inline slot, or when that slot is
        // already visible between "Why trust us" and the contact card.
        const shouldHideFixedBanner =
          currentScrollY <= 0 || scrollingDown || slotVisibleRef.current;

        if (shouldHideFixedBanner) {
          setShowFixedBanner(false);
          return;
        }

        if (scrollingUp) {
          setShowFixedBanner(true);
        }

        animationFrameId = 0;
      });
    };

    observer.observe(slot);
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      observer.disconnect();
      if (animationFrameId) {
        window.cancelAnimationFrame(animationFrameId);
      }
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <>
      {showFixedBanner ? (
        <div className="pointer-events-none fixed inset-x-0 z-30 px-3" style={{ bottom: FIXED_BOTTOM_OFFSET }}>
          <div className="pointer-events-auto mx-auto w-full max-w-xl">
            <SellTruckCard />
          </div>
        </div>
      ) : null}

      <div ref={slotRef} className="mt-4 px-3">
        {showFixedBanner ? <div aria-hidden="true" className="h-[68px]" /> : <SellTruckCard />}
      </div>
    </>
  );
}
