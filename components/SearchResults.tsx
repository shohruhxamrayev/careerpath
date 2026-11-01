"use client";

import { ArrowRight, Briefcase, Compass, GraduationCap, Layers, Search, Sparkles } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { SearchInput, useUrlFilters } from "@/components/filters";
import { Button, Chip, EmptyState } from "@/components/ui";
import { searchAll, SEARCH_KIND_LABELS, type SearchDoc, type SearchKind } from "@/lib/search";

const ORDER: SearchKind[] = ["university", "opportunity", "career", "program", "skill"];
const ICONS: Record<SearchKind, React.ComponentType<{ className?: string }>> = { university: GraduationCap, opportunity: Compass, career: Briefcase, program: Layers, skill: Sparkles };
const SUGGESTIONS = ["business", "computer science", "fully funded", "Uzbekistan", "internship", "economics", "data"];

export function SearchResults() {
  const { state: f, set } = useUrlFilters({ q: "", type: "" });
  const all = useMemo(() => searchAll(f.q), [f.q]);
  const grouped = useMemo(() => {
    const g = new Map<SearchKind, SearchDoc[]>();
    for (const d of all) g.set(d.kind, [...(g.get(d.kind) ?? []), d]);
    return g;
  }, [all]);
  const kinds = ORDER.filter((k) => grouped.has(k));
  const visible = f.type ? kinds.filter((k) => k === f.type) : kinds;

  return (
    <>
      <header className="border-b border-line bg-surface">
        <div className="container py-8">
          <p className="eyebrow mb-2">Search</p>
          <h1 className="display mb-5 text-[34px]">Search everything</h1>
          <div className="max-w-2xl">
            <SearchInput value={f.q} onChange={(v) => set("q", v)} placeholder="Universities, scholarships, careers, programs, skills…" label="Search CareerPath" />
          </div>
          {f.q.trim() && all.length > 0 && (
            <div className="scrollbar-none -mx-4 mt-5 flex gap-2 overflow-x-auto px-4" role="group" aria-label="Filter results by type">
              <Chip active={!f.type} onClick={() => set("type", "")}>All <span className="font-mono text-[11px] text-ink-4">{all.length}</span></Chip>
              {kinds.map((k) => (
                <Chip key={k} active={f.type === k} onClick={() => set("type", f.type === k ? "" : k)}>
                  {SEARCH_KIND_LABELS[k]} <span className="font-mono text-[11px] text-ink-4">{grouped.get(k)!.length}</span>
                </Chip>
              ))}
            </div>
          )}
        </div>
      </header>
      <div className="container py-8">
        {!f.q.trim() ? (
          <EmptyState
            icon={<Search />}
            title="What are you looking for?"
            body="Search across universities, opportunities, careers, programs and skills."
            action={SUGGESTIONS.map((s) => <Chip key={s} onClick={() => set("q", s)}>{s}</Chip>)}
          />
        ) : all.length === 0 || visible.length === 0 ? (
          <EmptyState
            icon={<Search />}
            title="No results found."
            body="Try a broader search or remove some filters."
            action={<>{f.type && <Button variant="secondary" onClick={() => set("type", "")}>Show all types</Button>}<Button variant="ghost" onClick={() => set("q", "")}>Clear search</Button></>}
          />
        ) : (
          <div className="space-y-10">
            {visible.map((k) => {
              const items = grouped.get(k)!;
              const I = ICONS[k];
              const shown = f.type ? items : items.slice(0, 6);
              return (
                <section key={k} aria-labelledby={`sr-${k}`}>
                  <div className="mb-3 flex items-center justify-between">
                    <h2 id={`sr-${k}`} className="flex items-center gap-2 text-[16px] font-semibold">
                      <I className="h-4 w-4 text-ink-3" /> {SEARCH_KIND_LABELS[k]} <span className="font-mono text-[12px] font-normal text-ink-4">{items.length}</span>
                    </h2>
                    {!f.type && items.length > 6 && (
                      <button onClick={() => set("type", k)} className="inline-flex items-center gap-1 text-[13px] font-medium text-brand-700 hover:underline">
                        Show all <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                  <ul className="divide-y divide-line overflow-hidden rounded-md border border-line bg-surface">
                    {shown.map((d) => (
                      <li key={d.id}>
                        <Link href={d.href} className="flex items-center justify-between gap-4 px-4 py-3.5 transition-colors hover:bg-paper">
                          <span className="min-w-0">
                            <span className="block truncate text-[14.5px] font-medium">{d.title}</span>
                            <span className="block truncate text-[12.5px] text-ink-3">{d.subtitle}</span>
                          </span>
                          <ArrowRight className="h-4 w-4 shrink-0 text-ink-4" aria-hidden />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
