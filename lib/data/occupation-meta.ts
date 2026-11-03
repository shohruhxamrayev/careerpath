/* Client-safe constants and helpers for occupations. */

export const JOB_ZONES: Record<number, { label: string; detail: string }> = {
  1: { label: "Little or no preparation", detail: "Usually a high school diploma or less; a few days to a few months of training." },
  2: { label: "Some preparation", detail: "Usually a high school diploma; some previous work experience or training helps." },
  3: { label: "Medium preparation", detail: "Usually vocational training, an associate's degree or an apprenticeship." },
  4: { label: "Considerable preparation", detail: "Usually a bachelor's degree and several years of related experience." },
  5: { label: "Extensive preparation", detail: "Usually a graduate degree (master's, PhD, MD, JD) and extensive experience." },
};

export const RIASEC: Record<string, string> = {
  Realistic: "Hands-on work with tools, machines, plants or animals",
  Investigative: "Ideas, research and solving problems",
  Artistic: "Creating, designing and self-expression",
  Social: "Helping, teaching and caring for people",
  Enterprising: "Leading, persuading and starting things",
  Conventional: "Organising data, details and procedures",
};

export const onetUrl = (code: string) => `https://www.onetonline.org/link/summary/${code}`;

/** Compact row for the directory (keeps the client payload small). */
export type OccRow = [slug: string, title: string, family: string, wage: number | null, growth: number | null, zone: number | null, alt: string];
export const money = (n: number | null | undefined) => (n == null ? "—" : `$${Math.round(n).toLocaleString("en-US")}`);
