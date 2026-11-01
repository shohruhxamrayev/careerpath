"use client";

import { ArrowRight, MapPin, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { SaveButton } from "@/components/actions";
import { MatchPill } from "@/components/match";
import { LazyGlobe } from "@/components/three/lazy";
import { AID_LABELS } from "@/lib/data/taxonomy";
import type { MatchResult } from "@/lib/matching/types";
import type { University } from "@/lib/types";
import { cn } from "@/lib/utils";

/** Interactive 3D globe of the currently filtered universities, with a synced list and detail card. */
export function GlobeExplorer({ rows, fromTashkent }: { rows: { u: University; m?: MatchResult }[]; fromTashkent: boolean }) {
  const [focus, setFocus] = useState<string | null>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const points = useMemo(
    () =>
      rows
        .filter(({ u }) => u.geo)
        .map(({ u, m }) => ({
          id: u.slug,
          label: u.shortName ?? u.name,
          sub: `${u.city}, ${u.country}${m ? ` · ${m.score}% match` : u.qsRank ? ` · QS #${u.qsRank}` : ""}`,
          lat: u.geo![0],
          lng: u.geo![1],
          weight: m ? m.score / 100 : u.qsRank ? Math.max(0.35, 1 - u.qsRank / 140) : 0.3,
        })),
    [rows],
  );
  const arcTo = useMemo(() => (fromTashkent ? rows.filter((r) => r.m && r.m.eligible !== false).slice(0, 5).map((r) => r.u.slug) : []), [rows, fromTashkent]);
  const sel = rows.find((r) => r.u.slug === focus);

  useEffect(() => {
    if (focus && !rows.some((r) => r.u.slug === focus)) setFocus(null);
  }, [rows, focus]);
  useEffect(() => {
    if (!focus) return;
    listRef.current?.querySelector<HTMLElement>(`[data-slug="${focus}"]`)?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [focus]);

  return (
    <div className="night overflow-hidden rounded-2xl border border-white/[0.08] bg-night-900 shadow-pop">
      <div className="grid lg:grid-cols-[320px_1fr]">
        <ul ref={listRef} className="order-2 max-h-[360px] divide-y divide-white/[0.06] overflow-y-auto border-white/[0.08] lg:order-1 lg:max-h-[600px] lg:border-r" aria-label="Universities on the globe">
          {rows.map(({ u, m }) => (
            <li key={u.slug} data-slug={u.slug}>
              <button
                onClick={() => setFocus(u.slug)}
                aria-pressed={focus === u.slug}
                className={cn("flex w-full items-center gap-3 px-4 py-3 text-left transition-colors", focus === u.slug ? "bg-mint/10" : "hover:bg-white/[0.04]")}
              >
                <span className="w-9 shrink-0 font-mono text-[11px] text-night-400">{u.qsRank ? `#${u.qsRank}` : "—"}</span>
                <span className="min-w-0 flex-1">
                  <span className={cn("block truncate text-[13.5px]", focus === u.slug ? "font-medium text-white" : "text-night-100")}>{u.name}</span>
                  <span className="block truncate text-[11.5px] text-night-400">{u.city}, {u.country}</span>
                </span>
                {m && <span className={cn("shrink-0 font-mono text-[11.5px]", m.eligible === false ? "text-night-400" : "text-mint")}>{m.eligible === false ? "—" : `${m.score}%`}</span>}
              </button>
            </li>
          ))}
        </ul>
        <div className="relative order-1 h-[380px] sm:h-[480px] lg:order-2 lg:h-[600px]">
          <div className="night-grid pointer-events-none absolute inset-0 opacity-40 [mask-image:radial-gradient(circle,black,transparent_70%)]" aria-hidden />
          <LazyGlobe
            className="relative h-full w-full"
            points={points}
            focusId={focus}
            interactive
            zoom
            autoRotate={!focus}
            origin={fromTashkent ? { lat: 41.31, lng: 69.28, label: "Tashkent" } : undefined}
            arcTo={arcTo}
            onSelect={setFocus}
          />
          <p className="pointer-events-none absolute left-4 top-4 font-mono text-[10.5px] uppercase tracking-wider text-night-400">
            {points.length} on the globe · drag · scroll to zoom
          </p>
          {sel && (
            <div className="absolute inset-x-3 bottom-3 animate-fade-in rounded-xl border border-white/10 bg-night-800/90 p-4 shadow-pop backdrop-blur-xl sm:inset-x-auto sm:right-4 sm:w-[340px]">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-[15px] font-semibold text-white">{sel.u.name}</p>
                  <p className="mt-0.5 flex items-center gap-1 text-[12px] text-night-300"><MapPin className="h-3 w-3" /> {sel.u.city}, {sel.u.country}</p>
                </div>
                <button onClick={() => setFocus(null)} className="rounded p-1 text-night-400 hover:text-white" aria-label="Close"><X className="h-4 w-4" /></button>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {sel.m && <MatchPill score={sel.m.score} eligible={sel.m.eligible} />}
                {sel.u.qsRank && <span className="rounded border border-white/15 px-1.5 py-0.5 text-[11.5px] text-night-200">QS 2027 #{sel.u.qsRank}</span>}
                <span className="rounded bg-white/[0.06] px-1.5 py-0.5 text-[11.5px] text-night-200">{AID_LABELS[sel.u.aid.kind]}</span>
              </div>
              <p className="mt-3 line-clamp-2 text-[12.5px] text-night-300">{sel.u.tuition.display}</p>
              <div className="mt-4 flex items-center gap-2">
                <Link href={`/universities/${sel.u.slug}`} className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-md bg-mint px-3 py-2 text-[13px] font-medium text-night-900 hover:bg-mint-300">
                  View details <ArrowRight className="h-3.5 w-3.5" />
                </Link>
                <SaveButton kind="university" slug={sel.u.slug} title={sel.u.shortName ?? sel.u.name} className="h-9 w-9 border-white/15 bg-white/[0.05] text-night-100" />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
