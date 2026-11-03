import raw from "./research/onet-occupations.json";
import type { OccRow } from "./occupation-meta";
export { JOB_ZONES, RIASEC, money, onetUrl, type OccRow } from "./occupation-meta";

/**
 * Every occupation in O*NET 31.0 (U.S. Department of Labor, CC BY 4.0) with
 * BLS Employment Projections 2025–35 (median pay, growth, openings, typical entry education).
 * Server-only: import from server components and API routes, not client components.
 */
export interface Occupation {
  code: string;
  slug: string;
  title: string;
  family: string;
  description: string;
  tasks: string[];
  skills: [string, number][];
  knowledge: [string, number][];
  interests: string[];
  education: [string, number][];
  zone: number | null;
  altTitles: string[];
  related: string[];
  bls: null | {
    soc: string;
    emp: number | null; // thousands, 2025
    growth: number | null; // percent, 2025–35
    openings: number | null; // thousands per year
    wage: number | null; // USD median annual, 2025
    edu: string | null;
    exp: string | null;
    ooh: string | null;
  };
}

export const occupations = raw as unknown as Occupation[];
const bySlug = new Map(occupations.map((o) => [o.slug, o]));
const byCode = new Map(occupations.map((o) => [o.code, o]));
export const getOccupation = (slug: string) => bySlug.get(slug);
export const getOccupationByCode = (code: string) => byCode.get(code);

export const OCC_FAMILIES = Array.from(new Set(occupations.map((o) => o.family))).sort();

/** Compact rows for the directory (keeps the client payload small). */
export function occupationIndex(): OccRow[] {
  return occupations.map((o) => [o.slug, o.title, o.family, o.bls?.wage ?? null, o.bls?.growth ?? null, o.zone, o.altTitles.slice(0, 5).join(" · ")]);
}

export function searchOccupations(q: string, f: { family?: string; zone?: number; limit?: number } = {}) {
  const words = q.toLowerCase().split(/\s+/).filter((w) => w.length > 1);
  return occupations
    .filter((o) => (!f.family || o.family === f.family) && (!f.zone || o.zone === f.zone))
    .map((o) => {
      const t = o.title.toLowerCase();
      const hay = `${t} ${o.altTitles.join(" ").toLowerCase()} ${o.family.toLowerCase()}`;
      if (words.length && !words.every((w) => hay.includes(w))) return null;
      const score = (words.every((w) => t.includes(w)) ? 50 : 0) + (o.tasks.length ? 5 : 0) + (o.bls?.openings ?? 0) / 100;
      return { o, score };
    })
    .filter((x): x is { o: Occupation; score: number } => !!x)
    .sort((a, b) => b.score - a.score)
    .slice(0, f.limit ?? 10)
    .map((x) => x.o);
}


/** Hand-matched O*NET occupations for each curated CareerPath career. */
export const CAREER_OCCUPATIONS: Record<string, string[]> = {
  "business-analyst": ["13-1111.00", "15-2051.01", "15-2031.00"],
  "financial-analyst": ["13-2051.00", "13-2099.01", "13-2041.00", "13-2052.00"],
  economist: ["19-3011.00", "19-3011.01", "13-2051.00"],
  "software-engineer": ["15-1252.00", "15-1254.00", "15-1253.00"],
  "product-manager": ["11-3021.00", "15-1299.09", "13-1082.00"],
  "marketing-specialist": ["13-1161.00", "11-2021.00", "27-3031.00", "11-2011.00"],
  "data-analyst": ["15-2051.01", "15-2041.00", "15-2051.00", "15-2031.00"],
  "management-consultant": ["13-1111.00", "11-1021.00", "13-1082.00"],
  entrepreneur: ["11-1011.00", "11-1021.00", "11-2022.00"],
  researcher: ["19-3022.00", "19-1042.00", "15-1221.00", "19-4061.00"],
  "ux-designer": ["15-1255.00", "27-1024.00", "15-1254.00"],
  "policy-analyst": ["19-3094.00", "19-3011.00", "19-3051.00", "11-9161.00"],
  "ai-ml-engineer": ["15-2051.00", "15-1221.00", "15-1252.00"],
  "investment-banker": ["13-2051.00", "41-3031.00", "11-3031.03", "11-3031.00"],
  diplomat: ["19-3094.00", "27-3031.00", "27-3091.00"],
  architect: ["17-1011.00", "17-1012.00", "19-3051.00", "11-9041.00"],
  physician: ["29-1215.00", "29-1216.00", "29-1214.00", "29-1221.00"],
  lawyer: ["23-1011.00", "23-1012.00", "23-2011.00"],
  "cybersecurity-analyst": ["15-1212.00", "15-1299.05", "15-1299.04", "15-1299.06"],
  "cloud-engineer": ["15-1241.00", "15-1299.08", "15-1244.00", "15-1243.00"],
  accountant: ["13-2011.00", "13-2082.00", "11-3031.01"],
  "civil-engineer": ["17-2051.00", "17-2081.00", "17-3022.00"],
  "mechanical-engineer": ["17-2141.00", "17-3027.00", "11-9041.00"],
  teacher: ["25-2031.00", "25-2021.00", "25-9031.00", "13-1151.00"],
  journalist: ["27-3023.00", "27-3041.00", "27-3043.00", "27-2012.00"],
  "sustainability-specialist": ["13-1199.05", "11-1011.03", "19-2041.00", "17-2081.00"],
};
export const occupationsForCareer = (slug: string) => (CAREER_OCCUPATIONS[slug] ?? []).map(getOccupationByCode).filter((o): o is Occupation => !!o);

/** Pulls a job name out of questions like "how do I become a nurse?" or "what does an actuary earn". */
export function jobFromQuestion(s: string): string | null {
  const m = s.toLowerCase().match(/(?:become|becoming|be|career as|work as|working as|job as|jobs? for|what (?:does|do|is)|salary (?:of|for)|pay (?:of|for)|how much (?:does|do|is)|about being|about the job of)\s+(?:an?\s+|the\s+)?([a-z][a-z\- ]{2,40}?)(?:\s+(?:do|does|earn|earns|make|makes|need|needs|get paid|study|job|career|salary)\b|[?.!,]|$)/);
  if (!m) return null;
  const q = m[1].replace(/\b(good|successful|professional|certified|licensed)\b/g, "").trim();
  return q.length >= 3 && !/^(it|that|this|career|job|good|you|me|i)$/.test(q) ? q : null;
}
export const guidedCareerFor = (code: string) => Object.entries(CAREER_OCCUPATIONS).find(([, codes]) => codes.includes(code))?.[0];
