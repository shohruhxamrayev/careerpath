import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { CareerDirectory } from "@/components/directories/CareerDirectory";
import { CareerConstellation } from "@/components/home/CareerConstellation";
import { OccupationDirectory } from "@/components/occupations/OccupationDirectory";
import { ButtonLink, CardSkeletonGrid, PageHeader } from "@/components/ui";
import { careers } from "@/lib/data/careers";
import { OCC_FAMILIES, occupationIndex, occupations } from "@/lib/data/occupations";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Careers — every job explained",
  description: "Explore every career: 1,016 occupations across all fields with tasks, skills, education, pay and job growth, plus guided career paths with a personal Career Match.",
};

export default function CareersPage({ searchParams }: { searchParams: { view?: string } }) {
  const guided = searchParams.view === "guided";
  const tabs = [
    { href: "/careers", label: "All careers", n: occupations.length, active: !guided },
    { href: "/careers?view=guided", label: "Guided paths & Career Match", n: careers.length, active: guided },
  ];
  return (
    <>
      <PageHeader
        eyebrow="Careers"
        title="Every career,"
        accent="explained."
        description={`${occupations.length.toLocaleString("en")} occupations in ${OCC_FAMILIES.length} career families — from nurses and pilots to data scientists and chefs — with what each job involves, the skills and education it needs, pay and job growth. Plus ${careers.length} guided paths with step-by-step plans and your personal Career Match.`}
        actions={<ButtonLink href="/courses" variant="nightOutline">Find courses</ButtonLink>}
        visual={<div className="relative h-[300px] sm:h-[380px]"><CareerConstellation className="h-full w-full" /></div>}
      />
      <div className="border-b border-line bg-paper">
        <div className="container">
          <nav className="scrollbar-none -mx-4 flex gap-1 overflow-x-auto px-4" aria-label="Career views">
            {tabs.map((t) => (
              <Link
                key={t.href}
                href={t.href}
                scroll={false}
                aria-current={t.active ? "page" : undefined}
                className={cn("relative whitespace-nowrap px-3 py-3.5 text-[14px] transition-colors", t.active ? "font-semibold text-ink" : "text-ink-3 hover:text-ink")}
              >
                {t.label} <span className="ml-1 font-mono text-[11.5px] text-ink-4">{t.n.toLocaleString("en")}</span>
                {t.active && <span className="absolute inset-x-3 -bottom-px h-[2px] rounded-full bg-brand-600" aria-hidden />}
              </Link>
            ))}
          </nav>
        </div>
      </div>
      <Suspense fallback={<div className="container py-8"><CardSkeletonGrid /></div>}>
        {guided ? <CareerDirectory /> : <OccupationDirectory rows={occupationIndex()} families={OCC_FAMILIES} />}
      </Suspense>
    </>
  );
}
