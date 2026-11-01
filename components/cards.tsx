"use client";

import { ArrowUpRight, CalendarClock, MapPin, Wallet } from "lucide-react";
import Link from "next/link";
import { SaveButton } from "@/components/actions";
import { MatchPill } from "@/components/match";
import { Badge } from "@/components/ui";
import { AID_LABELS, FIELD_LABELS, OPPORTUNITY_TYPE_LABELS } from "@/lib/data/taxonomy";
import type { CareerMatch } from "@/lib/matching/career";
import type { MatchResult } from "@/lib/matching/types";
import type { Career, Opportunity, University } from "@/lib/types";
import { cn } from "@/lib/utils";

const FUNDING_LABEL: Record<Opportunity["funding"]["kind"], string> = {
  "fully-funded": "Fully funded",
  partial: "Partial funding",
  paid: "Paid",
  prize: "Prizes",
  unpaid: "Unpaid",
  varies: "Funding varies",
};

export function UniversityCard({ u, match, why }: { u: University; match?: MatchResult; why?: string }) {
  return (
    <article className="card card-hover group relative flex flex-col p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-[15.5px] font-semibold leading-snug">
            <Link href={`/universities/${u.slug}`} className="after:absolute after:inset-0 after:content-[''] focus:outline-none">
              {u.name}
            </Link>
          </h3>
          <p className="mt-1 flex items-center gap-1 text-[12.5px] text-ink-3">
            <MapPin className="h-3 w-3" aria-hidden /> {u.city}, {u.country}
          </p>
        </div>
        <SaveButton kind="university" slug={u.slug} title={u.shortName ?? u.name} />
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {match && <MatchPill score={match.score} eligible={match.eligible} />}
        {u.qsRank && <Badge tone="outline" title="QS World University Rankings 2027">QS #{u.qsRank}</Badge>}
        <Badge tone={u.aid.kind === "need-based-full" || u.aid.kind === "government" ? "brand" : "neutral"}>{AID_LABELS[u.aid.kind]}</Badge>
      </div>
      <p className="mt-3 line-clamp-2 text-[13px] leading-relaxed text-ink-2">{u.notablePrograms.slice(0, 3).join(" · ")}</p>
      {why && <p className="mt-3 rounded bg-paper px-2.5 py-2 text-[12.5px] leading-relaxed text-ink-2">{why}</p>}
      <div className="flex-1" />
      <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-line pt-3 text-[12px]">
        <div className="min-w-0">
          <dt className="flex items-center gap-1 text-ink-4"><Wallet className="h-3 w-3" aria-hidden /> Tuition</dt>
          <dd className="mt-0.5 line-clamp-2 text-ink-2">{u.tuition.display}</dd>
        </div>
        <div className="min-w-0">
          <dt className="flex items-center gap-1 text-ink-4"><CalendarClock className="h-3 w-3" aria-hidden /> Deadline</dt>
          <dd className="mt-0.5 line-clamp-2 text-ink-2">{u.deadlines[0]?.timing ?? "See official site"}</dd>
        </div>
      </dl>
    </article>
  );
}

export function OpportunityCard({ o, match, why, compact }: { o: Opportunity; match?: MatchResult; why?: string; compact?: boolean }) {
  const fields = o.fields === "any" ? "All fields" : o.fields.slice(0, 2).map((f) => FIELD_LABELS[f]).join(", ");
  return (
    <article className="card card-hover relative flex flex-col p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="eyebrow mb-1.5">{OPPORTUNITY_TYPE_LABELS[o.type]}</p>
          <h3 className="text-[15.5px] font-semibold leading-snug">
            <Link href={`/opportunities/${o.slug}`} className="after:absolute after:inset-0 after:content-[''] focus:outline-none">
              {o.title}
            </Link>
          </h3>
          <p className="mt-1 text-[12.5px] text-ink-3">{o.organization}</p>
        </div>
        <SaveButton kind="opportunity" slug={o.slug} title={o.title} />
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {match && <MatchPill score={match.score} eligible={match.eligible} />}
        <Badge tone={o.funding.kind === "fully-funded" ? "brand" : "neutral"}>{FUNDING_LABEL[o.funding.kind]}</Badge>
        <Badge tone="outline">{o.format === "online" ? "Online" : o.format === "hybrid" ? "Hybrid" : "In person"}</Badge>
      </div>
      {!compact && <p className="mt-3 line-clamp-2 text-[13px] leading-relaxed text-ink-2">{o.summary}</p>}
      {why && <p className="mt-3 rounded bg-paper px-2.5 py-2 text-[12.5px] leading-relaxed text-ink-2">{why}</p>}
      <div className="flex-1" />
      <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-line pt-3 text-[12px]">
        <div className="min-w-0">
          <dt className="flex items-center gap-1 text-ink-4"><MapPin className="h-3 w-3" aria-hidden /> Location</dt>
          <dd className="mt-0.5 line-clamp-1 text-ink-2">{o.location}</dd>
        </div>
        <div className="min-w-0">
          <dt className="flex items-center gap-1 text-ink-4"><CalendarClock className="h-3 w-3" aria-hidden /> Deadline</dt>
          <dd className="mt-0.5 line-clamp-2 text-ink-2">{o.deadline.timing}</dd>
        </div>
        {!compact && (
          <div className="col-span-2 min-w-0">
            <dt className="sr-only">Eligibility</dt>
            <dd className="line-clamp-1 text-ink-3">{fields} · {o.requirements[0]?.text}</dd>
          </div>
        )}
      </dl>
    </article>
  );
}

export function CareerCard({ c, match, className }: { c: Career; match?: CareerMatch; className?: string }) {
  return (
    <article className={cn("card card-hover relative flex flex-col p-5", className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="eyebrow mb-1.5">{c.family}</p>
          <h3 className="text-[15.5px] font-semibold">
            <Link href={`/careers/${c.slug}`} className="after:absolute after:inset-0 after:content-[''] focus:outline-none">
              {c.title}
            </Link>
          </h3>
        </div>
        {match ? <MatchPill score={match.score} /> : <ArrowUpRight className="h-4 w-4 text-ink-4" aria-hidden />}
      </div>
      <p className="mt-2 text-[13px] leading-relaxed text-ink-2">{c.summary}</p>
      {match && (
        <div className="mt-3 space-y-1.5 text-[12.5px]">
          {match.strong.length > 0 && <p><span className="font-medium text-ok">Strong:</span> <span className="text-ink-2">{match.strong.slice(0, 3).join(", ")}</span></p>}
          {match.develop.length > 0 && <p><span className="font-medium text-warn">Develop:</span> <span className="text-ink-2">{match.develop.slice(0, 3).map((d) => d.name).join(", ")}</span></p>}
        </div>
      )}
      <p className="mt-auto pt-4 text-[12px] text-ink-3">Entry roles: {c.entryRoles.slice(0, 2).join(", ")}</p>
    </article>
  );
}
