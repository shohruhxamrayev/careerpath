import { getSkill, resolveSkillSlugs } from "@/lib/data/skills";
import { FIELD_LABELS, INTEREST_LABELS } from "@/lib/data/taxonomy";
import type { Career, StudentProfile } from "@/lib/types";
import { englishAsIelts } from "./profile";
import { clamp } from "./types";

export interface CareerMatch {
  score: number;
  strong: string[];
  develop: { slug: string; name: string }[];
  reason: string;
}

export function studentSkillSlugs(p: StudentProfile): Set<string> {
  return resolveSkillSlugs([...p.skills.technical, ...p.skills.soft]);
}

export function matchCareer(p: StudentProfile, c: Career): CareerMatch {
  const strong: string[] = [];

  const interestHits = c.interests.filter((i) => p.interests.includes(i));
  interestHits.forEach((i) => strong.push(`${INTEREST_LABELS[i]} interest`));
  const interestScore = c.interests.length ? Math.min(100, (interestHits.length / Math.min(2, c.interests.length)) * 100) : 50;

  const field = p.education.field;
  let fieldScore = 40;
  if (field && c.relatedFields.includes(field)) {
    fieldScore = c.relatedFields[0] === field ? 100 : 85;
    strong.push(`${FIELD_LABELS[field]} studies`);
  } else if (!field) fieldScore = 50;

  const have = studentSkillSlugs(p);
  const matched = c.keySkills.filter((s) => have.has(s));
  matched.forEach((s) => strong.push(getSkill(s)?.name ?? s));
  const skillScore = c.keySkills.length ? (matched.length / Math.min(4, c.keySkills.length)) * 100 : 50;

  const eng = englishAsIelts(p);
  if (eng && eng.band >= 7) strong.push("Strong English");

  const goal = p.goals.careers.includes(c.slug) || p.goals.careers.includes(c.title);
  if (goal) strong.unshift("Listed as a career goal");

  const relevantActivities = p.activities.filter((a) =>
    c.extracurriculars.some((e) => e.toLowerCase().split(/\W+/).some((w) => w.length > 4 && (a.title + " " + (a.description ?? "")).toLowerCase().includes(w))),
  );
  if (relevantActivities.length) strong.push("Relevant extracurriculars");

  let score = interestScore * 0.35 + fieldScore * 0.25 + clamp(skillScore) * 0.25 + (goal ? 100 : 40) * 0.15;
  score = clamp(Math.round(score + Math.min(6, relevantActivities.length * 3)));

  const develop = c.keySkills
    .filter((s) => !have.has(s))
    .slice(0, 4)
    .map((s) => ({ slug: s, name: getSkill(s)?.name ?? s }));

  const reason = strong.length
    ? `Strong: ${strong.slice(0, 3).join(", ")}${develop.length ? `. Develop: ${develop.slice(0, 2).map((d) => d.name).join(", ")}` : ""}.`
    : `Develop: ${develop.slice(0, 3).map((d) => d.name).join(", ")}.`;

  return { score, strong: Array.from(new Set(strong)), develop, reason };
}
