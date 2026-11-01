import { ArrowLeft, ExternalLink } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CareerMatchPanel } from "@/components/CareerMatchPanel";
import { OpportunityCard, UniversityCard } from "@/components/cards";
import { SectionNav } from "@/components/detail";
import { Badge } from "@/components/ui";
import { careers, getCareer } from "@/lib/data/careers";
import { getOpportunity } from "@/lib/data/opportunities";
import { getSkill } from "@/lib/data/skills";
import { FIELD_LABELS } from "@/lib/data/taxonomy";
import { universities } from "@/lib/data/universities";
import type { Opportunity, Skill } from "@/lib/types";

export function generateStaticParams() {
  return careers.map((c) => ({ slug: c.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const c = getCareer(params.slug);
  return c ? { title: c.title, description: c.summary } : { title: "Career not found" };
}

const SECTIONS = [
  { id: "overview", label: "Overview" },
  { id: "skills", label: "Key skills" },
  { id: "education", label: "Education paths" },
  { id: "roles", label: "Entry roles" },
  { id: "build", label: "Build your profile" },
  { id: "resources", label: "Courses & resources" },
  { id: "majors", label: "Related majors" },
];

export default function CareerPage({ params }: { params: { slug: string } }) {
  const c = getCareer(params.slug);
  if (!c) notFound();
  const skillList = c.keySkills.map(getSkill).filter((s): s is Skill => !!s);
  const opps = c.opportunitySlugs.map(getOpportunity).filter((o): o is Opportunity => !!o);
  const comps = opps.filter((o) => o.type === "competition");
  const interns = opps.filter((o) => o.type === "internship" || o.type === "job" || o.type === "summer-program");
  const otherOpps = opps.filter((o) => !comps.includes(o) && !interns.includes(o));
  const unis = universities
    .filter((u) => u.fields.includes(c.relatedFields[0]))
    .sort((a, b) => (a.qsRank ?? 999) - (b.qsRank ?? 999))
    .slice(0, 3);

  return (
    <>
      <div className="border-b border-line bg-surface">
        <div className="container py-8">
          <Link href="/careers" className="inline-flex items-center gap-1.5 text-[13px] text-ink-3 hover:text-ink">
            <ArrowLeft className="h-3.5 w-3.5" /> All careers
          </Link>
          <p className="eyebrow mt-5">{c.family}</p>
          <h1 className="display mt-2 text-[34px] leading-[1.1] sm:text-[44px]">{c.title}</h1>
          <p className="mt-3 max-w-2xl text-[16px] leading-relaxed text-ink-3">{c.summary}</p>
        </div>
      </div>
      <SectionNav sections={SECTIONS} />
      <div className="container grid gap-8 py-8 lg:grid-cols-[1fr_340px]">
        <div className="min-w-0 space-y-6">
          <Block id="overview" title="What this career is">
            <p className="text-[15px] leading-relaxed text-ink-2">{c.whatItIs}</p>
            <h3 className="mb-2 mt-5 text-[14px] font-semibold">What professionals do</h3>
            <ul className="space-y-1.5">
              {c.dayToDay.map((d) => <li key={d} className="flex gap-2.5 text-[14px] text-ink-2"><span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-brand-500" />{d}</li>)}
            </ul>
            <p className="mt-5 rounded bg-paper px-3.5 py-3 text-[13.5px] text-ink-2"><span className="font-medium">Outlook:</span> {c.outlook}</p>
          </Block>

          <Block id="skills" title="Key skills">
            <div className="grid gap-3 sm:grid-cols-2">
              {skillList.map((s) => (
                <div key={s.slug} id={`skill-${s.slug}`} className="scroll-mt-32 rounded border border-line p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[14px] font-semibold">{s.name}</p>
                    <Badge>{s.category}</Badge>
                  </div>
                  <p className="mt-1.5 text-[13px] text-ink-3">{s.whyItMatters}</p>
                  <p className="mt-2.5 text-[12px] font-medium text-ink-2">Start with</p>
                  <ul className="mt-1 space-y-0.5 text-[12.5px] text-ink-3">{s.howToStart.slice(0, 2).map((h) => <li key={h}>· {h}</li>)}</ul>
                  {s.resources[0] && (
                    <a href={s.resources[0].url} target="_blank" rel="noopener noreferrer" className="mt-2.5 inline-flex items-center gap-1 text-[12.5px] font-medium text-brand-700 hover:underline">
                      {s.resources[0].title} <ExternalLink className="h-3 w-3" /><span className="sr-only">(opens in a new tab)</span>
                    </a>
                  )}
                </div>
              ))}
            </div>
          </Block>

          <Block id="education" title="Education paths">
            <ol className="space-y-2.5">
              {c.educationPaths.map((e, i) => (
                <li key={e} className="flex gap-3 text-[14px] text-ink-2">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-50 font-mono text-[12px] text-brand-700">{i + 1}</span>
                  <span className="pt-0.5">{e}</span>
                </li>
              ))}
            </ol>
            {unis.length > 0 && (
              <>
                <h3 className="mb-3 mt-6 text-[14px] font-semibold">Universities strong in {FIELD_LABELS[c.relatedFields[0]]}</h3>
                <div className="grid gap-3 sm:grid-cols-3">{unis.map((u) => <UniversityCard key={u.slug} u={u} />)}</div>
              </>
            )}
          </Block>

          <Block id="roles" title="Typical entry-level roles">
            <div className="flex flex-wrap gap-2">{c.entryRoles.map((r) => <span key={r} className="rounded border border-line bg-paper px-3 py-1.5 text-[13.5px]">{r}</span>)}</div>
          </Block>

          <Block id="build" title="Build your profile">
            <h3 className="mb-2 text-[14px] font-semibold">Recommended extracurriculars</h3>
            <ul className="mb-5 grid gap-1.5 sm:grid-cols-2">{c.extracurriculars.map((e) => <li key={e} className="text-[14px] text-ink-2">· {e}</li>)}</ul>
            {comps.length > 0 && (<><h3 className="mb-3 text-[14px] font-semibold">Recommended competitions</h3><div className="mb-5 grid gap-3 sm:grid-cols-2">{comps.map((o) => <OpportunityCard key={o.slug} o={o} compact />)}</div></>)}
            {interns.length > 0 && (<><h3 className="mb-3 text-[14px] font-semibold">Recommended internships & programmes</h3><div className="mb-5 grid gap-3 sm:grid-cols-2">{interns.map((o) => <OpportunityCard key={o.slug} o={o} compact />)}</div></>)}
            {otherOpps.length > 0 && (<><h3 className="mb-3 text-[14px] font-semibold">Scholarships & fellowships</h3><div className="grid gap-3 sm:grid-cols-2">{otherOpps.map((o) => <OpportunityCard key={o.slug} o={o} compact />)}</div></>)}
          </Block>

          <Block id="resources" title="Courses & resources">
            <ul className="divide-y divide-line rounded border border-line">
              {c.resources.map((r) => (
                <li key={r.url}>
                  <a href={r.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-paper">
                    <span>
                      <span className="block text-[14px] font-medium">{r.title}</span>
                      <span className="text-[12.5px] text-ink-3">{r.provider}</span>
                    </span>
                    <span className="flex shrink-0 items-center gap-2">
                      <Badge tone={r.free ? "ok" : "neutral"}>{r.free ? "Free" : "Paid / audit"}</Badge>
                      <ExternalLink className="h-3.5 w-3.5 text-ink-4" /><span className="sr-only">(opens in a new tab)</span>
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </Block>

          <Block id="majors" title="Related university majors">
            <div className="flex flex-wrap gap-2">
              {c.majors.map((m) => (
                <Link key={m} href={`/search?q=${encodeURIComponent(m)}`} className="rounded border border-line-strong bg-surface px-3 py-1.5 text-[13.5px] hover:border-brand-500 hover:text-brand-700">{m}</Link>
              ))}
            </div>
          </Block>
        </div>
        <aside className="lg:sticky lg:top-32 lg:self-start">
          <CareerMatchPanel slug={c.slug} />
        </aside>
      </div>
    </>
  );
}

function Block({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="card scroll-mt-32 p-5 sm:p-6" aria-labelledby={`${id}-h`}>
      <h2 id={`${id}-h`} className="mb-4 text-[17px] font-semibold">{title}</h2>
      {children}
    </section>
  );
}
