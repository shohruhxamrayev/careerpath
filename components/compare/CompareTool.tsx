"use client";

import { ArrowUpRight, Crown, Plus, Search, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { AID_LABELS, SELECTIVITY_LABELS, TUITION_BAND_MAX } from "@/lib/data/taxonomy";
import { getUniversity, universities } from "@/lib/data/universities";
import { isProfileReady } from "@/lib/matching/profile";
import { matchUniversity } from "@/lib/matching/university";
import { useApp } from "@/lib/store/AppProvider";
import type { University } from "@/lib/types";
import { cn } from "@/lib/utils";

const MAX = 4;
const PRESETS: { label: string; slugs: string[] }[] = [
  { label: "UK Russell Group", slugs: ["university-of-warwick", "university-of-manchester", "university-of-leeds"] },
  { label: "US full-need aid", slugs: ["massachusetts-institute-of-technology", "yale-university", "columbia-university"] },
  { label: "Low tuition in Europe", slugs: ["technical-university-of-munich", "university-of-vienna", "university-of-bologna"] },
  { label: "Asia's tech leaders", slugs: ["kaist", "national-university-of-singapore", "postech"] },
];

type Row = { label: string; value: (u: University, i: number) => React.ReactNode; best?: (list: University[]) => number[] };

const bestBy = (list: University[], score: (u: University) => number | null, dir: "min" | "max") => {
  const vals = list.map(score);
  const valid = vals.filter((v): v is number => v != null);
  if (valid.length < 2) return [];
  const target = dir === "min" ? Math.min(...valid) : Math.max(...valid);
  if (valid.every((v) => v === target)) return [];
  return vals.map((v, i) => (v === target ? i : -1)).filter((i) => i >= 0);
};

export function CompareTool() {
  const params = useSearchParams();
  const router = useRouter();
  const path = usePathname();
  const { user, data } = useApp();
  const profile = data?.profile ?? null;
  const personalised = !!user && isProfileReady(profile);
  const [q, setQ] = useState("");

  const slugs = (params.get("u") ?? "").split(",").filter((s) => !!getUniversity(s)).slice(0, MAX);
  const list = slugs.map((s) => getUniversity(s)!);
  const matches = list.map((u) => (personalised ? matchUniversity(profile!, u) : null));
  const setSlugs = (next: string[]) => router.replace(`${path}${next.length ? `?u=${next.join(",")}` : ""}`, { scroll: false });

  const suggestions = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return [];
    return universities.filter((u) => !slugs.includes(u.slug) && [u.name, u.shortName, u.city, u.country].join(" ").toLowerCase().includes(s)).slice(0, 7);
  }, [q, slugs]);

  const rows: Row[] = [
    ...(personalised ? [{ label: "Your Profile Match", value: (_u: University, i: number) => <span className="font-mono text-[15px] font-semibold text-brand-700">{matches[i]!.score}%</span>, best: (l: University[]) => bestBy(l, (u) => matches[l.indexOf(u)]?.score ?? null, "max") }] : []),
    { label: "QS World Ranking 2027", value: (u) => (u.qsRank ? `#${u.qsRank}` : "Not in top 200"), best: (l) => bestBy(l, (u) => u.qsRank ?? null, "min") },
    { label: "Location", value: (u) => `${u.city}, ${u.country}` },
    { label: "Type", value: (u) => (u.type === "public" ? "Public" : "Private") },
    { label: "Selectivity", value: (u) => SELECTIVITY_LABELS[u.selectivity] },
    { label: "Tuition (international)", value: (u) => <Fact text={u.tuition.display} status={u.tuition.source.status} />, best: (l) => bestBy(l, (u) => (u.tuition.band ? TUITION_BAND_MAX[u.tuition.band] : null), "min") },
    { label: "Financial aid", value: (u) => <Fact text={`${AID_LABELS[u.aid.kind]}. ${u.aid.summary}`} status={u.aid.source.status} />, best: (l) => bestBy(l, (u) => (u.aid.kind === "need-based-full" ? 1 : 0), "max") },
    { label: "English requirement", value: (u) => <Fact text={u.english.ielts ? `IELTS ${u.english.ielts.toFixed(1)}${u.english.toefl ? ` · TOEFL ${u.english.toefl}` : ""}` : "See official site"} status={u.english.source.status} />, best: (l) => bestBy(l, (u) => u.english.ielts ?? null, "min") },
    { label: "SAT / ACT", value: (u) => ({ required: "Required", optional: "Optional", "not-used": "Not used", varies: "Varies" })[u.testing.policy], best: (l) => bestBy(l, (u) => (u.testing.policy === "required" ? 1 : u.testing.policy === "varies" ? null : 0), "min") },
    { label: "Deadlines", value: (u) => <ul className="space-y-1">{u.deadlines.slice(0, 3).map((d) => <li key={d.label}><span className="font-medium text-ink">{d.label}:</span> {d.timing}</li>)}</ul> },
    { label: "How to apply", value: (u) => u.applicationPlatform?.name ?? "Directly to the university" },
    { label: "Language", value: (u) => u.languageOfInstruction },
    { label: "Notable programmes", value: (u) => u.notablePrograms.slice(0, 4).join(" · ") },
  ];

  return (
    <div className="container py-8">
      {/* Picker */}
      <div className="card p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-2">
          {list.map((u) => (
            <span key={u.slug} className="inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 py-1 pl-3 pr-1 text-[13px] font-medium text-brand-800">
              {u.shortName ?? u.name}
              <button onClick={() => setSlugs(slugs.filter((s) => s !== u.slug))} className="rounded-full p-1 hover:bg-brand-100" aria-label={`Remove ${u.name}`}><X className="h-3.5 w-3.5" /></button>
            </span>
          ))}
          {list.length < MAX && (
            <div className="relative min-w-[220px] flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-4" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={list.length ? "Add another university…" : "Search a university to compare…"} className="input h-10 w-full pl-9" aria-label="Add a university to compare" />
              {suggestions.length > 0 && (
                <ul className="absolute left-0 right-0 top-full z-20 mt-1 overflow-hidden rounded-lg border border-line bg-surface shadow-lift" role="listbox">
                  {suggestions.map((u) => (
                    <li key={u.slug}>
                      <button onClick={() => { setSlugs([...slugs, u.slug]); setQ(""); }} className="flex w-full items-center justify-between gap-3 px-3.5 py-2.5 text-left text-[13.5px] hover:bg-paper" role="option" aria-selected={false}>
                        <span><span className="font-medium text-ink">{u.name}</span> <span className="text-ink-3">· {u.country}</span></span>
                        <Plus className="h-4 w-4 text-ink-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
        {list.length < 2 && (
          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line pt-4 text-[13px]">
            <span className="text-ink-3">Try:</span>
            {PRESETS.map((p) => (
              <button key={p.label} onClick={() => setSlugs(p.slugs.filter((s) => getUniversity(s)))} className="rounded-full border border-line-strong px-3 py-1 text-ink-2 hover:border-brand-500 hover:text-brand-700">{p.label}</button>
            ))}
          </div>
        )}
      </div>

      {list.length === 0 ? (
        <p className="mt-10 text-center text-[14px] text-ink-3">Pick two to four universities to see them side by side.</p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-xl border border-line bg-surface">
          <table className="w-full min-w-[640px] table-fixed border-collapse text-[13.5px]">
            <thead>
              <tr>
                <th className="sticky left-0 z-10 w-44 border-b border-line bg-paper px-4 py-4 text-left align-bottom font-mono text-[10.5px] font-medium uppercase tracking-wider text-ink-4">Compare</th>
                {list.map((u) => (
                  <th key={u.slug} className="border-b border-l border-line px-4 py-4 text-left align-bottom">
                    <Link href={`/universities/${u.slug}`} className="group inline-flex items-start gap-1 font-display text-[16px] font-semibold leading-tight text-ink hover:underline">
                      {u.name} <ArrowUpRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-4" />
                    </Link>
                    <p className="mt-0.5 text-[12px] font-normal text-ink-3">{u.city}, {u.country}</p>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const best = r.best?.(list) ?? [];
                return (
                  <tr key={r.label} className="align-top">
                    <th scope="row" className="sticky left-0 z-10 border-b border-line bg-paper px-4 py-3 text-left text-[12.5px] font-medium text-ink-3">{r.label}</th>
                    {list.map((u, i) => (
                      <td key={u.slug} className={cn("border-b border-l border-line px-4 py-3 text-ink-2", best.includes(i) && "bg-ok-bg/50")}>
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">{r.value(u, i)}</div>
                          {best.includes(i) && <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-ok-bg px-1.5 py-0.5 text-[10.5px] font-semibold text-ok"><Crown className="h-3 w-3" />Best</span>}
                        </div>
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {list.length > 0 && (
        <p className="mt-4 text-[12.5px] text-ink-4">
          “Best” highlights the most favourable value in each row (lowest rank, tuition or English minimum; strongest aid; highest match). Tuition and some requirements are indicative — confirm on each official site.
          {!personalised && <> <Link href={user ? "/profile" : "/signup?next=/compare"} className="link">{user ? "Complete your profile" : "Create a profile"}</Link> to add your Profile Match.</>}
        </p>
      )}
    </div>
  );
}

function Fact({ text, status }: { text: string; status: string }) {
  return (
    <span>
      {text}
      {status === "verified" && <span className="ml-1.5 inline-block rounded bg-ok-bg px-1 text-[10px] font-semibold uppercase tracking-wide text-ok">Verified</span>}
    </span>
  );
}
