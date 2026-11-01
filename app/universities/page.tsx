import type { Metadata } from "next";
import { Suspense } from "react";
import { UniversityDirectory } from "@/components/directories/UniversityDirectory";
import { CardSkeletonGrid, PageHeader } from "@/components/ui";
import { universities } from "@/lib/data/universities";

export const metadata: Metadata = { title: "Universities", description: "Search and compare universities with programmes, tuition, scholarships and deadlines." };

export default function UniversitiesPage() {
  const countries = new Set(universities.map((u) => u.country)).size;
  return (
    <>
      <PageHeader
        eyebrow="Universities"
        title="Find universities"
        accent="that fit you."
        description={`${universities.length} universities across ${countries} countries — from the US and UK to Uzbekistan and Central Asia. QS 2027 ranks, sourced requirements, and a 3D globe view.`}
      />
      <Suspense fallback={<div className="container py-8"><CardSkeletonGrid /></div>}>
        <UniversityDirectory />
      </Suspense>
    </>
  );
}
