import type { Metadata } from "next";
import { Suspense } from "react";
import { DeadlineRadar } from "@/components/directories/DeadlineRadar";
import { OpportunityDirectory } from "@/components/directories/OpportunityDirectory";
import { CardSkeletonGrid, PageHeader } from "@/components/ui";
import { opportunities } from "@/lib/data/opportunities";

export const metadata: Metadata = { title: "Opportunities", description: "Scholarships, competitions, internships, fellowships, exchanges and more — with eligibility checks." };

export default function OpportunitiesPage() {
  return (
    <>
      <PageHeader
        eyebrow="Opportunities"
        title="Scholarships, competitions"
        accent="& more."
        description={`${opportunities.length} programmes with structured eligibility rules and links to official sources only. Your Profile Match separates eligibility from personal fit.`}
        visual={<DeadlineRadar />}
      />
      <Suspense fallback={<div className="container py-8"><CardSkeletonGrid /></div>}>
        <OpportunityDirectory />
      </Suspense>
    </>
  );
}
