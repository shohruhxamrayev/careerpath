import { opportunities } from "@/lib/data/opportunities";
import { universities } from "@/lib/data/universities";
import { matchOpportunity } from "@/lib/matching/opportunity";
import { englishAsIelts, isProfileReady } from "@/lib/matching/profile";
import { matchUniversity } from "@/lib/matching/university";
import type { DegreeLevel, Field, Opportunity, StudentProfile, University } from "@/lib/types";

/*
 * Roadmap engine — turns a goal (where, what, when) into a month-by-month plan:
 * real deadline windows from the dataset plus the milestones a counsellor would set around them.
 */

export type Lane = "tests" | "universities" | "funding" | "profile" | "essays" | "move";

export const LANES: { id: Lane; label: string; color: string }[] = [
  { id: "tests", label: "Tests", color: "#A7B4DA" },
  { id: "universities", label: "Universities", color: "#8CCFB4" },
  { id: "funding", label: "Funding", color: "#E6C88E" },
  { id: "profile", label: "Profile building", color: "#D9A7BD" },
  { id: "essays", label: "Essays & documents", color: "#B4ABD6" },
  { id: "move", label: "Offers, visa & move", color: "#9CC8DC" },
];

export interface RoadmapInput {
  intake: string; // "YYYY-MM" — when studies start
  level: DegreeLevel;
  countries: string[];
  fields: Field[];
  ielts: number | null;
  needsFunding: boolean;
}

export interface RoadmapItem {
  id: string;
  lane: Lane;
  month: number; // index into months
  title: string;
  detail: string;
  href?: string;
  kind: "deadline" | "milestone";
  ref?: { kind: "university" | "opportunity"; slug: string };
  match?: number;
  critical?: boolean;
}

export interface Readiness {
  label: string;
  done: boolean;
  hint: string;
}

export interface Roadmap {
  months: { label: string; year: number; month: number }[]; // month 1–12
  items: RoadmapItem[];
  readiness: Readiness[];
  score: number;
  universities: University[];
  scholarships: Opportunity[];
  notes: string[];
}

const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function defaultRoadmapInput(profile: StudentProfile | null, now = new Date()): RoadmapInput {
  const seeking = (profile?.education.seeking || "undergraduate") as DegreeLevel;
  // earliest realistic September intake at least ~10 months away
  const y = now.getFullYear() + 1;
  return {
    intake: `${y}-09`,
    level: seeking === "phd" || seeking === "masters" ? seeking : "undergraduate",
    countries: profile?.goals.countries.slice(0, 3) ?? [],
    fields: profile?.education.field ? [profile.education.field as Field] : [],
    ielts: profile ? (englishAsIelts(profile)?.band ?? null) : null,
    needsFunding: profile ? profile.finance.need !== "self" : true,
  };
}

/** Latest month index (within [0, last]) whose calendar month is in `months`. */
function placeDeadline(months: number[], cal: { month: number }[], last: number): number | null {
  for (let i = last; i >= 0; i--) if (months.includes(cal[i].month)) return i;
  return null;
}

export function buildRoadmap(input: RoadmapInput, profile: StudentProfile | null, now = new Date()): Roadmap {
  const [iy, im] = input.intake.split("-").map(Number);
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const intake = new Date(iy, im - 1, 1);
  const total = Math.max(3, Math.min(30, (intake.getFullYear() - start.getFullYear()) * 12 + intake.getMonth() - start.getMonth() + 1));
  const months = Array.from({ length: total }, (_, i) => {
    const d = new Date(start.getFullYear(), start.getMonth() + i, 1);
    return { label: `${MON[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`, year: d.getFullYear(), month: d.getMonth() + 1 };
  });
  const last = total - 1;
  // applications for a September intake close by roughly 4 months before; keep deadlines before the last ~3 months
  const appLast = Math.max(0, last - 3);
  const ready = !!profile && isProfileReady(profile);
  const items: RoadmapItem[] = [];
  const notes: string[] = [];
  const at = (i: number) => Math.max(0, Math.min(last, i));

  // ── universities ──
  const uniPool = universities.filter((u) => u.levels.includes(input.level) && (!input.countries.length || input.countries.includes(u.country)) && (!input.fields.length || input.fields.some((f) => u.fields.includes(f))));
  const scoredUnis = uniPool
    .map((u) => ({ u, score: ready ? matchUniversity(profile!, u).score : 100 - (u.qsRank ?? 150) / 3 }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);
  for (const { u, score } of scoredUnis) {
    const UG_ONLY = /ucas|early|regular|decision|bachelor|undergrad|\buc\b|peak|national admission/i;
    let dl = input.level === "undergraduate"
      ? u.deadlines.find((d) => !/early|master/i.test(d.label)) ?? u.deadlines[0]
      : u.deadlines.find((d) => /master|graduate|postgrad/i.test(d.label)) ?? u.deadlines.find((d) => !UG_ONLY.test(d.label));
    let detail = dl ? `${dl.label}: ${dl.timing}` : "";
    if (!dl && input.level !== "undergraduate") {
      // graduate deadlines vary by programme; many close around 7–9 months before a September start
      dl = { label: "Programme deadline", timing: "Varies by programme — many close January–March", months: [1, 2, 3], source: u.deadlines[0]?.source ?? u.english.source };
      detail = "Graduate deadlines vary by programme — many close Jan–Mar. Confirm on the course page.";
    }
    const idx = dl ? placeDeadline(dl.months, months, appLast) : null;
    if (idx == null) continue;
    items.push({ id: `u-${u.slug}`, lane: "universities", month: idx, title: u.shortName ?? u.name, detail, href: `/universities/${u.slug}`, kind: "deadline", ref: { kind: "university", slug: u.slug }, match: ready ? score : undefined, critical: true });
  }
  if (!scoredUnis.length) notes.push("No universities in the dataset match all your filters — try another country or field.");

  // ── funding ──
  // opportunity levels describe the student's *current* stage: bachelor's applicants are in high school, master's applicants hold/finish a bachelor's
  const current = input.level === "undergraduate" ? ["high-school"] : input.level === "masters" ? ["undergraduate", "graduate"] : ["masters", "graduate"];
  const levelOk = (o: Opportunity) => o.levels.some((l) => current.includes(l));
  const scholPool = opportunities
    .filter((o) => o.type === "scholarship" && levelOk(o))
    .filter((o) => !input.countries.length || o.hostCountries.some((h) => input.countries.includes(h)) || /abroad|any|multiple|worldwide|international/i.test(o.location))
    .map((o) => ({ o, m: ready ? matchOpportunity(profile!, o) : null }))
    .filter((x) => x.m?.eligible !== false)
    .sort((a, b) => (b.m?.score ?? 0) - (a.m?.score ?? 0))
    .slice(0, input.needsFunding ? 6 : 3);
  for (const { o, m } of scholPool) {
    if (o.deadline.months.length >= 12) continue;
    const idx = placeDeadline(o.deadline.months, months, appLast);
    if (idx == null) continue;
    items.push({ id: `o-${o.slug}`, lane: "funding", month: idx, title: o.title.split(/[—(]/)[0].trim(), detail: o.deadline.timing, href: `/opportunities/${o.slug}`, kind: "deadline", ref: { kind: "opportunity", slug: o.slug }, match: m?.score, critical: input.needsFunding });
  }

  // ── profile building ──
  const pbTypes = input.level === "undergraduate" ? ["competition", "summer-program", "volunteering"] : ["internship", "fellowship", "conference", "competition"];
  const pbPool = opportunities
    .filter((o) => pbTypes.includes(o.type) && levelOk(o) && (!input.fields.length || o.fields === "any" || input.fields.some((f) => (o.fields as Field[]).includes(f))))
    .map((o) => ({ o, m: ready ? matchOpportunity(profile!, o) : null }))
    .filter((x) => x.m?.eligible !== false)
    .sort((a, b) => (b.m?.score ?? 0) - (a.m?.score ?? 0));
  let pb = 0;
  for (const { o, m } of pbPool) {
    if (pb >= 4) break;
    const idx = o.deadline.months.length >= 12 ? 0 : placeDeadline(o.deadline.months, months, Math.max(0, appLast - 1));
    if (idx == null) continue;
    items.push({ id: `p-${o.slug}`, lane: "profile", month: idx, title: o.title.split(/[—(]/)[0].trim(), detail: o.deadline.months.length >= 12 ? "Open year-round — start now" : o.deadline.timing, href: `/opportunities/${o.slug}`, kind: "deadline", ref: { kind: "opportunity", slug: o.slug }, match: m?.score });
    pb++;
  }

  // ── milestones around the first application deadline ──
  const appIdx = items.filter((x) => x.lane === "universities" || (x.lane === "funding" && x.critical)).map((x) => x.month);
  const first = appIdx.length ? Math.min(...appIdx) : at(appLast - 2);
  const needEnglish = input.ielts == null || input.ielts < (input.level === "undergraduate" ? 6.5 : 7);
  const ms = (lane: Lane, i: number, title: string, detail: string, critical = false) => items.push({ id: `m-${lane}-${title}`, lane, month: at(i), title, detail, kind: "milestone", critical });

  ms("universities", 0, "Final shortlist", "Pick 6–10 universities across ambitious / good-fit / likely tiers.");
  if (needEnglish) {
    ms("tests", first - 5, "Book English test", input.ielts ? `Current IELTS ${input.ielts} — aim for ${input.level === "undergraduate" ? "6.5–7.0" : "7.0+"}.` : "IELTS, TOEFL or Duolingo — check what your list accepts.");
    ms("tests", first - 3, "English test day", "Leave time for one retake before deadlines.", true);
  } else ms("tests", 0, "English score ready", `IELTS ${input.ielts} — check section minimums for each university.`);
  if (input.level === "undergraduate" && input.countries.includes("United States")) {
    ms("tests", first - 5, "SAT — first attempt", "Several US universities require it again.");
    ms("tests", first - 2, "SAT retake (if needed)", "Last sitting that reports in time.");
  }
  if (input.level !== "undergraduate" && input.fields.some((f) => ["business", "finance", "economics"].includes(f)) && input.countries.includes("United States")) ms("tests", first - 4, "GRE / GMAT", "Often expected by US business and economics programmes.");
  ms("essays", first - 4, input.level === "undergraduate" ? "Personal statement — first draft" : "Statement of purpose — first draft", "Outline your story; get feedback from two readers.");
  ms("essays", first - 2, "Ask referees", "Send each a brag sheet with deadlines.");
  ms("essays", first - 1, "Final essays & documents", "Transcripts, translations, passport, CV.", true);
  if (input.countries.includes("United States") && input.needsFunding && input.level === "undergraduate") ms("essays", first, "CSS Profile / aid forms", "Submit with your applications.");
  ms("profile", 0, "Strengthen your activities", "One project or competition tied to your field.");
  ms("move", last - 5, "Compare offers", "Total cost after aid; scholarship results.");
  ms("move", last - 3, "Accept offer & pay deposit", "Then request your CAS / I-20 / admission letter.", true);
  ms("move", last - 2, "Student visa", input.countries.includes("United Kingdom") ? "UK: show £1,171–£1,529/month living funds." : input.countries.includes("Germany") ? "Germany: blocked account €992/month (2026)." : "Book the appointment as early as allowed.", true);
  ms("move", last - 1, "Housing & travel", "Accommodation, flights, insurance.");
  ms("move", last, "Start studies", `${MON[im - 1]} ${iy} intake.`, true);

  // ── readiness ──
  const readiness: Readiness[] = [
    { label: "Profile complete", done: ready, hint: "Lets CareerPath match and check eligibility for you." },
    { label: "English test score", done: !needEnglish, hint: input.ielts ? `IELTS ${input.ielts} — below the usual target.` : "No score yet." },
    { label: "Target countries chosen", done: input.countries.length > 0, hint: "Pick 1–3 destinations." },
    { label: "Field chosen", done: input.fields.length > 0, hint: "Choose your intended field of study." },
    { label: "Universities in plan", done: items.some((x) => x.lane === "universities" && x.kind === "deadline"), hint: "At least one deadline fits your intake." },
    { label: "Funding route", done: !input.needsFunding || items.some((x) => x.lane === "funding" && x.kind === "deadline"), hint: "At least one scholarship you appear eligible for." },
    { label: "Enough time", done: first >= 3, hint: first < 3 ? "First deadline is under 3 months away — consider a later intake." : "" },
  ];
  if (first < 3) notes.push(`Your first key deadline is about ${Math.max(first, 1)} month${first === 1 ? "" : "s"} away. That's tight — focus on essays and tests now, or consider the following year's intake for a stronger application.`);

  return {
    months,
    items: items.sort((a, b) => a.month - b.month),
    readiness,
    score: Math.round((readiness.filter((r) => r.done).length / readiness.length) * 100),
    universities: scoredUnis.map((x) => x.u),
    scholarships: scholPool.map((x) => x.o),
    notes,
  };
}

export function monthToISO(m: { year: number; month: number }, day = 15) {
  return `${m.year}-${String(m.month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}
