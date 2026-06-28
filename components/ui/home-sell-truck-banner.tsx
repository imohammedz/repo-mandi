"use client";

import { useEffect, useRef, useState } from "react";
import SellTruckCard from "@/components/ui/SellTruckCard";

const FIXED_BOTTOM_OFFSET = "72px";

export function HomeSellTruckBanner() {
  const slotRef = useRef<HTMLDivElement | null>(null);
  const slotVisibleRef = useRef(false);
  const [slotVisible, setSlotVisible] = useState(false);
  const [showFixedBanner, setShowFixedBanner] = useState(false);

  useEffect(() => {
    slotVisibleRef.current = slotVisible;

    if (slotVisible) {
      setShowFixedBanner(false);
    }
  }, [slotVisible]);

  useEffect(() => {
    const slot = slotRef.current;

    if (!slot) {
      return;
    }

    let previousScrollY = window.scrollY;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setSlotVisible(entry.isIntersecting);
      },
      {
        threshold: 0.15,
      },
    );

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const scrollingUp = currentScrollY < previousScrollY;
      const scrollingDown = currentScrollY > previousScrollY;

      previousScrollY = currentScrollY;

      if (currentScrollY <= 0 || scrollingDown || slotVisibleRef.current) {
        setShowFixedBanner(false);
        return;
      }

      if (scrollingUp) {
        setShowFixedBanner(true);
      }
    };

    observer.observe(slot);
    handleScroll();

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      observer.disconnect();
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

      <div ref={slotRef} className="mt-6 px-3">
        <SellTruckCard />
      </div>
    </>
  );
}
