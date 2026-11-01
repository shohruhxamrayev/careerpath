"use client";

import { motion } from "framer-motion";
import { CalendarClock, CheckCircle2, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { GlobePoint } from "@/components/three/Globe";
import { LazyGlobe } from "@/components/three/lazy";

export function HeroGlobe({ points, arcTo, highlights }: { points: GlobePoint[]; arcTo: string[]; highlights: { uni: string; uniScore: number; scholarship: string } }) {
  const router = useRouter();
  const [hover, setHover] = useState<string | null>(null);
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[640px]">
      <div className="pointer-events-none absolute inset-[12%] rounded-full bg-mint/10 blur-[80px]" aria-hidden />
      <LazyGlobe
        className="relative h-full w-full"
        points={points}
        origin={{ lat: 41.31, lng: 69.28, label: "Tashkent" }}
        arcTo={arcTo}
        autoRotate
        beams
        stars
        interactive
        onHover={setHover}
        onSelect={(id) => router.push(`/universities/${id}`)}
      />
      {/* Floating proof cards — values are produced by the real matching engine for an example profile */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: hover ? 0.25 : 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.6 }}
        className="night-card pointer-events-none absolute left-0 top-[14%] hidden w-[230px] p-3.5 shadow-pop sm:block"
      >
        <p className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-mint"><Sparkles className="h-3 w-3" /> Profile Match</p>
        <p className="mt-1.5 text-[13.5px] font-semibold text-white">{highlights.uni}</p>
        <div className="mt-2 flex items-center gap-2">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-mint to-peri" style={{ width: `${highlights.uniScore}%` }} /></div>
          <span className="font-mono text-[12px] text-white">{highlights.uniScore}%</span>
        </div>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: hover ? 0.25 : 1, y: 0 }}
        transition={{ delay: 0.9, duration: 0.6 }}
        className="night-card pointer-events-none absolute bottom-[16%] right-0 hidden w-[240px] p-3.5 shadow-pop sm:block"
      >
        <p className="flex items-center gap-1.5 text-[12.5px] text-night-200"><CheckCircle2 className="h-3.5 w-3.5 text-mint" /> Eligible · {highlights.scholarship}</p>
        <p className="mt-2 flex items-center gap-1.5 text-[12.5px] text-night-200"><CalendarClock className="h-3.5 w-3.5 text-sun" /> Added to your planner</p>
      </motion.div>
      <p className="pointer-events-none absolute bottom-1 left-1/2 -translate-x-1/2 whitespace-nowrap font-mono text-[10.5px] uppercase tracking-wider text-night-400">
        Drag to spin · hover a point · click to open
      </p>
    </div>
  );
}
