"use client";

import { Briefcase, Building2, Clock, ExternalLink, MapPin, Radio } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { FilterPanel, FilterSelect, FilterToggle, SearchInput, useUrlFilters } from "@/components/filters";
import { Badge, Button, Chip, EmptyState } from "@/components/ui";
import type { LiveJob, LiveSource } from "@/lib/live/jobs";

const DEFAULTS = { q: "", level: "", remote: "", source: "", category: "", where: "" };
const PAGE = 48;

function ago(iso: string) {
  const d = (Date.now() - new Date(iso).getTime()) / 86_400_000;
  if (!Number.isFinite(d)) return "";
  if (d < 1) return "today";
  if (d < 2) return "yesterday";
  if (d < 30) return `${Math.floor(d)} days ago`;
  const m = Math.floor(d / 30);
  return m === 1 ? "1 month ago" : `${m} months ago`;
}

export function LiveJobBoard({ jobs, sources, fetchedAt }: { jobs: LiveJob[]; sources: Record<LiveSource, { url: string; note: string; count: number }>; fetchedAt: string }) {
  const { state: f, set, reset, activeCount } = useUrlFilters(DEFAULTS);

  const categories = useMemo(() => {
    const c = new Map<string, number>();
    jobs.forEach((j) => c.set(j.category, (c.get(j.category) ?? 0) + 1));
    return [...c.entries()].filter(([k]) => k && k !== "Other").sort((a, b) => b[1] - a[1]).slice(0, 30).map(([k]) => k).sort();
  }, [jobs]);

  const rows = useMemo(() => {
    const words = f.q.toLowerCase().split(/\s+/).filter(Boolean);
    const where = f.where.trim().toLowerCase();
    return jobs.filter((j) => {
      if (f.level && j.level !== f.level) return false;
      if (f.remote && !j.remote) return false;
      if (f.source && j.source !== f.source) return false;
      if (f.category && j.category !== f.category) return false;
      if (where && !j.location.toLowerCase().includes(where)) return false;
      if (words.length) {
        const hay = `${j.title} ${j.company} ${j.category} ${j.location}`.toLowerCase();
        if (!words.every((w) => hay.includes(w))) return false;
      }
      return true;
    });
  }, [jobs, f]);

  const [shown, setShown] = useState(PAGE);
  useEffect(() => setShown(PAGE), [f]);
  const internships = jobs.filter((j) => j.level === "internship").length;

  return (
    <div className="container py-8">
      <div className="scrollbar-none -mx-4 mb-6 flex gap-2 overflow-x-auto px-4 pb-1" role="group" aria-label="Level">
        <Chip active={!f.level} onClick={() => set("level", "")}>All <span className="font-mono text-[11px] text-ink-4">{jobs.length}</span></Chip>
        <Chip active={f.level === "internship"} onClick={() => set("level", f.level === "internship" ? "" : "internship")}>Internships <span className="font-mono text-[11px] text-ink-4">{internships}</span></Chip>
        <Chip active={f.level === "entry"} onClick={() => set("level", f.level === "entry" ? "" : "entry")}>Entry-level jobs <span className="font-mono text-[11px] text-ink-4">{jobs.length - internships}</span></Chip>
        <Chip active={!!f.remote} onClick={() => set("remote", f.remote ? "" : "1")}>Remote only</Chip>
      </div>

      <p className="mb-6 flex flex-wrap items-center gap-x-2 gap-y-1 rounded-md border border-line bg-surface px-4 py-3 text-[13px] text-ink-3">
        <Radio className="h-4 w-4 shrink-0 text-ok" aria-hidden />
        Live listings, refreshed every few hours (last update {new Date(fetchedAt).toUTCString().slice(5, 22)} UTC). Each job opens on the site that posted it — always apply there, and never pay to apply.
      </p>

      <div className="grid gap-6 lg:grid-cols-[250px_1fr]">
        <FilterPanel activeCount={activeCount} onReset={reset} resultCount={rows.length}>
          <FilterToggle id="j-remote" label="Remote only" checked={!!f.remote} onChange={(v) => set("remote", v ? "1" : "")} />
          <FilterSelect id="j-level" label="Level" value={f.level} onChange={(v) => set("level", v)} options={[["", "Internships and jobs"], ["internship", "Internships"], ["entry", "Entry-level jobs"]]} />
          <FilterSelect id="j-cat" label="Category" value={f.category} onChange={(v) => set("category", v)} options={[["", "Any category"], ...categories.map((c) => [c, c] as [string, string])]} />
          <FilterSelect id="j-src" label="Source" value={f.source} onChange={(v) => set("source", v)} options={[["", "All sources"], ...(Object.keys(sources) as LiveSource[]).map((s) => [s, `${s} (${sources[s].count})`] as [string, string])]} />
          <div>
            <label htmlFor="j-where" className="mb-1.5 block text-[12.5px] font-medium text-ink-2">Location contains</label>
            <input id="j-where" value={f.where} onChange={(e) => set("where", e.target.value)} placeholder="e.g. Berlin, London, NY" className="input h-10 w-full" />
          </div>
        </FilterPanel>

        <div className="min-w-0">
          <div className="mb-4">
            <SearchInput value={f.q} onChange={(v) => set("q", v)} placeholder="Search job title, company or field…" label="Search live jobs" />
          </div>
          <p className="mb-4 text-[13px] text-ink-3" aria-live="polite">{rows.length} {rows.length === 1 ? "listing" : "listings"}</p>
          {jobs.length === 0 ? (
            <EmptyState icon={<Briefcase />} title="Live listings are temporarily unavailable." body="The job sources didn't respond. Try again in a little while, or browse the curated internships and jobs in Opportunities." />
          ) : rows.length === 0 ? (
            <EmptyState icon={<Briefcase />} title="No listings match." body="Try a broader search or remove some filters." action={<Button variant="secondary" onClick={reset}>Clear filters</Button>} />
          ) : (
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 [&>*]:min-w-0">
              {rows.slice(0, shown).map((j) => (
                <li key={j.id}>
                  <a href={j.url} target="_blank" rel="noopener noreferrer nofollow" className="card card-hover group flex h-full flex-col p-4">
                    <div className="mb-2 flex flex-wrap gap-1.5">
                      <Badge tone={j.level === "internship" ? "brand" : "info"}>{j.level === "internship" ? "Internship" : "Entry level"}</Badge>
                      {j.remote && <Badge tone="ok">Remote</Badge>}
                    </div>
                    <h3 className="line-clamp-2 text-[14.5px] font-semibold leading-snug group-hover:text-brand-700">{j.title}</h3>
                    <p className="mt-1 flex items-center gap-1.5 text-[12.5px] text-ink-2"><Building2 className="h-3.5 w-3.5 shrink-0 text-ink-4" aria-hidden />{j.company}</p>
                    <p className="mt-1 flex items-start gap-1.5 text-[12.5px] text-ink-3"><MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-4" aria-hidden /><span className="line-clamp-1">{j.location}</span></p>
                    {j.salary && <p className="mt-1 text-[12.5px] text-ink-2">{j.salary}</p>}
                    <div className="flex-1" />
                    <div className="mt-3 flex items-center justify-between gap-2 border-t border-line pt-2.5 text-[11.5px] text-ink-4">
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" aria-hidden />{ago(j.posted)}</span>
                      <span className="flex items-center gap-1">via {j.source} <ExternalLink className="h-3 w-3" aria-hidden /></span>
                    </div>
                  </a>
                </li>
              ))}
            </ul>
          )}
          {rows.length > shown && (
            <div className="mt-6 flex justify-center">
              <Button variant="secondary" onClick={() => setShown((n) => n + PAGE)}>Show more ({rows.length - shown} left)</Button>
            </div>
          )}
          <p className="mt-8 text-[12px] leading-relaxed text-ink-4">
            Listings from{" "}
            {(Object.keys(sources) as LiveSource[]).map((s, i, arr) => (
              <span key={s}>
                <a href={sources[s].url} target="_blank" rel="noopener noreferrer" className="underline hover:text-ink-2">{s}</a>
                {i < arr.length - 2 ? ", " : i === arr.length - 2 ? " and " : ""}
              </span>
            ))}
            . CareerPath doesn&apos;t screen employers — check each posting before you share personal details.
          </p>
        </div>
      </div>
    </div>
  );
}
