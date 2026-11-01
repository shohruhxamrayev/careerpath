"use client";

import { Check, TrendingUp } from "lucide-react";
import { MatchRing } from "@/components/match";
import { ButtonLink, Skeleton } from "@/components/ui";
import { getCareer } from "@/lib/data/careers";
import { matchCareer } from "@/lib/matching/career";
import { isProfileReady } from "@/lib/matching/profile";
import { useApp } from "@/lib/store/AppProvider";
import { SaveButton } from "./actions";

export function CareerMatchPanel({ slug }: { slug: string }) {
  const { ready, user, data } = useApp();
  const c = getCareer(slug)!;
  if (!ready || (user && !data)) return <Skeleton className="h-64 w-full" />;
  if (!user || !isProfileReady(data?.profile)) {
    return (
      <div className="card p-5">
        <p className="text-[14px] font-semibold">See your Career Match</p>
        <p className="mt-2 text-[13.5px] text-ink-3">We compare this career with your interests, field of study, skills and goals — and show what to develop next.</p>
        <ButtonLink href={user ? "/profile" : `/signup?next=/careers/${slug}`} className="mt-4 w-full">{user ? "Complete your profile" : "Create your profile"}</ButtonLink>
      </div>
    );
  }
  const m = matchCareer(data!.profile, c);
  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-line p-5">
        <MatchRing score={m.score} label="Career Match" />
        <SaveButton kind="career" slug={c.slug} title={c.title} />
      </div>
      <div className="space-y-5 p-5">
        <div>
          <h3 className="mb-2 text-[13px] font-semibold text-ok">Strong</h3>
          {m.strong.length ? (
            <ul className="space-y-1.5">
              {m.strong.map((s) => <li key={s} className="flex items-center gap-2 text-[13.5px]"><Check className="h-3.5 w-3.5 text-ok" aria-hidden />{s}</li>)}
            </ul>
          ) : <p className="text-[13px] text-ink-3">Add interests and skills to your profile to see strengths.</p>}
        </div>
        <div>
          <h3 className="mb-2 text-[13px] font-semibold text-warn">Develop</h3>
          {m.develop.length ? (
            <ul className="space-y-1.5">
              {m.develop.map((s) => (
                <li key={s.slug} className="flex items-center gap-2 text-[13.5px]">
                  <TrendingUp className="h-3.5 w-3.5 text-warn" aria-hidden />
                  <a href={`#skill-${s.slug}`} className="hover:text-brand-700 hover:underline">{s.name}</a>
                </li>
              ))}
            </ul>
          ) : <p className="text-[13px] text-ink-3">You already list the key skills for this career.</p>}
        </div>
      </div>
      <p className="border-t border-line bg-paper px-5 py-3 text-[12px] text-ink-3">An informational fit score — not a prediction of success or hiring.</p>
    </div>
  );
}
