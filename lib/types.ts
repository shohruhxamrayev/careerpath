// ───────────────────────── Shared domain types ─────────────────────────

/** Verification state for any time-sensitive fact. */
export type VerificationStatus =
  | "verified" // checked against the official source on `lastVerified`
  | "indicative" // reasonable general guidance; exact figure changes by cycle/program
  | "unverified"; // not yet checked for the current cycle — always confirm

export interface Source {
  org: string;
  url: string;
  status: VerificationStatus;
  /** ISO month, e.g. "2026-11". Only set when status is "verified". */
  lastVerified?: string;
  note?: string;
}

export type Region =
  | "North America"
  | "United Kingdom"
  | "Europe"
  | "East Asia"
  | "Southeast Asia"
  | "Central Asia"
  | "Middle East"
  | "Oceania";

export type DegreeLevel = "undergraduate" | "masters" | "phd";
export type StudentLevel = "high-school" | "undergraduate" | "masters" | "phd" | "graduate";

export type TuitionBand = "under-5k" | "5-15k" | "15-30k" | "30-50k" | "50k-plus";

export type AidForInternational =
  | "need-based-full" // meets full demonstrated need for international students
  | "need-based-limited"
  | "merit"
  | "government" // mainly via state/government scholarship programs
  | "limited";

export type Selectivity = "most" | "high" | "moderate" | "accessible";

export type Field =
  | "business"
  | "economics"
  | "finance"
  | "computer-science"
  | "data-science"
  | "engineering"
  | "mathematics"
  | "natural-sciences"
  | "medicine-health"
  | "law"
  | "politics-ir"
  | "social-sciences"
  | "humanities"
  | "arts-design"
  | "education"
  | "environment"
  | "architecture"
  | "media-communications";

export interface DeadlineInfo {
  label: string; // e.g. "Regular Decision"
  timing: string; // human description, e.g. "Typically early January"
  months: number[]; // 1–12, months the deadline typically falls in (for filters/planning)
  source: Source;
}

export interface University {
  slug: string;
  name: string;
  shortName?: string;
  country: string;
  countryCode: string;
  city: string;
  region: Region;
  website: string;
  admissionsUrl: string;
  applicationPlatform?: { name: string; url: string };
  type: "public" | "private";
  founded?: number;
  overview: string;
  levels: DegreeLevel[];
  fields: Field[];
  notablePrograms: string[];
  languageOfInstruction: string;
  selectivity: Selectivity;
  qsRank?: number;
  /** [latitude, longitude] for the globe */
  geo?: [number, number];
  tuition: { band: TuitionBand | null; display: string; source: Source };
  aid: { kind: AidForInternational; summary: string; source: Source };
  english: { ielts?: number; toefl?: number; note: string; source: Source };
  testing: { policy: "required" | "optional" | "not-used" | "varies"; note: string; source: Source };
  deadlines: DeadlineInfo[];
  internationalNote: string;
  scholarshipSlugs?: string[]; // links to opportunities
}

export type OpportunityType =
  | "scholarship"
  | "competition"
  | "internship"
  | "fellowship"
  | "exchange"
  | "summer-program"
  | "volunteering"
  | "conference"
  | "job"
  | "grant";

export type Requirement =
  | { kind: "level"; levels: StudentLevel[]; text: string }
  | { kind: "age"; min?: number; max?: number; text: string }
  | { kind: "english"; ielts?: number; toefl?: number; text: string }
  | { kind: "gpa"; min4: number; text: string }
  | { kind: "work"; minMonths: number; text: string }
  | { kind: "nationality"; include?: string[]; exclude?: string[]; text: string }
  | { kind: "field"; fields: Field[]; text: string }
  | { kind: "other"; text: string };

export interface Opportunity {
  slug: string;
  title: string;
  organization: string;
  type: OpportunityType;
  summary: string;
  overview: string;
  fields: Field[] | "any";
  levels: StudentLevel[];
  format: "in-person" | "online" | "hybrid";
  location: string;
  hostCountries: string[];
  funding: { kind: "fully-funded" | "partial" | "paid" | "prize" | "unpaid" | "varies"; summary: string };
  requirements: Requirement[];
  applicationSteps: string[];
  deadline: DeadlineInfo;
  officialUrl: string;
  source: Source;
  tags: string[];
}

export interface Career {
  slug: string;
  title: string;
  family: string;
  summary: string;
  whatItIs: string;
  dayToDay: string[];
  keySkills: string[]; // skill slugs
  relatedFields: Field[];
  interests: Interest[];
  educationPaths: string[];
  entryRoles: string[];
  extracurriculars: string[];
  opportunitySlugs: string[];
  resources: { title: string; provider: string; url: string; free: boolean }[];
  majors: string[];
  outlook: string;
}

export interface Skill {
  slug: string;
  name: string;
  category: "technical" | "analytical" | "communication" | "leadership" | "creative";
  summary: string;
  whyItMatters: string;
  howToStart: string[];
  resources: { title: string; provider: string; url: string; free: boolean }[];
  aliases: string[];
}

export type Interest =
  | "business"
  | "economics"
  | "finance"
  | "technology"
  | "science"
  | "politics"
  | "arts"
  | "design"
  | "health"
  | "law"
  | "education"
  | "environment"
  | "media"
  | "entrepreneurship"
  | "social-impact"
  | "research";

// ───────────────────────── Student profile ─────────────────────────

export type ActivityType =
  | "club"
  | "leadership"
  | "volunteering"
  | "competition"
  | "project"
  | "research"
  | "work";

export interface Activity {
  id: string;
  type: ActivityType;
  title: string;
  organization?: string;
  role?: string;
  description?: string;
  months?: number;
}

export interface StudentProfile {
  personal: { name: string; country: string; city: string; age: number | null };
  education: {
    institution: string;
    level: StudentLevel | "";
    seeking: DegreeLevel | "";
    field: Field | "";
    major: string;
    graduationYear: number | null;
    gpa: number | null;
    gpaScale: 4 | 5 | 10 | 100;
  };
  tests: {
    ielts: number | null;
    toefl: number | null;
    duolingo: number | null;
    sat: number | null;
    act: number | null;
    gre: number | null;
    gmat: number | null;
    other: string;
  };
  skills: { technical: string[]; soft: string[]; languages: string[] };
  activities: Activity[];
  interests: Interest[];
  goals: { careers: string[]; industries: string[]; countries: string[] };
  finance: { need: "full" | "partial" | "self" | ""; budgetUSD: number | null };
  updatedAt?: string;
}

// ───────────────────────── Planner ─────────────────────────

export type ItemKind = "university" | "opportunity" | "career";

export type ApplicationStatus = "interested" | "preparing" | "applied" | "interview" | "accepted" | "rejected";

export interface SavedItem {
  id: string;
  kind: ItemKind;
  slug: string;
  savedAt: string;
}

export interface Application {
  id: string;
  kind: "university" | "opportunity" | "custom";
  slug?: string;
  title: string;
  subtitle?: string;
  status: ApplicationStatus;
  deadline?: string; // ISO date the student entered/confirmed
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PlannerTask {
  id: string;
  title: string;
  due?: string; // ISO date
  done: boolean;
  applicationId?: string;
  createdAt: string;
}

export interface UserAccount {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}
