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
    <footer className="mt-auto border-t border-line bg-surface">
      <div className="container grid gap-10 py-12 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div className="max-w-xs">
          <Logo />
          <p className="mt-4 text-[13.5px] leading-relaxed text-ink-3">Find your path. Build your future. An independent planning tool for students — not affiliated with any university or programme listed.</p>
        </div>
        {COLS.map((c) => (
          <div key={c.title}>
            <h2 className="eyebrow mb-3">{c.title}</h2>
            <ul className="space-y-2">
              {c.links.map(([label, href]) => (
                <li key={href}>
                  <Link href={href} className="text-[13.5px] text-ink-2 hover:text-brand-700">{label}</Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-line">
        <div className="container flex flex-col gap-2 py-5 text-[12px] text-ink-3 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} CareerPath</p>
          <p>
            Dataset compiled {new Date(DATASET_COMPILED + "-01").toLocaleDateString("en-GB", { month: "long", year: "numeric" })}. Deadlines and requirements change — always confirm on official sites.
          </p>
        </div>
      </div>
    </footer>
  );
}
