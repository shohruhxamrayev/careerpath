"use client";

import { ArrowRight, CalendarClock, CheckCircle2, ExternalLink, Sparkles, UserRound } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { CareerCard, OpportunityCard, UniversityCard } from "@/components/cards";
import { Badge, ButtonLink, EmptyState, Progress, Section } from "@/components/ui";
import { buildRecommendations } from "@/lib/matching/recommend";
import { describeStudent, isProfileReady, profileCompletion } from "@/lib/matching/profile";
import { useApp } from "@/lib/store/AppProvider";
import { daysUntil, relativeDays } from "@/lib/utils";

export function ForYouDashboard() {
  const { data, user } = useApp();
  const profile = data!.profile;
  const ready = isProfileReady(profile);
  const completion = useMemo(() => profileCompletion(profile), [profile]);
  const recs = useMemo(() => (ready ? buildRecommendations(profile) : null), [ready, profile]);
  const first = (profile.personal.name || user?.name || "").split(" ")[0];

  const nextSteps = useMemo(() => {
    const steps: { title: string; body: string; href: string; cta: string }[] = [];
    const overdue = data!.tasks.filter((t) => !t.done && t.due && daysUntil(t.due) < 0);
    if (overdue.length) steps.push({ title: `${overdue.length} overdue task${overdue.length > 1 ? "s" : ""}`, body: overdue[0].title, href: "/planner?tab=tasks", cta: "Review tasks" });
    const soon = data!.applications.filter((a) => a.deadline && daysUntil(a.deadline) >= 0 && daysUntil(a.deadline) <= 30 && !["applied", "accepted", "rejected", "interview"].includes(a.status)).sort((a, b) => a.deadline!.localeCompare(b.deadline!));
    if (soon[0]) steps.push({ title: `${soon[0].title} — ${relativeDays(soon[0].deadline!)}`, body: "Deadline coming up. Check your documents are ready.", href: `/planner?app=${soon[0].id}`, cta: "Open in planner" });
    if (completion.percent < 100) steps.push({ title: `Profile ${completion.percent}% complete`, body: `Add: ${completion.missing.slice(0, 2).join("; ").toLowerCase()}.`, href: "/profile", cta: "Complete profile" });
    if (recs?.scholarships[0] && !data!.applications.some((a) => a.slug === recs.scholarships[0].item.slug)) {
      steps.push({ title: `Consider ${recs.scholarships[0].item.title}`, body: recs.scholarships[0].item.deadline.timing + ".", href: `/opportunities/${recs.scholarships[0].item.slug}`, cta: "View scholarship" });
    }
    if (recs?.skills[0]) steps.push({ title: `Start building ${recs.skills[0].skill.name}`, body: recs.skills[0].why, href: recs.skills[0].skill.resources[0]?.url ?? "/careers", cta: "Free resource" });
    return steps.slice(0, 3);
  }, [data, completion, recs]);

  return (
    <div className="pb-16">
      <div className="border-b border-line bg-surface">
        <div className="container py-8 sm:py-10">
          <p className="eyebrow mb-2">For you</p>
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <h1 className="display text-[34px] leading-tight sm:text-[42px]">{first ? `What to pursue next, ${first}` : "What to pursue next"}</h1>
              <p className="mt-2 text-[15px] text-ink-3">
                {ready ? <>Based on your profile as {describeStudent(profile) || "a student"}.</> : "Recommendations are built from your profile using published requirements."}
              </p>
            </div>
            <div className="w-full max-w-xs">
              <div className="flex justify-between text-[13px]"><span className="text-ink-3">Profile</span><span className="font-mono">{completion.percent}%</span></div>
              <Progress value={completion.percent} className="mt-1.5" label="Profile completion" />
              <Link href="/profile" className="mt-2 inline-flex items-center gap-1 text-[13px] font-medium text-brand-700 hover:underline">
                <UserRound className="h-3.5 w-3.5" /> Edit profile
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="container space-y-12 py-8">
        {!ready ? (
          <EmptyState
            icon={<Sparkles />}
            title="Complete your profile to unlock personalized recommendations."
            body="We need at least your current level of study and your field or interests. It takes about two minutes."
            action={<ButtonLink href="/profile">Complete your profile <ArrowRight className="h-4 w-4" /></ButtonLink>}
          />
        ) : (
          <>
            {nextSteps.length > 0 && (
              <section aria-labelledby="next-h">
                <h2 id="next-h" className="mb-4 text-[18px] font-semibold">Next steps</h2>
                <ol className="grid gap-3 md:grid-cols-3">
                  {nextSteps.map((s, i) => {
                    const external = s.href.startsWith("http");
                    return (
                      <li key={s.title} className="card flex flex-col p-4">
                        <span className="font-mono text-[11px] text-ink-4">{String(i + 1).padStart(2, "0")}</span>
                        <p className="mt-1 text-[14px] font-semibold">{s.title}</p>
                        <p className="mt-1 flex-1 text-[13px] text-ink-3">{s.body}</p>
                        {external ? (
                          <a href={s.href} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1 text-[13px] font-medium text-brand-700 hover:underline">{s.cta} <ExternalLink className="h-3.5 w-3.5" /></a>
                        ) : (
                          <Link href={s.href} className="mt-3 inline-flex items-center gap-1 text-[13px] font-medium text-brand-700 hover:underline">{s.cta} <ArrowRight className="h-3.5 w-3.5" /></Link>
                        )}
                      </li>
                    );
                  })}
                </ol>
              </section>
            )}

            <Section title="Recommended universities" description="Ranked by Profile Match — an informational fit score, not an admission prediction." action={<SeeAll href="/universities" />}>
              {recs!.universities.length ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{recs!.universities.map((r) => <UniversityCard key={r.item.slug} u={r.item} match={r.match} why={r.why} />)}</div>
              ) : <Empty what="universities" />}
            </Section>

            <Section title="Recommended scholarships" description="Eligibility is checked against each programme's published rules." action={<SeeAll href="/opportunities?type=scholarship" />}>
              {recs!.scholarships.length ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{recs!.scholarships.map((r) => <OpportunityCard key={r.item.slug} o={r.item} match={r.match} why={r.why} />)}</div>
              ) : <Empty what="scholarships" />}
            </Section>

            <div className="grid gap-12 lg:grid-cols-2 lg:gap-6">
              <Section title="Recommended competitions" action={<SeeAll href="/opportunities?type=competition" />}>
                {recs!.competitions.length ? (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">{recs!.competitions.map((r) => <OpportunityCard key={r.item.slug} o={r.item} match={r.match} why={r.match.reason} compact />)}</div>
                ) : <Empty what="competitions" />}
              </Section>
              <Section title="Recommended internships & jobs" action={<SeeAll href="/opportunities?type=internship" />}>
                {recs!.internships.length ? (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">{recs!.internships.map((r) => <OpportunityCard key={r.item.slug} o={r.item} match={r.match} why={r.match.reason} compact />)}</div>
                ) : <Empty what="internships for your current level" />}
              </Section>
            </div>

            <Section title="Recommended careers" description="Based on your interests, field, skills and stated goals." action={<SeeAll href="/careers" />}>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{recs!.careers.map((r) => <CareerCard key={r.item.slug} c={r.item} match={r.match} />)}</div>
            </Section>

            <Section title="Recommended skills" description="Skills your top-matching careers need that aren't on your profile yet.">
              {recs!.skills.length ? (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {recs!.skills.map(({ skill, why }) => (
                    <div key={skill.slug} className="card p-4">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-[14.5px] font-semibold">{skill.name}</p>
                        <Badge>{skill.category}</Badge>
                      </div>
                      <p className="mt-1.5 text-[13px] text-ink-3">{why}</p>
                      <ul className="mt-3 space-y-1">
                        {skill.resources.slice(0, 2).map((r) => (
                          <li key={r.url}>
                            <a href={r.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[13px] text-brand-700 hover:underline">
                              {r.title} <ExternalLink className="h-3 w-3" /><span className="sr-only">(opens in a new tab)</span>
                            </a>
                            {r.free && <span className="ml-1.5 text-[11px] text-ok">Free</span>}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="flex items-center gap-2 text-[14px] text-ink-2"><CheckCircle2 className="h-4 w-4 text-ok" /> You already list the key skills for your top careers.</p>
              )}
            </Section>

            {recs!.other.length > 0 && (
              <Section title="Fellowships, programmes & more" action={<SeeAll href="/opportunities" />}>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{recs!.other.map((r) => <OpportunityCard key={r.item.slug} o={r.item} match={r.match} compact />)}</div>
              </Section>
            )}

            <p className="flex items-start gap-2 rounded border border-line bg-surface px-4 py-3 text-[12.5px] text-ink-3">
              <CalendarClock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              Recommendations use a rule-based engine and published criteria. Deadlines show typical timing — always confirm dates and requirements on the official site before applying.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

function SeeAll({ href }: { href: string }) {
  return (
    <Link href={href} className="inline-flex shrink-0 items-center gap-1 text-[13px] font-medium text-brand-700 hover:underline">
      See all <ArrowRight className="h-3.5 w-3.5" />
    </Link>
  );
}

function Empty({ what }: { what: string }) {
  return <p className="rounded border border-dashed border-line-strong px-4 py-6 text-center text-[13.5px] text-ink-3">No strong matches for {what} yet. Adding more detail to your profile usually helps.</p>;
}
