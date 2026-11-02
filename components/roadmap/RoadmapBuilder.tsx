"use client";

import { ArrowUpRight, CalendarPlus, Check, CircleDashed, Flag, Sparkles } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui";
import { useToast } from "@/components/ui/Toast";
import { FIELD_LABELS, FIELDS } from "@/lib/data/taxonomy";
import { universities } from "@/lib/data/universities";
import { isProfileReady } from "@/lib/matching/profile";
import { buildRoadmap, defaultRoadmapInput, LANES, monthToISO, type Lane, type RoadmapInput, type RoadmapItem } from "@/lib/roadmap";
import { useApp } from "@/lib/store/AppProvider";
import type { DegreeLevel, Field } from "@/lib/types";
import { cn } from "@/lib/utils";

const COUNTRY_OPTIONS = Array.from(new Set(universities.map((u) => u.country))).sort();
const COL = 168;
const laneColor = (l: Lane) => LANES.find((x) => x.id === l)!.color;

function intakeOptions(now = new Date()) {
  const out: { value: string; label: string }[] = [];
  for (let y = now.getFullYear(); y <= now.getFullYear() + 3; y++) {
    for (const [m, name] of [[2, "February"], [9, "September"]] as const) {
      const d = new Date(y, m - 1, 1);
      const monthsAway = (d.getFullYear() - now.getFullYear()) * 12 + d.getMonth() - now.getMonth();
      if (monthsAway >= 4 && monthsAway <= 30) out.push({ value: `${y}-${String(m).padStart(2, "0")}`, label: `${name} ${y}` });
    }
  }
  return out;
}

export function RoadmapBuilder() {
  const { user, data, ready, addApplication, addTask } = useApp();
  const toast = useToast();
  const profile = data?.profile ?? null;
  const personalised = !!user && isProfileReady(profile);
  const [input, setInput] = useState<RoadmapInput>(() => defaultRoadmapInput(null));
  const [touched, setTouched] = useState(false);
  const [now, setNow] = useState<Date | null>(null);
  const [added, setAdded] = useState(false);

  useEffect(() => setNow(new Date()), []);
  useEffect(() => {
    if (ready && !touched) setInput(defaultRoadmapInput(personalised ? profile : null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, personalised]);

  const set = <K extends keyof RoadmapInput>(k: K, v: RoadmapInput[K]) => {
    setTouched(true);
    setAdded(false);
    setInput((x) => ({ ...x, [k]: v }));
  };

  const rm = useMemo(() => (now ? buildRoadmap(input, personalised ? profile : null, now) : null), [input, personalised, profile, now]);
  const intakes = useMemo(() => (now ? intakeOptions(now) : []), [now]);

  const addAll = () => {
    if (!rm) return;
    if (!user) {
      toast.info("Log in to add your roadmap to the planner.");
      return;
    }
    const existing = new Set((data?.applications ?? []).map((a) => `${a.kind}:${a.slug}`));
    const existingTasks = new Set((data?.tasks ?? []).map((t) => t.title));
    let apps = 0;
    let tasks = 0;
    for (const it of rm.items) {
      if (it.ref && !existing.has(`${it.ref.kind}:${it.ref.slug}`) && it.lane !== "profile") {
        addApplication({ kind: it.ref.kind, slug: it.ref.slug, title: it.title, subtitle: it.detail, notes: `From your roadmap — typical window ${rm.months[it.month].label}. Confirm the exact date.` });
        apps++;
      } else if (it.kind === "milestone" && !existingTasks.has(`Roadmap: ${it.title}`)) {
        addTask({ title: `Roadmap: ${it.title}`, due: monthToISO(rm.months[it.month]) });
        tasks++;
      }
    }
    setAdded(true);
    toast.success(`Added ${apps} applications and ${tasks} tasks to your planner.`, { label: "Open planner", href: "/planner" });
  };

  const deadlines = rm?.items.filter((i) => i.kind === "deadline").length ?? 0;

  return (
    <div className="flex-1">
      {/* Header */}
      <section className="night relative overflow-hidden bg-night-950">
        <div className="night-grid pointer-events-none absolute inset-0 opacity-50 [mask-image:radial-gradient(ellipse_70%_80%_at_30%_40%,black,transparent)]" aria-hidden />
        <div className="pointer-events-none absolute -right-32 -top-20 h-[420px] w-[620px] rounded-full bg-mint/10 blur-[120px]" aria-hidden />
        <div className="container relative grid gap-10 py-12 sm:py-16 lg:grid-cols-[1.15fr_1fr] lg:items-center [&>*]:min-w-0">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-mint">Roadmap</p>
            <h1 className="display mt-4 text-[40px] leading-[1.02] text-white sm:text-[56px]">
              From today to <span className="font-serif font-normal italic text-mint">day one.</span>
            </h1>
            <p className="mt-4 max-w-xl text-[16px] leading-relaxed text-night-300">
              Tell us where and when you want to study. CareerPath lays out every test, essay, university and scholarship deadline month by month — built from real deadline windows and your Profile Match.
            </p>
            {!personalised && (
              <p className="mt-4 text-[13.5px] text-night-300">
                {user ? <Link href="/profile" className="text-mint hover:underline">Complete your profile</Link> : <Link href="/signup?next=/roadmap" className="text-mint hover:underline">Create a profile</Link>} to rank options by your match and check eligibility.
              </p>
            )}
          </div>
          {rm && <ReadinessCard score={rm.score} readiness={rm.readiness} months={rm.months.length} deadlines={deadlines} />}
        </div>
      </section>

      {/* Controls */}
      <div className="sticky top-16 z-20 border-b border-line bg-paper/95 backdrop-blur">
        <div className="container flex flex-wrap items-end gap-3 py-3">
          <Ctl label="Start studying">
            <select className="input h-10 w-40" value={input.intake} onChange={(e) => set("intake", e.target.value)} aria-label="Intake">
              {intakes.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              {!intakes.some((o) => o.value === input.intake) && <option value={input.intake}>{input.intake}</option>}
            </select>
          </Ctl>
          <Ctl label="Level">
            <select className="input h-10 w-40" value={input.level} onChange={(e) => set("level", e.target.value as DegreeLevel)} aria-label="Level">
              <option value="undergraduate">Bachelor&apos;s</option>
              <option value="masters">Master&apos;s</option>
              <option value="phd">PhD</option>
            </select>
          </Ctl>
          <Ctl label="Field">
            <select className="input h-10 w-48" value={input.fields[0] ?? ""} onChange={(e) => set("fields", e.target.value ? [e.target.value as Field] : [])} aria-label="Field">
              <option value="">Any field</option>
              {FIELDS.map((f) => <option key={f} value={f}>{FIELD_LABELS[f]}</option>)}
            </select>
          </Ctl>
          <Ctl label="IELTS (or equivalent)">
            <input className="input h-10 w-28" type="number" min={4} max={9} step={0.5} value={input.ielts ?? ""} placeholder="None yet" onChange={(e) => set("ielts", e.target.value ? Number(e.target.value) : null)} aria-label="IELTS score" />
          </Ctl>
          <label className="flex h-10 items-center gap-2 text-[13.5px] text-ink-2">
            <input type="checkbox" className="h-4 w-4 accent-brand-600" checked={input.needsFunding} onChange={(e) => set("needsFunding", e.target.checked)} /> I need funding
          </label>
          <div className="ml-auto flex gap-2">
            <Button variant={added ? "secondary" : "primary"} onClick={addAll} disabled={!rm || added}>
              {added ? <Check className="h-4 w-4" /> : <CalendarPlus className="h-4 w-4" />} {added ? "Added to planner" : "Add to planner"}
            </Button>
          </div>
          <div className="w-full min-w-0 basis-full">
            <p className="mb-1.5 text-[12px] font-medium text-ink-3">Destinations</p>
            <div className="scrollbar-none -mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1" role="group" aria-label="Destination countries">
              {COUNTRY_OPTIONS.map((c) => {
                const on = input.countries.includes(c);
                return (
                  <button key={c} type="button" aria-pressed={on} onClick={() => set("countries", on ? input.countries.filter((x) => x !== c) : [...input.countries, c].slice(-4))} className={cn("h-7 shrink-0 whitespace-nowrap rounded-full border px-3 text-[12.5px] transition-colors", on ? "border-brand-600 bg-brand-50 font-medium text-brand-800" : "border-line-strong bg-surface text-ink-3 hover:border-ink-4")}>
                    {c}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {!rm ? (
        <div className="container py-16"><div className="skeleton h-80" /></div>
      ) : (
        <div className="container py-8">
          {rm.notes.map((n) => <p key={n} className="mb-4 rounded-lg border border-warn/30 bg-warn-bg px-4 py-2.5 text-[13.5px] text-warn">{n}</p>)}

          {/* Legend */}
          <div className="mb-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-[12.5px] text-ink-3">
            {LANES.map((l) => <span key={l.id} className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full" style={{ background: l.color }} />{l.label}</span>)}
            <span className="inline-flex items-center gap-1.5"><Flag className="h-3.5 w-3.5" /> Deadline</span>
            <span className="inline-flex items-center gap-1.5"><CircleDashed className="h-3.5 w-3.5" /> Milestone</span>
          </div>

          {/* Desktop Gantt */}
          <div className="hidden overflow-hidden rounded-2xl border border-night-700 bg-night-950 lg:block">
            <div className="night flex">
              <div className="w-44 shrink-0 border-r border-white/[0.07]">
                <div className="h-12 border-b border-white/[0.07]" />
                {LANES.map((l) => (
                  <div key={l.id} style={{ height: laneHeight(rm.items, l.id) }} className="flex items-start gap-2 border-b border-white/[0.05] px-4 pt-4 last:border-b-0">
                    <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: l.color, boxShadow: `0 0 12px ${l.color}` }} />
                    <span className="text-[13px] font-medium text-night-100">{l.label}</span>
                  </div>
                ))}
              </div>
              <div className="relative overflow-x-auto">
                <div style={{ width: rm.months.length * COL }}>
                  <div className="flex h-12 border-b border-white/[0.07]">
                    {rm.months.map((m, i) => (
                      <div key={i} className={cn("flex shrink-0 items-center justify-between border-r border-white/[0.04] px-3 font-mono text-[11px] uppercase tracking-wider", i === 0 ? "text-mint" : "text-night-400")} style={{ width: COL }}>
                        {m.label}
                        {i === 0 && <span className="rounded bg-mint/15 px-1.5 py-0.5 text-[9.5px] text-mint">Now</span>}
                      </div>
                    ))}
                  </div>
                  {LANES.map((l) => {
                    const byMonth = laneMonths(rm.items, l.id);
                    return (
                      <div key={l.id} className="relative flex border-b border-white/[0.05] last:border-b-0" style={{ height: laneHeight(rm.items, l.id) }}>
                        {rm.months.map((_, i) => (
                          <div key={i} className="shrink-0 border-r border-white/[0.04] p-1.5" style={{ width: COL }}>
                            <div className="space-y-1.5">{(byMonth.get(i) ?? []).map((it) => <ItemChip key={it.id} it={it} />)}</div>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Mobile / tablet list */}
          <ol className="space-y-5 lg:hidden">
            {rm.months.map((m, i) => {
              const its = rm.items.filter((x) => x.month === i);
              if (!its.length) return null;
              return (
                <li key={i}>
                  <p className="mb-2 font-mono text-[11.5px] uppercase tracking-wider text-ink-3">{m.label}{i === 0 && " · now"}</p>
                  <ul className="space-y-2 border-l-2 border-line pl-4">
                    {its.map((it) => (
                      <li key={it.id} className="card relative px-3.5 py-2.5">
                        <span className="absolute -left-[23px] top-3.5 h-3 w-3 rounded-full border-2 border-paper" style={{ background: laneColor(it.lane) }} />
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-[13.5px] font-medium text-ink">{it.href ? <Link href={it.href} className="hover:underline">{it.title}</Link> : it.title}</p>
                            <p className="text-[12.5px] text-ink-3">{it.detail}</p>
                          </div>
                          {it.match != null && <span className="shrink-0 font-mono text-[12px] text-brand-700">{it.match}%</span>}
                        </div>
                      </li>
                    ))}
                  </ul>
                </li>
              );
            })}
          </ol>

          {/* Lists */}
          <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-2 [&>*]:min-w-0">
            <ListCard title="Universities in this plan" empty="No universities match these filters." rows={rm.items.filter((x) => x.lane === "universities" && x.kind === "deadline").map((x) => ({ href: x.href!, title: x.title, sub: `${rm.months[x.month].label} · ${x.detail}`, match: x.match }))} />
            <ListCard title="Funding in this plan" empty={input.needsFunding ? "No matching scholarships with deadlines in this window." : "You said you don't need funding."} rows={rm.items.filter((x) => x.lane === "funding").map((x) => ({ href: x.href!, title: x.title, sub: `${rm.months[x.month].label} · ${x.detail}`, match: x.match }))} />
          </div>
          <p className="mt-6 flex items-start gap-2 text-[12.5px] text-ink-4">
            <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            Deadline months are typical windows from previous cycles, placed in the latest window before your intake. Confirm every exact date on the official page — then ask the <Link href="/assistant" className="link">Path Advisor</Link> to refine your plan.
          </p>
        </div>
      )}
    </div>
  );
}

function laneMonths(items: RoadmapItem[], lane: Lane) {
  const m = new Map<number, RoadmapItem[]>();
  items.filter((x) => x.lane === lane).forEach((x) => m.set(x.month, [...(m.get(x.month) ?? []), x]));
  return m;
}
function laneHeight(items: RoadmapItem[], lane: Lane) {
  const max = Math.max(1, ...Array.from(laneMonths(items, lane).values()).map((v) => v.length));
  return 16 + max * 62;
}

function Ctl({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[12px] font-medium text-ink-3">{label}</span>
      {children}
    </label>
  );
}

function ItemChip({ it }: { it: RoadmapItem }) {
  const c = laneColor(it.lane);
  const inner = (
    <div className="group relative h-14 rounded-lg border bg-night-850 px-2.5 py-2 transition-colors hover:bg-white/[0.07]" style={{ borderColor: `${c}40` }} title={`${it.title} — ${it.detail}`}>
      <span className="absolute inset-y-2 left-0 w-0.5 rounded-full" style={{ background: c }} />
      <div className="flex items-start justify-between gap-1.5 pl-1">
        <p className="line-clamp-1 text-[12px] font-medium leading-snug text-white">
          {it.kind === "deadline" ? <Flag className="mr-1 inline h-3 w-3 -translate-y-px" style={{ color: c }} /> : <CircleDashed className="mr-1 inline h-3 w-3 -translate-y-px" style={{ color: c }} />}
          {it.title}
        </p>
        {it.match != null && <span className="shrink-0 font-mono text-[10.5px] text-mint">{it.match}%</span>}
      </div>
      <p className="mt-0.5 line-clamp-1 pl-1 text-[10.5px] text-night-400">{it.detail}</p>
    </div>
  );
  return it.href ? <Link href={it.href} className="block">{inner}</Link> : inner;
}

function ReadinessCard({ score, readiness, months, deadlines }: { score: number; readiness: { label: string; done: boolean; hint: string }[]; months: number; deadlines: number }) {
  const r = 46;
  const circ = 2 * Math.PI * r;
  return (
    <div className="night-card p-5 sm:p-6">
      <div className="flex items-center gap-5">
        <svg viewBox="0 0 120 120" className="h-28 w-28 shrink-0 -rotate-90" aria-hidden>
          <defs>
            <linearGradient id="rdy" x1="0" x2="1"><stop offset="0%" stopColor="#8CCFB4" /><stop offset="100%" stopColor="#A7B4DA" /></linearGradient>
          </defs>
          <circle cx="60" cy="60" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="10" />
          <circle cx="60" cy="60" r={r} fill="none" stroke="url(#rdy)" strokeWidth="10" strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={circ * (1 - score / 100)} style={{ transition: "stroke-dashoffset .6s ease" }} />
        </svg>
        <div>
          <p className="font-mono text-[10.5px] uppercase tracking-wider text-night-400">Readiness</p>
          <p className="font-display text-[44px] font-semibold leading-none text-white">{score}<span className="text-[22px] text-night-300">%</span></p>
          <p className="mt-1.5 text-[12.5px] text-night-300">{months} months · {deadlines} deadlines mapped</p>
        </div>
      </div>
      <ul className="mt-5 grid gap-1.5 sm:grid-cols-2">
        {readiness.map((x) => (
          <li key={x.label} className="flex items-start gap-2 text-[12.5px]" title={x.hint}>
            <span className={cn("mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full", x.done ? "bg-mint/20 text-mint" : "border border-white/20 text-night-400")}>{x.done && <Check className="h-2.5 w-2.5" />}</span>
            <span className={x.done ? "text-night-100" : "text-night-400"}>{x.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ListCard({ title, rows, empty }: { title: string; rows: { href: string; title: string; sub: string; match?: number }[]; empty: string }) {
  return (
    <div className="card p-5">
      <h2 className="font-display text-[17px] font-semibold">{title}</h2>
      {rows.length ? (
        <ul className="mt-3 divide-y divide-line">
          {rows.map((r) => (
            <li key={r.href}>
              <Link href={r.href} className="group flex items-center justify-between gap-3 py-2.5">
                <span className="min-w-0">
                  <span className="block truncate text-[14px] font-medium text-ink group-hover:underline">{r.title}</span>
                  <span className="block truncate text-[12.5px] text-ink-3">{r.sub}</span>
                </span>
                <span className="flex shrink-0 items-center gap-2">
                  {r.match != null && <span className="font-mono text-[12.5px] text-brand-700">{r.match}%</span>}
                  <ArrowUpRight className="h-4 w-4 text-ink-4" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-[13.5px] text-ink-3">{empty}</p>
      )}
    </div>
  );
}
