"use client";

import { LazyGlobe } from "@/components/three/lazy";

/** Small 3D globe that spins to one university's location (used on detail pages). */
export function LocationGlobe({ id, label, sub, lat, lng }: { id: string; label: string; sub: string; lat: number; lng: number }) {
  return (
    <div className="night relative mb-4 overflow-hidden rounded-xl border border-white/[0.08] bg-night-900">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_60%,rgba(94,234,176,0.12),transparent_65%)]" aria-hidden />
      <LazyGlobe className="relative h-[230px] w-full" points={[{ id, label, sub, lat, lng, weight: 1 }]} focusId={id} />
      <div className="relative border-t border-white/[0.07] px-4 py-3">
        <p className="font-mono text-[10.5px] uppercase tracking-wider text-mint/80">Location</p>
        <p className="text-[13.5px] text-white">{sub}</p>
      </div>
    </div>
  );
}
