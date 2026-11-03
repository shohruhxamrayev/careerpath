import { GUIDES, getGuide } from "@/lib/ai/knowledge";
import { careerBrief, oppBrief, parseEntities, searchCareers, searchOpportunities, searchUniversities, uniBrief } from "@/lib/ai/tools";
import { careers } from "@/lib/data/careers";
import { certifications } from "@/lib/data/certifications";
import { opportunities } from "@/lib/data/opportunities";
import { FIELDS, OPPORTUNITY_TYPES, REGIONS } from "@/lib/data/taxonomy";
import { universities } from "@/lib/data/universities";
import { isProfileReady, profileCompletion } from "@/lib/matching/profile";
import { buildRecommendations } from "@/lib/matching/recommend";
import type { DegreeLevel, Field, OpportunityType, StudentProfile } from "@/lib/types";
import { monthsAhead } from "@/lib/utils";
import { filterLiveJobs, getLiveJobs } from "@/lib/live/jobs";
import { getCourses, searchCourses } from "@/lib/live/courses";

/* Tool definitions + executors for the AI advisor (Claude tool use). Server-only. */

export const AI_TOOLS = [
  {
    name: "search_universities",
    description: "Search CareerPath's sourced university dataset. Returns up to `limit` universities with QS 2027 rank, tuition, aid, English requirement, testing policy, deadlines and (if the student has a profile) their Profile Match. Use for any question about where to study, lists, filters or recommendations.",
    input_schema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Free text matched against name, city, overview and programmes" },
        countries: { type: "array", items: { type: "string" }, description: "Full country names, e.g. 'United Kingdom', 'United States', 'Germany', 'South Korea', 'Türkiye'" },
        regions: { type: "array", items: { type: "string", enum: REGIONS } },
        fields: { type: "array", items: { type: "string", enum: FIELDS } },
        level: { type: "string", enum: ["undergraduate", "masters", "phd"] },
        max_ielts: { type: "number", description: "Only universities whose published IELTS minimum is at or below this" },
        max_tuition_usd: { type: "number", description: "Upper bound on annual international tuition (USD, approximate band)" },
        full_need_aid: { type: "boolean", description: "Only universities that meet full demonstrated need for international students" },
        no_required_tests: { type: "boolean", description: "Exclude universities that require SAT/ACT" },
        max_qs_rank: { type: "number" },
        limit: { type: "number", description: "Default 8, max 15" },
      },
    },
  },
  {
    name: "get_university",
    description: "Full sourced profile of one university (by name, short name or slug), including verification status of each fact and the student's Profile Match checks.",
    input_schema: { type: "object", properties: { name: { type: "string" } }, required: ["name"] },
  },
  {
    name: "compare_universities",
    description: "Side-by-side data for 2–4 universities.",
    input_schema: { type: "object", properties: { names: { type: "array", items: { type: "string" }, minItems: 2, maxItems: 4 } }, required: ["names"] },
  },
  {
    name: "search_opportunities",
    description: "Search scholarships, competitions, internships, fellowships, exchanges, summer programmes, volunteering, conferences, jobs and grants. Returns funding, requirements, typical deadline and the student's eligibility when a profile exists.",
    input_schema: {
      type: "object",
      properties: {
        query: { type: "string" },
        types: { type: "array", items: { type: "string", enum: OPPORTUNITY_TYPES } },
        host_countries: { type: "array", items: { type: "string" } },
        fields: { type: "array", items: { type: "string", enum: FIELDS } },
        level: { type: "string", enum: ["high-school", "undergraduate", "masters", "phd", "graduate"] },
        fully_funded: { type: "boolean" },
        closing_within_months: { type: "number" },
        eligible_only: { type: "boolean", description: "Hide items the student is not eligible for (needs profile)" },
        limit: { type: "number" },
      },
    },
  },
  {
    name: "get_opportunity",
    description: "Full details for one opportunity by name or slug: requirements, funding, steps, deadline, official URL and eligibility checks.",
    input_schema: { type: "object", properties: { name: { type: "string" } }, required: ["name"] },
  },
  {
    name: "search_careers",
    description: "Careers with skills, majors, entry roles, outlook and (with profile) Career Match.",
    input_schema: { type: "object", properties: { query: { type: "string" } } },
  },
  {
    name: "search_certifications",
    description: "Industry certifications and courses (AWS, Google, Microsoft, CFA, ACCA, PMI, CompTIA, Cisco, CS50, IELTS…) with cost, level, time, skills and related careers. Use for questions about certificates, courses, credentials or upskilling.",
    input_schema: { type: "object", properties: { query: { type: "string" }, career: { type: "string", description: "Career slug, e.g. data-analyst" }, free_only: { type: "boolean" } } },
  },
  {
    name: "get_guide",
    description: "Expert advising guide with checked facts. Topics: " + GUIDES.map((g) => `${g.id} (${g.title})`).join("; "),
    input_schema: { type: "object", properties: { topic: { type: "string", enum: GUIDES.map((g) => g.id) } }, required: ["topic"] },
  },
  {
    name: "get_my_recommendations",
    description: "The student's profile summary, completion gaps and personalised top universities, scholarships, opportunities, careers and skills from CareerPath's matching engine. Call this first for any personal question (what should I…, am I eligible…, what fits me…).",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "upcoming_deadlines",
    description: "Opportunities and university deadlines typically falling within the next N months, plus deadlines from the student's planner.",
    input_schema: { type: "object", properties: { months: { type: "number" } } },
  },
  {
    name: "search_courses",
    description: "Search Coursera's full catalogue (25,000+ courses from universities and companies) by keywords, subject and language. Use when the student asks for courses or how to learn a skill online. Return course names with their coursera.org links; the finder is at /courses.",
    input_schema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Skill or topic, e.g. 'python', 'machine learning', 'financial accounting'" },
        domain: { type: "string", enum: ["computer-science", "data-science", "information-technology", "business", "physical-science-and-engineering", "life-sciences", "social-sciences", "arts-and-humanities", "math-and-logic", "personal-development", "language-learning"] },
        language: { type: "string", description: "ISO code, e.g. 'en', 'es', 'ru'" },
        limit: { type: "number" },
      },
    },
  },
  {
    name: "search_live_jobs",
    description: "Search LIVE internship and entry-level job postings (refreshed every few hours from The Muse, Arbeitnow and Jobicy). Use when the student wants current/open internships or first jobs to apply to now. Each result has the original posting URL — always give it. The full board is at /jobs.",
    input_schema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Keywords matched against title, company and category, e.g. 'data', 'marketing', 'software'" },
        level: { type: "string", enum: ["internship", "entry"] },
        remote: { type: "boolean" },
        location: { type: "string", description: "Substring of the location, e.g. 'Berlin', 'London', 'New York'" },
        limit: { type: "number" },
      },
    },
  },
] as const;

export const TOOL_LABELS: Record<string, string> = {
  search_live_jobs: "Checking live job boards",
  search_courses: "Searching 25,000+ courses",
  search_universities: "Searching universities",
  get_university: "Reading university profile",
  compare_universities: "Comparing universities",
  search_opportunities: "Searching opportunities",
  get_opportunity: "Reading programme rules",
  search_careers: "Exploring careers",
  get_guide: "Checking advising guide",
  search_certifications: "Finding certifications",
  get_my_recommendations: "Analysing your profile",
  upcoming_deadlines: "Checking deadlines",
};

function findUni(name: string) {
  const n = name.toLowerCase().trim();
  return universities.find((u) => u.slug === n || u.name.toLowerCase() === n || u.shortName?.toLowerCase() === n) ?? parseEntities(name).universities[0] ?? universities.find((u) => u.name.toLowerCase().includes(n));
}
function findOpp(name: string) {
  const n = name.toLowerCase().trim();
  return opportunities.find((o) => o.slug === n || o.title.toLowerCase() === n) ?? parseEntities(name).opportunities[0] ?? opportunities.find((o) => o.title.toLowerCase().includes(n));
}

type Planner = { title: string; status: string; deadline: string | null }[];

export function runTool(name: string, input: any, profile: StudentProfile | null, planner: Planner): unknown {
  const p = profile && isProfileReady(profile) ? profile : null;
  const limit = Math.min(Number(input?.limit) || 8, 15);
  switch (name) {
    case "search_courses":
      return getCourses().then((all) => {
        const r = searchCourses(all, { q: input?.query, domain: input?.domain, lang: input?.language, limit });
        return { finder: `/courses${input?.query ? `?q=${encodeURIComponent(input.query)}` : ""}`, totalMatches: r.total, results: r.results.map((c) => ({ name: c.name, by: c.partner, workload: c.workload, language: c.lang, certificate: c.certificate, url: c.url })) };
      });
    case "search_live_jobs":
      return getLiveJobs().then(({ jobs, fetchedAt }) => {
        const rows = filterLiveJobs(jobs, { query: input?.query, level: input?.level, remote: !!input?.remote, location: input?.location, limit });
        return { fetchedAt, totalLive: jobs.length, board: "/jobs", results: rows.map((j) => ({ title: j.title, company: j.company, location: j.location, level: j.level, posted: j.posted.slice(0, 10), url: j.url, source: j.source })) };
      });
    case "search_universities": {
      const rows = searchUniversities({
        query: input.query, countries: input.countries, regions: input.regions, fields: input.fields as Field[], level: input.level as DegreeLevel,
        maxIelts: input.max_ielts ?? null, maxTuitionUsd: input.max_tuition_usd ?? null, fullNeed: !!input.full_need_aid, noTest: !!input.no_required_tests, maxQsRank: input.max_qs_rank ?? null, limit,
      }, p);
      return { count: rows.length, universities: rows.map(({ u }) => { const b = uniBrief(u, p); return { ...b, overview: undefined, deadlines: b.deadlines.slice(0, 2), profileMatch: b.profileMatch ? { score: b.profileMatch.score, reason: b.profileMatch.reason } : null }; }) };
    }
    case "get_university": {
      const u = findUni(String(input.name ?? ""));
      return u ? uniBrief(u, p) : { error: `No university matching "${input.name}" in CareerPath's dataset. Say so and suggest the student checks the official site.` };
    }
    case "compare_universities": {
      const list = (input.names as string[]).map(findUni).filter(Boolean);
      return { universities: list.map((u) => uniBrief(u!, p)) };
    }
    case "search_opportunities": {
      const rows = searchOpportunities({ query: input.query, types: input.types as OpportunityType[], hostCountries: input.host_countries, fields: input.fields as Field[], level: input.level, fullyFunded: !!input.fully_funded, closingWithinMonths: input.closing_within_months ?? null, eligibleOnly: !!input.eligible_only, limit }, p);
      return { count: rows.length, opportunities: rows.map(({ o }) => { const b = oppBrief(o, p); return { ...b, overview: undefined, steps: undefined }; }) };
    }
    case "get_opportunity": {
      const o = findOpp(String(input.name ?? ""));
      return o ? oppBrief(o, p) : { error: `No opportunity matching "${input.name}" in CareerPath's dataset.` };
    }
    case "search_careers":
      return { careers: searchCareers(String(input.query ?? ""), p).slice(0, 6).map(({ c }) => careerBrief(c, p)) };
    case "search_certifications": {
      const q = String(input.query ?? "").toLowerCase();
      const rows = certifications.filter((c) => (!input.career || c.careers.includes(String(input.career))) && (!input.free_only || c.cost.free) && (!q || [c.name, c.provider, c.category, c.summary, ...c.careers].join(" ").toLowerCase().includes(q)));
      return { url: "/certifications", certifications: (rows.length ? rows : certifications).slice(0, 10).map((c) => ({ name: c.name, provider: c.provider, category: c.category, level: c.level, cost: c.cost.display, costStatus: c.cost.status, duration: c.duration, why: c.why, official: c.url, careers: c.careers })) };
    }
    case "get_guide": {
      const g = getGuide(String(input.topic));
      return g ? { title: g.title, content: g.body, sources: g.sources ?? [] } : { error: "Unknown topic" };
    }
    case "get_my_recommendations": {
      if (!profile) return { profile: null, note: "Student is not signed in or has no profile. Answer generally and suggest creating a profile at /profile." };
      const c = profileCompletion(profile);
      if (!p) return { profileCompletion: c.percent, missing: c.missing, note: "Profile too incomplete for personalised matches; suggest completing it at /profile." };
      const r = buildRecommendations(p);
      return {
        profileCompletion: c.percent,
        missing: c.missing.slice(0, 5),
        universities: r.universities.map((x) => ({ name: x.item.name, url: `/universities/${x.item.slug}`, match: x.match.score, why: x.why })),
        scholarships: r.scholarships.map((x) => ({ title: x.item.title, url: `/opportunities/${x.item.slug}`, match: x.match.score, eligible: x.match.eligible, deadline: x.item.deadline.timing })),
        competitions: r.competitions.map((x) => ({ title: x.item.title, url: `/opportunities/${x.item.slug}`, match: x.match.score })),
        internships: r.internships.map((x) => ({ title: x.item.title, url: `/opportunities/${x.item.slug}`, match: x.match.score })),
        careers: r.careers.map((x) => ({ title: x.item.title, url: `/careers/${x.item.slug}`, match: x.match.score, strong: x.match.strong, develop: x.match.develop.map((d) => d.name) })),
        skills: r.skills.map((s) => ({ skill: s.skill.name, for: s.forCareers })),
      };
    }
    case "upcoming_deadlines": {
      const m = Math.min(Math.max(Number(input?.months) || 3, 1), 12);
      return {
        planner: planner.filter((a) => a.deadline),
        opportunities: opportunities.filter((o) => !o.slug.startsWith("em-") && (monthsAhead(o.deadline.months) ?? 99) < m && o.deadline.months.length < 12).slice(0, 20).map((o) => ({ title: o.title, url: `/opportunities/${o.slug}`, timing: o.deadline.timing })),
        universities: universities.filter((u) => u.deadlines.some((d) => (monthsAhead(d.months) ?? 99) < m)).slice(0, 20).map((u) => ({ name: u.name, url: `/universities/${u.slug}`, deadlines: u.deadlines.filter((d) => (monthsAhead(d.months) ?? 99) < m).map((d) => `${d.label}: ${d.timing}`) })),
      };
    }
    default:
      return { error: "Unknown tool" };
  }
}

export const DATASET_SUMMARY = () => `${universities.length} universities in ${new Set(universities.map((u) => u.country)).size} countries, ${opportunities.length} opportunities, ${careers.length} careers`;

/**
 * Pre-fetch the data a question most likely needs, so the model can usually answer in ONE call
 * (no tool round-trips). Tools stay available for anything this misses.
 */
export function prefetchContext(question: string, profile: StudentProfile | null, planner: Planner) {
  const s = question.toLowerCase();
  const e = parseEntities(question);
  const p = profile && isProfileReady(profile) ? profile : null;
  const pack: Record<string, unknown> = {};
  if (e.universities.length) pack.universities = e.universities.slice(0, 4).map((u) => uniBrief(u, p));
  if (e.opportunities.length) pack.opportunities = e.opportunities.slice(0, 3).map((o) => oppBrief(o, p));
  if (e.careers.length) pack.careers = e.careers.slice(0, 2).map((c) => careerBrief(c, p));
  const guide = GUIDES.find((g) => g.match.test(s));
  if (guide) pack.guide = { title: guide.title, content: guide.body, sources: guide.sources ?? [] };
  const wantsUnis = /universit|college|study in|where (can|should) i study/.test(s);
  if (!e.universities.length && (wantsUnis || e.countries.length || e.ielts || e.cheap || e.fullNeed) && !e.types.length) {
    pack.universitySearch = runTool("search_universities", { countries: e.countries, regions: e.countries.length ? undefined : e.regions, fields: e.fields, level: e.level ?? undefined, max_ielts: e.ielts ?? undefined, max_tuition_usd: e.cheap ? 15000 : undefined, full_need_aid: e.fullNeed, max_qs_rank: e.topN ?? undefined, limit: 8 }, profile, planner);
  }
  if (e.types.length && !e.opportunities.length) {
    pack.opportunitySearch = runTool("search_opportunities", { types: e.types, host_countries: e.countries, fields: e.fields, level: e.school ? "high-school" : e.level ?? undefined, fully_funded: e.funded, limit: 8 }, profile, planner);
  }
  if (p && /\b(i|me|my|mine)\b/.test(s)) pack.myRecommendations = runTool("get_my_recommendations", {}, profile, planner);
  if (/certif|course|credential|upskill|micro-?credential|learn online/.test(s)) pack.certifications = runTool("search_certifications", { career: e.careers[0]?.slug }, profile, planner);
  if (/deadline|due|upcoming|this month|next month|closing/.test(s)) pack.deadlines = runTool("upcoming_deadlines", { months: 3 }, profile, planner);
  return pack;
}
