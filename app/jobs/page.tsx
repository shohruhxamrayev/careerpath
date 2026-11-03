import type { Metadata } from "next";
import { Suspense } from "react";
import { LiveJobBoard } from "@/components/jobs/LiveJobBoard";
import { ButtonLink, PageHeader } from "@/components/ui";
import { getLiveJobs, LIVE_SOURCES, type LiveSource } from "@/lib/live/jobs";

export const revalidate = 21600; // 6 hours

export const metadata: Metadata = {
  title: "Live internships & entry-level jobs",
  description: "Thousands of current internships and entry-level jobs from The Muse, Arbeitnow and Jobicy — refreshed every few hours, each linking to the original posting.",
};

export default async function JobsPage() {
  const { jobs, fetchedAt, counts } = await getLiveJobs();
  const sources = Object.fromEntries(
    (Object.keys(LIVE_SOURCES) as LiveSource[]).map((s) => [s, { ...LIVE_SOURCES[s], count: counts[s] }]),
  ) as Record<LiveSource, { url: string; note: string; count: number }>;
  return (
    <>
      <PageHeader
        eyebrow="Live jobs"
        title="Internships and first jobs,"
        accent="updated today."
        description={`${jobs.length.toLocaleString("en")} current internships and entry-level roles pulled from public job boards every few hours. Filter by level, field and location, then apply on the original posting.`}
        actions={<ButtonLink href="/opportunities?type=internship" variant="nightOutline">Curated internships</ButtonLink>}
      />
      <Suspense fallback={<div className="container py-8"><div className="skeleton h-60" /></div>}>
        <LiveJobBoard jobs={jobs} sources={sources} fetchedAt={fetchedAt} />
      </Suspense>
    </>
  );
}
