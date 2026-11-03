"use client";

import { Briefcase, TrendingDown, TrendingUp } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { FilterPanel, FilterSelect, SearchInput, useUrlFilters } from "@/components/filters";
import { Badge, Button, Chip, EmptyState } from "@/components/ui";
import { JOB_ZONES, money, type OccRow } from "@/lib/data/occupation-meta";

const DEFAULTS = { q: "", family: "", zone: "", pay: "", sort: "" };
const PAGE = 60;

export function OccupationDirectory({ rows: all, families }: { rows: OccRow[]; families: string[] }) {
  const { state: f, set, reset, activeCount } = useUrlFilters(DEFAULTS);
  const counts = useMemo(() => Object.fromEntries(families.map((fam) => [fam, all.filter((r) => r[2] === fam).length])), [all, families]);

  const rows = useMemo(() => {
    const words = f.q.toLowerCase().split(/\s+/).filter(Boolean);
    const list = all.filter(([, title, family, wage, , zone, alt]) => {
      if (f.family && family !== f.family) return false;
      if (f.zone && String(zone) !== f.zone) return false;
      if (f.pay && (wage ?? 0) < Number(f.pay)) return false;
      if (words.length) {
        const hay = `${title} ${alt} ${family}`.toLowerCase();
        if (!words.every((w) => hay.includes(w))) return false;
      }
      return true;
    });
    const sort = f.sort || (words.length ? "relevance" : "name");
    const inTitle = (t: string) => (words.length && words.every((w) => t.toLowerCase().includes(w)) ? 1 : 0);
    list.sort((a, b) =>
      sort === "pay" ? (b[3] ?? -1) - (a[3] ?? -1)
      : sort === "growth" ? (b[4] ?? -99) - (a[4] ?? -99)
      : sort === "relevance" ? inTitle(b[1]) - inTitle(a[1]) || a[1].localeCompare(b[1])
      : a[1].localeCompare(b[1]),
    );
    return list;
  }, [all, f]);

  const [shown, setShown] = useState(PAGE);
  useEffect(() => setShown(PAGE), [f]);

  return (
    <div className="container py-8">
      <div className="scrollbar-none -mx-4 mb-6 flex gap-2 overflow-x-auto px-4 pb-1" role="group" aria-label="Career family">
        <Chip active={!f.family} onClick={() => set("family", "")}>All <span className="font-mono text-[11px] text-ink-4">{all.length}</span></Chip>
        {families.map((fam) => (
          <Chip key={fam} active={f.family === fam} onClick={() => set("family", f.family === fam ? "" : fam)}>
            {fam} <span className="font-mono text-[11px] text-ink-4">{counts[fam]}</span>
          </Chip>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[250px_1fr]">
        <FilterPanel activeCount={activeCount} onReset={reset} resultCount={rows.length}>
          <FilterSelect id="o-fam" label="Career family" value={f.family} onChange={(v) => set("family", v)} options={[["", "All families"], ...families.map((x) => [x, x] as [string, string])]} />
          <FilterSelect id="o-zone" label="Preparation needed" value={f.zone} onChange={(v) => set("zone", v)} options={[["", "Any"], ...[1, 2, 3, 4, 5].map((z) => [String(z), `${z} · ${JOB_ZONES[z].label}`] as [string, string])]} />
          <FilterSelect id="o-pay" label="US median pay at least" value={f.pay} onChange={(v) => set("pay", v)} options={[["", "Any pay"], ["40000", "$40,000"], ["60000", "$60,000"], ["80000", "$80,000"], ["100000", "$100,000"], ["150000", "$150,000"]]} />
        </FilterPanel>

        <div className="min-w-0">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row">
            <SearchInput value={f.q} onChange={(v) => set("q", v)} placeholder="Search any job — nurse, pilot, data scientist, chef, lawyer…" label="Search occupations" />
            <label htmlFor="o-sort" className="sr-only">Sort</label>
            <select id="o-sort" value={f.sort || (f.q ? "relevance" : "name")} onChange={(e) => set("sort", e.target.value)} className="input h-11 w-full sm:w-48">
              {f.q && <option value="relevance">Best match</option>}
              <option value="name">Name (A–Z)</option>
              <option value="pay">Highest pay</option>
              <option value="growth">Fastest growth</option>
            </select>
          </div>
          <p className="mb-4 text-[13px] text-ink-3" aria-live="polite">{rows.length.toLocaleString("en")} occupations</p>
          {rows.length === 0 ? (
            <EmptyState icon={<Briefcase />} title="No occupations match." body="Try a different word — many jobs have several names, and we search those too." action={<Button variant="secondary" onClick={reset}>Clear filters</Button>} />
          ) : (
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 [&>*]:min-w-0">
              {rows.slice(0, shown).map(([slug, title, family, wage, growth, zone, alt]) => (
                <li key={slug}>
                  <Link href={`/occupations/${slug}`} className="card card-hover group flex h-full flex-col p-4">
                    <p className="eyebrow mb-1.5 truncate">{family}</p>
                    <h3 className="line-clamp-2 text-[14.5px] font-semibold leading-snug group-hover:text-brand-700">{title}</h3>
                    {alt && <p className="mt-1 line-clamp-1 text-[12px] text-ink-3">Also: {alt}</p>}
                    <div className="flex-1" />
                    <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-line pt-2.5">
                      {wage != null && <Badge tone="neutral">{money(wage)}/yr</Badge>}
                      {growth != null && (
                        <Badge tone={growth >= 5 ? "ok" : growth < 0 ? "warn" : "outline"}>
                          {growth >= 0 ? <TrendingUp className="h-3 w-3" aria-hidden /> : <TrendingDown className="h-3 w-3" aria-hidden />}
                          {growth > 0 ? "+" : ""}{growth}%
                        </Badge>
                      )}
                      {zone && <Badge tone="outline" title={JOB_ZONES[zone].label}>Prep {zone}/5</Badge>}
                    </div>
                  </Link>
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
            Pay is the US median annual wage (May 2025) and growth is the projected change in US employment 2025–35, from the{" "}
            <a href="https://www.bls.gov/emp/" target="_blank" rel="noopener noreferrer" className="underline hover:text-ink-2">U.S. Bureau of Labor Statistics</a>. Occupation details from{" "}
            <a href="https://www.onetcenter.org/database.html" target="_blank" rel="noopener noreferrer" className="underline hover:text-ink-2">O*NET 31.0</a> by the U.S. Department of Labor/ETA, used under the CC BY 4.0 licence. Pay and demand differ by country.
          </p>
        </div>
      </div>
    </div>
  );
}
