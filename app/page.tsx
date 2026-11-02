import { ArrowRight, BadgeCheck, Bot, Briefcase, CalendarCheck, Compass, Globe2, GraduationCap, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { CareerConstellation } from "@/components/home/CareerConstellation";
import { HeroGlobe } from "@/components/home/HeroGlobe";
import { StoryScroll, type StoryData } from "@/components/home/StoryScroll";
import { HomeCTA } from "@/components/HomeCTA";
import { careers } from "@/lib/data/careers";
import { EXAMPLE_PROFILE } from "@/lib/data/example";
import { getOpportunity, opportunities } from "@/lib/data/opportunities";
import { skills } from "@/lib/data/skills";
import { OPPORTUNITY_TYPE_PLURAL, OPPORTUNITY_TYPES } from "@/lib/data/taxonomy";
import { universities } from "@/lib/data/universities";
import { buildRecommendations } from "@/lib/matching/recommend";

export default function Home() {
  const recs = buildRecommendations(EXAMPLE_PROFILE);
  const countries = new Set(universities.map((u) => u.country)).size;
  const verified =
    universities.reduce((n, u) => n + [u.english.source, u.aid.source, u.testing.source, u.tuition.source].filter((s) => s.status === "verified").length + (u.qsRank ? 1 : 0), 0) +
    opportunities.filter((o) => o.source.status === "verified").length;

  const points = universities
    .filter((u) => u.geo)
    .map((u) => ({
      id: u.slug,
      label: u.shortName ?? u.name,
      sub: `${u.city}, ${u.country}${u.qsRank ? ` · QS #${u.qsRank}` : ""}`,
      lat: u.geo![0],
      lng: u.geo![1],
      weight: u.qsRank ? Math.max(0.35, 1 - u.qsRank / 140) : 0.3,
    }));
  const arcTo = recs.universities.slice(0, 6).map((r) => r.item.slug);
  const topUni = recs.universities[0];
  const topSch = recs.scholarships[0];
  const official = getOpportunity("jj-wbgsp")!;

  const story: StoryData = {
    uni: { name: topUni.item.name, score: topUni.match.score, checks: topUni.match.checks.filter((c) => c.status === "pass").slice(0, 4).map((c) => c.label) },
    recs: [
      { title: topSch.item.title, kind: "Scholarship", score: topSch.match.score },
      { title: recs.universities[1].item.name, kind: "University", score: recs.universities[1].match.score },
      { title: (recs.competitions[0] ?? recs.other[0]).item.title, kind: "Competition", score: (recs.competitions[0] ?? recs.other[0]).match.score },
      { title: recs.careers[0].item.title, kind: "Career", score: recs.careers[0].match.score },
    ],
    scholarship: { title: official.title, timing: official.deadline.timing, url: official.officialUrl, org: official.organization },
  };

  const typeCounts = OPPORTUNITY_TYPES.map((t) => ({ t, n: opportunities.filter((o) => o.type === t).length })).filter((x) => x.n > 0).sort((a, b) => b.n - a.n);
  const maxType = typeCounts[0].n;
  const marquee = universities.filter((u) => u.qsRank).sort((a, b) => a.qsRank! - b.qsRank!).slice(0, 36);

  return (
    <div className="night">
      {/* ───────── Hero ───────── */}
      <section className="noise relative overflow-hidden">
        <div className="night-grid pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_70%_60%_at_50%_30%,black,transparent)]" aria-hidden />
        <div className="pointer-events-none absolute -left-40 top-0 h-[560px] w-[760px] rounded-full bg-mint/[0.09] blur-[130px]" aria-hidden />
        <div className="pointer-events-none absolute -right-40 top-40 h-[480px] w-[640px] rounded-full bg-peri/[0.09] blur-[130px]" aria-hidden />
        <div className="container relative grid items-center gap-6 pb-14 pt-12 sm:pt-16 lg:grid-cols-[1.02fr_1fr] lg:gap-4 lg:pb-20 lg:pt-20">
          <div className="relative z-10 max-w-[620px]">
            <Link href="/roadmap" className="group inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] py-1 pl-1 pr-3 text-[12.5px] text-night-200 backdrop-blur hover:border-mint/40">
              <span className="rounded-full bg-mint px-2 py-0.5 font-mono text-[10.5px] font-semibold uppercase tracking-wider text-night-900">New</span>
              Roadmap — your month-by-month plan to day one
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <h1 className="display mt-6 text-[48px] leading-[0.98] sm:text-[68px] lg:text-[78px]">
              Find the opportunities that fit your <span className="accent-serif text-gradient pr-1">future.</span>
            </h1>
            <p className="mt-6 max-w-[520px] text-[17px] leading-relaxed text-night-300">
              Discover universities, scholarships, competitions, internships, and career paths matched to your goals, education, skills, and interests.
            </p>
            <HomeCTA />
            <dl className="mt-10 grid max-w-[520px] grid-cols-3 gap-4 border-t border-white/[0.08] pt-6">
              {[
                [universities.length, "universities"],
                [opportunities.length, "opportunities"],
                [countries, "countries"],
              ].map(([n, l]) => (
                <div key={String(l)}>
                  <dt className="sr-only">{l}</dt>
                  <dd className="display text-[34px] leading-none text-white">{n}</dd>
                  <dd className="mt-1.5 text-[12.5px] text-night-300">{l}</dd>
                </div>
              ))}
            </dl>
          </div>
          <HeroGlobe points={points} arcTo={arcTo} highlights={{ uni: topUni.item.name, uniScore: topUni.match.score, scholarship: topSch.item.title }} />
        </div>
      </section>

      {/* ───────── Marquee ───────── */}
      <section className="relative overflow-hidden border-y border-white/[0.06] bg-night-850 py-5" aria-label="Universities in the dataset">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-night-850 to-transparent" aria-hidden />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-night-850 to-transparent" aria-hidden />
        <div className="flex w-max animate-marquee gap-10 hover:[animation-play-state:paused]">
          {[...marquee, ...marquee].map((u, i) => (
            <Link key={i} href={`/universities/${u.slug}`} tabIndex={i >= marquee.length ? -1 : 0} aria-hidden={i >= marquee.length ? true : undefined} className="flex items-center gap-2.5 whitespace-nowrap text-[15px] text-night-300 transition-colors hover:text-white">
              <span className="font-mono text-[11px] text-mint/70">#{u.qsRank}</span>
              {u.shortName ?? u.name}
            </Link>
          ))}
        </div>
      </section>

      {/* ───────── Story ───────── */}
      <section className="relative">
        <div className="container py-20 sm:py-28">
          <div className="mb-12 max-w-2xl lg:mb-4">
            <p className="eyebrow mb-3">How it works</p>
            <h2 className="display text-[40px] leading-[1.02] sm:text-[56px]">
              From one profile to <span className="accent-serif text-gradient">every application.</span>
            </h2>
          </div>
          <StoryScroll data={story} />
        </div>
      </section>

      {/* ───────── Bento (light) ───────── */}
      <section className="relative bg-paper text-ink [color-scheme:light]">
        <div className="container py-20 sm:py-28">
          <div className="max-w-2xl">
            <p className="eyebrow mb-3 !text-brand-600">Everything in one place</p>
            <h2 className="display text-[40px] leading-[1.02] !text-ink sm:text-[54px]">
              A student advisor, <span className="accent-serif text-brand-600">not just a database.</span>
            </h2>
          </div>
          <div className="mt-12 grid auto-rows-[minmax(200px,auto)] gap-4 md:grid-cols-6">
            <Link href="/universities" className="group card card-hover relative overflow-hidden p-6 md:col-span-4 md:row-span-2">
              <div className="flex items-center gap-2 text-brand-600"><GraduationCap className="h-5 w-5" /><span className="eyebrow !text-brand-600">Universities</span></div>
              <h3 className="display mt-3 text-[30px] leading-tight !text-ink">{universities.length} universities. {countries} countries. One globe.</h3>
              <p className="mt-2 max-w-md text-[14.5px] text-ink-3">Requirements, tuition, aid and typical deadlines — each tagged with its official source and verification status. Explore them on an interactive 3D globe.</p>
              <div className="relative mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {["United States", "United Kingdom", "Germany", "South Korea", "Uzbekistan", "Australia", "Netherlands", "Kazakhstan"].map((c) => (
                  <div key={c} className="rounded-lg border border-line bg-paper px-3 py-2">
                    <p className="font-mono text-[18px] text-ink">{universities.filter((u) => u.country === c).length}</p>
                    <p className="truncate text-[11.5px] text-ink-3">{c}</p>
                  </div>
                ))}
              </div>
              <span className="relative mt-6 inline-flex items-center gap-1 text-[13.5px] font-medium text-brand-700">Explore universities <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" /></span>
              <Globe2 className="pointer-events-none absolute -bottom-16 -right-16 h-64 w-64 text-brand-100" strokeWidth={0.6} aria-hidden />
            </Link>
            <Link href="/opportunities" className="group card card-hover p-6 md:col-span-2 md:row-span-2">
              <div className="flex items-center gap-2 text-brand-600"><Compass className="h-5 w-5" /><span className="eyebrow !text-brand-600">Opportunities</span></div>
              <h3 className="display mt-3 text-[26px] leading-tight !text-ink">{opportunities.length} programmes</h3>
              <ul className="mt-5 space-y-2.5">
                {typeCounts.slice(0, 7).map(({ t, n }) => (
                  <li key={t}>
                    <div className="flex justify-between text-[12.5px]"><span className="text-ink-2">{OPPORTUNITY_TYPE_PLURAL[t]}</span><span className="font-mono text-ink-3">{n}</span></div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-line/70"><div className="h-full rounded-full bg-gradient-to-r from-brand-500 to-mint-600" style={{ width: `${(n / maxType) * 100}%` }} /></div>
                  </li>
                ))}
              </ul>
            </Link>
            <Link href="/careers" className="group card card-hover p-6 md:col-span-2">
              <div className="flex items-center gap-2 text-brand-600"><Briefcase className="h-5 w-5" /><span className="eyebrow !text-brand-600">Careers</span></div>
              <h3 className="mt-3 text-[18px] font-semibold !text-ink">{careers.length} career paths · {skills.length} skills</h3>
              <p className="mt-1.5 text-[13.5px] text-ink-3">What the job is, the skills it needs, and the opportunities that lead into it.</p>
            </Link>
            <Link href="/planner" className="group card card-hover p-6 md:col-span-2">
              <div className="flex items-center gap-2 text-brand-600"><CalendarCheck className="h-5 w-5" /><span className="eyebrow !text-brand-600">Planner</span></div>
              <h3 className="mt-3 text-[18px] font-semibold !text-ink">Every deadline, task and status</h3>
              <p className="mt-1.5 text-[13.5px] text-ink-3">Overview, applications, tasks and a calendar — all in one place.</p>
            </Link>
            <Link href="/assistant" className="group card card-hover p-6 md:col-span-2">
              <div className="flex items-center gap-2 text-brand-600"><Bot className="h-5 w-5" /><span className="eyebrow !text-brand-600">Path Assistant</span></div>
              <h3 className="mt-3 text-[18px] font-semibold !text-ink">Ask anything about your plan</h3>
              <p className="mt-1.5 text-[13.5px] text-ink-3">“What scholarships am I eligible for?” — answered from verified data.</p>
            </Link>
          </div>
        </div>
      </section>

      {/* ───────── Constellation ───────── */}
      <section className="noise relative overflow-hidden">
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-[600px] w-[900px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-peri/[0.07] blur-[140px]" aria-hidden />
        <div className="container relative grid items-center gap-10 py-20 sm:py-28 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="max-w-lg">
            <p className="eyebrow mb-3">Career constellation</p>
            <h2 className="display text-[40px] leading-[1.02] sm:text-[52px]">
              See how careers <span className="accent-serif text-gradient">connect.</span>
            </h2>
            <p className="mt-5 text-[16px] leading-relaxed text-night-300">
              {careers.length} careers orbit the skills that link them. Hover a career to light up what it needs; click to open its full guide. When you&apos;re signed in, every node shows your Career Match.
            </p>
            <Link href="/careers" className="mt-8 inline-flex items-center gap-1.5 text-[14px] font-medium text-mint hover:underline">Explore all careers <ArrowRight className="h-4 w-4" /></Link>
          </div>
          <div className="relative h-[440px] sm:h-[520px]">
            <CareerConstellation className="h-full w-full" />
          </div>
        </div>
      </section>

      {/* ───────── Trust ───────── */}
      <section className="border-t border-white/[0.06] bg-night-850">
        <div className="container grid gap-10 py-20 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="eyebrow mb-3">Built on sources, not guesses</p>
            <h2 className="display text-[36px] leading-[1.05] sm:text-[46px]">Every fact shows where it came from.</h2>
            <p className="mt-4 max-w-lg text-[15.5px] leading-relaxed text-night-300">
              {verified} facts were checked against official pages in November 2026. Everything else is clearly labelled — and every application link goes to the real university or programme.
            </p>
            <Link href="/methodology" className="mt-6 inline-flex items-center gap-1.5 text-[14px] font-medium text-mint hover:underline">How matching and data work <ArrowRight className="h-4 w-4" /></Link>
          </div>
          <div className="night-card divide-y divide-white/[0.07]">
            {([
              [BadgeCheck, "Verified", "Read on the official page this cycle, with the date", "text-mint"],
              [ShieldCheck, "Indicative — confirm", "Reliable general guidance; exact figures vary by programme", "text-peri"],
              [CalendarCheck, "Not yet verified", "Typical pattern from past cycles — always confirm", "text-sun"],
            ] as const).map(([I, t, d, c]) => (
              <div key={t} className="flex items-start gap-4 p-5">
                <I className={`mt-0.5 h-5 w-5 shrink-0 ${c}`} />
                <div>
                  <p className="text-[15px] font-semibold text-white">{t}</p>
                  <p className="mt-0.5 text-[13.5px] text-night-300">{d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── CTA ───────── */}
      <section className="noise relative overflow-hidden border-t border-white/[0.06]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_80%_at_50%_120%,rgba(140,207,180,0.18),transparent)]" aria-hidden />
        <div className="container relative flex flex-col items-center py-24 text-center">
          <h2 className="display max-w-3xl text-[44px] leading-[1] sm:text-[64px]">
            Find your path. <span className="accent-serif text-gradient">Build your future.</span>
          </h2>
          <p className="mt-5 max-w-md text-[16px] text-night-300">One profile. Every opportunity that fits it. Free to use.</p>
          <div className="flex justify-center"><HomeCTA /></div>
        </div>
      </section>
    </div>
  );
}
