import { careers } from "@/lib/data/careers";
import { opportunities } from "@/lib/data/opportunities";
import { skills } from "@/lib/data/skills";
import { FIELD_LABELS, FIELDS, OPPORTUNITY_TYPE_LABELS, REGIONS, TUITION_BAND_MAX } from "@/lib/data/taxonomy";
import { universities } from "@/lib/data/universities";
import { matchCareer } from "@/lib/matching/career";
import { matchOpportunity } from "@/lib/matching/opportunity";
import { isProfileReady } from "@/lib/matching/profile";
import { matchUniversity } from "@/lib/matching/university";
import type { Career, DegreeLevel, Field, Opportunity, OpportunityType, Region, StudentProfile, University } from "@/lib/types";
import { monthsAhead } from "@/lib/utils";

/*
 * Data tools shared by the offline advisor and the AI advisor (Claude tool use).
 * Everything here reads CareerPath's sourced dataset — nothing is invented.
 */

// ───────────── entity parsing ─────────────

const COUNTRY_ALIASES: Record<string, string> = {
  uk: "United Kingdom", britain: "United Kingdom", england: "United Kingdom", scotland: "United Kingdom", "united kingdom": "United Kingdom", british: "United Kingdom",
  us: "United States", usa: "United States", america: "United States", "united states": "United States", american: "United States", states: "United States",
  korea: "South Korea", "south korea": "South Korea", korean: "South Korea",
  turkey: "Türkiye", türkiye: "Türkiye", turkiye: "Türkiye", turkish: "Türkiye",
  holland: "Netherlands", netherlands: "Netherlands", dutch: "Netherlands",
  uae: "United Arab Emirates", emirates: "United Arab Emirates", dubai: "United Arab Emirates", "abu dhabi": "United Arab Emirates",
  germany: "Germany", german: "Germany", france: "France", french: "France", italy: "Italy", italian: "Italy", spain: "Spain", spanish: "Spain",
  japan: "Japan", japanese: "Japan", china: "China", chinese: "China", "hong kong": "Hong Kong SAR", singapore: "Singapore", malaysia: "Malaysia",
  canada: "Canada", canadian: "Canada", australia: "Australia", australian: "Australia", "new zealand": "New Zealand",
  switzerland: "Switzerland", swiss: "Switzerland", sweden: "Sweden", swedish: "Sweden", norway: "Norway", denmark: "Denmark", finland: "Finland",
  hungary: "Hungary", hungarian: "Hungary", poland: "Poland", polish: "Poland", czech: "Czechia", czechia: "Czechia", austria: "Austria", belgium: "Belgium", ireland: "Ireland",
  uzbekistan: "Uzbekistan", tashkent: "Uzbekistan", uzbek: "Uzbekistan", kazakhstan: "Kazakhstan", taiwan: "Taiwan", qatar: "Qatar", "saudi arabia": "Saudi Arabia", india: "India", russia: "Russia", estonia: "Estonia", portugal: "Portugal",
};

const TYPE_WORDS: [RegExp, OpportunityType][] = [
  [/scholarship|funding|fully funded|grant to study/, "scholarship"],
  [/competition|olympiad|hackathon|contest|challenge/, "competition"],
  [/internship|intern\b/, "internship"],
  [/fellowship/, "fellowship"],
  [/exchange/, "exchange"],
  [/summer (school|program)/, "summer-program"],
  [/volunteer/, "volunteering"],
  [/conference|model un|\bmun\b|forum|summit/, "conference"],
  [/\bjob\b|graduate (programme|program|role)|entry[- ]level/, "job"],
  [/research grant|\bgrant\b/, "grant"],
];

const FIELD_WORDS: [RegExp, Field][] = [
  [/computer science|\bcs\b|software|programming|coding|\bai\b|artificial intelligence|machine learning/, "computer-science"],
  [/data science|data analy|statistics/, "data-science"],
  [/business|management|\bmba\b|marketing/, "business"],
  [/economics|econ\b/, "economics"],
  [/finance|banking|accounting|investment/, "finance"],
  [/engineering|mechanical|electrical|civil engineer/, "engineering"],
  [/medicine|medical|health|nursing|pharmacy|biomed/, "medicine-health"],
  [/\blaw\b|legal/, "law"],
  [/international relations|politic|diplomac|public policy/, "politics-ir"],
  [/math/, "mathematics"],
  [/physics|chemistry|biology|natural science/, "natural-sciences"],
  [/architecture/, "architecture"],
  [/design|\bart\b|arts\b/, "arts-design"],
  [/environment|climate|sustainab|energy/, "environment"],
  [/education|teaching/, "education"],
  [/journalism|media|communication/, "media-communications"],
  [/history|philosophy|literature|humanities|linguistic/, "humanities"],
  [/psychology|sociology|social science/, "social-sciences" as Field],
];

export interface Entities {
  universities: University[];
  opportunities: Opportunity[];
  careers: Career[];
  countries: string[];
  regions: Region[];
  types: OpportunityType[];
  fields: Field[];
  level: DegreeLevel | null;
  school: boolean;
  ielts: number | null;
  funded: boolean;
  cheap: boolean;
  noTest: boolean;
  fullNeed: boolean;
  topN: number | null;
}

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const UNI_GENERIC = new Set(["university", "college", "institute", "state", "national"]);

export function parseEntities(q: string): Entities {
  const s = ` ${q.toLowerCase().replace(/[’']/g, "'")} `;
  const uniHits: { u: University; at: number }[] = [];
  for (const u of universities) {
    const names = [u.name, u.shortName, u.name.replace(/^(the )?university of /i, ""), u.name.replace(/ university$/i, "")]
      .filter((n): n is string => !!n && n.length > 2 && !UNI_GENERIC.has(n.toLowerCase()))
      .map((n) => n.toLowerCase());
    for (const n of Array.from(new Set(names))) {
      const re = new RegExp(`(^|[^a-z])${esc(n)}([^a-z]|$)`);
      const m = s.match(re);
      if (m && m.index !== undefined) {
        // short acronyms must be written as words, e.g. "MIT", "UCL"
        if (n.length <= 4 && !new RegExp(`\\b${esc(n)}\\b`, "i").test(q)) continue;
        uniHits.push({ u, at: m.index });
        break;
      }
    }
  }
  const GENERIC = new Set(["global", "united", "international", "national", "world", "student", "summer", "young", "future", "open", "google", "microsoft"]);
  const oppHits: { o: Opportunity; at: number; strong: boolean; first: string }[] = [];
  const COUNTRY_WORDS = new Set(Object.keys(COUNTRY_ALIASES).concat(["europe", "asia", "africa", "stem", "online", "global"]));
  for (const o of opportunities) {
    const full = o.title.toLowerCase();
    const short = full.split(/[—(:]/)[0].trim();
    const first = full.split(/[^a-zà-ÿ-]+/)[0];
    const cands = [full, short, ...o.tags.filter((t) => t.length > 3 && /[A-Z]/.test(t) && !COUNTRY_WORDS.has(t.toLowerCase())).map((t) => t.toLowerCase())];
    let at = -1;
    for (const c of cands) {
      const m = c.length > 3 ? s.match(new RegExp(`(^|[^a-z])${esc(c)}([^a-z]|$)`)) : null;
      if (m?.index !== undefined) { at = m.index; break; }
    }
    let strong = at >= 0;
    if (at < 0 && first.length >= 6 && !GENERIC.has(first) && !COUNTRY_WORDS.has(first)) {
      const m = s.match(new RegExp(`\\b${esc(first)}\\b`));
      if (m?.index !== undefined) at = m.index;
      strong = false;
    }
    if (at >= 0) oppHits.push({ o, at, strong, first });
  }
  // a loose first-word hit ("chevening") only counts if nothing with that word matched strongly; keep the shortest title
  const keptOpps = oppHits.filter((h) => {
    if (h.strong) return true;
    if (oppHits.some((x) => x.strong && x.first === h.first)) return false;
    return !oppHits.some((x) => !x.strong && x.first === h.first && opportunities.indexOf(x.o) < opportunities.indexOf(h.o));
  });
  const careerHits = careers.filter((c) =>
    [c.title.toLowerCase().split(/[/(]/)[0].trim(), ...c.entryRoles.map((r) => r.toLowerCase().replace(/^(junior|graduate|trainee|summer) /, ""))].some((t) => t.length > 4 && s.includes(t)),
  );

  const countries = new Set<string>();
  for (const [k, v] of Object.entries(COUNTRY_ALIASES)) if (new RegExp(`[^a-z]${esc(k)}[^a-z]`).test(s)) countries.add(v);
  const regions = REGIONS.filter((r) => s.includes(r.toLowerCase()) || (r === "Europe" && /\beurope(an)?\b/.test(s)) || (r === "East Asia" && /\basia\b/.test(s) && !/central asia|southeast asia/.test(s)));
  const types = Array.from(new Set(TYPE_WORDS.filter(([re]) => re.test(s)).map(([, t]) => t)));
  const fields = Array.from(new Set(FIELD_WORDS.filter(([re]) => re.test(s)).map(([, f]) => f))).filter((f) => FIELDS.includes(f));
  const level: DegreeLevel | null = /\bphd\b|doctora/.test(s) ? "phd" : /master|\bmsc\b|\bma\b|\bmba\b|postgrad|graduate school/.test(s) ? "masters" : /bachelor|undergrad|\bbsc\b|\bba\b|high school|freshman|first[- ]year/.test(s) ? "undergraduate" : null;
  const ielts = Number(s.match(/ielts\s*(?:of|score|band)?\s*([4-9](?:\.[05])?)/)?.[1] ?? s.match(/([4-9]\.[05])\s*(?:in\s*)?ielts/)?.[1] ?? NaN);
  const topN = Number(s.match(/\btop\s*(\d{1,3})\b/)?.[1] ?? NaN);

  return {
    universities: uniHits.sort((a, b) => a.at - b.at).map((x) => x.u).filter((u, i, a) => a.indexOf(u) === i),
    opportunities: keptOpps.sort((a, b) => a.at - b.at).map((x) => x.o).filter((o, i, a) => a.indexOf(o) === i),
    careers: careerHits,
    countries: Array.from(countries),
    regions,
    types,
    fields,
    level,
    school: /high[- ]school|secondary school|school students|pupils|grade (9|10|11|12)|teen/.test(s),
    ielts: Number.isFinite(ielts) ? ielts : null,
    funded: /fully funded|full funding|full scholarship|free tuition|full ride|fully-funded/.test(s),
    cheap: /cheap|low[- ]cost|low tuition|affordable|tuition[- ]free|no tuition|free universit|budget/.test(s),
    noTest: /no sat|without sat|test[- ]optional|no ielts|without ielts|without (an )?english test/.test(s),
    fullNeed: /full need|need[- ]blind|meet(s)? (full|100%)|financial aid for international/.test(s),
    topN: Number.isFinite(topN) ? topN : null,
  };
}

// ───────────── searches ─────────────

export interface UniFilters {
  query?: string;
  countries?: string[];
  regions?: string[];
  fields?: Field[];
  level?: DegreeLevel | null;
  maxIelts?: number | null;
  maxTuitionUsd?: number | null;
  fullNeed?: boolean;
  noTest?: boolean;
  maxQsRank?: number | null;
  limit?: number;
}

export function searchUniversities(f: UniFilters, profile?: StudentProfile | null) {
  const q = f.query?.toLowerCase().trim();
  let rows = universities.filter((u) => {
    if (f.countries?.length && !f.countries.some((c) => c.toLowerCase() === u.country.toLowerCase())) return false;
    if (f.regions?.length && !f.regions.includes(u.region)) return false;
    if (f.fields?.length && !f.fields.some((x) => u.fields.includes(x))) return false;
    if (f.level && !u.levels.includes(f.level)) return false;
    if (f.maxIelts != null && (u.english.ielts == null || u.english.ielts > f.maxIelts)) return false;
    if (f.maxTuitionUsd != null && (!u.tuition.band || TUITION_BAND_MAX[u.tuition.band] > f.maxTuitionUsd)) return false;
    if (f.fullNeed && u.aid.kind !== "need-based-full") return false;
    if (f.noTest && u.testing.policy === "required") return false;
    if (f.maxQsRank != null && (!u.qsRank || u.qsRank > f.maxQsRank)) return false;
    if (q && ![u.name, u.shortName, u.city, u.country, u.overview, ...u.notablePrograms].join(" ").toLowerCase().includes(q)) return false;
    return true;
  });
  const ready = !!profile && isProfileReady(profile);
  const scored = rows.map((u) => ({ u, m: ready ? matchUniversity(profile!, u) : null }));
  scored.sort((a, b) => (b.m?.score ?? 0) - (a.m?.score ?? 0) || (a.u.qsRank ?? 999) - (b.u.qsRank ?? 999));
  rows = scored.map((x) => x.u);
  return scored.slice(0, f.limit ?? 8);
}

export interface OppFilters {
  query?: string;
  types?: OpportunityType[];
  hostCountries?: string[];
  fields?: Field[];
  level?: string | null;
  fullyFunded?: boolean;
  closingWithinMonths?: number | null;
  eligibleOnly?: boolean;
  limit?: number;
}

export function searchOpportunities(f: OppFilters, profile?: StudentProfile | null) {
  const q = f.query?.toLowerCase().trim();
  const ready = !!profile && isProfileReady(profile);
  const rows = opportunities
    .filter((o) => {
      if (f.types?.length && !f.types.includes(o.type)) return false;
      if (f.hostCountries?.length && !f.hostCountries.some((c) => o.hostCountries.some((h) => h.toLowerCase() === c.toLowerCase()) || o.location.toLowerCase().includes(c.toLowerCase()))) return false;
      if (f.fields?.length && o.fields !== "any" && !f.fields.some((x) => (o.fields as Field[]).includes(x))) return false;
      if (f.level) {
        const lv = f.level === "undergraduate" ? ["high-school", "undergraduate"] : f.level === "masters" ? ["undergraduate", "graduate", "masters"] : [f.level];
        if (!o.levels.some((l) => lv.includes(l))) return false;
      }
      if (f.fullyFunded && o.funding.kind !== "fully-funded") return false;
      if (f.closingWithinMonths != null && ((monthsAhead(o.deadline.months) ?? 99) > f.closingWithinMonths || o.deadline.months.length >= 12)) return false;
      if (q && ![o.title, o.organization, o.summary, o.location, ...o.tags].join(" ").toLowerCase().includes(q)) return false;
      return true;
    })
    .map((o) => ({ o, m: ready ? matchOpportunity(profile!, o) : null }))
    .filter((x) => !f.eligibleOnly || x.m?.eligible !== false);
  rows.sort((a, b) => {
    if (a.m && b.m) {
      const ea = a.m.eligible === false ? 0 : 1;
      const eb = b.m.eligible === false ? 0 : 1;
      if (ea !== eb) return eb - ea;
      return b.m.score - a.m.score;
    }
    return (monthsAhead(a.o.deadline.months) ?? 99) - (monthsAhead(b.o.deadline.months) ?? 99);
  });
  return rows.slice(0, f.limit ?? 8);
}

export function searchCareers(query: string, profile?: StudentProfile | null) {
  const q = query.toLowerCase();
  const ready = !!profile && isProfileReady(profile);
  return careers
    .filter((c) => !q || [c.title, c.family, c.summary, ...c.majors].join(" ").toLowerCase().includes(q))
    .map((c) => ({ c, m: ready ? matchCareer(profile!, c) : null }))
    .sort((a, b) => (b.m?.score ?? 0) - (a.m?.score ?? 0));
}

// ───────────── briefs for the AI model ─────────────

export function uniBrief(u: University, profile?: StudentProfile | null) {
  const ready = !!profile && isProfileReady(profile);
  const m = ready ? matchUniversity(profile!, u) : null;
  return {
    name: u.name, url: `/universities/${u.slug}`, slug: u.slug, city: u.city, country: u.country, type: u.type,
    qsRank2027: u.qsRank ?? null, selectivity: u.selectivity, levels: u.levels, fields: u.fields.map((f) => FIELD_LABELS[f]),
    notablePrograms: u.notablePrograms, overview: u.overview,
    tuition: { display: u.tuition.display, status: u.tuition.source.status },
    aid: { kind: u.aid.kind, summary: u.aid.summary, status: u.aid.source.status },
    english: { ielts: u.english.ielts ?? null, toefl: u.english.toefl ?? null, note: u.english.note, status: u.english.source.status },
    testing: { policy: u.testing.policy, note: u.testing.note, status: u.testing.source.status },
    deadlines: u.deadlines.map((d) => ({ label: d.label, timing: d.timing, status: d.source.status })),
    internationalNote: u.internationalNote,
    officialAdmissions: u.admissionsUrl,
    profileMatch: m ? { score: m.score, eligible: m.eligible, reason: m.reason, checks: m.checks.map((c) => `${c.status}: ${c.label}${c.detail ? ` (${c.detail})` : ""}`) } : null,
  };
}

export function oppBrief(o: Opportunity, profile?: StudentProfile | null) {
  const ready = !!profile && isProfileReady(profile);
  const m = ready ? matchOpportunity(profile!, o) : null;
  return {
    title: o.title, url: `/opportunities/${o.slug}`, slug: o.slug, type: OPPORTUNITY_TYPE_LABELS[o.type], organization: o.organization,
    summary: o.summary, overview: o.overview, location: o.location, format: o.format, levels: o.levels,
    funding: o.funding, requirements: o.requirements.map((r) => r.text), steps: o.applicationSteps,
    deadline: { timing: o.deadline.timing, status: o.deadline.source.status }, official: o.officialUrl, verification: o.source.status,
    profileMatch: m ? { score: m.score, eligible: m.eligible, reason: m.reason, checks: m.checks.map((c) => `${c.status}: ${c.label}`) } : null,
  };
}

export function careerBrief(c: Career, profile?: StudentProfile | null) {
  const ready = !!profile && isProfileReady(profile);
  const m = ready ? matchCareer(profile!, c) : null;
  return {
    title: c.title, url: `/careers/${c.slug}`, summary: c.summary, dayToDay: c.dayToDay, majors: c.majors,
    keySkills: c.keySkills.map((s) => skills.find((x) => x.slug === s)?.name ?? s), educationPaths: c.educationPaths,
    entryRoles: c.entryRoles, outlook: c.outlook, opportunities: c.opportunitySlugs.map((s) => `/opportunities/${s}`),
    careerMatch: m ? { score: m.score, strong: m.strong, develop: m.develop.map((d) => d.name) } : null,
  };
}

export function datasetStats() {
  return {
    universities: universities.length,
    countries: new Set(universities.map((u) => u.country)).size,
    opportunities: opportunities.length,
    careers: careers.length,
  };
}
