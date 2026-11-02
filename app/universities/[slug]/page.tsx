import { ArrowLeft, ExternalLink, Globe, MapPin } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AddToPlannerButton, SaveButton } from "@/components/actions";
import { OpportunityCard } from "@/components/cards";
import { MatchPanel, SectionNav } from "@/components/detail";
import { LocationGlobe } from "@/components/LocationGlobe";
import { SourceNote } from "@/components/match";
import { Badge, ButtonLink } from "@/components/ui";
import { getOpportunity, opportunities } from "@/lib/data/opportunities";
import { QS_SOURCE } from "@/lib/data/sources";
import { AID_LABELS, DEGREE_LEVEL_LABELS, FIELD_LABELS, SELECTIVITY_LABELS } from "@/lib/data/taxonomy";
import { getUniversity, universities } from "@/lib/data/universities";
import type { Opportunity } from "@/lib/types";

export function generateStaticParams() {
  return universities.map((u) => ({ slug: u.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const u = getUniversity(params.slug);
  return u ? { title: u.name, description: u.overview } : { title: "University not found" };
}

const SECTIONS = [
  { id: "overview", label: "Overview" },
  { id: "admissions", label: "Admissions" },
  { id: "requirements", label: "Requirements" },
  { id: "deadlines", label: "Deadlines" },
  { id: "tuition", label: "Tuition" },
  { id: "scholarships", label: "Scholarships" },
  { id: "programs", label: "Programs" },
  { id: "international", label: "International students" },
  { id: "application", label: "Application" },
];

const TESTING_LABEL = { required: "SAT/ACT required", optional: "Test-optional", "not-used": "Not required for most applicants", varies: "Varies — check policy" };

export default function UniversityPage({ params }: { params: { slug: string } }) {
  const u = getUniversity(params.slug);
  if (!u) notFound();

  const related: Opportunity[] = [
    ...(u.scholarshipSlugs ?? []).map(getOpportunity).filter((o): o is Opportunity => !!o),
    ...opportunities.filter((o) => o.type === "scholarship" && o.hostCountries.includes(u.country) && !(u.scholarshipSlugs ?? []).includes(o.slug)),
  ].slice(0, 4);

  return (
    <>
      <div className="night-band">
        <div className="container py-8">
          <Link href="/universities" className="inline-flex items-center gap-1.5 text-[13px] text-night-300 hover:text-white">
            <ArrowLeft className="h-3.5 w-3.5" /> All universities
          </Link>
          <div className="mt-5 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="flex flex-wrap gap-1.5">
                {u.qsRank && <Badge tone="outline">QS 2027 #{u.qsRank}</Badge>}
                <Badge>{u.type === "public" ? "Public" : "Private"}</Badge>
                <Badge>{SELECTIVITY_LABELS[u.selectivity]}</Badge>
                <Badge tone="brand">{AID_LABELS[u.aid.kind]}</Badge>
              </div>
              <h1 className="display mt-3 text-[34px] leading-[1.1] sm:text-[44px]">{u.name}</h1>
              <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[14px] text-ink-3">
                <span className="inline-flex items-center gap-1.5"><MapPin className="h-4 w-4" /> {u.city}, {u.country}</span>
                <a href={u.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 hover:text-mint">
                  <Globe className="h-4 w-4" /> {new URL(u.website).hostname.replace(/^www\./, "")}
                  <span className="sr-only">(opens in a new tab)</span>
                </a>
                {u.founded && <span>Founded {u.founded}</span>}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <SaveButton kind="university" slug={u.slug} title={u.shortName ?? u.name} variant="button" />
              <AddToPlannerButton kind="university" slug={u.slug} title={u.name} subtitle={`${u.city}, ${u.country}`} deadlines={u.deadlines} />
              <ButtonLink href={`/compare?u=${u.slug}`} variant="nightOutline">
                Compare
              </ButtonLink>
              <ButtonLink href={u.admissionsUrl} external variant="nightOutline">
                Official admissions <ExternalLink className="h-3.5 w-3.5" />
              </ButtonLink>
            </div>
          </div>
        </div>
      </div>

      <SectionNav sections={SECTIONS} />

      <div className="container grid gap-8 py-8 lg:grid-cols-[1fr_380px]">
        <div className="min-w-0 space-y-6">
          <Block id="overview" title="Overview">
            <p className="text-[15px] leading-relaxed text-ink-2">{u.overview}</p>
            <dl className="mt-5 grid gap-4 sm:grid-cols-3">
              <Fact label="Degree levels" value={u.levels.map((l) => DEGREE_LEVEL_LABELS[l]).join(", ")} />
              <Fact label="Language of instruction" value={u.languageOfInstruction} />
              <Fact label="Ranking" value={u.qsRank ? `#${u.qsRank} in QS World University Rankings 2027` : "Not in our ranking data"} />
            </dl>
            {u.qsRank && <SourceNote source={QS_SOURCE} className="mt-4" />}
          </Block>

          <Block id="admissions" title="Admissions">
            <dl className="grid gap-4 sm:grid-cols-2">
              <Fact label="Selectivity" value={SELECTIVITY_LABELS[u.selectivity]} hint="A general characterisation, not an admission rate." />
              <Fact label="How to apply" value={u.applicationPlatform ? `Through ${u.applicationPlatform.name}` : "Directly through the university"} />
            </dl>
          </Block>

          <Block id="requirements" title="Requirements">
            <div className="divide-y divide-line rounded border border-line">
              <Req
                label="English proficiency"
                value={u.english.ielts ? `About IELTS ${u.english.ielts}${u.english.toefl ? ` / TOEFL ${u.english.toefl}` : ""}` : "Minimum not captured"}
                note={u.english.note}
                source={u.english.source}
              />
              <Req label="Standardized testing" value={TESTING_LABEL[u.testing.policy]} note={u.testing.note} source={u.testing.source} />
            </div>
          </Block>

          <Block id="deadlines" title="Deadlines">
            <div className="divide-y divide-line rounded border border-line">
              {u.deadlines.map((d) => (
                <Req key={d.label} label={d.label} value={d.timing} source={d.source} />
              ))}
            </div>
            <p className="mt-3 text-[12.5px] text-ink-3">These describe the usual timing from previous cycles. Exact dates change every year — confirm them on the official site before planning.</p>
          </Block>

          <Block id="tuition" title="Tuition">
            <div className="rounded border border-line">
              <Req label="Annual tuition (international)" value={u.tuition.display} source={u.tuition.source} />
            </div>
          </Block>

          <Block id="scholarships" title="Scholarships & financial aid">
            <div className="rounded border border-line">
              <Req label={AID_LABELS[u.aid.kind]} value={u.aid.summary} source={u.aid.source} />
            </div>
            {related.length > 0 && (
              <>
                <h3 className="mb-3 mt-6 text-[14px] font-semibold">Related external scholarships</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  {related.map((o) => <OpportunityCard key={o.slug} o={o} compact />)}
                </div>
              </>
            )}
          </Block>

          <Block id="programs" title="Programs">
            <ul className="grid gap-2 sm:grid-cols-2">
              {u.notablePrograms.map((p) => (
                <li key={p} className="rounded border border-line bg-paper px-3 py-2.5 text-[14px]">{p}</li>
              ))}
            </ul>
            <p className="mt-4 text-[13px] text-ink-3">Fields: {u.fields.map((f) => FIELD_LABELS[f]).join(" · ")}</p>
          </Block>

          <Block id="international" title="International students">
            <p className="text-[15px] leading-relaxed text-ink-2">{u.internationalNote}</p>
          </Block>

          <Block id="application" title="Application">
            <p className="text-[14px] leading-relaxed text-ink-2">
              Applications are submitted on official channels only. CareerPath doesn&apos;t process applications or share your data with universities.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <ButtonLink href={u.admissionsUrl} external>
                Go to official admissions <ExternalLink className="h-3.5 w-3.5" />
              </ButtonLink>
              {u.applicationPlatform && (
                <ButtonLink href={u.applicationPlatform.url} external variant="secondary">
                  {u.applicationPlatform.name} <ExternalLink className="h-3.5 w-3.5" />
                </ButtonLink>
              )}
            </div>
          </Block>
        </div>

        <aside className="lg:sticky lg:top-32 lg:self-start">
          {u.geo && <LocationGlobe id={u.slug} label={u.shortName ?? u.name} sub={`${u.city}, ${u.country}`} lat={u.geo[0]} lng={u.geo[1]} />}
          <MatchPanel kind="university" slug={u.slug} />
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

function Fact({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div>
      <dt className="text-[12px] text-ink-3">{label}</dt>
      <dd className="mt-0.5 text-[14px] text-ink">{value}</dd>
      {hint && <dd className="mt-0.5 text-[12px] text-ink-4">{hint}</dd>}
    </div>
  );
}

function Req({ label, value, note, source }: { label: string; value: string; note?: string; source: Parameters<typeof SourceNote>[0]["source"] }) {
  return (
    <div className="p-4">
      <div className="flex flex-col gap-1 sm:flex-row sm:justify-between sm:gap-6">
        <p className="text-[13px] font-medium text-ink-2">{label}</p>
        <p className="text-[14px] text-ink sm:text-right">{value}</p>
      </div>
      {note && <p className="mt-1.5 text-[13px] text-ink-3">{note}</p>}
      <SourceNote source={source} className="mt-2.5" />
    </div>
  );
}
