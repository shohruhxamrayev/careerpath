"use client";

import { Briefcase, X } from "lucide-react";
import { useMemo } from "react";
import { CareerCard } from "@/components/cards";
import { SearchInput, useUrlFilters } from "@/components/filters";
import { Button, Chip, EmptyState } from "@/components/ui";
import { careers } from "@/lib/data/careers";
import { getSkill } from "@/lib/data/skills";
import { matchCareer } from "@/lib/matching/career";
import { isProfileReady } from "@/lib/matching/profile";
import { useApp } from "@/lib/store/AppProvider";

const FAMILIES = Array.from(new Set(careers.map((c) => c.family)));
const DEFAULTS = { q: "", family: "", skill: "" };

export function CareerDirectory() {
  const { user, data } = useApp();
  const { state: f, set, reset } = useUrlFilters(DEFAULTS);
  const personalised = !!user && isProfileReady(data?.profile);
  const skill = f.skill ? getSkill(f.skill) : undefined;

  const rows = useMemo(() => {
    const q = f.q.trim().toLowerCase();
    const list = careers
      .filter((c) => !q || [c.title, c.family, c.summary, ...c.majors, ...c.entryRoles].join(" ").toLowerCase().includes(q))
      .filter((c) => !f.family || c.family === f.family)
      .filter((c) => !f.skill || c.keySkills.includes(f.skill))
      .map((c) => ({ c, m: personalised ? matchCareer(data!.profile, c) : undefined }));
    if (personalised) list.sort((a, b) => b.m!.score - a.m!.score);
    return list;
  }, [f, personalised, data]);

  return (
    <div className="container py-8">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchInput value={f.q} onChange={(v) => set("q", v)} placeholder="Search careers, roles or majors" label="Search careers" />
      </div>
      <div className="scrollbar-none -mx-4 mb-5 flex gap-2 overflow-x-auto px-4 pb-1" role="group" aria-label="Career family">
        <Chip active={!f.family} onClick={() => set("family", "")}>All</Chip>
        {FAMILIES.map((fam) => <Chip key={fam} active={f.family === fam} onClick={() => set("family", f.family === fam ? "" : fam)}>{fam}</Chip>)}
      </div>
      {skill && (
        <div className="mb-5 flex items-center gap-2 text-[13.5px] text-ink-2">
          Careers that use <span className="font-medium">{skill.name}</span>
          <button onClick={() => set("skill", "")} className="inline-flex items-center gap-1 rounded border border-line px-2 py-0.5 text-[12px] text-ink-3 hover:text-ink" aria-label="Clear skill filter">
            <X className="h-3 w-3" /> Clear
          </button>
        </div>
      )}
      {personalised && <p className="mb-4 text-[13px] text-ink-3">Sorted by your Career Match — based on your interests, field, skills and goals.</p>}
      {rows.length === 0 ? (
        <EmptyState icon={<Briefcase />} title="No careers found." body="Try a broader search or remove some filters." action={<Button variant="secondary" onClick={() => { reset(); set("q", ""); set("skill", ""); }}>Clear search and filters</Button>} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map(({ c, m }) => <CareerCard key={c.slug} c={c} match={m} />)}
        </div>
      )}
    </div>
  );
}
