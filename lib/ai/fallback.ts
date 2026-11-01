import { careers } from "@/lib/data/careers";
import { opportunities } from "@/lib/data/opportunities";
import { MONTHS } from "@/lib/data/taxonomy";
import { universities } from "@/lib/data/universities";
import { matchOpportunity } from "@/lib/matching/opportunity";
import { describeStudent, englishAsIelts, isProfileReady, profileCompletion, workMonths } from "@/lib/matching/profile";
import { rankCareers, rankOpportunities, rankUniversities } from "@/lib/matching/recommend";
import { matchUniversity } from "@/lib/matching/university";
import type { Application, OpportunityType, StudentProfile } from "@/lib/types";
import { daysUntil, formatDate, monthsAhead } from "@/lib/utils";

/*
 * Rule-based Path Assistant.
 * Answers common planning questions using the platform's own verified dataset and matching engine.
 * Used whenever no AI key is configured, or if the AI request fails — so the assistant never breaks.
 */

export type Intent = "scholarships" | "universities" | "competitions" | "internships" | "careers" | "improve" | "plan" | "deadlines" | "item" | "help";

export function detectIntent(q: string): Intent {
  const s = q.toLowerCase();
  if (findItem(s)) return "item";
  if (/(\d+[- ]?month|roadmap|timeline|plan\b|schedule|step[- ]by[- ]step)/.test(s)) return "plan";
  if (/improve|weak|strengthen my|before applying|better chance|gap/.test(s) && !/competition/.test(s)) return "improve";
  if (/scholarship|funding|fully funded|financial aid|grant/.test(s)) return "scholarships";
  if (/compet|olympiad|hackathon|contest|prize/.test(s)) return "competitions";
  if (/intern|job|work experience|summer/.test(s)) return "internships";
  if (/career|job title|profession|what should i become|fit my interests/.test(s)) return "careers";
  if (/deadline|due|when should|upcoming/.test(s)) return "deadlines";
  if (/universit|college|school|where (should|can) i study|admission|apply to/.test(s)) return "universities";
  return "help";
}

function findItem(s: string) {
  for (const u of universities) {
    const names = [u.name, u.shortName].filter(Boolean).map((n) => n!.toLowerCase());
    if (names.some((n) => n.length > 2 && new RegExp(`\\b${n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`).test(s))) return { kind: "university" as const, slug: u.slug };
  }
  const GENERIC = new Set(["global", "united", "international", "national", "world", "student", "summer"]);
  for (const o of opportunities) {
    const short = o.title.toLowerCase().split(/[—(:]/)[0].trim();
    if (short.length > 4 && s.includes(short)) return { kind: "opportunity" as const, slug: o.slug };
  }
  for (const o of opportunities) {
    const first = o.title.toLowerCase().split(/[^a-zà-ÿ-]+/)[0];
    if (first.length >= 6 && !GENERIC.has(first) && new RegExp(`\\b${first}\\b`).test(s)) return { kind: "opportunity" as const, slug: o.slug };
  }
  return null;
}

const link = (title: string, href: string) => `[${title}](${href})`;

export function fallbackAnswer(question: string, profile: StudentProfile | null, applications: Application[] = []): string {
  const ready = !!profile && isProfileReady(profile);
  const intent = detectIntent(question);
  const who = ready ? describeStudent(profile!) : "";
  const intro = ready && who ? `Based on your profile as ${who}:\n\n` : "";
  const nudge = ready ? "" : "\n\n_Tip: [complete your profile](/profile) and I can check eligibility and rank these for you personally._";

  switch (intent) {
    case "item": {
      const it = findItem(question.toLowerCase())!;
      if (it.kind === "university") {
        const u = universities.find((x) => x.slug === it.slug)!;
        const lines = [
          `### ${u.name}`,
          `${u.overview}`,
          ``,
          `- **Location:** ${u.city}, ${u.country}`,
          `- **English:** ${u.english.ielts ? `about IELTS ${u.english.ielts}` : "minimum not captured"} — ${u.english.note}`,
          `- **Testing:** ${u.testing.note}`,
          `- **Tuition:** ${u.tuition.display}`,
          `- **Aid:** ${u.aid.summary}`,
          ...u.deadlines.map((d) => `- **${d.label}:** ${d.timing}`),
        ];
        if (ready) {
          const m = matchUniversity(profile!, u);
          lines.push("", `**Your Profile Match: ${m.score}%** — ${m.reason}`);
          const warns = m.checks.filter((c) => c.status === "warn" || c.status === "fail").slice(0, 3);
          if (warns.length) lines.push("", "Worth checking:", ...warns.map((c) => `- ${c.label}${c.detail ? ` (${c.detail})` : ""}`));
        }
        lines.push("", `Confirm everything on the ${link("official admissions page", u.admissionsUrl)} · ${link("Full profile on CareerPath", `/universities/${u.slug}`)}`);
        return lines.join("\n") + nudge;
      }
      const o = opportunities.find((x) => x.slug === it.slug)!;
      const lines = [`### ${o.title}`, o.overview, "", "**Requirements:**", ...o.requirements.map((r) => `- ${r.text}`), "", `- **Funding:** ${o.funding.summary}`, `- **Deadline:** ${o.deadline.timing}`];
      if (ready) {
        const m = matchOpportunity(profile!, o);
        lines.push("", m.eligible === false ? `**Based on your profile you don't currently meet every requirement.** ${m.reason}` : `**Your Profile Match: ${m.score}%** — ${m.reason}`);
      }
      lines.push("", `${link("Official website", o.officialUrl)} · ${link("Details on CareerPath", `/opportunities/${o.slug}`)}`);
      return lines.join("\n") + nudge;
    }

    case "scholarships":
      return intro + listOpportunities(profile, ready, ["scholarship"], "scholarships", 5) + nudge;
    case "competitions":
      return intro + listOpportunities(profile, ready, ["competition"], "competitions", 4) + "\n\nCompetitions are strongest when they connect to your intended field — one or two done well beat many done briefly." + nudge;
    case "internships":
      return intro + listOpportunities(profile, ready, ["internship", "job", "summer-program", "volunteering"], "internships and programmes", 5) + nudge;

    case "universities": {
      if (!ready) {
        const top = [...universities].filter((u) => u.qsRank2026).sort((a, b) => a.qsRank2026! - b.qsRank2026!).slice(0, 5);
        return `Here are some highly ranked universities in our dataset (QS 2026):\n\n${top.map((u) => `- ${link(u.name, `/universities/${u.slug}`)} — ${u.city}, ${u.country}. ${u.aid.summary}`).join("\n")}\n\nRanking alone isn't a good way to choose. Fit with your field, budget and English level matters more.${nudge}`;
      }
      const ranked = rankUniversities(profile!).filter((r) => r.match.eligible !== false);
      const top = ranked.slice(0, 5);
      const access = ranked.filter((r) => r.item.selectivity === "moderate" || r.item.selectivity === "accessible").slice(0, 2);
      return (
        intro +
        `### Universities to consider\n${top.map((r) => `- **${link(r.item.name, `/universities/${r.item.slug}`)}** (${r.item.country}) — ${r.match.score}% Profile Match. ${r.match.reason}`).join("\n")}\n\n` +
        (access.length ? `### Balance your list\nInclude options that are less selective too:\n${access.map((r) => `- ${link(r.item.name, `/universities/${r.item.slug}`)} — ${r.match.score}% match`).join("\n")}\n\n` : "") +
        `Profile Match is informational and based on published criteria — it doesn't predict admission.`
      );
    }

    case "careers": {
      const ranked = ready ? rankCareers(profile!).slice(0, 3) : careers.slice(0, 4).map((c) => ({ item: c, match: null }));
      return (
        intro +
        `### Careers that fit\n` +
        ranked
          .map((r) =>
            r.match
              ? `- **${link(r.item.title, `/careers/${r.item.slug}`)}** — ${r.match.score}% Career Match.\n  Strong: ${r.match.strong.slice(0, 3).join(", ") || "—"}. Develop: ${r.match.develop.slice(0, 3).map((d) => d.name).join(", ") || "—"}.`
              : `- ${link(r.item.title, `/careers/${r.item.slug}`)} — ${r.item.summary}`,
          )
          .join("\n") +
        `\n\nTry one small project or competition in your top career before committing — it's the fastest way to test fit.` +
        nudge
      );
    }

    case "improve": {
      if (!profile) return `Create a profile first and I'll compare it with real requirements. In general, the biggest levers are: a strong English score, consistent grades, two or three meaningful activities with measurable impact, and a clear story connecting them to your goals.${nudge}`;
      const out: string[] = [];
      const c = profileCompletion(profile);
      if (c.percent < 80) out.push(`- **Complete your profile (${c.percent}%).** Missing: ${c.missing.slice(0, 3).join("; ").toLowerCase()}.`);
      const eng = englishAsIelts(profile);
      if (!eng) out.push("- **Take an English test.** Most international programmes ask for IELTS 6.5–7.0 or equivalent.");
      else if (eng.band < 7) out.push(`- **Raise your English score.** ${eng.from} meets many requirements, but selective universities and scholarships often expect IELTS 7.0+.`);
      if (profile.education.seeking === "undergraduate" && profile.tests.sat == null && profile.tests.act == null && profile.goals.countries.includes("United States")) out.push("- **Plan for the SAT/ACT.** Several US universities in our data require it.");
      if (profile.activities.length < 3) out.push("- **Deepen your extracurriculars.** Aim for 2–3 activities where you can show leadership or results with numbers.");
      if (profile.education.seeking === "masters" && workMonths(profile) < 24) out.push("- **Build work experience.** Programmes such as Chevening require about two years.");
      if (ready) {
        const dev = rankCareers(profile)[0];
        if (dev?.match.develop.length) out.push(`- **Build skills for ${dev.item.title}:** ${dev.match.develop.slice(0, 3).map((d) => d.name).join(", ")}.`);
        const nearMiss = rankOpportunities(profile, ["scholarship"]).filter((r) => r.match.eligible === false).slice(0, 2);
        if (nearMiss.length) out.push(`- **Unlock more scholarships.** Currently blocked: ${nearMiss.map((r) => `${r.item.title} (${r.match.checks.find((x) => x.status === "fail")?.label.toLowerCase()})`).join("; ")}.`);
      }
      return `${intro}### What to improve before applying\n${out.length ? out.join("\n") : "- Your profile already covers the main requirements we track. Focus on essays and recommendation letters."}`;
    }

    case "plan": {
      const months = Number(question.match(/(\d+)\s*-?\s*month/i)?.[1] ?? 6);
      const n = Math.min(Math.max(months, 3), 12);
      const now = new Date();
      const targets = ready
        ? [...rankOpportunities(profile!, ["scholarship"]).filter((r) => r.match.eligible !== false).slice(0, 2).map((r) => ({ name: r.item.title, months: r.item.deadline.months, timing: r.item.deadline.timing })),
           ...rankUniversities(profile!).filter((r) => r.match.eligible !== false).slice(0, 2).map((r) => ({ name: r.item.name, months: r.item.deadlines[0]?.months ?? [], timing: r.item.deadlines[0]?.timing ?? "" }))]
        : [];
      const phases = [
        "Shortlist 6–10 universities/programmes and 3–5 scholarships. Confirm every deadline on official sites and add them to your [planner](/planner).",
        "Book your English test (and SAT/ACT or GRE/GMAT if needed). Start weekly practice.",
        "Draft your personal statement and activity list. Ask two teachers or managers for recommendations.",
        "Take your test; retake if below target. Revise essays with feedback.",
        "Finalise documents: transcripts, translations, passport, financial documents.",
        "Submit applications ahead of deadlines. Prepare for interviews.",
        "Follow up on missing documents; apply for remaining scholarships.",
        "Compare offers and funding; plan visas and accommodation.",
      ];
      const rows: string[] = [];
      for (let i = 0; i < n; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
        const label = `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
        const due = targets.filter((t) => t.months.includes(d.getMonth() + 1)).map((t) => t.name);
        const phase = phases[Math.min(Math.floor((i / n) * phases.length), phases.length - 1)];
        rows.push(`**${label}** — ${phase}${due.length ? ` _Typical deadline window: ${due.join(", ")}._` : ""}`);
      }
      return `${intro}### Your ${n}-month application plan\n${rows.map((r, i) => `${i + 1}. ${r}`).join("\n")}\n\n${targets.length ? `Built around your top matches: ${targets.map((t) => t.name).join(", ")}. ` : ""}Deadline windows are typical patterns from previous cycles — confirm exact dates before relying on them.${nudge}`;
    }

    case "deadlines": {
      const mine = applications.filter((a) => a.deadline && daysUntil(a.deadline) >= 0).sort((a, b) => a.deadline!.localeCompare(b.deadline!)).slice(0, 5);
      const pool = ready ? rankOpportunities(profile!).filter((r) => r.match.eligible !== false).map((r) => r.item) : opportunities;
      const soon = pool.filter((o) => (monthsAhead(o.deadline.months) ?? 99) <= 2 && o.deadline.months.length < 12).slice(0, 5);
      return (
        (mine.length ? `### In your planner\n${mine.map((a) => `- **${a.title}** — ${formatDate(a.deadline!)}`).join("\n")}\n\n` : "") +
        `### Typically due in the next ~2 months\n${soon.length ? soon.map((o) => `- ${link(o.title, `/opportunities/${o.slug}`)} — ${o.deadline.timing}`).join("\n") : "- Nothing in our data typically closes in the next two months."}\n\nThese are typical windows from previous cycles. Always confirm the current date on the official site.${nudge}`
      );
    }

    default:
      return `I can help you plan with CareerPath's verified data. Try asking:\n\n- What scholarships am I eligible for?\n- What universities should I consider?\n- What competitions would strengthen my profile?\n- What career fits my interests?\n- What should I improve before applying?\n- Build me a 6-month application plan.\n\nYou can also ask about a specific university or programme by name, for example “Tell me about Chevening”.${nudge}`;
  }
}

function listOpportunities(profile: StudentProfile | null, ready: boolean, types: OpportunityType[], noun: string, n: number) {
  if (!ready) {
    const list = opportunities.filter((o) => types.includes(o.type)).slice(0, n);
    return `Some ${noun} in our dataset:\n\n${list.map((o) => `- ${link(o.title, `/opportunities/${o.slug}`)} — ${o.summary} _${o.deadline.timing}._`).join("\n")}`;
  }
  const ranked = rankOpportunities(profile!, types);
  const ok = ranked.filter((r) => r.match.eligible === true).slice(0, n);
  const check = ranked.filter((r) => r.match.eligible === null).slice(0, Math.max(0, n - ok.length));
  const no = ranked.filter((r) => r.match.eligible === false);
  let out = "";
  if (ok.length) out += `### You appear eligible for\n${ok.map((r) => `- **${link(r.item.title, `/opportunities/${r.item.slug}`)}** — ${r.match.score}% match. ${r.match.reason} _${r.item.deadline.timing}._`).join("\n")}\n\n`;
  if (check.length) out += `### Likely eligible — some rules need checking\n${check.map((r) => `- ${link(r.item.title, `/opportunities/${r.item.slug}`)} — ${r.match.score}% match. ${r.item.deadline.timing}.`).join("\n")}\n\n`;
  if (!ok.length && !check.length) out += `I couldn't find ${noun} you clearly qualify for right now.\n\n`;
  if (no.length) out += `Not currently eligible for ${no.length} other ${noun} (for example ${no.slice(0, 2).map((r) => r.item.title).join(", ")}). Check each one's page for the specific rule.\n\n`;
  out += `Eligibility is checked against published rules; selection is always decided by the programme.`;
  return out;
}

/** Compact, non-sensitive context sent to the AI model so it can reason over verified data. */
export function buildAIContext(profile: StudentProfile | null, applications: Application[]) {
  if (!profile || !isProfileReady(profile)) {
    return { profile: null, note: "The student has not completed a profile." };
  }
  const p = profile;
  return {
    profile: {
      level: p.education.level, seeking: p.education.seeking, field: p.education.field, major: p.education.major,
      graduationYear: p.education.graduationYear, gpa: p.education.gpa != null ? `${p.education.gpa}/${p.education.gpaScale}` : null,
      country: p.personal.country, age: p.personal.age, tests: p.tests, skills: p.skills, interests: p.interests,
      activities: p.activities.map((a) => `${a.type}: ${a.title}${a.role ? ` (${a.role})` : ""}${a.months ? `, ${a.months} months` : ""}`),
      goals: p.goals, funding: p.finance,
    },
    topUniversities: rankUniversities(p).slice(0, 6).map((r) => ({ name: r.item.name, url: `/universities/${r.item.slug}`, match: r.match.score, reason: r.match.reason, english: r.item.english, deadlines: r.item.deadlines.map((d) => `${d.label}: ${d.timing} (${d.source.status})`), tuition: r.item.tuition.display, aid: r.item.aid.summary })),
    topOpportunities: rankOpportunities(p).slice(0, 10).map((r) => ({ title: r.item.title, url: `/opportunities/${r.item.slug}`, type: r.item.type, match: r.match.score, eligible: r.match.eligible, reason: r.match.reason, deadline: r.item.deadline.timing, requirements: r.item.requirements.map((x) => x.text) })),
    topCareers: rankCareers(p).slice(0, 4).map((r) => ({ title: r.item.title, url: `/careers/${r.item.slug}`, match: r.match.score, strong: r.match.strong, develop: r.match.develop.map((d) => d.name) })),
    planner: applications.map((a) => ({ title: a.title, status: a.status, deadline: a.deadline ?? null })),
  };
}
