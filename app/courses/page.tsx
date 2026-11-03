import type { Metadata } from "next";
import { Suspense } from "react";
import { CourseFinder } from "@/components/courses/CourseFinder";
import { ButtonLink, PageHeader } from "@/components/ui";

export const metadata: Metadata = {
  title: "Online courses",
  description: "Search Coursera's full catalogue — 25,000+ courses from universities and companies such as Stanford, Yale, Google, IBM and DeepLearning.AI — by subject, language and certificate.",
};

export default function CoursesPage() {
  return (
    <>
      <PageHeader
        eyebrow="Courses"
        title="Learn anything,"
        accent="from the best."
        description="Search the full Coursera catalogue — 25,000+ courses from universities like Stanford, Yale and Imperial, and companies like Google, IBM and Meta. Filter by subject and language; most can be audited free."
        actions={<ButtonLink href="/certifications" variant="nightOutline">Industry certifications</ButtonLink>}
      />
      <Suspense fallback={<div className="container py-8"><div className="skeleton h-60" /></div>}>
        <CourseFinder />
      </Suspense>
    </>
  );
}
