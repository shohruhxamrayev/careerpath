"use client";

import { Globe2, GraduationCap, LayoutGrid, Sparkles } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { UniversityCard } from "@/components/cards";
import { GlobeExplorer } from "@/components/directories/GlobeExplorer";
import { FilterPanel, FilterSelect, SearchInput, useUrlFilters } from "@/components/filters";
import { Button, EmptyState } from "@/components/ui";
import { DEGREE_LEVEL_LABELS, FIELD_LABELS, FIELDS, REGIONS, TUITION_BAND_MAX } from "@/lib/data/taxonomy";
import { universities } from "@/lib/data/universities";
import { isProfileReady } from "@/lib/matching/profile";
import { matchUniversity } from "@/lib/matching/university";
import { useApp } from "@/lib/store/AppProvider";
import type { TuitionBand } from "@/lib/types";
import { cn, monthsAhead } from "@/lib/utils";

const DEFAULTS = { q: "", country: "", region: "", field: "", level: "", tuition: "", aid: "", deadline: "", testing: "", english: "", rank: "", sort: "", view: "" };
const COUNTRIES = Array.from(new Set(universities.map((u) => u.country))).sort();

export function UniversityDirectory() {
  const { user, data } = useApp();
  const { state: f, set, reset, activeCount } = useUrlFilters(DEFAULTS);
  const personalised = !!user && isProfileReady(data?.profile);

  const rows = useMemo(() => {
    const q = f.q.trim().toLowerCase();
    let list = universities.map((u) => ({ u, m: personalised ? matchUniversity(data!.profile, u) : undefined }));
    list = list.filter(({ u }) => {
      if (q && ![u.name, u.shortName, u.city, u.country, ...u.notablePrograms, ...u.fields.map((x) => FIELD_LABELS[x])].join(" ").toLowerCase().includes(q)) return false;
      if (f.country && u.country !== f.country) return false;
      if (f.region && u.region !== f.region) return false;
      if (f.field && !u.fields.includes(f.field as never)) return false;
      if (f.level && !u.levels.includes(f.level as never)) return false;
      if (f.tuition && (!u.tuition.band || TUITION_BAND_MAX[u.tuition.band] > TUITION_BAND_MAX[f.tuition as TuitionBand])) return false;
      if (f.aid === "any" && u.aid.kind === "limited") return false;
      if (f.aid && f.aid !== "any" && u.aid.kind !== f.aid) return false;
      if (f.deadline) {
        const ahead = Math.min(...u.deadlines.map((d) => monthsAhead(d.months) ?? 99));
        if (ahead > Number(f.deadline)) return false;
      }
      if (f.testing === "none" && !(u.testing.policy === "not-used" || u.testing.policy === "optional")) return false;
      if (f.english && !(u.english.ielts != null && u.english.ielts <= Number(f.english))) return false;
      if (f.rank === "ranked" && !u.qsRank) return false;
      if (f.rank && f.rank !== "ranked" && !(u.qsRank && u.qsRank <= Number(f.rank))) return false;
      return true;
    });
    const sort = f.sort || (personalised ? "match" : "rank");
    list.sort((a, b) => {
      switch (sort) {
        case "match": return (b.m?.score ?? 0) - (a.m?.score ?? 0);
        case "name": return a.u.name.localeCompare(b.u.name);
        case "tuition": return (a.u.tuition.band ? TUITION_BAND_MAX[a.u.tuition.band] : 1e9) - (b.u.tuition.band ? TUITION_BAND_MAX[b.u.tuition.band] : 1e9);
        case "deadline": return Math.min(...a.u.deadlines.map((d) => monthsAhead(d.months) ?? 99)) - Math.min(...b.u.deadlines.map((d) => monthsAhead(d.months) ?? 99));
        default: return (a.u.qsRank ?? 999) - (b.u.qsRank ?? 999) || a.u.name.localeCompare(b.u.name);
      }
    });
    return list;
  }, [f, personalised, data]);

  return (
    <div className="container py-8">
      {!personalised && (
        <div className="mb-6 flex flex-col gap-3 rounded-md border border-brand-100 bg-brand-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-center gap-2 text-[13.5px] text-brand-800">
            <Sparkles className="h-4 w-4 shrink-0" /> {user ? "Complete your education and interests to see your Profile Match on every university." : "Create a profile to see your Profile Match on every university."}
          </p>
          <Link href={user ? "/profile" : "/signup?next=/universities"} className="text-[13.5px] font-medium text-brand-700 hover:underline">
            {user ? "Complete profile →" : "Create profile →"}
          </Link>
        </div>
      )}
      <div className="grid gap-6 lg:grid-cols-[250px_1fr]">
        <FilterPanel activeCount={activeCount} onReset={reset} resultCount={rows.length}>
          <FilterSelect id="f-country" label="Country" value={f.country} onChange={(v) => set("country", v)} options={[["", "All countries"], ...COUNTRIES.map((c) => [c, c] as [string, string])]} />
          <FilterSelect id="f-region" label="Region" value={f.region} onChange={(v) => set("region", v)} options={[["", "All regions"], ...REGIONS.map((r) => [r, r] as [string, string])]} />
          <FilterSelect id="f-field" label="Major / field" value={f.field} onChange={(v) => set("field", v)} options={[["", "All fields"], ...FIELDS.map((x) => [x, FIELD_LABELS[x]] as [string, string])]} />
          <FilterSelect id="f-level" label="Degree level" value={f.level} onChange={(v) => set("level", v)} options={[["", "Any level"], ...Object.entries(DEGREE_LEVEL_LABELS)]} />
          <FilterSelect id="f-tuition" label="Max tuition (indicative)" value={f.tuition} onChange={(v) => set("tuition", v)} options={[["", "Any tuition"], ["under-5k", "Up to $5k / year"], ["5-15k", "Up to $15k / year"], ["15-30k", "Up to $30k / year"], ["30-50k", "Up to $50k / year"]]} />
          <FilterSelect id="f-aid" label="Scholarships & aid" value={f.aid} onChange={(v) => set("aid", v)} options={[["", "Any"], ["any", "Some aid available"], ["need-based-full", "Full need-based aid"], ["merit", "Merit scholarships"], ["government", "Government / grant places"]]} />
          <FilterSelect id="f-deadline" label="Application deadline" value={f.deadline} onChange={(v) => set("deadline", v)} options={[["", "Any time"], ["2", "Within ~2 months"], ["4", "Within ~4 months"], ["6", "Within ~6 months"]]} />
          <FilterSelect id="f-testing" label="Test requirements" value={f.testing} onChange={(v) => set("testing", v)} options={[["", "Any policy"], ["none", "No SAT/ACT required"]]} />
          <FilterSelect id="f-english" label="English requirement" value={f.english} onChange={(v) => set("english", v)} options={[["", "Any"], ["6", "IELTS 6.0 or lower"], ["6.5", "IELTS 6.5 or lower"], ["7", "IELTS 7.0 or lower"]]} />
          <FilterSelect id="f-rank" label="Ranking (QS 2027)" value={f.rank} onChange={(v) => set("rank", v)} options={[["", "Any"], ["10", "Top 10"], ["25", "Top 25"], ["50", "Top 50"], ["ranked", "Ranked in our data"]]} />
        </FilterPanel>

        <div className="min-w-0">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row">
            <SearchInput value={f.q} onChange={(v) => set("q", v)} placeholder="Search by name, city or programme" label="Search universities" />
            <div className="flex items-center gap-2">
              <label htmlFor="sort" className="sr-only">Sort</label>
              <select id="sort" value={f.sort || (personalised ? "match" : "rank")} onChange={(e) => set("sort", e.target.value)} className="input h-11 w-full sm:w-48">
                {personalised && <option value="match">Best match</option>}
                <option value="rank">Ranking</option>
                <option value="name">Name (A–Z)</option>
                <option value="tuition">Lowest tuition</option>
                <option value="deadline">Soonest deadline</option>
              </select>
            </div>
          </div>
          <div className="mb-4 flex items-center justify-between gap-3">
            <p className="text-[13px] text-ink-3" aria-live="polite">
              {rows.length} {rows.length === 1 ? "university" : "universities"}
              {activeCount > 0 && " match your filters"}
            </p>
            <div className="inline-flex rounded-lg border border-line bg-surface p-0.5" role="group" aria-label="View">
              {([["", "Grid", LayoutGrid], ["globe", "Globe", Globe2]] as const).map(([v, label, I]) => (
                <button key={label} onClick={() => set("view", v)} aria-pressed={f.view === v} className={cn("inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[13px] transition-colors", f.view === v ? "bg-night-900 text-white" : "text-ink-3 hover:text-ink")}>
                  <I className="h-3.5 w-3.5" /> {label}
                </button>
              ))}
            </div>
          </div>
          {rows.length === 0 ? (
            <EmptyState icon={<GraduationCap />} title="No universities found." body="Try a broader search or remove some filters." action={<Button variant="secondary" onClick={() => { reset(); set("q", ""); }}>Clear search and filters</Button>} />
          ) : f.view === "globe" ? (
            <GlobeExplorer rows={rows} fromTashkent={!personalised || data?.profile.personal.country === "Uzbekistan"} />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {rows.map(({ u, m }) => <UniversityCard key={u.slug} u={u} match={m} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
