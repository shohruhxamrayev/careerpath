/**
 * Live internships and entry-level jobs from public job APIs. Server-only.
 * Every listing links straight to its original posting and credits its source.
 *  - The Muse      https://www.themuse.com/developers/api/v2  (Internship + Entry Level)
 *  - Arbeitnow     https://www.arbeitnow.com/api/job-board-api (Europe/Germany; filtered to student roles)
 *  - Jobicy        https://jobicy.com/jobs-rss-feed            (remote; entry-level only)
 * Results are cached for 6 hours (Next.js data cache), so the APIs are called a few times a day.
 */

export type LiveLevel = "internship" | "entry";
export type LiveSource = "The Muse" | "Arbeitnow" | "Jobicy";

export interface LiveJob {
  id: string;
  title: string;
  company: string;
  location: string;
  remote: boolean;
  level: LiveLevel;
  category: string;
  url: string;
  source: LiveSource;
  posted: string; // ISO date
  salary?: string;
}

export const LIVE_SOURCES: Record<LiveSource, { url: string; note: string }> = {
  "The Muse": { url: "https://www.themuse.com", note: "Internship and entry-level roles, mostly US and Europe" },
  Arbeitnow: { url: "https://www.arbeitnow.com", note: "Student, intern and junior roles in Europe (mostly Germany)" },
  Jobicy: { url: "https://jobicy.com", note: "Remote entry-level roles" },
};

export const REVALIDATE_SECONDS = 6 * 60 * 60;
const UA = "CareerPath student job board (+https://careerpath-dusky.vercel.app)";

async function getJSON<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": UA, Accept: "application/json" },
      next: { revalidate: REVALIDATE_SECONDS },
      signal: AbortSignal.timeout(9000),
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

const strip = (s: string) => s.replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
const isRemote = (s: string) => /remote|flexible|anywhere|worldwide/i.test(s);

/* ---------- The Muse ---------- */
interface MuseJob {
  id: number;
  name: string;
  publication_date: string;
  locations: { name: string }[];
  categories: { name: string }[];
  levels: { name: string; short_name: string }[];
  refs: { landing_page: string };
  company: { name: string };
}
async function fromMuse(): Promise<LiveJob[]> {
  const pages = [
    ...[1, 2, 3, 4, 5, 6].map((p) => `https://www.themuse.com/api/public/jobs?level=Internship&page=${p}`),
    ...[1, 2, 3, 4].map((p) => `https://www.themuse.com/api/public/jobs?level=Entry%20Level&page=${p}`),
  ];
  const all = await Promise.all(pages.map((u) => getJSON<{ results: MuseJob[] }>(u)));
  return all.flatMap((r) => r?.results ?? []).map((j) => {
    const loc = j.locations.map((l) => l.name).join(" · ") || "Not specified";
    return {
      id: `muse-${j.id}`,
      title: strip(j.name),
      company: j.company?.name ?? "—",
      location: loc,
      remote: isRemote(loc),
      level: j.levels.some((l) => l.short_name === "internship") ? "internship" : "entry",
      category: j.categories[0]?.name ?? "Other",
      url: j.refs.landing_page,
      source: "The Muse",
      posted: j.publication_date,
    } satisfies LiveJob;
  });
}

/* ---------- Arbeitnow ---------- */
interface ArbeitJob {
  slug: string;
  company_name: string;
  title: string;
  remote: boolean;
  url: string;
  tags: string[];
  job_types: string[];
  location: string;
  created_at: number;
}
const STUDENT_RE = /\b(intern(ship)?|praktik|werkstudent|working student|student|trainee|graduate|junior|entry|einsteiger|absolvent|azubi|ausbildung|apprentice)/i;
async function fromArbeitnow(): Promise<LiveJob[]> {
  const all = await Promise.all([1, 2, 3, 4, 5].map((p) => getJSON<{ data: ArbeitJob[] }>(`https://www.arbeitnow.com/api/job-board-api?page=${p}`)));
  return all
    .flatMap((r) => r?.data ?? [])
    .filter((j) => STUDENT_RE.test(j.title) || j.job_types?.some((t) => /intern|student|praktik/i.test(t)))
    .map((j) => ({
      id: `arbeitnow-${j.slug}`,
      title: strip(j.title),
      company: j.company_name,
      location: j.remote ? `${j.location} · Remote` : j.location,
      remote: !!j.remote,
      level: /intern|praktik|werkstudent|working student|student|azubi|ausbildung|apprentice/i.test(j.title) ? "internship" : "entry",
      category: j.tags?.[0] ?? "Other",
      url: j.url,
      source: "Arbeitnow",
      posted: new Date(j.created_at * 1000).toISOString(),
    }));
}

/* ---------- Jobicy ---------- */
interface JobicyJob {
  id: number;
  url: string;
  jobTitle: string;
  companyName: string;
  jobIndustry: string[];
  jobGeo: string;
  jobLevel: string;
  pubDate: string;
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency?: string;
  salaryPeriod?: string;
}
async function fromJobicy(): Promise<LiveJob[]> {
  const r = await getJSON<{ jobs: JobicyJob[] }>("https://jobicy.com/api/v2/remote-jobs?count=100");
  return (r?.jobs ?? [])
    .filter((j) => /entry/i.test(j.jobLevel) || STUDENT_RE.test(j.jobTitle))
    .map((j) => ({
      id: `jobicy-${j.id}`,
      title: strip(j.jobTitle),
      company: j.companyName,
      location: `Remote · ${j.jobGeo}`,
      remote: true,
      level: /intern/i.test(j.jobTitle) ? "internship" : "entry",
      category: strip(j.jobIndustry?.[0] ?? "Other"),
      url: j.url,
      source: "Jobicy",
      posted: j.pubDate,
      salary: j.salaryMin && j.salaryMax ? `${j.salaryCurrency ?? ""} ${j.salaryMin.toLocaleString("en")}–${j.salaryMax.toLocaleString("en")}${j.salaryPeriod ? ` / ${j.salaryPeriod.replace("ly", "")}` : ""}`.trim() : undefined,
    }));
}

export interface LiveJobsResult {
  jobs: LiveJob[];
  fetchedAt: string;
  counts: Record<LiveSource, number>;
}

export async function getLiveJobs(): Promise<LiveJobsResult> {
  // Local testing only: a saved snapshot, since sandboxes often can't reach the job APIs.
  if (process.env.LIVE_JOBS_FIXTURE) {
    const { readFile } = await import("fs/promises");
    return JSON.parse(await readFile(process.env.LIVE_JOBS_FIXTURE, "utf8")) as LiveJobsResult;
  }
  const [muse, arbeit, jobicy] = await Promise.all([fromMuse(), fromArbeitnow(), fromJobicy()]);
  const seen = new Set<string>();
  const jobs = [...muse, ...arbeit, ...jobicy]
    .filter((j) => j.url && !seen.has(j.id) && (seen.add(j.id), true))
    .sort((a, b) => b.posted.localeCompare(a.posted));
  return {
    jobs,
    fetchedAt: new Date().toISOString(),
    counts: { "The Muse": muse.length, Arbeitnow: arbeit.length, Jobicy: jobicy.length },
  };
}

/** Simple keyword/level/remote search used by the advisor. */
export function filterLiveJobs(jobs: LiveJob[], f: { query?: string; level?: LiveLevel; remote?: boolean; location?: string; limit?: number }) {
  const words = (f.query ?? "").toLowerCase().split(/\s+/).filter((w) => w.length > 1);
  return jobs
    .filter((j) => (!f.level || j.level === f.level) && (!f.remote || j.remote))
    .filter((j) => !f.location || j.location.toLowerCase().includes(f.location.toLowerCase()))
    .filter((j) => {
      if (!words.length) return true;
      const hay = `${j.title} ${j.company} ${j.category}`.toLowerCase();
      return words.every((w) => hay.includes(w));
    })
    .slice(0, f.limit ?? 10);
}
