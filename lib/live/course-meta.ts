/* Client-safe types and labels for the course finder. */

export interface Course {
  id: string;
  name: string;
  url: string;
  partner: string;
  workload: string;
  domain: string;
  subdomain: string;
  lang: string;
  certificate: boolean;
}

export const COURSE_DOMAINS: Record<string, string> = {
  "computer-science": "Computer science",
  "data-science": "Data science & AI",
  "information-technology": "IT & cloud",
  business: "Business",
  "physical-science-and-engineering": "Engineering & physical sciences",
  "life-sciences": "Health & life sciences",
  "social-sciences": "Social sciences",
  "arts-and-humanities": "Arts & humanities",
  "math-and-logic": "Maths & logic",
  "personal-development": "Personal development",
  "language-learning": "Languages",
};

const LANGS: Record<string, string> = { en: "English", es: "Spanish", fr: "French", ar: "Arabic", "pt-BR": "Portuguese", ru: "Russian", zh: "Chinese", "zh-CN": "Chinese", de: "German", ja: "Japanese", ko: "Korean", id: "Indonesian", it: "Italian", tr: "Turkish", hi: "Hindi", uk: "Ukrainian", vi: "Vietnamese", kk: "Kazakh" };
export const langName = (l: string) => LANGS[l] ?? l;

