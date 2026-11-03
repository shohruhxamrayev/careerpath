import type { Metadata } from "next";
import { Suspense } from "react";
import { OccupationDirectory } from "@/components/occupations/OccupationDirectory";
import { ButtonLink, CardSkeletonGrid, PageHeader } from "@/components/ui";
import { OCC_FAMILIES, occupationIndex, occupations } from "@/lib/data/occupations";

export const metadata: Metadata = {
  title: "Every occupation — tasks, skills, pay and outlook",
  description: "Explore 1,016 occupations across every field: what each job involves, the skills and education it needs, pay, job growth and related careers. Data from O*NET and the U.S. Bureau of Labor Statistics.",
};

export default function OccupationsPage() {
  const rows = occupationIndex();
  return (
    <>
      <PageHeader
        eyebrow="Occupation explorer"
        title="Every job,"
        accent="explained."
        description={`${occupations.length.toLocaleString("en")} occupations in ${OCC_FAMILIES.length} career families — from nurses and pilots to data scientists and chefs. See what each job involves, the skills and education it needs, what it pays and whether it's growing.`}
        actions={<ButtonLink href="/careers" variant="nightOutline">Guided career paths</ButtonLink>}
      />
      <Suspense fallback={<div className="container py-8"><CardSkeletonGrid /></div>}>
        <OccupationDirectory rows={rows} families={OCC_FAMILIES} />
      </Suspense>
    </>
  );
}
