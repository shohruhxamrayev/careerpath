import { ArrowUpRight, Sparkles } from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { BackToTop } from "@/components/layout/BackToTop";
import { DATASET_COMPILED } from "@/lib/data/sources";

const COLS: { title: string; links: [string, string][] }[] = [
  { title: "Study", links: [["Universities", "/universities"], ["Compare universities", "/compare"], ["Scholarships", "/opportunities?type=scholarship"], ["Erasmus Mundus", "/opportunities?em=1"], ["Competitions", "/opportunities?type=competition"]] },
  { title: "Work & skills", links: [["Careers", "/careers"], ["Guided career paths", "/careers?view=guided"], ["Live jobs & internships", "/jobs"], ["Online courses", "/courses"], ["Certifications", "/certifications"]] },
  { title: "Plan", links: [["For You", "/for-you"], ["Roadmap", "/roadmap"], ["Planner", "/planner"], ["Path Assistant", "/assistant"], ["Your profile", "/profile"]] },
  { title: "About", links: [["How matching works", "/methodology"], ["Data & sources", "/methodology#data"], ["Privacy", "/methodology#privacy"], ["Search", "/search"]] },
];

const STATS: [string, string][] = [["1,500+", "universities"], ["1,000+", "careers"], ["370+", "opportunities"], ["25k+", "courses"]];

const SOURCES = ["QS Rankings 2027", "O*NET 31.0", "U.S. BLS", "European Commission", "Coursera"];

export function Footer() {
  const compiled = new Date(DATASET_COMPILED + "-01").toLocaleDateString("en-GB", { month: "long", year: "numeric" });
  return (
    <footer className="night relative mt-auto border-t border-white/[0.07] bg-night-950">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-mint/40 to-transparent" aria-hidden />

      <div className="container grid gap-10 py-10 lg:grid-cols-[1.25fr_2fr] lg:gap-16 lg:py-12">
        {/* Brand */}
        <div className="max-w-sm">
          <Logo />
          <p className="mt-3 text-[13px] leading-relaxed text-night-300">
            An independent planning tool for students — universities, scholarships, careers and courses in one place. Not affiliated with any institution listed.
          </p>
          <dl className="mt-5 grid grid-cols-4 gap-2 rounded-lg border border-white/[0.07] bg-white/[0.02] p-3">
            {STATS.map(([n, l]) => (
              <div key={l} className="min-w-0">
                <dt className="sr-only">{l}</dt>
                <dd className="font-mono text-[14px] font-medium text-white">{n}</dd>
                <dd className="truncate text-[11px] text-night-400">{l}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link href="/signup" className="inline-flex h-9 items-center gap-1.5 rounded-md bg-mint px-3.5 text-[13px] font-medium text-night-900 transition-colors hover:bg-mint/90">
              Create free profile <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
            <Link href="/assistant" className="inline-flex h-9 items-center gap-1.5 rounded-md border border-white/10 px-3.5 text-[13px] text-night-100 transition-colors hover:border-mint/40 hover:text-white">
              <Sparkles className="h-3.5 w-3.5 text-mint" /> Ask the advisor
            </Link>
          </div>
        </div>

        {/* Links */}
        <nav aria-label="Footer" className="grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-4">
          {COLS.map((c) => (
            <div key={c.title}>
              <h2 className="mb-3 font-mono text-[11px] uppercase tracking-[0.14em] text-mint/80">{c.title}</h2>
              <ul className="space-y-2">
                {c.links.map(([label, href]) => (
                  <li key={href}>
                    <Link href={href} className="text-[13px] text-night-300 transition-colors hover:text-white">{label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/[0.06]">
        <div className="container flex flex-col gap-3 py-4 text-[11.5px] text-night-400 md:flex-row md:items-center md:justify-between">
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span>© {new Date().getFullYear()} CareerPath</span>
            <span aria-hidden>·</span>
            <span>Data compiled {compiled}</span>
            <span aria-hidden className="hidden sm:inline">·</span>
            <span className="w-full sm:w-auto">Sources: {SOURCES.join(", ")}</span>
          </p>
          <div className="flex items-center gap-4">
            <span>Deadlines change — always confirm on official sites.</span>
            <BackToTop />
          </div>
        </div>
      </div>
    </footer>
  );
}
