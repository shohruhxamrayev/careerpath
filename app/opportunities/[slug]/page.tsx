import { ArrowLeft, ExternalLink } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AddToPlannerButton, SaveButton } from "@/components/actions";
import { CareerCard, OpportunityCard } from "@/components/cards";
import { MatchPanel, SectionNav } from "@/components/detail";
import { SourceNote } from "@/components/match";
import { Badge, ButtonLink } from "@/components/ui";
import { careers } from "@/lib/data/careers";
import { getOpportunity, opportunities } from "@/lib/data/opportunities";
import { FIELD_LABELS, OPPORTUNITY_TYPE_LABELS, STUDENT_LEVEL_LABELS } from "@/lib/data/taxonomy";

export function generateStaticParams() {
  return opportunities.map((o) => ({ slug: o.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const o = getOpportunity(params.slug);
  return o ? { title: o.title, description: o.summary } : { title: "Opportunity not found" };
}

const SECTIONS = [
  { id: "overview", label: "Overview" },
  { id: "eligibility", label: "Eligibility" },
  { id: "funding", label: "Funding" },
  { id: "deadline", label: "Deadline" },
  { id: "location", label: "Location" },
  { id: "process", label: "Application process" },
];

const FUNDING = { "fully-funded": "Fully funded", partial: "Partial funding", paid: "Paid", prize: "Prizes / awards", unpaid: "Unpaid", varies: "Varies" };

export default function OpportunityPage({ params }: { params: { slug: string } }) {
  const o = getOpportunity(params.slug);
  if (!o) notFound();

  const relatedCareers = careers.filter((c) => c.opportunitySlugs.includes(o.slug)).slice(0, 3);
  const similar = opportunities.filter((x) => x.slug !== o.slug && x.type === o.type).slice(0, 3);

  return (
    <>
      <div className="night-band">
        <div className="container py-8">
          <Link href="/opportunities" className="inline-flex items-center gap-1.5 text-[13px] text-night-300 hover:text-white">
            <ArrowLeft className="h-3.5 w-3.5" /> All opportunities
          </Link>
          <div className="mt-5 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="flex flex-wrap gap-1.5">
                <Badge tone="brand">{OPPORTUNITY_TYPE_LABELS[o.type]}</Badge>
                <Badge>{FUNDING[o.funding.kind]}</Badge>
                <Badge tone="outline">{o.format === "online" ? "Online" : o.format === "hybrid" ? "Hybrid" : "In person"}</Badge>
              </div>
              <h1 className="display mt-3 text-[32px] leading-[1.1] sm:text-[42px]">{o.title}</h1>
              <p className="mt-2 text-[15px] text-ink-3">{o.organization}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <SaveButton kind="opportunity" slug={o.slug} title={o.title} variant="button" />
              <AddToPlannerButton kind="opportunity" slug={o.slug} title={o.title} subtitle={o.organization} deadlines={[o.deadline]} />
              <ButtonLink href={o.officialUrl} external variant="nightOutline">
                Official website <ExternalLink className="h-3.5 w-3.5" />
              </ButtonLink>
            </div>
          </div>
        </div>
      </div>

      <SectionNav sections={SECTIONS} />

      <div className="container grid gap-8 py-8 lg:grid-cols-[1fr_380px]">
        <div className="min-w-0 space-y-6">
          <Block id="overview" title="Overview">
            <p className="text-[15px] leading-relaxed text-ink-2">{o.overview}</p>
            <dl className="mt-5 grid gap-4 sm:grid-cols-2">
              <Fact label="Who it's for" value={o.levels.map((l) => STUDENT_LEVEL_LABELS[l]).join(", ")} />
              <Fact label="Fields" value={o.fields === "any" ? "All fields" : o.fields.map((f) => FIELD_LABELS[f]).join(", ")} />
            </dl>
            <SourceNote source={o.source} className="mt-5" />
          </Block>

          <Block id="eligibility" title="Eligibility & requirements">
            <ul className="space-y-2.5">
              {o.requirements.map((r, i) => (
                <li key={i} className="flex gap-3 rounded border border-line bg-paper px-3.5 py-3 text-[14px]">
                  <span className="mt-0.5 font-mono text-[11px] text-ink-4">{String(i + 1).padStart(2, "0")}</span>
                  <span className="text-ink-2">{r.text}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-[12.5px] text-ink-3">Summarised from the official programme pages. The official rules always take precedence.</p>
          </Block>

          <Block id="funding" title="Funding">
            <p className="text-[15px] leading-relaxed text-ink-2">{o.funding.summary}</p>
          </Block>

          <Block id="deadline" title="Deadline">
            <div className="rounded border border-line p-4">
              <div className="flex flex-col gap-1 sm:flex-row sm:justify-between">
                <p className="text-[13px] font-medium text-ink-2">{o.deadline.label}</p>
                <p className="text-[14px]">{o.deadline.timing}</p>
              </div>
              <SourceNote source={o.deadline.source} className="mt-2.5" />
            </div>
            <p className="mt-3 text-[12.5px] text-ink-3">Timing from previous cycles. Add this to your planner and enter the confirmed date once it&apos;s announced.</p>
          </Block>

          <Block id="location" title="Location">
            <p className="text-[15px] text-ink-2">{o.location}</p>
            {o.hostCountries.length > 0 && <p className="mt-2 text-[13px] text-ink-3">Countries: {o.hostCountries.join(", ")}</p>}
          </Block>

          <Block id="process" title="Application process">
            <ol className="space-y-3">
              {o.applicationSteps.map((s, i) => (
                <li key={i} className="flex gap-3 text-[14.5px] text-ink-2">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-50 font-mono text-[12px] text-brand-700">{i + 1}</span>
                  <span className="pt-0.5">{s}</span>
                </li>
              ))}
            </ol>
            <ButtonLink href={o.officialUrl} external className="mt-5">
              Apply on the official website <ExternalLink className="h-3.5 w-3.5" />
            </ButtonLink>
          </Block>

          {relatedCareers.length > 0 && (
            <section>
              <h2 className="mb-3 text-[16px] font-semibold">Careers this builds toward</h2>
              <div className="grid gap-3 sm:grid-cols-3">{relatedCareers.map((c) => <CareerCard key={c.slug} c={c} />)}</div>
            </section>
          )}
          {similar.length > 0 && (
            <section>
              <h2 className="mb-3 text-[16px] font-semibold">Similar {OPPORTUNITY_TYPE_LABELS[o.type].toLowerCase()}s</h2>
              <div className="grid gap-3 sm:grid-cols-3">{similar.map((x) => <OpportunityCard key={x.slug} o={x} compact />)}</div>
            </section>
          )}
        </div>

        <aside className="lg:sticky lg:top-32 lg:self-start">
          <MatchPanel kind="opportunity" slug={o.slug} />
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

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[12px] text-ink-3">{label}</dt>
      <dd className="mt-0.5 text-[14px] text-ink">{value}</dd>
    </div>
  );
}
