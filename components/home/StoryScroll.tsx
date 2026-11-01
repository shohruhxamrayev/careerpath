"use client";

import { motion, useInView } from "framer-motion";
import { ArrowUpRight, CalendarDays, Check, ShieldCheck, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export interface StoryData {
  uni: { name: string; score: number; checks: string[] };
  recs: { title: string; kind: string; score: number }[];
  scholarship: { title: string; timing: string; url: string; org: string };
}

const STEPS = [
  { k: "01", title: "Create one profile", body: "Education, test scores, skills, activities, interests, goals and how you'll fund your studies. Save as you go." },
  { k: "02", title: "Get matched — with reasons", body: "Every requirement is checked rule by rule. You see what's met, what to check, and what's missing." },
  { k: "03", title: "Discover what fits", body: "Universities, scholarships, competitions, internships and careers, ranked for you and explained in plain language." },
  { k: "04", title: "Plan every deadline", body: "Track status, confirmed dates and tasks for every application in one calm planner." },
  { k: "05", title: "Apply on official sites", body: "Every application link goes to the real university or programme, with the source and verification date shown." },
];

function Visual({ i, d }: { i: number; d: StoryData }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.5 });
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!inView || i !== 1) return;
    let raf = 0;
    const t0 = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / 1100);
      setN(Math.round(d.uni.score * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, i, d.uni.score]);

  const fade = (delay = 0) => ({ initial: { opacity: 0, y: 14 }, animate: inView ? { opacity: 1, y: 0 } : {}, transition: { duration: 0.5, delay } });

  return (
    <div ref={ref} className="night-card relative overflow-hidden p-5 shadow-pop sm:p-6">
      <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-mint/10 blur-3xl" aria-hidden />
      {i === 0 && (
        <div className="relative space-y-3">
          <p className="eyebrow">Your profile</p>
          {[["Level", "Undergraduate · Business"], ["English", "IELTS 7.5"], ["Skills", "SQL · Excel · Public speaking"], ["Goal", "Financial Analyst · UK, Germany"], ["Funding", "Full scholarship required"]].map(([k, v], j) => (
            <motion.div key={k} {...fade(0.08 * j)} className="flex items-center justify-between rounded-lg border border-white/[0.07] bg-white/[0.03] px-3.5 py-2.5">
              <span className="text-[12px] text-night-300">{k}</span>
              <span className="text-[13.5px] text-white">{v}</span>
            </motion.div>
          ))}
          <motion.div {...fade(0.5)} className="flex items-center gap-3 pt-1">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10"><motion.div initial={{ width: "20%" }} animate={inView ? { width: "92%" } : {}} transition={{ duration: 1.2, delay: 0.5 }} className="h-full rounded-full bg-gradient-to-r from-mint to-peri" /></div>
            <span className="font-mono text-[12px] text-mint">92%</span>
          </motion.div>
        </div>
      )}
      {i === 1 && (
        <div className="relative">
          <div className="flex items-end justify-between">
            <div>
              <p className="eyebrow">Profile Match</p>
              <p className="mt-1 text-[15px] font-semibold text-white">{d.uni.name}</p>
            </div>
            <p className="display text-[56px] leading-none text-gradient">{n}%</p>
          </div>
          <ul className="mt-5 space-y-2">
            {d.uni.checks.map((c, j) => (
              <motion.li key={c} {...fade(0.25 + j * 0.12)} className="flex items-center gap-2.5 text-[13.5px] text-night-100">
                <span className="flex h-5 w-5 items-center justify-center rounded-md bg-mint/15 text-mint"><Check className="h-3 w-3" /></span>
                {c}
              </motion.li>
            ))}
          </ul>
          <p className="mt-5 border-t border-white/[0.07] pt-3 text-[11.5px] text-night-400">Informational match based on published criteria. Never an admission prediction.</p>
        </div>
      )}
      {i === 2 && (
        <div className="relative space-y-2.5">
          <p className="eyebrow">Recommended for you</p>
          {d.recs.map((r, j) => (
            <motion.div key={r.title} {...fade(0.1 * j)} className="flex items-center justify-between gap-3 rounded-lg border border-white/[0.07] bg-white/[0.03] px-3.5 py-3">
              <div className="min-w-0">
                <p className="truncate text-[13.5px] font-medium text-white">{r.title}</p>
                <p className="text-[11.5px] text-night-300">{r.kind}</p>
              </div>
              <span className="shrink-0 rounded-md bg-mint/15 px-2 py-0.5 font-mono text-[11.5px] text-mint">{r.score}%</span>
            </motion.div>
          ))}
        </div>
      )}
      {i === 3 && (
        <div className="relative">
          <p className="eyebrow mb-3 flex items-center gap-2"><CalendarDays className="h-3.5 w-3.5" /> Your planner</p>
          <div className="grid grid-cols-7 gap-1.5">
            {Array.from({ length: 28 }).map((_, j) => {
              const hot = [4, 11, 17, 23].includes(j);
              return (
                <motion.div key={j} {...fade(0.015 * j)} className={cn("flex aspect-square items-center justify-center rounded-md text-[11px]", hot ? "bg-sun/20 font-semibold text-sun ring-1 ring-sun/40" : "bg-white/[0.03] text-night-400")}>
                  {j + 1}
                </motion.div>
              );
            })}
          </div>
          <div className="mt-4 space-y-1.5 text-[12.5px]">
            {["Book IELTS retake", "Request recommendation letters", "Draft personal statement"].map((t, j) => (
              <motion.p key={t} {...fade(0.4 + j * 0.1)} className="flex items-center gap-2 text-night-200">
                <span className={cn("flex h-4 w-4 items-center justify-center rounded border", j === 0 ? "border-mint bg-mint text-night-900" : "border-white/20")}>{j === 0 && <Check className="h-3 w-3" />}</span>
                {t}
              </motion.p>
            ))}
          </div>
        </div>
      )}
      {i === 4 && (
        <div className="relative">
          <p className="eyebrow">Official source</p>
          <p className="mt-1 text-[15px] font-semibold text-white">{d.scholarship.title}</p>
          <p className="mt-1 text-[13px] text-night-300">{d.scholarship.timing}</p>
          <motion.div {...fade(0.2)} className="mt-4 flex flex-wrap items-center gap-2 text-[12px]">
            <span className="inline-flex items-center gap-1 rounded-md bg-mint/15 px-2 py-0.5 text-mint"><ShieldCheck className="h-3.5 w-3.5" /> Verified Nov 2026</span>
            <span className="text-night-300">Source: {d.scholarship.org}</span>
          </motion.div>
          <motion.a {...fade(0.35)} href={d.scholarship.url} target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex items-center gap-1.5 rounded-md bg-mint px-4 py-2.5 text-[13.5px] font-medium text-night-900 hover:bg-mint-300">
            Apply on the official website <ArrowUpRight className="h-4 w-4" />
          </motion.a>
        </div>
      )}
    </div>
  );
}

export function StoryScroll({ data }: { data: StoryData }) {
  const [active, setActive] = useState(0);
  const refs = useRef<(HTMLDivElement | null)[]>([]);
  useEffect(() => {
    const obs = new IntersectionObserver(
      (es) => es.forEach((e) => e.isIntersecting && setActive(Number((e.target as HTMLElement).dataset.i))),
      { rootMargin: "-45% 0px -45% 0px" },
    );
    refs.current.forEach((r) => r && obs.observe(r));
    return () => obs.disconnect();
  }, []);

  return (
    <div className="grid grid-cols-1 gap-10 [&>*]:min-w-0 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
      <div className="hidden lg:block">
        <div className="sticky top-32">
          <ol className="space-y-1">
            {STEPS.map((s, i) => (
              <li key={s.k}>
                <button
                  onClick={() => refs.current[i]?.scrollIntoView({ behavior: "smooth", block: "center" })}
                  className={cn("group flex w-full items-start gap-4 rounded-xl px-4 py-4 text-left transition-colors", active === i ? "bg-white/[0.04]" : "hover:bg-white/[0.02]")}
                >
                  <span className={cn("font-mono text-[12px] transition-colors", active === i ? "text-mint" : "text-night-400")}>{s.k}</span>
                  <span>
                    <span className={cn("display block text-[24px] leading-tight transition-colors", active === i ? "text-white" : "text-night-400")}>{s.title}</span>
                    <span className={cn("mt-1.5 block text-[14px] leading-relaxed transition-all duration-300", active === i ? "max-h-24 text-night-300 opacity-100" : "max-h-0 overflow-hidden opacity-0")}>{s.body}</span>
                  </span>
                </button>
              </li>
            ))}
          </ol>
        </div>
      </div>
      <div className="min-w-0 space-y-10 lg:space-y-[16vh] lg:py-[8vh]">
        {STEPS.map((s, i) => (
          <div key={s.k} ref={(el) => { refs.current[i] = el; }} data-i={i}>
            <div className="mb-4 lg:hidden">
              <p className="font-mono text-[12px] text-mint">{s.k}</p>
              <h3 className="display mt-1 text-[24px]">{s.title}</h3>
              <p className="mt-1.5 text-[14px] text-night-300">{s.body}</p>
            </div>
            <Visual i={i} d={data} />
          </div>
        ))}
        <div className="flex items-center gap-2 text-[13px] text-night-300 lg:hidden">
          <Sparkles className="h-4 w-4 text-mint" /> All of this runs on CareerPath&apos;s real matching engine.
        </div>
      </div>
    </div>
  );
}
