import type { Metadata } from "next";
import { Suspense } from "react";
import { CareerDirectory } from "@/components/directories/CareerDirectory";
import { CareerConstellation } from "@/components/home/CareerConstellation";
import { CardSkeletonGrid, PageHeader } from "@/components/ui";
import { careers } from "@/lib/data/careers";

export const metadata: Metadata = { title: "Careers", description: "Explore career paths, the skills they need and how to get started as a student." };

export default function CareersPage() {
  return (
    <>
      <PageHeader
        eyebrow="Careers"
        title="Explore where your studies"
        accent="can lead."
        description={`${careers.length} career paths with the skills, education routes, entry roles and student opportunities that lead into each one. Hover the constellation to see how careers share skills.`}
        visual={<div className="relative h-[340px] sm:h-[420px]"><CareerConstellation className="h-full w-full" /></div>}
      />
      <Suspense fallback={<div className="container py-8"><CardSkeletonGrid /></div>}>
        <CareerDirectory />
      </Suspense>
    </>
  );
}
