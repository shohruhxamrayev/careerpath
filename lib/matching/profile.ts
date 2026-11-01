import { FIELD_LABELS, INTEREST_FIELDS, STUDENT_LEVEL_LABELS } from "@/lib/data/taxonomy";
import type { Field, StudentProfile } from "@/lib/types";

export function emptyProfile(name = ""): StudentProfile {
  return {
    personal: { name, country: "", city: "", age: null },
    education: { institution: "", level: "", seeking: "", field: "", major: "", graduationYear: null, gpa: null, gpaScale: 4 },
    tests: { ielts: null, toefl: null, duolingo: null, sat: null, act: null, gre: null, gmat: null, other: "" },
    skills: { technical: [], soft: [], languages: [] },
    activities: [],
    interests: [],
    goals: { careers: [], industries: [], countries: [] },
    finance: { need: "", budgetUSD: null },
  };
}

/** Merge a stored (possibly older/partial) profile onto a complete empty profile. */
export function normalizeProfile(p: Partial<StudentProfile> | null | undefined, name = ""): StudentProfile {
  const base = emptyProfile(name);
  if (!p) return base;
  return {
    personal: { ...base.personal, ...p.personal },
    education: { ...base.education, ...p.education },
    tests: { ...base.tests, ...p.tests },
    skills: { ...base.skills, ...p.skills },
    activities: Array.isArray(p.activities) ? p.activities : [],
    interests: Array.isArray(p.interests) ? p.interests : [],
    goals: { ...base.goals, ...p.goals },
    finance: { ...base.finance, ...p.finance },
    updatedAt: p.updatedAt,
  };
}

// ───────────── Completion ─────────────

export interface CompletionSection {
  key: "personal" | "education" | "tests" | "skills" | "activities" | "interests" | "goals" | "finance";
  label: string;
  weight: number;
  done: number; // 0..1
  missing: string[];
}

export function profileCompletion(p: StudentProfile): { percent: number; sections: CompletionSection[]; missing: string[] } {
  const sec = (key: CompletionSection["key"], label: string, weight: number, checks: [boolean, string][]): CompletionSection => {
    const done = checks.filter(([ok]) => ok).length / checks.length;
    return { key, label, weight, done, missing: checks.filter(([ok]) => !ok).map(([, m]) => m) };
  };
  const t = p.tests;
  const sections: CompletionSection[] = [
    sec("personal", "Personal details", 10, [
      [!!p.personal.name.trim(), "Your name"],
      [!!p.personal.country, "Country of citizenship"],
      [!!p.personal.city.trim(), "City"],
      [p.personal.age != null, "Age"],
    ]),
    sec("education", "Education", 22, [
      [!!p.education.institution.trim(), "Current institution"],
      [!!p.education.level, "Current level of study"],
      [!!p.education.seeking, "Degree level you're aiming for"],
      [!!p.education.field, "Field of study"],
      [p.education.graduationYear != null, "Graduation year"],
      [p.education.gpa != null, "GPA or average grade"],
    ]),
    sec("tests", "Test scores", 12, [
      [t.ielts != null || t.toefl != null || t.duolingo != null, "An English test score (IELTS, TOEFL or Duolingo)"],
      [t.sat != null || t.act != null || t.gre != null || t.gmat != null || !!t.other.trim(), "Any academic test (SAT, ACT, GRE, GMAT or other) — or note that you have none"],
    ]),
    sec("skills", "Skills", 12, [
      [p.skills.technical.length > 0, "At least one technical skill"],
      [p.skills.soft.length > 0, "At least one soft skill"],
      [p.skills.languages.length > 0, "Languages you speak"],
    ]),
    sec("activities", "Extracurriculars", 14, [
      [p.activities.length > 0, "At least one activity"],
      [p.activities.length >= 3, "Three or more activities give stronger matches"],
    ]),
    sec("interests", "Interests", 10, [[p.interests.length >= 2, "At least two interests"]]),
    sec("goals", "Career goals", 12, [
      [p.goals.careers.length > 0, "Careers you're considering"],
      [p.goals.countries.length > 0, "Preferred study or work destinations"],
    ]),
    sec("finance", "Funding", 8, [
      [!!p.finance.need, "Funding preference"],
      [p.finance.need !== "self" || p.finance.budgetUSD != null, "Annual budget"],
    ]),
  ];
  const total = sections.reduce((s, x) => s + x.weight, 0);
  const percent = Math.round((sections.reduce((s, x) => s + x.weight * x.done, 0) / total) * 100);
  return { percent, sections, missing: sections.flatMap((s) => s.missing) };
}

/** The minimum information needed to personalise recommendations. */
export function isProfileReady(p: StudentProfile | null | undefined): boolean {
  if (!p) return false;
  return !!p.education.level && (!!p.education.field || p.interests.length > 0);
}

// ───────────── Normalisation helpers ─────────────

export function gpaOn4(p: StudentProfile): number | null {
  const { gpa, gpaScale } = p.education;
  if (gpa == null || !isFinite(gpa)) return null;
  const clamped = Math.max(0, Math.min(gpa, gpaScale));
  let v: number;
  if (gpaScale === 100) {
    // Percentage grades are compressed at the top: 90%+ ≈ 4.0, 75% ≈ 3.0, 60% ≈ 2.0.
    v = clamped >= 90 ? 4 : clamped >= 60 ? 2 + ((clamped - 60) / 30) * 2 : (clamped / 60) * 2;
  } else {
    v = (clamped / gpaScale) * 4;
  }
  return Math.round(v * 100) / 100;
}

const TOEFL_TO_IELTS: [number, number][] = [
  [118, 9], [115, 8.5], [110, 8], [102, 7.5], [94, 7], [79, 6.5], [60, 6], [46, 5.5], [35, 5], [0, 4.5],
];
const DUOLINGO_TO_IELTS: [number, number][] = [
  [155, 8], [145, 7.5], [135, 7], [125, 6.5], [115, 6], [105, 5.5], [95, 5], [0, 4.5],
];

/** Best English score expressed on the IELTS band scale. */
export function englishAsIelts(p: StudentProfile): { band: number; from: string } | null {
  const cands: { band: number; from: string }[] = [];
  if (p.tests.ielts != null) cands.push({ band: p.tests.ielts, from: `IELTS ${p.tests.ielts}` });
  if (p.tests.toefl != null) {
    const band = TOEFL_TO_IELTS.find(([min]) => p.tests.toefl! >= min)?.[1] ?? 4.5;
    cands.push({ band, from: `TOEFL ${p.tests.toefl}` });
  }
  if (p.tests.duolingo != null) {
    const band = DUOLINGO_TO_IELTS.find(([min]) => p.tests.duolingo! >= min)?.[1] ?? 4.5;
    cands.push({ band, from: `Duolingo ${p.tests.duolingo}` });
  }
  if (!cands.length) return null;
  return cands.sort((a, b) => b.band - a.band)[0];
}

/** Academic fields implied by the student's field of study and interests. */
export function studentFields(p: StudentProfile): { primary: Field | null; related: Set<Field> } {
  const related = new Set<Field>();
  for (const i of p.interests) INTEREST_FIELDS[i]?.forEach((f) => related.add(f));
  const primary = (p.education.field || null) as Field | null;
  if (primary) related.add(primary);
  return { primary, related };
}

export function workMonths(p: StudentProfile): number {
  return p.activities.filter((a) => a.type === "work").reduce((s, a) => s + (a.months ?? 0), 0);
}

/** A short natural-language description used in recommendation reasons. */
export function describeStudent(p: StudentProfile): string {
  const parts: string[] = [];
  const level = p.education.level ? STUDENT_LEVEL_LABELS[p.education.level].toLowerCase() : "";
  const field = p.education.field ? FIELD_LABELS[p.education.field] : "";
  if (level && field) parts.push(`${aOrAn(level)} ${level} ${field} student`);
  else if (field) parts.push(`a ${field} student`);
  else if (level) parts.push(`${aOrAn(level)} ${level} student`);
  const eng = englishAsIelts(p);
  if (eng && eng.band >= 7) parts.push("strong English proficiency");
  else if (eng && eng.band >= 6) parts.push("solid English proficiency");
  return parts.join(" with ");
}

function aOrAn(word: string) {
  return /^[aeiou]/i.test(word) ? "an" : "a";
}
