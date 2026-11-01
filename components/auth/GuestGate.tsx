"use client";

import { ArrowRight, Check, Lock } from "lucide-react";
import { usePathname } from "next/navigation";
import { useMemo } from "react";
import { ButtonLink, Skeleton } from "@/components/ui";
import { EXAMPLE_PROFILE } from "@/lib/data/example";
import { buildRecommendations } from "@/lib/matching/recommend";
import { useApp } from "@/lib/store/AppProvider";

interface PreviewRow {
  kind: string;
  title: string;
  score: number;
}

/** Renders children only for signed-in users; otherwise an inviting preview built from a sample profile (never a dead page). */
export function GuestGate({ title, body, perks, children }: { title: string; body: string; perks?: string[]; children: React.ReactNode }) {
  const { ready, user, data } = useApp();
  const path = usePathname();

  const preview = useMemo<PreviewRow[]>(() => {
    const r = buildRecommendations(EXAMPLE_PROFILE);
    return [
      ...r.universities.slice(0, 2).map((x) => ({ kind: "University", title: x.item.name, score: x.match.score })),
      ...r.scholarships.slice(0, 2).map((x) => ({ kind: "Scholarship", title: x.item.title, score: x.match.score })),
      ...r.careers.slice(0, 1).map((x) => ({ kind: "Career", title: x.item.title, score: x.match.score })),
    ];
  }, []);

  if (!ready || (user && !data)) {
    return (
      <div className="container py-10" aria-busy="true">
        <Skeleton className="mb-3 h-3 w-24" />
        <Skeleton className="mb-8 h-9 w-80" />
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
      </div>
    );
  }
  if (!user) {
    const list = perks ?? [];
    return (
      <section className="night relative flex flex-1 overflow-hidden bg-night-950">
        <div className="pointer-events-none absolute inset-0 night-grid opacity-60 [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" aria-hidden />
        <div className="pointer-events-none absolute -left-40 top-0 h-[480px] w-[640px] rounded-full bg-mint/10 blur-[120px]" aria-hidden />
        <div className="pointer-events-none absolute -right-40 bottom-0 h-[420px] w-[560px] rounded-full bg-peri/10 blur-[120px]" aria-hidden />
        <div className="container relative grid grid-cols-1 items-center gap-12 py-16 [&>*]:min-w-0 lg:grid-cols-[1fr_1fr] lg:py-24">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 font-mono text-[11px] uppercase tracking-wider text-mint">
              <Lock className="h-3 w-3" /> Free account
            </span>
            <h1 className="display mt-5 text-[38px] leading-[1.05] text-white sm:text-[52px]">{title}</h1>
            <p className="mt-4 max-w-lg text-[16px] leading-relaxed text-night-300">{body}</p>
            {list.length > 0 && (
              <ul className="mt-6 space-y-2.5">
                {list.map((p) => (
                  <li key={p} className="flex items-start gap-2.5 text-[14.5px] text-night-100">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-mint/15 text-mint"><Check className="h-3 w-3" /></span>
                    {p}
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-8 flex flex-col gap-2 sm:flex-row">
              <ButtonLink href={`/signup?next=${encodeURIComponent(path)}`} variant="mint" size="lg">
                Create your profile <ArrowRight className="h-4 w-4" />
              </ButtonLink>
              <ButtonLink href={`/login?next=${encodeURIComponent(path)}`} variant="nightOutline" size="lg">Log in</ButtonLink>
            </div>
            <p className="mt-3 text-[12px] text-night-400">Stored on this device by default. No payment, no spam.</p>
          </div>

          <div className="relative" aria-label="Example recommendations for a sample student">
            <div className="night-card relative overflow-hidden p-5 shadow-pop sm:p-6">
              <div className="mb-4 flex items-center justify-between">
                <p className="font-mono text-[11px] uppercase tracking-wider text-night-400">Preview · sample student from Tashkent</p>
                <span className="rounded-full bg-sun/15 px-2 py-0.5 font-mono text-[10.5px] text-sun">EXAMPLE</span>
              </div>
              <ul className="space-y-2.5">
                {preview.map((r, i) => (
                  <li key={r.title} className="flex items-center gap-3 rounded-lg border border-white/[0.06] bg-white/[0.03] px-3.5 py-3" style={{ animation: `fade-in 420ms ease-out ${i * 90}ms both` }}>
                    <div className="min-w-0 flex-1">
                      <p className="font-mono text-[10.5px] uppercase tracking-wider text-mint/70">{r.kind}</p>
                      <p className="truncate text-[14px] font-medium text-white">{r.title}</p>
                      <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/[0.06]">
                        <div className="h-full rounded-full bg-gradient-to-r from-mint to-peri" style={{ width: `${r.score}%` }} />
                      </div>
                    </div>
                    <span className="font-mono text-[15px] font-semibold text-white">{r.score}%</span>
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-[12px] text-night-400">Profile Match = fit with your goals, not a chance of admission.</p>
            </div>
          </div>
        </div>
      </section>
    );
  }
  return <>{children}</>;
}
