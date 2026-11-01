import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { DATASET_COMPILED } from "@/lib/data/sources";

const COLS = [
  { title: "Discover", links: [["Universities", "/universities"], ["Opportunities", "/opportunities"], ["Careers", "/careers"], ["Search", "/search"]] },
  { title: "Plan", links: [["For You", "/for-you"], ["Planner", "/planner"], ["Path Assistant", "/assistant"], ["Your profile", "/profile"]] },
  { title: "About", links: [["How matching works", "/methodology"], ["Data & sources", "/methodology#data"], ["Privacy", "/methodology#privacy"]] },
];

export function Footer() {
  return (
    <footer className="night noise relative mt-auto overflow-hidden border-t border-white/[0.07]">
      <div className="pointer-events-none absolute -bottom-40 left-1/2 h-[380px] w-[900px] -translate-x-1/2 rounded-full bg-mint/[0.07] blur-[120px]" aria-hidden />
      <div className="container relative grid gap-10 py-14 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div className="max-w-xs">
          <Logo />
          <p className="mt-4 text-[13.5px] leading-relaxed text-night-300">
            Find your path. Build your future. An independent planning tool for students — not affiliated with any university or programme listed.
          </p>
          <Link href="/signup" className="mt-6 inline-flex items-center gap-1.5 text-[13.5px] font-medium text-mint hover:underline">
            Create your free profile <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
        {COLS.map((c) => (
          <div key={c.title}>
            <h2 className="eyebrow mb-4">{c.title}</h2>
            <ul className="space-y-2.5">
              {c.links.map(([label, href]) => (
                <li key={href}>
                  <Link href={href} className="text-[13.5px] text-night-200 transition-colors hover:text-white">{label}</Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="container relative select-none overflow-hidden" aria-hidden>
        <p className="display translate-y-[18%] whitespace-nowrap text-center text-[18vw] leading-none text-white/[0.035] lg:text-[200px]">careerpath</p>
      </div>
      <div className="relative border-t border-white/[0.07]">
        <div className="container flex flex-col gap-2 py-5 text-[12px] text-night-400 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} CareerPath</p>
          <p>
            Dataset compiled {new Date(DATASET_COMPILED + "-01").toLocaleDateString("en-GB", { month: "long", year: "numeric" })}. Deadlines and requirements change — always confirm on official sites.
          </p>
        </div>
      </div>
    </footer>
  );
}
