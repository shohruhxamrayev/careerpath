import type { Metadata } from "next";
import { Suspense } from "react";
import { CompareTool } from "@/components/compare/CompareTool";
import { PageHeader } from "@/components/ui";

export const metadata: Metadata = { title: "Compare universities", description: "Put up to four universities side by side: ranking, tuition, aid, English requirements, tests and deadlines." };

export default function ComparePage() {
  return (
    <>
      <PageHeader eyebrow="Compare" title="Side by side," accent="decided faster." description="Pick up to four universities. CareerPath lines up ranking, tuition, aid, English and test requirements, deadlines and your Profile Match — and highlights the best value in each row." />
      <Suspense fallback={<div className="container py-8"><div className="skeleton h-40" /></div>}>
        <CompareTool />
      </Suspense>
    </>
  );
}
