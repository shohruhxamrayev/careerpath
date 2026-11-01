import { careers } from "@/lib/data/careers";
import { FIELD_LABELS, STUDENT_LEVEL_LABELS } from "@/lib/data/taxonomy";
import type { Opportunity, Requirement, StudentProfile } from "@/lib/types";
import { englishAsIelts, gpaOn4, studentFields, workMonths } from "./profile";
import { clamp, type Check, type CheckStatus, type MatchResult } from "./types";

/** Evaluate one structured requirement against the student profile. */
export function evaluateRequirement(p: StudentProfile, r: Requirement): Check {
  const c = (status: CheckStatus, detail?: string): Check => ({ status, label: r.text, detail, group: "eligibility" });
  switch (r.kind) {
    case "level": {
      const lvl = p.education.level;
      if (!lvl) return c("unknown", "Add your current level of study.");
      if (r.levels.includes(lvl)) return c("pass", `You: ${STUDENT_LEVEL_LABELS[lvl]}`);
      const finalYear =
        lvl === "undergraduate" &&
        p.education.graduationYear != null &&
        p.education.graduationYear <= new Date().getFullYear() + 1 &&
        (r.levels.includes("graduate") || r.levels.includes("masters"));
      if (finalYear) return c("warn", "You may qualify once you complete your bachelor's degree.");
      return c("fail", `You: ${STUDENT_LEVEL_LABELS[lvl]}`);
    }
    case "age": {
      const age = p.personal.age;
      if (age == null) return c("unknown", "Add your age to check this.");
      if ((r.min != null && age < r.min) || (r.max != null && age > r.max)) return c("fail", `You: ${age}`);
      return c("pass", `You: ${age}`);
    }
    case "english": {
      const eng = englishAsIelts(p);
      if (!eng) return c("unknown", "Add an English test score.");
      if (r.ielts == null) return c(eng.band >= 6.5 ? "pass" : "warn", `You: ${eng.from}`);
      if (eng.band >= r.ielts) return c("pass", `You: ${eng.from}`);
      if (eng.band >= r.ielts - 0.5) return c("warn", `You: ${eng.from} — just below the usual minimum`);
      return c("fail", `You: ${eng.from}`);
    }
    case "gpa": {
      const g = gpaOn4(p);
      if (g == null) return c("unknown", "Add your GPA to check this.");
      if (g >= r.min4) return c("pass", `You ≈ ${g.toFixed(2)} / 4.0`);
      return c(g >= r.min4 - 0.3 ? "warn" : "fail", `You ≈ ${g.toFixed(2)} / 4.0`);
    }
    case "work": {
      const m = workMonths(p);
      if (m >= r.minMonths) return c("pass", `You: about ${m} months recorded`);
      if (m === 0 && !p.activities.some((a) => a.type === "work")) return c("fail", "No work experience recorded yet.");
      return c("fail", `You: about ${m} months recorded`);
    }
    case "nationality": {
      const country = p.personal.country;
      if (r.include?.length) {
        if (!country) return c("unknown", "Add your country of citizenship.");
        return c(r.include.includes(country) ? "pass" : "fail", `You: ${country}`);
      }
      if (r.exclude?.length && country && r.exclude.includes(country)) return c("fail", `You: ${country}`);
      if (/any|all national/i.test(r.text)) return c("pass");
      return c(country ? "unknown" : "unknown", country ? `Confirm ${country} is on the current eligible list.` : "Add your country of citizenship.");
    }
    case "field": {
      const { related } = studentFields(p);
      if (!related.size) return c("unknown", "Add your field of study.");
      const hit = r.fields.find((f) => related.has(f));
      return hit ? c("pass", `Matches ${FIELD_LABELS[hit]}`) : c("warn", "Your field isn't listed — check the details.");
    }
    case "other":
      return c("unknown", "Check this on the official page.");
  }
}

/** Rule-based match: eligibility (hard requirements) separated from personal fit. */
export function matchOpportunity(p: StudentProfile, o: Opportunity): MatchResult {
  const checks: Check[] = o.requirements.map((r) => evaluateRequirement(p, r));

  // If the opportunity has no explicit level requirement, use its audience levels.
  if (!o.requirements.some((r) => r.kind === "level") && p.education.level) {
    const ok = o.levels.includes(p.education.level);
    checks.unshift({
      status: ok ? "pass" : "warn",
      label: ok ? `Open to ${STUDENT_LEVEL_LABELS[p.education.level].toLowerCase()} students` : `Usually aimed at ${o.levels.map((l) => STUDENT_LEVEL_LABELS[l].toLowerCase()).join(", ")} students`,
      group: "eligibility",
    });
  }

  const elig = checks.filter((c) => c.group === "eligibility");
  const weight: Record<CheckStatus, number> = { pass: 1, warn: 0.55, unknown: 0.6, fail: 0 };
  const evaluable = elig.filter((c) => !(c.status === "unknown" && /official page/.test(c.detail ?? "")));
  const eligibilityScore = evaluable.length
    ? Math.round((evaluable.reduce((s, c) => s + weight[c.status], 0) / evaluable.length) * 100)
    : 70;
  const anyFail = elig.some((c) => c.status === "fail");
  const anyUnknown = evaluable.some((c) => c.status === "unknown");

  // ── Personal fit ──
  const fit: Check[] = [];
  const { primary, related } = studentFields(p);
  let fieldFit = 55;
  if (o.fields === "any") {
    fieldFit = 70;
  } else if (primary && o.fields.includes(primary)) {
    fieldFit = 95;
    fit.push({ status: "pass", label: `Relevant to ${FIELD_LABELS[primary]}`, group: "fit" });
  } else {
    const overlap = o.fields.filter((f) => related.has(f));
    if (overlap.length) {
      fieldFit = 78;
      fit.push({ status: "pass", label: `Connects to your interest in ${FIELD_LABELS[overlap[0]]}`, group: "fit" });
    } else if (related.size) {
      fieldFit = 30;
      fit.push({ status: "warn", label: "Outside your main fields", group: "fit" });
    }
  }

  let goalFit = 50;
  const goalCareers = careers.filter((c) => p.goals.careers.includes(c.slug) || p.goals.careers.includes(c.title));
  const linked = goalCareers.find((c) => c.opportunitySlugs.includes(o.slug));
  if (linked) {
    goalFit = 95;
    fit.push({ status: "pass", label: `Builds toward ${linked.title}`, group: "fit" });
  }

  let placeFit = 60;
  if (o.format === "online") placeFit = 75;
  if (p.goals.countries.length && o.hostCountries.length) {
    const hit = o.hostCountries.find((h) => p.goals.countries.includes(h));
    if (hit) {
      placeFit = 95;
      fit.push({ status: "pass", label: `In a preferred destination (${hit})`, group: "fit" });
    } else placeFit = 45;
  }

  let fundFit = 60;
  if (p.finance.need === "full") {
    fundFit = o.funding.kind === "fully-funded" || o.funding.kind === "paid" ? 95 : o.funding.kind === "partial" ? 50 : o.funding.kind === "unpaid" ? 40 : 60;
    if (o.funding.kind === "fully-funded") fit.push({ status: "pass", label: "Fully funded — matches your funding need", group: "fit" });
  } else if (o.funding.kind === "fully-funded" || o.funding.kind === "paid") fundFit = 80;

  const fitScore = Math.round(fieldFit * 0.4 + goalFit * 0.2 + placeFit * 0.15 + fundFit * 0.25);
  let score = Math.round(eligibilityScore * 0.6 + fitScore * 0.4);
  if (anyFail) score = Math.min(score, 40);

  const passed = [...elig, ...fit].filter((c) => c.status === "pass");
  const reason = anyFail
    ? `Not currently eligible: ${lower(elig.find((c) => c.status === "fail")!.label)}.`
    : passed.length
      ? `${passed.slice(0, 2).map((c) => c.label).join("; ")}.`
      : "Some requirements need checking on the official page.";

  return {
    score,
    eligible: anyFail ? false : anyUnknown ? null : true,
    eligibilityScore,
    fitScore,
    components: [
      { key: "eligibility", label: "Eligibility", score: eligibilityScore, weight: 0.6 },
      { key: "fit", label: "Personal fit", score: fitScore, weight: 0.4 },
    ],
    checks: [...checks, ...fit],
    reason,
  };
}

function lower(s: string) {
  return s.charAt(0).toLowerCase() + s.slice(1);
}
