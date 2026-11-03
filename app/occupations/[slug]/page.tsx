import { ArrowLeft, Briefcase, ExternalLink, GraduationCap, TrendingUp, Wallet } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SectionNav } from "@/components/detail";
import { Badge } from "@/components/ui";
import { getOccupation, getOccupationByCode, JOB_ZONES, money, occupations, onetUrl, RIASEC, type Occupation } from "@/lib/data/occupations";

export function generateStaticParams() {
  return occupations.map((o) => ({ slug: o.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const o = getOccupation(params.slug);
  return o ? { title: `${o.title} — what they do, skills, pay and outlook`, description: o.description.slice(0, 160) } : { title: "Occupation not found" };
}

const SECTIONS = [
  { id: "overview", label: "Overview" },
  { id: "tasks", label: "What they do" },
  { id: "skills", label: "Skills & knowledge" },
  { id: "education", label: "Education" },
  { id: "personality", label: "Who it suits" },
  { id: "titles", label: "Job titles" },
  { id: "related", label: "Related careers" },
];

function Block({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="card scroll-mt-32 p-5 sm:p-6" aria-labelledby={`${id}-h`}>
      <h2 id={`${id}-h`} className="mb-4 text-[17px] font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function Bars({ items }: { items: [string, number][] }) {
  return (
    <ul className="space-y-2.5">
      {items.map(([name, v]) => (
        <li key={name}>
          <div className="mb-1 flex justify-between gap-3 text-[13.5px]"><span className="text-ink-2">{name}</span><span className="font-mono text-[12px] text-ink-4">{v.toFixed(1)}/5</span></div>
          <div className="h-1.5 rounded-full bg-ink/[0.06]"><div className="h-full rounded-full bg-brand-500" style={{ width: `${Math.min(100, (v / 5) * 100)}%` }} /></div>
        </li>
      ))}
    </ul>
  );
}

function Stat({ icon, label, value, note }: { icon: React.ReactNode; label: string; value: string; note?: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
      <p className="flex items-center gap-1.5 text-[12px] text-night-300">{icon}{label}</p>
      <p className="mt-1 text-[20px] font-semibold text-white">{value}</p>
      {note && <p className="mt-0.5 text-[11.5px] text-night-300">{note}</p>}
    </div>
  );
}

export default function OccupationPage({ params }: { params: { slug: string } }) {
  const o = getOccupation(params.slug);
  if (!o) notFound();
  const b = o.bls;
  const related = o.related.map(getOccupationByCode).filter((x): x is Occupation => !!x);
  const shared = b && b.soc !== o.code.slice(0, 7);
  const q = encodeURIComponent(o.title.replace(/,.*$/, "").replace(/s$/, ""));

  return (
    <>
      <div className="night-band">
        <div className="container py-8">
          <Link href="/occupations" className="inline-flex items-center gap-1.5 text-[13px] text-night-300 hover:text-white">
            <ArrowLeft className="h-3.5 w-3.5" /> All occupations
          </Link>
          <p className="eyebrow mt-5">{o.family}</p>
          <h1 className="display mt-2 text-[32px] leading-[1.1] sm:text-[42px]">{o.title}</h1>
          {o.altTitles.length > 0 && <p className="mt-2 text-[14px] text-night-300">Also called: {o.altTitles.slice(0, 4).join(", ")}</p>}
          <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Stat icon={<Wallet className="h-3.5 w-3.5" />} label="US median pay" value={b?.wage ? `${money(b.wage)}` : "—"} note={b?.wage ? "per year, 2025" : "not published"} />
            <Stat icon={<TrendingUp className="h-3.5 w-3.5" />} label="Job growth 2025–35" value={b?.growth != null ? `${b.growth > 0 ? "+" : ""}${b.growth}%` : "—"} note={b?.growth != null ? (b.growth >= 5 ? "faster than average" : b.growth < 0 ? "declining" : "about average or slower") : undefined} />
            <Stat icon={<Briefcase className="h-3.5 w-3.5" />} label="Openings a year (US)" value={b?.openings != null ? Math.round(b.openings * 1000).toLocaleString("en-US") : "—"} note={b?.emp != null ? `${Math.round(b.emp * 1000).toLocaleString("en-US")} employed` : undefined} />
            <Stat icon={<GraduationCap className="h-3.5 w-3.5" />} label="Typical entry education" value={b?.edu ?? o.education[0]?.[0] ?? "—"} note={o.zone ? `Preparation ${o.zone}/5 · ${JOB_ZONES[o.zone].label}` : undefined} />
          </div>
          {shared && <p className="mt-3 text-[12px] text-night-300">Pay and outlook figures are for the broader occupation group {b!.soc}.</p>}
        </div>
      </div>
      <SectionNav sections={SECTIONS} />
      <div className="container grid gap-8 py-8 lg:grid-cols-[1fr_320px]">
        <div className="min-w-0 space-y-6">
          <Block id="overview" title="What this job is">
            <p className="text-[15px] leading-relaxed text-ink-2">{o.description}</p>
          </Block>

          <Block id="tasks" title="What they do day to day">
            {o.tasks.length ? (
              <ul className="space-y-2">
                {o.tasks.map((t) => <li key={t} className="flex gap-2.5 text-[14px] leading-relaxed text-ink-2"><span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-brand-500" />{t}</li>)}
              </ul>
            ) : (
              <p className="text-[14px] text-ink-3">O*NET groups several different jobs under this title, so it doesn&apos;t publish one task list. See the related careers below for specific roles.</p>
            )}
          </Block>

          {(o.skills.length > 0 || o.knowledge.length > 0) && (
            <Block id="skills" title="Skills and knowledge that matter most">
              <div className="grid gap-8 sm:grid-cols-2">
                {o.skills.length > 0 && <div><h3 className="mb-3 text-[14px] font-semibold">Skills</h3><Bars items={o.skills} /></div>}
                {o.knowledge.length > 0 && <div><h3 className="mb-3 text-[14px] font-semibold">Knowledge</h3><Bars items={o.knowledge} /></div>}
              </div>
              <p className="mt-4 text-[12px] text-ink-4">Importance rated by people working in the job (1 = not important, 5 = extremely important).</p>
            </Block>
          )}

          <Block id="education" title="Education and preparation">
            {o.zone && <p className="mb-3 text-[14px] text-ink-2"><span className="font-medium">Preparation level {o.zone} of 5 — {JOB_ZONES[o.zone].label}.</span> {JOB_ZONES[o.zone].detail}</p>}
            {b?.edu && <p className="mb-3 text-[14px] text-ink-2"><span className="font-medium">Typical entry education (BLS):</span> {b.edu}{b.exp ? `, plus ${b.exp.toLowerCase()} of related work experience` : ""}.</p>}
            {o.education.length > 0 && (
              <div>
                <p className="mb-2 text-[13px] text-ink-3">Highest education of people in this job:</p>
                <ul className="space-y-2">
                  {o.education.map(([lvl, pct]) => (
                    <li key={lvl} className="flex items-center gap-3 text-[13.5px]">
                      <span className="w-36 shrink-0 text-ink-2 sm:w-48">{lvl}</span>
                      <span className="h-1.5 flex-1 rounded-full bg-ink/[0.06]"><span className="block h-full rounded-full bg-mint" style={{ width: `${pct}%` }} /></span>
                      <span className="w-10 text-right font-mono text-[12px] text-ink-4">{pct}%</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Block>

          {o.interests.length > 0 && (
            <Block id="personality" title="Who this job suits">
              <div className="grid gap-3 sm:grid-cols-3">
                {o.interests.map((i, n) => (
                  <div key={i} className="rounded border border-line p-3.5">
                    <p className="text-[13px] font-semibold">{n === 0 ? "Mostly " : ""}{i}</p>
                    <p className="mt-1 text-[12.5px] leading-relaxed text-ink-3">{RIASEC[i]}</p>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-[12px] text-ink-4">Based on the Holland (RIASEC) interest profile for this occupation.</p>
            </Block>
          )}

          {o.altTitles.length > 0 && (
            <Block id="titles" title="Job titles you'll see in postings">
              <div className="flex flex-wrap gap-1.5">{o.altTitles.map((t) => <Badge key={t} tone="outline">{t}</Badge>)}</div>
            </Block>
          )}

          {related.length > 0 && (
            <Block id="related" title="Related careers">
              <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 [&>*]:min-w-0">
                {related.map((r) => (
                  <li key={r.code}>
                    <Link href={`/occupations/${r.slug}`} className="flex items-center justify-between gap-3 rounded border border-line px-3.5 py-2.5 text-[13.5px] hover:border-brand-300 hover:bg-brand-50">
                      <span className="min-w-0 truncate">{r.title}</span>
                      {r.bls?.wage != null && <span className="shrink-0 font-mono text-[11.5px] text-ink-4">{money(r.bls.wage)}</span>}
                    </Link>
                  </li>
                ))}
              </ul>
            </Block>
          )}
        </div>

        <aside className="space-y-4 lg:sticky lg:top-28 lg:self-start">
          <div className="card p-5">
            <h2 className="mb-3 text-[15px] font-semibold">Get started</h2>
            <ul className="space-y-2 text-[13.5px]">
              <li><Link href={`/courses?q=${q}`} className="text-brand-700 hover:underline">Online courses for this career →</Link></li>
              <li><Link href={`/jobs?q=${q}`} className="text-brand-700 hover:underline">Live internships and jobs →</Link></li>
              <li><Link href="/universities" className="text-brand-700 hover:underline">Universities to study at →</Link></li>
              <li><Link href={`/assistant`} className="text-brand-700 hover:underline">Ask the advisor how to get there →</Link></li>
            </ul>
          </div>
          <div className="card p-5 text-[12.5px] leading-relaxed text-ink-3">
            <h2 className="mb-2 text-[13.5px] font-semibold text-ink">Sources</h2>
            <p>
              Tasks, skills, knowledge, education and interests: <a href={onetUrl(o.code)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-brand-700 hover:underline">O*NET {o.code} <ExternalLink className="h-3 w-3" /></a>, O*NET 31.0 Database, U.S. Department of Labor/ETA, CC BY 4.0. Adapted by CareerPath.
            </p>
            {b && (
              <p className="mt-2">
                Pay and outlook: U.S. Bureau of Labor Statistics, Employment Projections 2025–35
                {b.ooh && <> · <a href={b.ooh} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-brand-700 hover:underline">Occupational Outlook Handbook <ExternalLink className="h-3 w-3" /></a></>}.
              </p>
            )}
            <p className="mt-2">Figures are for the United States; pay and demand differ by country.</p>
          </div>
        </aside>
      </div>
    </>
  );
}
