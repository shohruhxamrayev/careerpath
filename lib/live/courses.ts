/**
 * The full Coursera course catalogue (25,000+ courses) from Coursera's public catalogue API
 * (https://api.coursera.org/api/courses.v1). Server-only; cached for 24 hours.
 * Each course links to its page on coursera.org.
 */

import type { Course } from "./course-meta";
export { COURSE_DOMAINS, langName, type Course } from "./course-meta";

/** Universities and employers students recognise — used only to order results. */
const WELL_KNOWN = [
  "Stanford University", "Yale University", "Princeton University", "University of Pennsylvania", "Duke University", "Johns Hopkins University",
  "University of Michigan", "University of Illinois Urbana-Champaign", "Imperial College London", "University of London", "University of Toronto",
  "DeepLearning.AI", "Google", "Google Cloud", "IBM", "Meta", "Microsoft", "Amazon Web Services", "Salesforce", "Adobe", "Intuit",
  "École Polytechnique Fédérale de Lausanne", "The Hong Kong University of Science and Technology", "Peking University", "Universidad de los Andes",
  "Macquarie University", "Erasmus University Rotterdam", "Copenhagen Business School", "HEC Paris", "ESSEC Business School", "IE Business School",
  "University of Colorado Boulder", "University of California, Irvine", "University of California San Diego", "Northwestern University", "Rice University",
  "Vanderbilt University", "Emory University", "Columbia University", "The University of Chicago", "Wharton School of the University of Pennsylvania",
];
const RANK = new Map(WELL_KNOWN.map((p, i) => [p, i]));

const API = "https://api.coursera.org/api/courses.v1";
const FIELDS = "name,slug,partnerIds,workload,domainTypes,primaryLanguages,certificates";
export const COURSES_REVALIDATE = 24 * 60 * 60;

interface RawPage {
  elements: { id: string; slug: string; name: string; workload?: string; partnerIds?: string[]; domainTypes?: { domainId: string; subdomainId: string }[]; primaryLanguages?: string[]; certificates?: string[] }[];
  paging?: { total?: number };
  linked?: { "partners.v1"?: { id: string; name: string }[] };
}

function normalise(pages: (RawPage | null)[]): Course[] {
  const partners = new Map<string, string>();
  pages.forEach((p) => p?.linked?.["partners.v1"]?.forEach((x) => partners.set(x.id, x.name)));
  const seen = new Set<string>();
  const out: Course[] = [];
  for (const p of pages)
    for (const e of p?.elements ?? []) {
      if (!e.slug || seen.has(e.id)) continue;
      seen.add(e.id);
      const dt = e.domainTypes?.[0];
      out.push({
        id: e.id,
        name: e.name.trim(),
        url: `https://www.coursera.org/learn/${e.slug}`,
        partner: (e.partnerIds ?? []).map((id) => partners.get(id)).filter(Boolean).join(" & ") || "Coursera",
        workload: (e.workload ?? "").trim(),
        domain: dt?.domainId ?? "other",
        subdomain: dt?.subdomainId ?? "",
        lang: e.primaryLanguages?.[0] ?? "en",
        certificate: (e.certificates ?? []).includes("VerifiedCert"),
      });
    }
  return out;
}

let memo: { at: number; courses: Course[] } | null = null;

async function getPage(start: number): Promise<RawPage | null> {
  try {
    const res = await fetch(`${API}?start=${start}&limit=1000&fields=${FIELDS}&includes=partnerIds`, {
      headers: { Accept: "application/json", "User-Agent": "CareerPath course finder (+https://careerpath-dusky.vercel.app)" },
      next: { revalidate: COURSES_REVALIDATE },
      signal: AbortSignal.timeout(15000),
    });
    return res.ok ? ((await res.json()) as RawPage) : null;
  } catch {
    return null;
  }
}

export async function getCourses(): Promise<Course[]> {
  if (memo && Date.now() - memo.at < COURSES_REVALIDATE * 1000) return memo.courses;
  if (process.env.COURSES_FIXTURE) {
    const { readFile } = await import("fs/promises");
    const files = process.env.COURSES_FIXTURE.split(",");
    const pages = await Promise.all(files.map(async (f) => JSON.parse(await readFile(f, "utf8")) as RawPage));
    memo = { at: Date.now(), courses: normalise(pages) };
    return memo.courses;
  }
  const first = await getPage(0);
  const total = Math.min(first?.paging?.total ?? 26000, 40000);
  const rest = await Promise.all(Array.from({ length: Math.ceil(total / 1000) - 1 }, (_, i) => getPage((i + 1) * 1000)));
  const courses = normalise([first, ...rest]);
  if (courses.length) memo = { at: Date.now(), courses };
  return courses;
}

export interface CourseQuery {
  q?: string;
  domain?: string;
  lang?: string;
  certificate?: boolean;
  offset?: number;
  limit?: number;
}

export function searchCourses(all: Course[], f: CourseQuery) {
  const words = (f.q ?? "").toLowerCase().split(/\s+/).filter((w) => w.length > 1);
  const list = all.filter((c) => {
    if (f.domain && c.domain !== f.domain) return false;
    if (f.lang && c.lang !== f.lang) return false;
    if (f.certificate && !c.certificate) return false;
    if (words.length) {
      const hay = `${c.name} ${c.partner} ${c.subdomain.replace(/-/g, " ")}`.toLowerCase();
      if (!words.every((w) => hay.includes(w))) return false;
    }
    return true;
  });
  const score = (c: Course) => {
    let s = RANK.has(c.partner) ? 100 - RANK.get(c.partner)! : 0;
    const n = c.name.toLowerCase();
    if (words.length && words.every((w) => n.includes(w))) s += 120;
    if (words.length && n.startsWith(words[0])) s += 30;
    if (c.lang === "en") s += 5;
    return s;
  };
  list.sort((a, b) => score(b) - score(a) || a.name.localeCompare(b.name));
  const offset = Math.max(0, f.offset ?? 0);
  const limit = Math.min(Math.max(1, f.limit ?? 48), 100);
  const domains: Record<string, number> = {};
  for (const c of list) domains[c.domain] = (domains[c.domain] ?? 0) + 1;
  return { total: list.length, results: list.slice(offset, offset + limit), domains };
}
