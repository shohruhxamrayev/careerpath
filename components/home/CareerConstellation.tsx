"use client";

import { useRouter } from "next/navigation";
import { useMemo } from "react";
import type { ConstellationNode } from "@/components/three/Constellation";
import { LazyConstellation } from "@/components/three/lazy";
import { careers } from "@/lib/data/careers";
import { skills } from "@/lib/data/skills";
import { matchCareer } from "@/lib/matching/career";
import { isProfileReady } from "@/lib/matching/profile";
import { useApp } from "@/lib/store/AppProvider";

/** 3D map of careers and the skills that connect them; scored with the student's Career Match when available. */
export function CareerConstellation({ className, highlight }: { className?: string; highlight?: string | null }) {
  const router = useRouter();
  const { user, data } = useApp();
  const ready = !!user && isProfileReady(data?.profile);
  const nodes = useMemo<ConstellationNode[]>(() => {
    const used = new Set(careers.flatMap((c) => c.keySkills));
    return [
      ...careers.map((c) => ({
        id: c.slug,
        label: c.title,
        kind: "career" as const,
        links: c.keySkills,
        score: ready ? matchCareer(data!.profile, c).score : undefined,
      })),
      ...skills.filter((s) => used.has(s.slug)).map((s) => ({ id: s.slug, label: s.name, kind: "skill" as const })),
    ];
  }, [ready, data]);
  return <LazyConstellation className={className} nodes={nodes} highlight={highlight} onSelect={(id) => router.push(`/careers/${id}`)} />;
}
