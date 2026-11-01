import { careers } from "@/lib/data/careers";
import { opportunities } from "@/lib/data/opportunities";
import { getSkill } from "@/lib/data/skills";
import { universities } from "@/lib/data/universities";
import type { Career, Opportunity, OpportunityType, Skill, StudentProfile, University } from "@/lib/types";
import { matchCareer, type CareerMatch } from "./career";
import { matchOpportunity } from "./opportunity";
import { describeStudent } from "./profile";
import type { MatchResult } from "./types";
import { matchUniversity } from "./university";

export interface Rec<T, M = MatchResult> {
  item: T;
  match: M;
  why: string;
}

export interface Recommendations {
  universities: Rec<University>[];
  scholarships: Rec<Opportunity>[];
  competitions: Rec<Opportunity>[];
  internships: Rec<Opportunity>[];
  other: Rec<Opportunity>[];
  careers: Rec<Career, CareerMatch>[];
  skills: { skill: Skill; forCareers: string[]; why: string }[];
}

function whyPrefix(p: StudentProfile) {
  const d = describeStudent(p);
  return d ? `Recommended because you are ${d}` : "Recommended for your profile";
}

export function rankUniversities(p: StudentProfile) {
  return universities
    .map((u) => ({ item: u, match: matchUniversity(p, u) }))
    .sort((a, b) => b.match.score - a.match.score);
}

export function rankOpportunities(p: StudentProfile, types?: OpportunityType[]) {
  return opportunities
    .filter((o) => !types || types.includes(o.type))
    .map((o) => ({ item: o, match: matchOpportunity(p, o) }))
    .sort((a, b) => (b.match.eligible === false ? -1 : 0) - (a.match.eligible === false ? -1 : 0) || b.match.score - a.match.score);
}

export function rankCareers(p: StudentProfile) {
  return careers.map((c) => ({ item: c, match: matchCareer(p, c) })).sort((a, b) => b.match.score - a.match.score);
}

export function buildRecommendations(p: StudentProfile): Recommendations {
  const prefix = whyPrefix(p);
  const withWhy = <T,>(r: { item: T; match: MatchResult }): Rec<T> => ({
    ...r,
    why: `${prefix}. ${r.match.reason}`,
  });

  const unis = rankUniversities(p).filter((r) => r.match.eligible !== false).slice(0, 6).map(withWhy);
  const opps = rankOpportunities(p).filter((r) => r.match.eligible !== false);
  const pick = (t: OpportunityType[], n: number) => opps.filter((r) => t.includes(r.item.type)).slice(0, n).map(withWhy);

  const careerRecs = rankCareers(p)
    .slice(0, 4)
    .map((r) => ({ ...r, why: `Matches your ${r.match.strong.slice(0, 2).join(" and ").toLowerCase() || "profile"}.` }));

  const skillCount = new Map<string, string[]>();
  for (const c of careerRecs.slice(0, 3)) {
    for (const d of c.match.develop) skillCount.set(d.slug, [...(skillCount.get(d.slug) ?? []), c.item.title]);
  }
  const skills = Array.from(skillCount.entries())
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 5)
    .map(([slug, forCareers]) => ({
      skill: getSkill(slug)!,
      forCareers,
      why: `Important for ${forCareers.join(" and ")}, and not yet on your profile.`,
    }))
    .filter((s) => s.skill);

  return {
    universities: unis,
    scholarships: pick(["scholarship"], 6),
    competitions: pick(["competition"], 4),
    internships: pick(["internship", "job"], 4),
    other: pick(["fellowship", "exchange", "summer-program", "volunteering", "conference", "grant"], 4),
    careers: careerRecs,
    skills,
  };
}
