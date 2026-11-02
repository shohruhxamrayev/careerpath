"use client";

import { ArrowUpRight, BadgeCheck, Clock, Search } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { useUrlFilters } from "@/components/filters";
import { Chip } from "@/components/ui";
import { careers } from "@/lib/data/careers";
import { CERT_CATEGORIES, certifications, type Certification } from "@/lib/data/certifications";
import { getSkill } from "@/lib/data/skills";
import { cn } from "@/lib/utils";

const DEFAULTS = { q: "", cat: "", level: "", free: "", career: "" };
const careerTitle = new Map(careers.map((c) => [c.slug, c.title]));

export function CertificationDirectory() {
  const { state: f, set } = useUrlFilters(DEFAULTS);
  const rows = useMemo(() => {
    const q = f.q.trim().toLowerCase();
    return certifications.filter(
      (c) =>
        (!f.cat || c.category === f.cat) &&
        (!f.level || c.level === f.level) &&
        (!f.free || c.cost.free) &&
        (!f.career || c.careers.includes(f.career)) &&
        (!q || [c.name, c.provider, c.summary, c.category].join(" ").toLowerCase().includes(q)),
    );
  }, [f]);
  const counts = useMemo(() => Object.fromEntries(CERT_CATEGORIES.map((c) => [c, certifications.filter((x) => x.category === c).length])), []);

  return (
    <div className="container py-8">
      <div className="scrollbar-none -mx-4 mb-5 flex gap-2 overflow-x-auto px-4 pb-1" role="group" aria-label="Category">
        <Chip active={!f.cat} onClick={() => set("cat", "")}>All <span className="font-mono text-[11px] text-ink-4">{certifications.length}</span></Chip>
        {CERT_CATEGORIES.map((c) => (
          <Chip key={c} active={f.cat === c} onClick={() => set("cat", f.cat === c ? "" : c)}>
            {c} <span className="font-mono text-[11px] text-ink-4">{counts[c]}</span>
          </Chip>
        ))}
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-[1fr_auto_auto_auto]">
        <label className="relative block">
          <span className="sr-only">Search certifications</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-4" />
          <input value={f.q} onChange={(e) => set("q", e.target.value)} placeholder="Search certifications, providers, skills…" className="input h-11 w-full pl-9" />
        </label>
        <select aria-label="Level" value={f.level} onChange={(e) => set("level", e.target.value)} className="input h-11">
          <option value="">Any level</option>
          <option>Beginner</option>
          <option>Intermediate</option>
          <option>Advanced</option>
        </select>
        <select aria-label="Career" value={f.career} onChange={(e) => set("career", e.target.value)} className="input h-11">
          <option value="">Any career</option>
          {careers.filter((c) => certifications.some((x) => x.careers.includes(c.slug))).map((c) => <option key={c.slug} value={c.slug}>{c.title}</option>)}
        </select>
        <label className="flex h-11 items-center gap-2 rounded-md border border-line-strong bg-surface px-3 text-[13.5px] text-ink-2">
          <input type="checkbox" className="h-4 w-4 accent-brand-600" checked={!!f.free} onChange={(e) => set("free", e.target.checked ? "1" : "")} /> Free only
        </label>
      </div>

      <p className="mb-4 text-[13px] text-ink-3" aria-live="polite">{rows.length} certification{rows.length === 1 ? "" : "s"}</p>
      {rows.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {rows.map((c) => <CertCard key={c.slug} c={c} />)}
        </div>
      ) : (
        <p className="rounded-lg border border-line bg-surface p-8 text-center text-[14px] text-ink-3">No certifications match these filters.</p>
      )}
      <p className="mt-6 text-[12.5px] text-ink-4">Prices change and often vary by country. “Verified” prices were checked on the official page in November 2026; always confirm before paying.</p>
    </div>
  );
}

const LEVEL_STYLE: Record<Certification["level"], string> = {
  Beginner: "bg-ok-bg text-ok",
  Intermediate: "bg-info-bg text-info",
  Advanced: "bg-warn-bg text-warn",
};

export function CertCard({ c, compact }: { c: Certification; compact?: boolean }) {
  return (
    <article className="card flex flex-col p-5 transition-shadow hover:shadow-lift">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-mono text-[10.5px] uppercase tracking-wider text-ink-4">{c.category}</p>
          <h3 className="mt-1 font-display text-[16.5px] font-semibold leading-snug text-ink">{c.name}</h3>
          <p className="mt-0.5 text-[12.5px] text-ink-3">{c.provider}</p>
        </div>
        <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold", LEVEL_STYLE[c.level])}>{c.level}</span>
      </div>
      <p className="mt-3 text-[13.5px] leading-relaxed text-ink-2">{c.summary}</p>
      {!compact && <p className="mt-2 text-[13px] leading-relaxed text-ink-3"><span className="font-medium text-ink-2">Why it helps:</span> {c.why}</p>}
      <dl className="mt-4 space-y-1.5 text-[12.5px]">
        <div className="flex items-start gap-2">
          <dt className="sr-only">Cost</dt>
          <dd className={cn("font-medium", c.cost.free ? "text-ok" : "text-ink-2")}>
            {c.cost.display}
            {c.cost.status === "verified" && <BadgeCheck className="ml-1 inline h-3.5 w-3.5 -translate-y-px text-ok" aria-label="Verified price" />}
          </dd>
        </div>
        <div className="flex items-center gap-1.5 text-ink-3">
          <Clock className="h-3.5 w-3.5" />
          <dt className="sr-only">Time</dt>
          <dd>{c.duration}</dd>
        </div>
      </dl>
      {!compact && c.skills.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {c.skills.map((s) => <Link key={s} href={`/careers?skill=${s}`} className="rounded-full bg-paper px-2 py-0.5 text-[11.5px] text-ink-3 hover:text-ink">{getSkill(s)?.name ?? s}</Link>)}
        </div>
      )}
      {!compact && c.careers.length > 0 && (
        <p className="mt-3 text-[12px] text-ink-4">
          Helps with: {c.careers.map((s, i) => <span key={s}>{i > 0 && ", "}<Link href={`/careers/${s}`} className="text-ink-3 hover:text-ink hover:underline">{careerTitle.get(s) ?? s}</Link></span>)}
        </p>
      )}
      <div className="mt-auto pt-4">
        <a href={c.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[13px] font-medium text-brand-700 hover:underline">
          Official page <ArrowUpRight className="h-3.5 w-3.5" />
        </a>
      </div>
    </article>
  );
}
