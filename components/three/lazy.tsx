"use client";

import dynamic from "next/dynamic";
import { GlobeFallback } from "./Globe";

/** 3D scenes load on the client only, after first paint, so pages stay fast. */
export const LazyGlobe = dynamic(() => import("./Globe"), {
  ssr: false,
  loading: () => <GlobeFallback className="h-full w-full" />,
});

export const LazyConstellation = dynamic(() => import("./Constellation"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center" aria-hidden>
      <div className="h-40 w-40 animate-glow-pulse rounded-full bg-mint/10 blur-2xl" />
    </div>
  ),
});
