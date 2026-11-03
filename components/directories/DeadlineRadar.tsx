"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { curatedOpportunities as opportunities } from "@/lib/data/opportunities";
import { OPPORTUNITY_TYPE_PLURAL } from "@/lib/data/taxonomy";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const C = 160; // centre
const R0 = 62; // inner radius
const R1 = 142; // max bar radius

function polar(r: number, a: number): [number, number] {
  return [C + r * Math.sin(a), C - r * Math.cos(a)];
}

/**
 * A 12-month radar of typical opportunity deadlines. The current month sits at the top,
 * bars show how many programmes usually close in each month, and the sweep highlights the
 * next three months (which links to the matching filter).
 */
export function DeadlineRadar() {
  const [now, setNow] = useState<number | null>(null);
  const [hover, setHover] = useState<number | null>(null);
  useEffect(() => setNow(new Date().getMonth()), []);

  const byMonth = useMemo(() => {
    const m = Array.from({ length: 12 }, () => [] as typeof opportunities);
    for (const o of opportunities) for (const mo of o.deadline.months) m[mo - 1]?.push(o);
    return m;
  }, []);
  const max = Math.max(1, ...byMonth.map((x) => x.length));
  const start = now ?? 0;
  const step = (Math.PI * 2) / 12;
  const order = Array.from({ length: 12 }, (_, i) => (start + i) % 12);
  const next3 = new Set(order.slice(0, 3).flatMap((mi) => byMonth[mi].map((o) => o.slug))).size;
  const focus = hover ?? start;
  const focusTypes = Object.entries(
    byMonth[focus].reduce<Record<string, number>>((acc, o) => ((acc[o.type] = (acc[o.type] ?? 0) + 1), acc), {}),
  ).sort((a, b) => b[1] - a[1]).slice(0, 3);

  return (
    <div className="relative mx-auto hidden w-full max-w-[420px] lg:block" aria-label="Deadline radar: how many opportunities typically close in each month">
      <svg viewBox="0 0 320 320" className="w-full overflow-visible">
        <defs>
          <radialGradient id="dr-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#8CCFB4" stopOpacity="0.16" />
            <stop offset="100%" stopColor="#8CCFB4" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="dr-sweep" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="#8CCFB4" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#A7B4DA" stopOpacity="0.04" />
          </linearGradient>
        </defs>
        <circle cx={C} cy={C} r={R1 + 10} fill="url(#dr-glow)" />
        {[R0, (R0 + R1) / 2, R1].map((r) => (
          <circle key={r} cx={C} cy={C} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeDasharray={r === R1 ? "2 4" : undefined} />
        ))}
        {/* next-3-months sweep */}
        {now !== null && (() => {
          const a0 = -step / 2, a1 = step * 2.5;
          const [x0, y0] = polar(R1 + 6, a0);
          const [x1, y1] = polar(R1 + 6, a1);
          return <path d={`M${C},${C} L${x0},${y0} A${R1 + 6},${R1 + 6} 0 0 1 ${x1},${y1} Z`} fill="url(#dr-sweep)" className="animate-[pulse_4s_ease-in-out_infinite]" />;
        })()}
        {order.map((mi, i) => {
          const a = i * step;
          const n = byMonth[mi].length;
          const len = R0 + ((R1 - R0) * n) / max;
          const [xa, ya] = polar(R0, a);
          const [xb, yb] = polar(len, a);
          const [xl, yl] = polar(R1 + 20, a);
          const active = focus === mi;
          const soon = now !== null && i < 3;
          return (
            <g key={mi} onMouseEnter={() => setHover(mi)} onMouseLeave={() => setHover(null)} className="cursor-default">
              <line x1={xa} y1={ya} x2={polar(R1, a)[0]} y2={polar(R1, a)[1]} stroke="transparent" strokeWidth={22} />
              <line x1={xa} y1={ya} x2={xb} y2={yb} stroke={soon ? "#8CCFB4" : "#A7B4DA"} strokeOpacity={active ? 1 : soon ? 0.85 : 0.4} strokeWidth={active ? 9 : 7} strokeLinecap="round" style={{ transition: "all .25s" }} />
              <circle cx={xb} cy={yb} r={active ? 4 : 2.5} fill={soon ? "#8CCFB4" : "#D3DAEE"} />
              <text x={xl} y={yl} textAnchor="middle" dominantBaseline="middle" className="font-mono" fontSize="9.5" fill={active ? "#fff" : "rgba(255,255,255,0.45)"} letterSpacing="0.08em">
                {MONTHS[mi].toUpperCase()}
              </text>
            </g>
          );
        })}
        <circle cx={C} cy={C} r={R0 - 8} fill="#121B2B" stroke="rgba(140,207,180,0.25)" />
        <text x={C} y={C - 8} textAnchor="middle" fill="#fff" fontSize="26" fontWeight={600}>{byMonth[focus].length}</text>
        <text x={C} y={C + 12} textAnchor="middle" fill="rgba(255,255,255,0.55)" fontSize="9" className="font-mono" letterSpacing="0.08em">
          CLOSE IN {MONTHS[focus].toUpperCase()}
        </text>
      </svg>
      <div className="mt-2 flex items-center justify-between gap-4 text-[12.5px] text-night-300">
        <p className="min-h-[18px]">
          {focusTypes.map(([t, n], i) => (
            <span key={t}>{i > 0 && " · "}{n} {OPPORTUNITY_TYPE_PLURAL[t as keyof typeof OPPORTUNITY_TYPE_PLURAL].toLowerCase()}</span>
          ))}
        </p>
        {now !== null && (
          <Link href="/opportunities?deadline=3" className="shrink-0 font-medium text-mint hover:text-white">
            {next3} closing in the next 3 months →
          </Link>
        )}
      </div>
      <p className="mt-1 text-[11px] text-night-400">Typical deadline months — confirm exact dates on each official site.</p>
    </div>
  );
}
