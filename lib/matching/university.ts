import { DEGREE_LEVEL_LABELS, FIELD_LABELS, TUITION_BAND_MAX, TUITION_BAND_MIN } from "@/lib/data/taxonomy";
import type { StudentProfile, University } from "@/lib/types";
import { englishAsIelts, gpaOn4, studentFields } from "./profile";
import { clamp, type Check, type MatchResult } from "./types";

const SELECTIVITY_GPA: Record<University["selectivity"], number> = { most: 3.85, high: 3.5, moderate: 3.0, accessible: 2.5 };

/**
 * Rule-based Profile Match between a student and a university.
 * Components: eligibility, academic fit, interest/major fit, profile alignment, financial fit.
 * It is an informational fit score, not an admission prediction.
 */
export function matchUniversity(p: StudentProfile, u: University): MatchResult {
  const checks: Check[] = [];

  // ── Eligibility ──
  let elig = 70;
  let levelFail = false;
  const seeking = p.education.seeking;
  if (seeking) {
    if (u.levels.includes(seeking)) {
      checks.push({ status: "pass", label: `${DEGREE_LEVEL_LABELS[seeking]} programmes offered`, group: "eligibility" });
      elig += 15;
    } else {
      checks.push({ status: "fail", label: `No ${DEGREE_LEVEL_LABELS[seeking]} programmes listed`, group: "eligibility" });
      levelFail = true;
      elig -= 50;
    }
  } else {
    checks.push({ status: "unknown", label: "Add the degree level you're aiming for", group: "eligibility" });
  }

  const eng = englishAsIelts(p);
  const englishTaught = /english/i.test(u.languageOfInstruction);
  if (!englishTaught) {
    checks.push({ status: "warn", label: `Taught in ${u.languageOfInstruction}`, detail: "Check which programmes are available in English.", group: "eligibility" });
    elig -= 10;
  }
  if (u.english.ielts != null) {
    if (!eng) {
      checks.push({ status: "warn", label: `English requirement around IELTS ${u.english.ielts}`, detail: "Add an English test score to compare.", group: "eligibility" });
    } else if (eng.band >= u.english.ielts) {
      checks.push({ status: "pass", label: "English requirement appears satisfied", detail: `${eng.from} vs. about IELTS ${u.english.ielts}`, group: "eligibility" });
      elig += 15;
    } else if (eng.band >= u.english.ielts - 0.5) {
      checks.push({ status: "warn", label: "English score is just below the usual minimum", detail: `${eng.from} vs. about IELTS ${u.english.ielts}`, group: "eligibility" });
      elig -= 5;
    } else {
      checks.push({ status: "fail", label: "English score below the usual minimum", detail: `${eng.from} vs. about IELTS ${u.english.ielts}`, group: "eligibility" });
      elig -= 25;
    }
  } else {
    checks.push({ status: "unknown", label: "No fixed English minimum captured", detail: "Confirm on the official site.", group: "eligibility" });
  }

  if (seeking === "undergraduate") {
    const hasTest = p.tests.sat != null || p.tests.act != null;
    if (u.testing.policy === "required") {
      checks.push(hasTest
        ? { status: "pass", label: "SAT/ACT score on profile", detail: "Standardized testing is required here.", group: "eligibility" }
        : { status: "warn", label: "SAT or ACT required", detail: "Add a score or plan to take the test.", group: "eligibility" });
      elig += hasTest ? 5 : -10;
    } else if (u.testing.policy === "varies") {
      checks.push({ status: "warn", label: "Testing policy should be checked", detail: u.testing.note, group: "eligibility" });
    } else if (u.testing.policy === "optional") {
      checks.push({ status: "pass", label: "Standardized tests optional", group: "eligibility" });
    } else {
      checks.push({ status: "pass", label: "No SAT/ACT needed for most applicants", group: "eligibility" });
    }
  }
  elig = clamp(elig);

  // ── Academic fit ──
  let academic = 55;
  const gpa = gpaOn4(p);
  const target = SELECTIVITY_GPA[u.selectivity];
  if (gpa == null) {
    checks.push({ status: "unknown", label: "Add your GPA to assess academic fit", group: "fit" });
  } else {
    academic = clamp(72 + (gpa - target) * 55);
    if (gpa >= target) checks.push({ status: "pass", label: "Grades align with typical admitted students", detail: `Your GPA ≈ ${gpa.toFixed(2)} / 4.0`, group: "fit" });
    else if (gpa >= target - 0.3) checks.push({ status: "warn", label: "Grades slightly below typical for this university", detail: `Your GPA ≈ ${gpa.toFixed(2)} / 4.0`, group: "fit" });
    else checks.push({ status: "warn", label: "Grades well below typical for this university", detail: `Your GPA ≈ ${gpa.toFixed(2)} / 4.0`, group: "fit" });
  }

  // ── Interest / major fit ──
  const { primary, related } = studentFields(p);
  let interest = 35;
  if (primary && u.fields.includes(primary)) {
    interest = 95;
    checks.push({ status: "pass", label: "Intended major available", detail: FIELD_LABELS[primary], group: "fit" });
  } else {
    const overlap = u.fields.filter((f) => related.has(f));
    if (overlap.length) {
      interest = clamp(55 + overlap.length * 10, 0, 85);
      checks.push({ status: primary ? "warn" : "pass", label: primary ? `${FIELD_LABELS[primary]} not a listed strength` : "Programmes match your interests", detail: `Related: ${overlap.slice(0, 3).map((f) => FIELD_LABELS[f]).join(", ")}`, group: "fit" });
    } else if (primary || related.size) {
      checks.push({ status: "warn", label: "Few programmes in your areas of interest", group: "fit" });
    } else {
      interest = 50;
      checks.push({ status: "unknown", label: "Add your field and interests", group: "fit" });
    }
  }

  // ── Profile alignment ──
  let alignment = 45;
  const wants = p.goals.countries;
  if (wants.length) {
    if (wants.includes(u.country)) {
      alignment += 35;
      checks.push({ status: "pass", label: `${u.country} is one of your preferred destinations`, group: "fit" });
    } else {
      alignment -= 10;
    }
  } else alignment += 10;
  const acts = p.activities.length;
  alignment += Math.min(20, acts * 5);
  if (acts >= 3 && (u.selectivity === "most" || u.selectivity === "high")) {
    checks.push({ status: "pass", label: "Student profile aligns with programme", detail: `${acts} extracurricular activities recorded`, group: "fit" });
  } else if (acts === 0 && (u.selectivity === "most" || u.selectivity === "high")) {
    checks.push({ status: "warn", label: "Selective universities weigh extracurriculars", detail: "Add your activities to your profile.", group: "fit" });
  }
  alignment = clamp(alignment);

  // ── Financial fit ──
  let financial = 60;
  const band = u.tuition.band;
  const need = p.finance.need;
  if (need === "full") {
    financial = { "need-based-full": 92, government: 78, merit: 58, "need-based-limited": 45, limited: 22 }[u.aid.kind];
    if (band === "under-5k") financial = Math.max(financial, 80);
    checks.push(financial >= 75
      ? { status: "pass", label: "Funding routes match a full-scholarship need", detail: u.aid.summary, group: "fit" }
      : { status: "warn", label: "Full funding is limited here", detail: u.aid.summary, group: "fit" });
  } else if (need === "partial") {
    financial = { "need-based-full": 90, government: 75, merit: 78, "need-based-limited": 65, limited: 45 }[u.aid.kind];
    if (band === "under-5k" || band === "5-15k") financial = Math.max(financial, 82);
  } else if (need === "self") {
    const budget = p.finance.budgetUSD;
    if (budget != null && band) {
      if (budget >= TUITION_BAND_MAX[band]) { financial = 95; checks.push({ status: "pass", label: "Estimated tuition fits your budget", detail: u.tuition.display, group: "fit" }); }
      else if (budget >= TUITION_BAND_MIN[band]) { financial = 70; checks.push({ status: "warn", label: "Tuition may be near your budget", detail: u.tuition.display, group: "fit" }); }
      else { financial = 25; checks.push({ status: "warn", label: "Estimated tuition is above your budget", detail: u.tuition.display, group: "fit" }); }
    }
  }
  if (!band) checks.push({ status: "unknown", label: "Tuition not yet captured", detail: "Check the official fees page.", group: "fit" });

  const components = [
    { key: "eligibility", label: "Eligibility match", score: Math.round(elig), weight: 0.25 },
    { key: "academic", label: "Academic fit", score: Math.round(academic), weight: 0.2 },
    { key: "interest", label: "Interest / major fit", score: Math.round(interest), weight: 0.25 },
    { key: "alignment", label: "Profile alignment", score: Math.round(alignment), weight: 0.15 },
    { key: "financial", label: "Financial fit", score: Math.round(financial), weight: 0.15 },
  ];
  let score = Math.round(components.reduce((s, c) => s + c.score * c.weight, 0));
  if (levelFail) score = Math.min(score, 35);

  const fitScore = Math.round((academic * 0.2 + interest * 0.25 + alignment * 0.15 + financial * 0.15) / 0.75);
  const passes = checks.filter((c) => c.status === "pass").map((c) => c.label.toLowerCase());
  const reason = levelFail
    ? `Doesn't list ${seeking ? DEGREE_LEVEL_LABELS[seeking] : "your"} programmes.`
    : passes.length
      ? `${capitalize(passes.slice(0, 2).join("; "))}.`
      : "Partial match — complete your profile for a clearer picture.";

  return { score, eligible: levelFail ? false : seeking ? true : null, eligibilityScore: Math.round(elig), fitScore, components, checks, reason };
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
