"use client";

import { AlertTriangle, Check, CircleHelp, ExternalLink, Info, X } from "lucide-react";
import { MATCH_DISCLAIMER, matchLabel, type Check as MatchCheck, type MatchResult } from "@/lib/matching/types";
import type { Source } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Badge } from "./ui";

export function matchTone(score: number) {
  if (score >= 85) return { ring: "#225548", text: "text-brand-700", bg: "bg-brand-50" };
  if (score >= 70) return { ring: "#2F6B5B", text: "text-brand-600", bg: "bg-brand-50" };
  if (score >= 55) return { ring: "#94570A", text: "text-warn", bg: "bg-warn-bg" };
  return { ring: "#8A8F99", text: "text-ink-3", bg: "bg-ink/[0.04]" };
}

/** Compact pill used on cards: "91% match". */
export function MatchPill({ score, eligible, className }: { score: number; eligible?: boolean | null; className?: string }) {
  if (eligible === false) {
    return (
      <span className={cn("inline-flex items-center gap-1 rounded bg-ink/[0.05] px-1.5 py-0.5 text-[11.5px] font-medium text-ink-3", className)} title="Based on your profile, at least one requirement isn't met">
        <X className="h-3 w-3" aria-hidden /> Not eligible
      </span>
    );
  }
  const t = matchTone(score);
  return (
    <span className={cn("inline-flex items-center gap-1 rounded px-1.5 py-0.5 font-mono text-[11.5px] font-medium", t.bg, t.text, className)} title={`${matchLabel(score)} — informational Profile Match`}>
      {score}% match
    </span>
  );
}

/** Circular meter used on detail pages. */
export function MatchRing({ score, size = 76, label = "Profile Match" }: { score: number; size?: number; label?: string }) {
  const r = (size - 8) / 2;
  const c = 2 * Math.PI * r;
  const t = matchTone(score);
  return (
    <div className="flex items-center gap-4">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90" aria-hidden>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#E4E1D8" strokeWidth={6} />
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={t.ring} strokeWidth={6} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - score / 100)} style={{ transition: "stroke-dashoffset 600ms ease" }} />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center font-mono text-[18px] font-semibold text-ink">{score}%</span>
      </div>
      <div>
        <p className="eyebrow">{label}</p>
        <p className={cn("text-[15px] font-semibold", t.text)}>{matchLabel(score)}</p>
      </div>
    </div>
  );
}

const ICON = {
  pass: { I: Check, cls: "text-ok bg-ok-bg", sr: "Met" },
  warn: { I: AlertTriangle, cls: "text-warn bg-warn-bg", sr: "Check" },
  fail: { I: X, cls: "text-bad bg-bad-bg", sr: "Not met" },
  unknown: { I: CircleHelp, cls: "text-ink-3 bg-ink/[0.05]", sr: "Unknown" },
} as const;

export function CheckList({ checks }: { checks: MatchCheck[] }) {
  return (
    <ul className="space-y-2.5">
      {checks.map((c, i) => {
        const { I, cls, sr } = ICON[c.status];
        return (
          <li key={i} className="flex gap-2.5 text-[13.5px]">
            <span className={cn("mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded", cls)}>
              <I className="h-3 w-3" aria-hidden />
              <span className="sr-only">{sr}:</span>
            </span>
            <span className="min-w-0">
              <span className="text-ink">{c.label}</span>
              {c.detail && <span className="block text-[12.5px] text-ink-3">{c.detail}</span>}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

export function MatchBreakdown({ match, title = "Profile Match" }: { match: MatchResult; title?: string }) {
  const elig = match.checks.filter((c) => c.group === "eligibility");
  const fit = match.checks.filter((c) => c.group === "fit");
  return (
    <div className="card overflow-hidden">
      <div className="space-y-4 border-b border-line p-5">
        <MatchRing score={match.score} label={title} />
        <div className="w-full space-y-2">
          {match.components.map((c) => (
            <div key={c.key}>
              <div className="flex justify-between text-[12px] text-ink-3">
                <span>{c.label}</span>
                <span className="font-mono text-ink-2">{c.score}</span>
              </div>
              <div className="mt-1 h-1 overflow-hidden rounded-full bg-line/70">
                <div className="h-full rounded-full bg-brand-500" style={{ width: `${c.score}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="grid gap-6 p-5">
        <div>
          <h3 className="mb-3 text-[13px] font-semibold">Eligibility</h3>
          {elig.length ? <CheckList checks={elig} /> : <p className="text-[13px] text-ink-3">No structured eligibility rules captured.</p>}
        </div>
        <div>
          <h3 className="mb-3 text-[13px] font-semibold">Personal fit</h3>
          {fit.length ? <CheckList checks={fit} /> : <p className="text-[13px] text-ink-3">Add interests, goals and destinations to see fit signals.</p>}
        </div>
      </div>
      <p className="flex items-start gap-2 border-t border-line bg-paper px-5 py-3 text-[12px] leading-relaxed text-ink-3">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
        {MATCH_DISCLAIMER}
      </p>
    </div>
  );
}

const STATUS_COPY: Record<Source["status"], { label: string; tone: "ok" | "info" | "warn" }> = {
  verified: { label: "Verified", tone: "ok" },
  indicative: { label: "Indicative — confirm", tone: "info" },
  unverified: { label: "Not yet verified", tone: "warn" },
};

export function SourceNote({ source, className }: { source: Source; className?: string }) {
  const s = STATUS_COPY[source.status];
  return (
    <div className={cn("flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-ink-3", className)}>
      <Badge tone={s.tone}>{s.label}</Badge>
      <span>
        Source:{" "}
        <a href={source.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-0.5 text-ink-2 underline decoration-line-strong underline-offset-2 hover:text-brand-700">
          {source.org}
          <ExternalLink className="h-3 w-3" aria-hidden />
          <span className="sr-only">(opens in a new tab)</span>
        </a>
      </span>
      {source.lastVerified && <span>· Last verified {new Date(source.lastVerified + "-01").toLocaleDateString("en-GB", { month: "long", year: "numeric" })}</span>}
    </div>
  );
}
