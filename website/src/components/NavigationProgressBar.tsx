"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export default function NavigationProgressBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isNavigating, setIsNavigating] = useState(false);

  // When pathname or searchParams change, the navigation has completed
  useEffect(() => {
    setIsNavigating(false);
  }, [pathname, searchParams]);

  // Listen to clicks on navigation links to provide immediate 0ms haptic feedback
  useEffect(() => {
    const handleLinkClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest("a");
      if (!target) return;

      const href = target.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("http") || href.startsWith("mailto:")) {
        return;
      }

      // If clicking the current path without param changes, don't trigger
      const currentUrl = `${window.location.pathname}${window.location.search}`;
      if (href === currentUrl) return;

      setIsNavigating(true);
    };

    document.addEventListener("click", handleLinkClick);
    return () => document.removeEventListener("click", handleLinkClick);
  }, []);

  if (!isNavigating) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-[2.5px] bg-black/40 overflow-hidden pointer-events-none">
      <div className="h-full bg-gradient-to-r from-transparent via-[#E10600] to-amber-400 f1-laser-bar shadow-[0_0_10px_#E10600]" />
    </div>
  );
}
