"use client";

import { Compass, Sparkles } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { OpportunityCard } from "@/components/cards";
import { FilterPanel, FilterSelect, FilterToggle, SearchInput, useUrlFilters } from "@/components/filters";
import { Button, Chip, EmptyState } from "@/components/ui";
import { opportunities } from "@/lib/data/opportunities";
import { FIELD_LABELS, FIELDS, OPPORTUNITY_TYPE_PLURAL, OPPORTUNITY_TYPES } from "@/lib/data/taxonomy";
import { matchOpportunity } from "@/lib/matching/opportunity";
import { isProfileReady } from "@/lib/matching/profile";
import { useApp } from "@/lib/store/AppProvider";
import { monthsAhead } from "@/lib/utils";

const DEFAULTS = { q: "", type: "", country: "", format: "", funded: "", level: "", field: "", deadline: "", eligible: "", sort: "" };
const HOSTS = Array.from(new Set(opportunities.flatMap((o) => o.hostCountries))).sort();
const COUNTS = Object.fromEntries(OPPORTUNITY_TYPES.map((t) => [t, opportunities.filter((o) => o.type === t).length]));

export function OpportunityDirectory() {
  const { user, data } = useApp();
  const { state: f, set, reset, activeCount } = useUrlFilters(DEFAULTS);
  const personalised = !!user && isProfileReady(data?.profile);

  const rows = useMemo(() => {
    const q = f.q.trim().toLowerCase();
    let list = opportunities.map((o) => ({ o, m: personalised ? matchOpportunity(data!.profile, o) : undefined }));
    list = list.filter(({ o, m }) => {
      if (q && ![o.title, o.organization, o.summary, o.location, ...o.tags].join(" ").toLowerCase().includes(q)) return false;
      if (f.type && o.type !== f.type) return false;
      if (f.country === "worldwide" && o.hostCountries.length > 0) return false;
      if (f.country && f.country !== "worldwide" && !o.hostCountries.includes(f.country)) return false;
      if (f.format === "online" && o.format === "in-person") return false;
      if (f.format === "in-person" && o.format === "online") return false;
      if (f.funded && o.funding.kind !== "fully-funded") return false;
      if (f.level === "high-school" && !o.levels.includes("high-school")) return false;
      if (f.level === "undergraduate" && !o.levels.includes("undergraduate")) return false;
      if (f.level === "graduate" && !o.levels.some((l) => l === "masters" || l === "phd" || l === "graduate")) return false;
      if (f.field && o.fields !== "any" && !o.fields.includes(f.field as never)) return false;
      if (f.deadline && (monthsAhead(o.deadline.months) ?? 99) > Number(f.deadline)) return false;
      if (f.eligible && m && m.eligible === false) return false;
      return true;
    });
    const sort = f.sort || (personalised ? "match" : "deadline");
    list.sort((a, b) =>
      sort === "match"
        ? (b.m?.score ?? 0) - (a.m?.score ?? 0)
        : sort === "name"
          ? a.o.title.localeCompare(b.o.title)
          : (monthsAhead(a.o.deadline.months) ?? 99) - (monthsAhead(b.o.deadline.months) ?? 99) || a.o.title.localeCompare(b.o.title),
    );
    return list;
  }, [f, personalised, data]);

  return (
    <div className="container py-8">
      <div className="scrollbar-none -mx-4 mb-6 flex gap-2 overflow-x-auto px-4 pb-1" role="group" aria-label="Opportunity type">
        <Chip active={!f.type} onClick={() => set("type", "")}>All <span className="font-mono text-[11px] text-ink-4">{opportunities.length}</span></Chip>
        {OPPORTUNITY_TYPES.filter((t) => COUNTS[t] > 0).map((t) => (
          <Chip key={t} active={f.type === t} onClick={() => set("type", f.type === t ? "" : t)}>
            {OPPORTUNITY_TYPE_PLURAL[t]} <span className="font-mono text-[11px] text-ink-4">{COUNTS[t]}</span>
          </Chip>
        ))}
      </div>

      {!personalised && (
        <div className="mb-6 flex flex-col gap-3 rounded-md border border-brand-100 bg-brand-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-center gap-2 text-[13.5px] text-brand-800">
            <Sparkles className="h-4 w-4 shrink-0" /> See which opportunities you&apos;re eligible for, checked against each programme&apos;s rules.
          </p>
          <Link href={user ? "/profile" : "/signup?next=/opportunities"} className="text-[13.5px] font-medium text-brand-700 hover:underline">
            {user ? "Complete profile →" : "Create profile →"}
          </Link>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[250px_1fr]">
        <FilterPanel activeCount={activeCount - (f.type ? 1 : 0)} onReset={() => { const t = f.type; reset(); set("type", t); }} resultCount={rows.length}>
          {personalised && <FilterToggle id="f-elig" label="Only show what I'm eligible for" checked={!!f.eligible} onChange={(v) => set("eligible", v ? "1" : "")} />}
          <FilterToggle id="f-funded" label="Fully funded only" checked={!!f.funded} onChange={(v) => set("funded", v ? "1" : "")} />
          <FilterSelect id="f-level" label="Level" value={f.level} onChange={(v) => set("level", v)} options={[["", "Any level"], ["high-school", "High school"], ["undergraduate", "Undergraduate"], ["graduate", "Graduate"]]} />
          <FilterSelect id="f-format" label="Format" value={f.format} onChange={(v) => set("format", v)} options={[["", "Online or in person"], ["online", "Online / hybrid"], ["in-person", "In person"]]} />
          <FilterSelect id="f-country" label="Country" value={f.country} onChange={(v) => set("country", v)} options={[["", "Any country"], ["worldwide", "Worldwide / multiple"], ...HOSTS.map((h) => [h, h] as [string, string])]} />
          <FilterSelect id="f-field" label="Field" value={f.field} onChange={(v) => set("field", v)} options={[["", "Any field"], ...FIELDS.map((x) => [x, FIELD_LABELS[x]] as [string, string])]} />
          <FilterSelect id="f-deadline" label="Deadline" value={f.deadline} onChange={(v) => set("deadline", v)} options={[["", "Any time"], ["1", "Within ~1 month"], ["3", "Within ~3 months"], ["6", "Within ~6 months"]]} />
        </FilterPanel>

        <div className="min-w-0">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row">
            <SearchInput value={f.q} onChange={(v) => set("q", v)} placeholder="Search scholarships, competitions, internships…" label="Search opportunities" />
            <label htmlFor="o-sort" className="sr-only">Sort</label>
            <select id="o-sort" value={f.sort || (personalised ? "match" : "deadline")} onChange={(e) => set("sort", e.target.value)} className="input h-11 w-full sm:w-48">
              {personalised && <option value="match">Best match</option>}
              <option value="deadline">Upcoming deadline</option>
              <option value="name">Name (A–Z)</option>
            </select>
          </div>
          <p className="mb-4 text-[13px] text-ink-3" aria-live="polite">{rows.length} {rows.length === 1 ? "opportunity" : "opportunities"}</p>
          {rows.length === 0 ? (
            <EmptyState icon={<Compass />} title="No results found." body="Try a broader search or remove some filters." action={<Button variant="secondary" onClick={() => { reset(); set("q", ""); set("type", ""); }}>Clear search and filters</Button>} />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {rows.map(({ o, m }) => <OpportunityCard key={o.slug} o={o} match={m} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
