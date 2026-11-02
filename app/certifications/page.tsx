import type { Metadata } from "next";
import { Suspense } from "react";
import { CertificationDirectory } from "@/components/certifications/CertificationDirectory";
import { ButtonLink, PageHeader } from "@/components/ui";
import { certifications } from "@/lib/data/certifications";

export const metadata: Metadata = { title: "Certifications & courses", description: "Industry certifications and courses employers recognise — cloud, data, AI, cybersecurity, finance, project management, design and languages — with costs, time and the careers they help." };

export default function CertificationsPage() {
  const free = certifications.filter((c) => c.cost.free).length;
  return (
    <>
      <PageHeader
        eyebrow="Certifications"
        title="Skills employers"
        accent="can verify."
        description={`${certifications.length} certifications and courses from AWS, Google, Microsoft, CFA Institute, ACCA, PMI, Harvard and more — ${free} of them free. Each shows cost, time and the careers it helps.`}
        actions={<ButtonLink href="/careers" variant="nightOutline">Explore careers</ButtonLink>}
      />
      <Suspense fallback={<div className="container py-8"><div className="skeleton h-60" /></div>}>
        <CertificationDirectory />
      </Suspense>
    </>
  );
}
