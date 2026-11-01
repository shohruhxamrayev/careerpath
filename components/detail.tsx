"use client";

import { Sparkles } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { MatchBreakdown } from "@/components/match";
import { ButtonLink, Skeleton } from "@/components/ui";
import { getOpportunity } from "@/lib/data/opportunities";
import { getUniversity } from "@/lib/data/universities";
import { matchOpportunity } from "@/lib/matching/opportunity";
import { isProfileReady } from "@/lib/matching/profile";
import { matchUniversity } from "@/lib/matching/university";
import { useApp } from "@/lib/store/AppProvider";
import { cn } from "@/lib/utils";

/** Personal Profile Match panel for detail pages; falls back to a clear call to action. */
export function MatchPanel({ kind, slug }: { kind: "university" | "opportunity"; slug: string }) {
  const { ready, user, data } = useApp();
  if (!ready || (user && !data)) return <Skeleton className="h-72 w-full" />;
  if (!user || !isProfileReady(data?.profile)) {
    return (
      <div className="card p-5">
        <div className="flex items-center gap-2 text-brand-700">
          <Sparkles className="h-4 w-4" />
          <p className="text-[14px] font-semibold">See your Profile Match</p>
        </div>
        <p className="mt-2 text-[13.5px] leading-relaxed text-ink-3">
          {user
            ? "Add your current level, the degree you're aiming for and your field to compare yourself with these requirements."
            : "Create a free profile to check eligibility and fit against these published requirements."}
        </p>
        <ButtonLink href={user ? "/profile" : `/signup?next=/${kind === "university" ? "universities" : "opportunities"}/${slug}`} className="mt-4 w-full">
          {user ? "Complete your profile" : "Create your profile"}
        </ButtonLink>
      </div>
    );
  }
  const match =
    kind === "university" ? matchUniversity(data!.profile, getUniversity(slug)!) : matchOpportunity(data!.profile, getOpportunity(slug)!);
  return (
    <div>
      <MatchBreakdown match={match} title="Your Profile Match" />
      <p className="mt-2 text-[12px] text-ink-3">
        Something wrong? <Link href="/profile" className="link">Update your profile</Link> and the match recalculates instantly.
      </p>
    </div>
  );
}

/** Sticky in-page section navigation with active-section highlighting. */
export function SectionNav({ sections }: { sections: { id: string; label: string }[] }) {
  const [active, setActive] = useState(sections[0]?.id);
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        const vis = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (vis[0]) setActive(vis[0].target.id);
      },
      { rootMargin: "-120px 0px -65% 0px" },
    );
    sections.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
  }, [sections]);
  return (
    <nav aria-label="On this page" className="sticky top-16 z-20 border-b border-line bg-paper/95 backdrop-blur">
      <div className="container">
        <ul className="scrollbar-none -mx-1 flex gap-1 overflow-x-auto py-2">
          {sections.map((s) => (
            <li key={s.id}>
              <a
                href={`#${s.id}`}
                className={cn("block whitespace-nowrap rounded px-3 py-1.5 text-[13px] transition-colors", active === s.id ? "bg-surface font-medium text-ink shadow-card" : "text-ink-3 hover:text-ink")}
                aria-current={active === s.id ? "true" : undefined}
              >
                {s.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
