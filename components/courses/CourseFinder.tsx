"use client";

import { Award, Building2, Clock, ExternalLink, GraduationCap, Languages } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { FilterPanel, FilterSelect, FilterToggle, SearchInput, useUrlFilters } from "@/components/filters";
import { Badge, Button, Chip, EmptyState } from "@/components/ui";
import { COURSE_DOMAINS, langName, type Course } from "@/lib/live/course-meta";

const DEFAULTS = { q: "", domain: "", lang: "", cert: "" };
const LANG_OPTIONS: [string, string][] = [["", "Any language"], ...["en", "es", "fr", "ar", "pt-BR", "ru", "zh-CN", "de", "ja", "ko", "id", "tr"].map((l) => [l, langName(l)] as [string, string])];
const PAGE = 48;
const label = (s: string) => s.replace(/-/g, " ").replace(/^\w/, (c) => c.toUpperCase());

interface Resp { catalogueSize: number; total: number; results: Course[]; domains: Record<string, number> }

export function CourseFinder() {
  const { state: f, set, reset, activeCount } = useUrlFilters(DEFAULTS);
  const [data, setData] = useState<Resp | null>(null);
  const [items, setItems] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const req = useRef(0);

  const params = (offset: number) => new URLSearchParams({ ...(f.q && { q: f.q }), ...(f.domain && { domain: f.domain }), ...(f.lang && { lang: f.lang }), ...(f.cert && { cert: "1" }), offset: String(offset), limit: String(PAGE) }).toString();

  useEffect(() => {
    const id = ++req.current;
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const r = await fetch(`/api/courses?${params(0)}`);
        if (!r.ok) throw new Error();
        const j = (await r.json()) as Resp;
        if (id !== req.current) return;
        setData(j);
        setItems(j.results);
        setFailed(false);
      } catch {
        if (id === req.current) setFailed(true);
      } finally {
        if (id === req.current) setLoading(false);
      }
    }, f.q ? 250 : 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [f.q, f.domain, f.lang, f.cert]);

  async function more() {
    setLoading(true);
    try {
      const j = (await (await fetch(`/api/courses?${params(items.length)}`)).json()) as Resp;
      setItems((x) => [...x, ...j.results]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container py-8">
      <div className="scrollbar-none -mx-4 mb-6 flex gap-2 overflow-x-auto px-4 pb-1" role="group" aria-label="Subject">
        <Chip active={!f.domain} onClick={() => set("domain", "")}>All subjects</Chip>
        {Object.entries(COURSE_DOMAINS).map(([k, v]) => (
          <Chip key={k} active={f.domain === k} onClick={() => set("domain", f.domain === k ? "" : k)}>{v}</Chip>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[250px_1fr]">
        <FilterPanel activeCount={activeCount} onReset={reset} resultCount={data?.total ?? 0}>
          <FilterSelect id="c-domain" label="Subject" value={f.domain} onChange={(v) => set("domain", v)} options={[["", "All subjects"], ...Object.entries(COURSE_DOMAINS).map(([k, v]) => [k, v] as [string, string])]} />
          <FilterSelect id="c-lang" label="Language" value={f.lang} onChange={(v) => set("lang", v)} options={LANG_OPTIONS} />
          <FilterToggle id="c-cert" label="Offers a certificate" checked={!!f.cert} onChange={(v) => set("cert", v ? "1" : "")} />
          <p className="text-[12px] leading-relaxed text-ink-4">Most Coursera courses can be audited for free; the certificate is usually paid, and financial aid is available on many courses.</p>
        </FilterPanel>

        <div className="min-w-0">
          <div className="mb-4">
            <SearchInput value={f.q} onChange={(v) => set("q", v)} placeholder="Search courses — e.g. Python, machine learning, accounting, IELTS…" label="Search courses" />
          </div>
          <p className="mb-4 text-[13px] text-ink-3" aria-live="polite">
            {data ? `${data.total.toLocaleString("en")} of ${data.catalogueSize.toLocaleString("en")} courses` : "Loading the catalogue…"}
          </p>
          {failed ? (
            <EmptyState icon={<GraduationCap />} title="The course catalogue didn't load." body="Coursera's catalogue didn't respond. Try again in a moment." action={<Button variant="secondary" onClick={() => location.reload()}>Try again</Button>} />
          ) : !loading && data && data.total === 0 ? (
            <EmptyState icon={<GraduationCap />} title="No courses match." body="Try a shorter search or remove a filter." action={<Button variant="secondary" onClick={reset}>Clear filters</Button>} />
          ) : (
            <ul className={`grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 [&>*]:min-w-0 ${loading && !items.length ? "opacity-60" : ""}`}>
              {(items.length ? items : []).map((c) => (
                <li key={c.id}>
                  <a href={c.url} target="_blank" rel="noopener noreferrer" className="card card-hover group flex h-full flex-col p-4">
                    <div className="mb-2 flex flex-wrap gap-1.5">
                      <Badge tone="brand">{COURSE_DOMAINS[c.domain] ?? label(c.domain)}</Badge>
                      {c.certificate && <Badge tone="ok"><Award className="h-3 w-3" aria-hidden />Certificate</Badge>}
                    </div>
                    <h3 className="line-clamp-2 text-[14.5px] font-semibold leading-snug group-hover:text-brand-700">{c.name}</h3>
                    <p className="mt-1 flex items-center gap-1.5 text-[12.5px] text-ink-2"><Building2 className="h-3.5 w-3.5 shrink-0 text-ink-4" aria-hidden /><span className="line-clamp-1">{c.partner}</span></p>
                    {c.subdomain && <p className="mt-1 text-[12px] text-ink-3">{label(c.subdomain)}</p>}
                    <div className="flex-1" />
                    <div className="mt-3 flex items-center justify-between gap-2 border-t border-line pt-2.5 text-[11.5px] text-ink-4">
                      <span className="flex min-w-0 items-center gap-3">
                        {c.workload && <span className="flex items-center gap-1 truncate"><Clock className="h-3 w-3 shrink-0" aria-hidden />{c.workload}</span>}
                        <span className="flex items-center gap-1"><Languages className="h-3 w-3" aria-hidden />{langName(c.lang)}</span>
                      </span>
                      <span className="flex shrink-0 items-center gap-1">Coursera <ExternalLink className="h-3 w-3" aria-hidden /></span>
                    </div>
                  </a>
                </li>
              ))}
              {loading && !items.length && Array.from({ length: 6 }, (_, i) => <li key={i} className="skeleton h-40 rounded-lg" />)}
            </ul>
          )}
          {data && items.length < data.total && !failed && (
            <div className="mt-6 flex justify-center">
              <Button variant="secondary" loading={loading} onClick={more}>Show more ({(data.total - items.length).toLocaleString("en")} left)</Button>
            </div>
          )}
          <p className="mt-8 text-[12px] leading-relaxed text-ink-4">
            Course data from <a href="https://www.coursera.org" target="_blank" rel="noopener noreferrer" className="underline hover:text-ink-2">Coursera</a>&apos;s public catalogue, refreshed daily. CareerPath isn&apos;t affiliated with Coursera — prices and access are shown on each course page.
          </p>
        </div>
      </div>
    </div>
  );
}
