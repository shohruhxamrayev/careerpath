import { findGuide } from "@/lib/ai/knowledge";
import { careerBrief, datasetStats, parseEntities, searchCareers, searchOpportunities, searchUniversities, type Entities } from "@/lib/ai/tools";
import { careers } from "@/lib/data/careers";
import { certifications } from "@/lib/data/certifications";
import { JOB_ZONES, jobFromQuestion, money, onetUrl, searchOccupations } from "@/lib/data/occupations";
import { opportunities } from "@/lib/data/opportunities";
import { AID_LABELS, FIELD_LABELS, MONTHS, OPPORTUNITY_TYPE_PLURAL, SELECTIVITY_LABELS } from "@/lib/data/taxonomy";
import { universities } from "@/lib/data/universities";
import { matchCareer } from "@/lib/matching/career";
import { matchOpportunity } from "@/lib/matching/opportunity";
import { describeStudent, englishAsIelts, gpaOn4, isProfileReady, profileCompletion, workMonths } from "@/lib/matching/profile";
import { rankCareers, rankOpportunities, rankUniversities } from "@/lib/matching/recommend";
import { matchUniversity } from "@/lib/matching/university";
import { searchAll } from "@/lib/search";
import type { Application, Career, Opportunity, OpportunityType, StudentProfile, University } from "@/lib/types";
import { daysUntil, formatDate, monthsAhead, qsLabel } from "@/lib/utils";

/*
 * Path Assistant — offline advisor.
 * Understands the question (entities + intent), pulls facts from CareerPath's sourced dataset,
 * applies the matching engine to the student's profile and answers like a counsellor would.
 * Used when no AI key is configured, or as a safety net if the AI request fails.
 */

export interface AdvisorReply {
  text: string;
  suggestions: string[];
  sources?: { label: string; url: string }[];
}

const link = (t: string, href: string) => `[${t}](${href})`;
const uLink = (u: University) => link(u.name, `/universities/${u.slug}`);
const oLink = (o: Opportunity) => link(o.title, `/opportunities/${o.slug}`);
const cLink = (c: Career) => link(c.title, `/careers/${c.slug}`);
const statusTag = (s: string) => (s === "verified" ? "✓ verified" : s === "indicative" ? "indicative" : "unverified");

export const STARTER_PROMPTS = [
  "What scholarships am I eligible for?",
  "What universities should I consider?",
  "What competitions would strengthen my profile?",
  "What career fits my interests?",
  "What should I improve before applying?",
  "Build me a 6-month application plan.",
];

export function advise(question: string, profile: StudentProfile | null, applications: Application[] = []): AdvisorReply {
  const q = question.trim();
  const s = q.toLowerCase();
  const ready = !!profile && isProfileReady(profile);
  const p = ready ? profile! : null;
  const e = parseEntities(q);
  const nudge = ready ? "" : "\n\n_[Complete your profile](/profile) and I'll check eligibility and rank options for you personally._";
  const intro = p ? `_Based on your profile as ${describeStudent(p)}._\n\n` : "";

  // ── small talk ──
  if (/^(hi|hello|hey|salom|assalomu|good (morning|evening|afternoon))\b/.test(s) && s.length < 30) {
    return { text: `Hello${profile?.personal.name ? `, ${profile.personal.name.split(" ")[0]}` : ""}! I'm your CareerPath advisor. I can compare universities, check scholarship eligibility, plan deadlines, review your profile and explain essays, tests and visas. What are you working on?`, suggestions: STARTER_PROMPTS.slice(0, 4) };
  }
  if (/^(thanks|thank you|rahmat|thx|great|ok|okay)\b/.test(s) && s.length < 40) {
    return { text: "You're welcome — good luck! Ask any time you want to check a deadline, compare options or plan the next step.", suggestions: ["What deadlines are coming up?", "What should I improve before applying?"] };
  }
  if (/who are you|what can you do|how do you work|are you (an )?ai|what is careerpath/.test(s)) {
    const st = datasetStats();
    return {
      text: `I'm **Path Assistant**, CareerPath's advisor. I work from a sourced dataset of **${st.universities} universities in ${st.countries} countries**, **${st.opportunities} opportunities** and **${st.careers} careers**, plus CareerPath's matching engine.\n\nI can:\n- Find and **compare universities** by country, budget, English level and field\n- **Check eligibility** for scholarships, competitions and internships\n- Explain **essays, recommendation letters, interviews, tests and visas**\n- Build a **month-by-month plan** around real deadline windows\n- Review your **profile gaps** and suggest what to do next\n\nI never predict admission chances, and I'll always point you to the official page to confirm details.`,
      suggestions: STARTER_PROMPTS.slice(0, 4),
    };
  }

  // ── comparisons ──
  const wantsCompare = /\bvs\.?\b|versus|compare|comparison|difference between|better[:,]? .* or |which is better|or .*\?$/.test(s);
  if (wantsCompare && e.universities.length >= 2) return compareUniversities(e.universities.slice(0, 4), p, nudge);
  if (wantsCompare && e.opportunities.length >= 2) return compareOpportunities(e.opportunities.slice(0, 3), p, nudge);
  if (/compare/.test(s) && e.universities.length < 2 && e.opportunities.length < 2) {
    return { text: "Tell me which ones to compare — for example **“Compare Warwick vs Manchester”** or **“Chevening vs Erasmus Mundus”**. I'll put requirements, costs, aid and deadlines side by side.", suggestions: ["Compare Warwick vs Manchester", "Compare Chevening vs Erasmus Mundus", "Compare MIT vs Stanford"] };
  }

  // ── chances ──
  if (/chance|get in|get into|admit me|will i be accepted|probability|odds|can i get accepted/.test(s)) {
    const u = e.universities[0];
    let text = "I can't predict admission — no one honestly can, because decisions depend on the whole applicant pool, essays, recommendations and institutional priorities.\n\nWhat I **can** do is show how well your profile fits the published criteria.";
    if (u && p) {
      const m = matchUniversity(p, u);
      text += `\n\n### ${u.name}\n**Profile Match: ${m.score}%** — ${m.reason}\n\n${m.checks.slice(0, 6).map((c) => `- ${c.status === "pass" ? "✓" : c.status === "fail" ? "✗" : "•"} ${c.label}${c.detail ? ` — ${c.detail}` : ""}`).join("\n")}\n\nSelectivity: **${SELECTIVITY_LABELS[u.selectivity]}**. Treat a highly selective university as an ambitious choice even with a strong match, and balance your list.`;
    } else if (u) text += `\n\n${uLink(u)} is rated **${SELECTIVITY_LABELS[u.selectivity].toLowerCase()}** in our data.`;
    return { text: text + nudge, suggestions: ["How do I build a balanced university list?", "What should I improve before applying?"] };
  }

  // ── "universities in X" style lists come before single-item answers ──
  const uniListAsk = /universit|college/.test(s) && e.universities.length === 0 && (e.countries.length || e.regions.length || e.fields.length || e.ielts || e.cheap || e.fullNeed || e.noTest || e.topN) && !/scholarship|competition|internship/.test(s);
  if (uniListAsk) return universityList(e, s, p, nudge);

  // ── a specific university / opportunity / career ──
  if (e.universities.length === 1 && !(e.types.length && /which|list|all|any/.test(s))) return universityAnswer(e.universities[0], s, p, nudge);
  if (e.opportunities.length >= 1 && e.universities.length === 0) {
    const r = opportunityAnswer(e.opportunities[0], s, p, nudge);
    const g = findGuide(s);
    if (g && g.id === "el-yurt-umidi") return { text: g.body + "\n\n" + r.text.split("\n").filter((l) => /Profile Match|don't currently meet|^- [✗?]|Official website/.test(l)).join("\n"), suggestions: g.followUps, sources: g.sources };
    return r;
  }

  // ── certifications & courses ──
  if (/certif|credential|micro-?credential|online course|which course|courses? (for|to)|upskill/.test(s)) {
    const career = e.careers[0];
    const list = (career ? certifications.filter((c) => c.careers.includes(career.slug)) : certifications.filter((c) => !/Languages/.test(c.category))).slice(0, 7);
    return {
      text: `### Certifications${career ? ` for ${career.title}` : " worth considering"}\n${list.map((c) => `- **${c.name}** (${c.provider}) — ${c.level}, ${c.duration}. **Cost:** ${c.cost.display}${c.cost.status === "verified" ? " ✓" : ""}. ${c.why}`).join("\n")}\n\nEmployers value a certificate most when it's paired with a project that uses the skill. Browse all of them with filters on [Certifications](/certifications${career ? `?career=${career.slug}` : ""}), or search 25,000+ online courses in [Courses](/courses${career ? `?q=${encodeURIComponent(career.title)}` : ""}).`,
      suggestions: ["Free certifications for data analysis", "What skills should I build?", "What career fits my interests?"],
    };
  }

  // ── any occupation in O*NET (pay, tasks, education) ──
  const job = !e.careers.length && !e.universities.length && !e.opportunities.length ? jobFromQuestion(s) : null;
  const occ = job ? searchOccupations(job, { limit: 1 })[0] ?? searchOccupations(job.replace(/s$/, ""), { limit: 1 })[0] : undefined;
  if (occ) {
    const b = occ.bls;
    const facts = [
      b?.wage ? `**US median pay:** ${money(b.wage)} a year (2025)` : null,
      b?.growth != null ? `**Job growth 2025–35:** ${b.growth > 0 ? "+" : ""}${b.growth}% (US)` : null,
      b?.edu || occ.education[0] ? `**Typical entry education:** ${b?.edu ?? occ.education[0][0]}` : null,
      occ.zone ? `**Preparation:** ${occ.zone}/5 — ${JOB_ZONES[occ.zone].label.toLowerCase()}` : null,
    ].filter(Boolean);
    return {
      text: `### ${occ.title}
${occ.description}

${facts.map((f) => `- ${f}`).join("\n")}

${occ.tasks.length ? `**What they do:**\n${occ.tasks.slice(0, 5).map((t) => `- ${t}`).join("\n")}\n\n` : ""}${occ.skills.length ? `**Top skills:** ${occ.skills.slice(0, 5).map((x) => x[0]).join(", ")}.\n\n` : ""}Full profile — tasks, skills, education and related careers: [${occ.title}](/occupations/${occ.slug}). Pay figures are for the United States and differ by country.${nudge}`,
      suggestions: [`Online courses for ${occ.title.toLowerCase()}`, "What career fits my interests?", "What should I study for this?"],
      sources: [{ label: `O*NET ${occ.code}`, url: onetUrl(occ.code) }, ...(b?.ooh ? [{ label: "BLS Occupational Outlook Handbook", url: b.ooh }] : [])],
    };
  }

  // ── knowledge guides (essays, tests, visas, funding, …) ──
  const guide = findGuide(s);
  const listy = /universit|college|school|programme|program|scholarship|competition|internship|fellowship|which|list|show|find|recommend|options/.test(s);
  if (guide && !(listy && guide.id === "choose-country" && e.countries.length)) {
    let text = guide.body;
    if (guide.id === "germany" || (guide.id === "uk-visa" && /universit/.test(s))) {
      const c = guide.id === "germany" ? "Germany" : "United Kingdom";
      const rows = searchUniversities({ countries: [c], limit: 5 }, p);
      if (rows.length) text += `\n\n### ${c} universities in CareerPath\n${rows.map(({ u, m }) => `- ${uLink(u)} — ${u.city}${u.qsRank ? ` · QS ${qsLabel(u)}` : ""}${m ? ` · **${m.score}% match**` : ""}`).join("\n")}`;
    }
    if (guide.id === "english-tests" && e.ielts) {
      const rows = universities.filter((u) => u.english.ielts != null && u.english.ielts <= e.ielts!).sort((a, b) => (a.qsRank ?? 999) - (b.qsRank ?? 999)).slice(0, 8);
      text = `### Universities whose published minimum is IELTS ${e.ielts.toFixed(1)} or lower\n${rows.map((u) => `- ${uLink(u)} (${u.country}) — IELTS ${u.english.ielts!.toFixed(1)}`).join("\n")}\n\nAlways check section minimums and programme-specific requirements on the official page.\n\n` + text;
    }
    if (guide.id === "career" || guide.id === "major") text += careerHint(p);
    return { text, suggestions: guide.followUps, sources: guide.sources };
  }

  // ── filtered searches ──
  const asksUnis = /universit|college|where (can|should) i study|study in|schools? in|campus/.test(s) || ((e.countries.length || e.ielts || e.cheap || e.fullNeed) && !e.types.length && !/career|job/.test(s));
  const anyUniFilter = e.countries.length || e.regions.length || e.fields.length || e.ielts || e.cheap || e.fullNeed || e.noTest || e.topN || e.level;
  if (asksUnis && !/scholarship/.test(s)) return anyUniFilter ? universityList(e, s, p, nudge) : universitiesForMe(p, intro, nudge);
  if (e.types.length && !/improve|plan|deadline/.test(s)) {
    if (/eligible|qualify|can i apply|for me|should i/.test(s) || !(e.countries.length || e.fields.length || e.level || e.school || e.funded)) {
      if (!e.countries.length && !e.fields.length && !e.level && !e.school && !e.funded) return { text: intro + listForMe(p, e.types, OPPORTUNITY_TYPE_PLURAL[e.types[0]].toLowerCase()) + (e.types[0] === "competition" ? "\n\nCompetitions are strongest when they connect to your intended field — one or two done well beat many done briefly." : "") + nudge, suggestions: followUpsFor(e.types[0]) };
    }
    return opportunityList(e, p, nudge);
  }

  // ── personal advising ──
  if (/(\d+)[- ]?month|roadmap|timeline|plan\b|schedule|step[- ]by[- ]step|what should i do (now|next|first)|where (do|should) i start/.test(s)) return plan(q, p, applications, intro, nudge);
  if (/improve|weak|strengthen|gap|missing|profile review|review my profile|what am i lacking|before applying/.test(s)) return improve(profile, p, intro, nudge);
  if (/deadline|due|closing|upcoming|this month|next month/.test(s)) return deadlines(p, applications, nudge);
  if (/skill|learn|course to take|what should i learn/.test(s)) return skillsAnswer(p, nudge);
  if (/career|profession|future job|what (should|can) i become|fit my interests|which job/.test(s) || e.careers.length) return careerAnswer(e, p, intro, nudge);

  // ── last resort: search everything ──
  const hits = searchAll(q.replace(/[?!.,]/g, " ").split(/\s+/).filter((w) => w.length > 3 && !STOP.has(w.toLowerCase())).slice(0, 3).join(" ")).slice(0, 6);
  if (hits.length) {
    return {
      text: `Here's what I found in CareerPath for “${q}”:\n\n${hits.map((h) => `- ${link(h.title, h.href)} — ${h.subtitle}`).join("\n")}\n\nAsk me about any of these by name for requirements, deadlines and your match.`,
      suggestions: STARTER_PROMPTS.slice(0, 3),
    };
  }
  return {
    text: `I'm not sure I understood that. I can help with:\n\n- **Universities** — “Universities in Germany for computer science”, “Compare Warwick vs Leeds”\n- **Funding** — “Fully funded scholarships for a master's in the UK”\n- **Opportunities** — “Competitions for high school students”, “Internships in data science”\n- **Applications** — essays, recommendation letters, interviews, IELTS/SAT, visas\n- **Planning** — “Build me a 6-month plan”, “What should I improve?”${nudge}`,
    suggestions: STARTER_PROMPTS,
  };
}

const STOP = new Set(["what", "which", "where", "when", "about", "tell", "with", "that", "this", "have", "should", "could", "would", "there", "their", "your", "from", "best", "good", "need", "want", "know", "give", "show", "please"]);

/** Backwards-compatible string answer. */
export function fallbackAnswer(question: string, profile: StudentProfile | null, applications: Application[] = []): string {
  return advise(question, profile, applications).text;
}

// ───────────── answers ─────────────

function universityAnswer(u: University, s: string, p: StudentProfile | null, nudge: string): AdvisorReply {
  const m = p ? matchUniversity(p, u) : null;
  const focus =
    /ielts|toefl|english|duolingo|language/.test(s) ? "english" :
    /sat|act|test/.test(s) ? "testing" :
    /tuition|cost|fee|price|expensive|afford/.test(s) ? "cost" :
    /aid|scholarship|funding|financial/.test(s) ? "aid" :
    /deadline|when|apply by|due/.test(s) ? "deadlines" : null;

  const lines: string[] = [`### ${u.name}`, `${u.city}, ${u.country} · ${u.type === "public" ? "Public" : "Private"}${u.qsRank ? ` · **QS 2027 ${qsLabel(u)}**` : ""} · ${SELECTIVITY_LABELS[u.selectivity]}`, ""];
  const eng = `- **English:** ${u.english.ielts ? `IELTS ${u.english.ielts.toFixed(1)}` : "minimum not captured"}${u.english.toefl ? ` / TOEFL ${u.english.toefl}` : ""} — ${u.english.note} _(${statusTag(u.english.source.status)})_`;
  const test = `- **Admission tests:** ${u.testing.note} _(${statusTag(u.testing.source.status)})_`;
  const cost = `- **Tuition:** ${u.tuition.display} _(${statusTag(u.tuition.source.status)})_`;
  const aid = `- **Financial aid:** ${AID_LABELS[u.aid.kind]}. ${u.aid.summary} _(${statusTag(u.aid.source.status)})_`;
  const dl = u.deadlines.map((d) => `- **${d.label}:** ${d.timing} _(${statusTag(d.source.status)})_`);
  if (focus === "english") lines.push(eng);
  else if (focus === "testing") lines.push(test);
  else if (focus === "cost") lines.push(cost, aid);
  else if (focus === "aid") lines.push(aid, cost);
  else if (focus === "deadlines") lines.push(...dl);
  else {
    lines.push(u.overview, "", eng, test, cost, aid, ...dl);
    if (u.notablePrograms.length) lines.push(`- **Notable programmes:** ${u.notablePrograms.slice(0, 5).join(", ")}`);
  }
  if (u.internationalNote && !focus) lines.push("", `**For international students:** ${u.internationalNote}`);
  if (m) {
    lines.push("", `**Your Profile Match: ${m.score}%** — ${m.reason}`);
    const gaps = m.checks.filter((c) => c.status === "fail" || c.status === "warn").slice(0, 3);
    if (gaps.length) lines.push(...gaps.map((c) => `- ${c.status === "fail" ? "✗" : "•"} ${c.label}${c.detail ? ` — ${c.detail}` : ""}`));
  }
  const schol = (u.scholarshipSlugs ?? []).map((x) => opportunities.find((o) => o.slug === x)).filter(Boolean) as Opportunity[];
  if (schol.length && (focus === "aid" || !focus)) lines.push("", `**Related funding:** ${schol.map(oLink).join(", ")}`);
  lines.push("", `${link("Official admissions page", u.admissionsUrl)} · ${link("Full profile on CareerPath", `/universities/${u.slug}`)}`);
  const similar = universities.filter((x) => x !== u && x.country === u.country).slice(0, 1)[0];
  return {
    text: lines.join("\n") + nudge,
    suggestions: [
      focus !== "deadlines" ? `When are the deadlines for ${u.shortName ?? u.name}?` : `What English score does ${u.shortName ?? u.name} need?`,
      similar ? `Compare ${u.shortName ?? u.name} vs ${similar.shortName ?? similar.name}` : "How do I build a balanced university list?",
      `Universities similar to ${u.shortName ?? u.name}`.replace(/^Universities similar to (.*)$/, `Universities in ${u.country}`),
    ],
    sources: [{ label: `${u.name} — admissions`, url: u.admissionsUrl }],
  };
}

function opportunityAnswer(o: Opportunity, s: string, p: StudentProfile | null, nudge: string): AdvisorReply {
  const m = p ? matchOpportunity(p, o) : null;
  const lines = [`### ${o.title}`, `${o.organization} · ${o.location} · ${o.format === "online" ? "Online" : o.format === "hybrid" ? "Hybrid" : "In person"}`, ""];
  if (!/requirement|eligib|deadline|when|cover|fund|how (do|to) apply|step/.test(s)) lines.push(o.overview, "");
  if (!/deadline|when|cover|fund/.test(s) || /requirement|eligib/.test(s)) lines.push("**Requirements**", ...o.requirements.map((r) => `- ${r.text}`), "");
  lines.push(`- **Funding:** ${o.funding.summary}`, `- **Deadline:** ${o.deadline.timing} _(${statusTag(o.deadline.source.status)})_`);
  if (/how (do|to) apply|step|process/.test(s) || !/requirement|deadline|fund/.test(s)) lines.push("", "**How to apply**", ...o.applicationSteps.map((x, i) => `${i + 1}. ${x}`));
  if (m) {
    lines.push("", m.eligible === false ? `**You don't currently meet every requirement.** ${m.reason}` : `**Your Profile Match: ${m.score}%**${m.eligible === null ? " — some rules need checking" : ""}. ${m.reason}`);
    const fails = m.checks.filter((c) => c.status === "fail" || c.status === "unknown").slice(0, 3);
    if (fails.length) lines.push(...fails.map((c) => `- ${c.status === "fail" ? "✗" : "?"} ${c.label}`));
  }
  lines.push("", `${link("Official website", o.officialUrl)} · ${link("Details on CareerPath", `/opportunities/${o.slug}`)}`);
  const alt = opportunities.find((x) => x !== o && x.type === o.type && x.levels.some((l) => o.levels.includes(l)));
  return {
    text: lines.join("\n") + nudge,
    suggestions: [alt ? `Compare ${short(o.title)} vs ${short(alt.title)}` : "What scholarships am I eligible for?", "How do I prepare for a scholarship interview?", `Similar ${OPPORTUNITY_TYPE_PLURAL[o.type].toLowerCase()} for me`],
    sources: [{ label: o.title, url: o.officialUrl }],
  };
}

const short = (t: string) => t.split(/[—(:]/)[0].replace(/ Scholarships?$| Programme$| Program$/i, "").trim();

function compareUniversities(list: University[], p: StudentProfile | null, nudge: string): AdvisorReply {
  const ms = list.map((u) => (p ? matchUniversity(p, u) : null));
  const cell = (x: string) => x.replace(/\|/g, "/").replace(/\n/g, " ");
  const head = `| | ${list.map((u) => u.shortName ?? u.name).join(" | ")} |\n| --- | ${list.map(() => "---").join(" | ")} |`;
  const rows: [string, (u: University, i: number) => string][] = [
    ["Location", (u) => `${u.city}, ${u.country}`],
    ["QS 2027", (u) => (u.qsRank ? qsLabel(u) : "—")],
    ["Selectivity", (u) => SELECTIVITY_LABELS[u.selectivity]],
    ["Tuition", (u) => u.tuition.display],
    ["Aid", (u) => AID_LABELS[u.aid.kind]],
    ["English", (u) => (u.english.ielts ? `IELTS ${u.english.ielts.toFixed(1)}${u.english.toefl ? ` / TOEFL ${u.english.toefl}` : ""}` : "See site")],
    ["Tests", (u) => ({ required: "Required", optional: "Optional", "not-used": "Not used", varies: "Varies" })[u.testing.policy]],
    ["Main deadline", (u) => u.deadlines[0]?.timing ?? "—"],
    ...(p ? ([["Your match", (_u: University, i: number) => `**${ms[i]!.score}%**`]] as [string, (u: University, i: number) => string][]) : []),
  ];
  const table = `${head}\n${rows.map(([k, f]) => `| **${k}** | ${list.map((u, i) => cell(f(u, i))).join(" | ")} |`).join("\n")}`;
  const notes: string[] = [];
  const cheapest = [...list].sort((a, b) => rankBand(a) - rankBand(b))[0];
  if (cheapest.tuition.band) notes.push(`**Lowest tuition band:** ${cheapest.shortName ?? cheapest.name}.`);
  const aid = list.filter((u) => u.aid.kind === "need-based-full");
  if (aid.length) notes.push(`**Meets full need for internationals:** ${aid.map((u) => u.shortName ?? u.name).join(", ")}.`);
  if (p) {
    const best = list[ms.indexOf(ms.reduce((a, b) => (b!.score > a!.score ? b : a))!)];
    notes.push(`**Best fit for your profile:** ${best.shortName ?? best.name} (${ms[list.indexOf(best)]!.score}%).`);
  }
  return {
    text: `### ${list.map((u) => u.shortName ?? u.name).join(" vs ")}\n\n${table}\n\n${notes.join(" ")}\n\nRankings are one signal — compare the actual course modules, total cost after aid, and graduate outcomes too. [Open this comparison](/compare?u=${list.map((u) => u.slug).join(",")}) · ${list.map(uLink).join(" · ")}${nudge}`,
    suggestions: [`When are the deadlines for ${list[0].shortName ?? list[0].name}?`, "How do I build a balanced university list?", "What scholarships am I eligible for?"],
  };
}
const rankBand = (u: University) => ["under-5k", "5-15k", "15-30k", "30-50k", "50k-plus"].indexOf(u.tuition.band ?? "50k-plus") + (u.tuition.band ? 0 : 10);

function compareOpportunities(list: Opportunity[], p: StudentProfile | null, nudge: string): AdvisorReply {
  const ms = list.map((o) => (p ? matchOpportunity(p, o) : null));
  const head = `| | ${list.map((o) => short(o.title)).join(" | ")} |\n| --- | ${list.map(() => "---").join(" | ")} |`;
  const rows: [string, (o: Opportunity, i: number) => string][] = [
    ["Organiser", (o) => o.organization],
    ["Where", (o) => o.location],
    ["Who", (o) => o.levels.join(", ")],
    ["Funding", (o) => o.funding.summary],
    ["Deadline", (o) => o.deadline.timing],
    ["Key rule", (o) => o.requirements[0]?.text ?? "—"],
    ...(p ? ([["Your status", (_o: Opportunity, i: number) => (ms[i]!.eligible === false ? "Not eligible" : `**${ms[i]!.score}%**${ms[i]!.eligible === null ? " (check rules)" : ""}`)]] as [string, (o: Opportunity, i: number) => string][]) : []),
  ];
  const table = `${head}\n${rows.map(([k, f]) => `| **${k}** | ${list.map((o, i) => f(o, i).replace(/\|/g, "/")).join(" | ")} |`).join("\n")}`;
  return {
    text: `### ${list.map((o) => short(o.title)).join(" vs ")}\n\n${table}\n\nYou can usually apply to several programmes in the same cycle — check whether any forbid holding two awards at once. ${list.map(oLink).join(" · ")}${nudge}`,
    suggestions: ["How do I prepare for a scholarship interview?", "What scholarships am I eligible for?"],
  };
}

function universitiesForMe(p: StudentProfile | null, intro: string, nudge: string): AdvisorReply {
  if (!p) {
    const top = [...universities].filter((u) => u.qsRank).sort((a, b) => a.qsRank! - b.qsRank!).slice(0, 6);
    return {
      text: `### Universities to consider\nSome of the highest-ranked universities in CareerPath (QS 2027):\n\n${top.map((u) => `- ${uLink(u)} — ${u.city}, ${u.country}. ${AID_LABELS[u.aid.kind]}.`).join("\n")}\n\nRanking alone is a weak way to choose — fit with your field, budget and English level matters more. Try “Universities in Germany for computer science” or “Cheap universities in Europe”.${nudge}`,
      suggestions: ["How do I build a balanced university list?", "Which countries have low tuition?", "Universities that meet full need for international students"],
    };
  }
  const ranked = rankUniversities(p).filter((r) => r.match.eligible !== false);
  const top = ranked.slice(0, 5);
  const access = ranked.filter((r) => (r.item.selectivity === "moderate" || r.item.selectivity === "accessible") && !top.includes(r)).slice(0, 3);
  return {
    text:
      intro +
      `### Universities to consider\n${top.map((r) => `- **${uLink(r.item)}** (${r.item.country}) — ${r.match.score}% Profile Match. ${r.match.reason}`).join("\n")}\n\n` +
      (access.length ? `### Balance your list with likely options\n${access.map((r) => `- ${uLink(r.item)} — ${r.match.score}% match, ${SELECTIVITY_LABELS[r.item.selectivity].toLowerCase()}`).join("\n")}\n\n` : "") +
      `Profile Match is informational and based on published criteria — it doesn't predict admission.`,
    suggestions: [top.length >= 2 ? `Compare ${top[0].item.shortName ?? top[0].item.name} vs ${top[1].item.shortName ?? top[1].item.name}` : "How do I build a balanced university list?", "What scholarships am I eligible for?", "Build me a 6-month application plan."],
  };
}

function universityList(e: Entities, s: string, p: StudentProfile | null, nudge: string): AdvisorReply {
  const maxTuition = e.cheap ? 15000 : Number(s.match(/under\s*\$?\s*(\d{1,3})[,.]?(\d{3})?\s*k?/)?.slice(1).join("") || NaN);
  const filters = {
    countries: e.countries,
    regions: e.countries.length ? [] : e.regions,
    fields: e.fields,
    level: e.level,
    maxIelts: e.ielts,
    maxTuitionUsd: Number.isFinite(maxTuition) ? (s.match(/under\s*\$?\s*\d{1,3}\s*k/) ? maxTuition * 1000 : maxTuition) : null,
    fullNeed: e.fullNeed,
    noTest: e.noTest,
    maxQsRank: e.topN,
    limit: 8,
  };
  const rows = searchUniversities(filters, p);
  const desc = [
    e.fields.length ? e.fields.map((f) => FIELD_LABELS[f]).join(" / ") : null,
    e.level ? (e.level === "masters" ? "master's" : e.level) : null,
    e.countries.length ? `in ${e.countries.join(", ")}` : e.regions.length ? `in ${e.regions.join(", ")}` : null,
    e.ielts ? `accepting IELTS ${e.ielts.toFixed(1)}` : null,
    e.cheap || filters.maxTuitionUsd ? `with tuition under about $${(filters.maxTuitionUsd ?? 15000).toLocaleString()}` : null,
    e.fullNeed ? "meeting full need for internationals" : null,
    e.noTest ? "without required SAT/ACT" : null,
    e.topN ? `in the QS top ${e.topN}` : null,
  ].filter(Boolean).join(", ");
  if (!rows.length) {
    return { text: `I couldn't find universities ${desc || "matching that"} in CareerPath's dataset. Try widening one filter — for example a nearby country or a higher English score.${nudge}`, suggestions: ["Which countries have low tuition?", "What universities should I consider?"] };
  }
  const lines = rows.map(({ u, m }) => `- **${uLink(u)}** — ${u.city}, ${u.country}${u.qsRank ? ` · QS ${qsLabel(u)}` : ""} · ${u.tuition.display}${u.english.ielts ? ` · IELTS ${u.english.ielts.toFixed(1)}` : ""}${m ? ` · **${m.score}% match**` : ""}`);
  const country = e.countries[0];
  return {
    text: `### Universities ${desc}\n${p ? "_Sorted by your Profile Match._\n" : "_Sorted by QS 2027 rank._\n"}\n${lines.join("\n")}\n\nSee them all with filters in [Universities](/universities${country ? `?country=${encodeURIComponent(country)}` : ""}).${nudge}`,
    suggestions: [rows.length >= 2 ? `Compare ${rows[0].u.shortName ?? rows[0].u.name} vs ${rows[1].u.shortName ?? rows[1].u.name}` : "How do I build a balanced university list?", country === "Germany" ? "How does the German blocked account work?" : country === "United Kingdom" ? "What do I need for a UK student visa?" : country === "United States" ? "How does financial aid work in the US?" : "Which countries have low tuition?", "What scholarships am I eligible for?"],
  };
}

function opportunityList(e: Entities, p: StudentProfile | null, nudge: string): AdvisorReply {
  const rows = searchOpportunities({ types: e.types, hostCountries: e.countries, fields: e.fields, level: e.school ? "high-school" : e.level, fullyFunded: e.funded, limit: 8 }, p);
  const noun = e.types.map((t) => OPPORTUNITY_TYPE_PLURAL[t].toLowerCase()).join(" and ");
  const desc = [e.funded ? "fully funded" : null, noun, e.school ? "for high school students" : e.level ? `for ${e.level === "masters" ? "master's" : e.level} students` : null, e.fields.length ? `in ${e.fields.map((f) => FIELD_LABELS[f]).join(" / ")}` : null, e.countries.length ? `in ${e.countries.join(", ")}` : null].filter(Boolean).join(" ");
  if (!rows.length) return { text: `I couldn't find ${desc} in CareerPath's dataset. Try removing one condition, or browse [Opportunities](/opportunities).${nudge}`, suggestions: followUpsFor(e.types[0]) };
  return {
    text: `### ${desc[0].toUpperCase() + desc.slice(1)}\n\n${rows.map(({ o, m }) => `- **${oLink(o)}** — ${o.summary} _${o.deadline.timing}._${m ? (m.eligible === false ? " ✗ Not eligible on your profile." : ` **${m.score}% match**.`) : ""}`).join("\n")}\n\nDeadlines are typical windows from previous cycles — confirm each on the official site.${e.types.some((t) => t === "internship" || t === "job") ? "\n\nFor postings open right now, browse [Live jobs & internships](/jobs) — refreshed every few hours." : ""}${nudge}`,
    suggestions: [rows.length >= 2 ? `Compare ${short(rows[0].o.title)} vs ${short(rows[1].o.title)}` : "What scholarships am I eligible for?", ...followUpsFor(e.types[0]).slice(0, 2)],
  };
}

function followUpsFor(t: OpportunityType): string[] {
  if (t === "scholarship") return ["How does financial aid work?", "How do I prepare for a scholarship interview?", "Fully funded scholarships for a master's"];
  if (t === "competition") return ["What extracurriculars stand out?", "Competitions in computer science", "What should I improve before applying?"];
  if (t === "internship" || t === "job") return ["How do I write a student CV?", "Internships in finance", "What skills should I build?"];
  return ["What scholarships am I eligible for?", "What should I improve before applying?"];
}

function listForMe(p: StudentProfile | null, types: OpportunityType[], noun: string) {
  if (!p) {
    const list = opportunities.filter((o) => types.includes(o.type) && !o.slug.startsWith("em-")).sort((a, b) => (monthsAhead(a.deadline.months) ?? 99) - (monthsAhead(b.deadline.months) ?? 99)).slice(0, 6);
    return `### ${noun[0].toUpperCase() + noun.slice(1)} with upcoming deadlines\n${list.map((o) => `- **${oLink(o)}** — ${o.summary} _${o.deadline.timing}._`).join("\n")}`;
  }
  const ranked = rankOpportunities(p, types);
  const ok = ranked.filter((r) => r.match.eligible === true).slice(0, 5);
  const check = ranked.filter((r) => r.match.eligible === null).slice(0, Math.max(0, 6 - ok.length));
  const no = ranked.filter((r) => r.match.eligible === false);
  let out = "";
  if (ok.length) out += `### You appear eligible for\n${ok.map((r) => `- **${oLink(r.item)}** — ${r.match.score}% match. ${r.match.reason} _${r.item.deadline.timing}._`).join("\n")}\n\n`;
  if (check.length) out += `### Likely eligible — some rules need checking\n${check.map((r) => `- ${oLink(r.item)} — ${r.match.score}% match. _${r.item.deadline.timing}._`).join("\n")}\n\n`;
  if (!ok.length && !check.length) out += `I couldn't find ${noun} you clearly qualify for right now.\n\n`;
  if (no.length) out += `Not currently eligible for ${no.length} other ${noun} — for example ${no.slice(0, 2).map((r) => `${r.item.title} (${r.match.checks.find((c) => c.status === "fail")?.label.toLowerCase() ?? "a rule"})`).join("; ")}.\n\n`;
  return out + "Eligibility is checked against published rules; selection is always decided by the programme.";
}

function plan(q: string, p: StudentProfile | null, applications: Application[], intro: string, nudge: string): AdvisorReply {
  const months = Number(q.match(/(\d+)\s*-?\s*month/i)?.[1] ?? 6);
  const n = Math.min(Math.max(months, 3), 12);
  const now = new Date();
  const targets = p
    ? [
        ...rankOpportunities(p, ["scholarship"]).filter((r) => r.match.eligible !== false).slice(0, 3).map((r) => ({ name: r.item.title, months: r.item.deadline.months })),
        ...rankUniversities(p).filter((r) => r.match.eligible !== false).slice(0, 3).map((r) => ({ name: r.item.name, months: r.item.deadlines[0]?.months ?? [] })),
      ]
    : [];
  const eng = p ? englishAsIelts(p) : null;
  const phases = [
    "Shortlist 6–10 universities and 4–6 scholarships; confirm every deadline and add them to your [planner](/planner).",
    eng && eng.band >= 7 ? "Your English score is solid — focus on SAT/GRE if needed, and start your activity list." : "Book your English test and start timed practice on your weakest section.",
    "Draft your personal statement; ask two referees and send them a brag sheet.",
    "Sit or retake tests; revise essays with feedback from two readers.",
    "Prepare documents: transcripts, translations, passport, financial proof.",
    "Submit applications 1–2 weeks before deadlines; prepare for interviews.",
    "Apply for remaining scholarships; chase missing documents.",
    "Compare offers and total cost after funding; start visa and housing steps.",
  ];
  const rows: string[] = [];
  for (let i = 0; i < n; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const due = targets.filter((t) => t.months.includes(d.getMonth() + 1)).map((t) => t.name);
    const mine = applications.filter((a) => a.deadline && new Date(a.deadline).getMonth() === d.getMonth() && new Date(a.deadline).getFullYear() === d.getFullYear()).map((a) => a.title);
    rows.push(`| **${MONTHS[d.getMonth()]} ${d.getFullYear()}** | ${phases[Math.min(Math.floor((i / n) * phases.length), phases.length - 1)]} | ${[...mine.map((x) => `📌 ${x}`), ...due].join(", ") || "—"} |`);
  }
  return {
    text: `${intro}### Your ${n}-month application plan\n\n| Month | Focus | Deadlines in this window |\n| --- | --- | --- |\n${rows.join("\n")}\n\n${targets.length ? `Built around your top matches. 📌 marks dates from your planner. ` : ""}Deadline windows are typical patterns from previous cycles — confirm exact dates. For a detailed, editable version, open your [Roadmap](/roadmap).${nudge}`,
    suggestions: ["What should I improve before applying?", "How do I write a personal statement?", "What deadlines are coming up?"],
  };
}

function improve(profile: StudentProfile | null, p: StudentProfile | null, intro: string, nudge: string): AdvisorReply {
  if (!profile) return { text: `Create a profile and I'll compare it with real requirements. In general, the biggest levers are a strong English score, consistent grades, two or three activities with measurable impact, and a clear story connecting them to your goals.${nudge}`, suggestions: ["What extracurriculars stand out?", "How do I write a personal statement?"] };
  const out: string[] = [];
  const c = profileCompletion(profile);
  if (c.percent < 80) out.push(`**Complete your profile (${c.percent}%).** Missing: ${c.missing.slice(0, 3).join("; ").toLowerCase()}.`);
  const eng = englishAsIelts(profile);
  if (!eng) out.push("**Take an English test.** Most international programmes ask for IELTS 6.5–7.0 or equivalent — it's the single most common blocker.");
  else if (eng.band < 6.5) out.push(`**Raise your English score.** ${eng.from} is below many university minimums (usually 6.5).`);
  else if (eng.band < 7) out.push(`**Consider an English retake.** ${eng.from} meets many requirements, but selective universities and scholarships (e.g. Chevening-level programmes, El-Yurt Umidi master's) often expect IELTS 7.0+.`);
  const g = gpaOn4(profile);
  if (g != null && g < 3.3) out.push(`**Strengthen academics.** Your GPA (≈${g.toFixed(2)}/4) is below the typical range of selective programmes — strong final-year grades, a test score or relevant projects can offset it.`);
  if (profile.education.seeking === "undergraduate" && profile.tests.sat == null && profile.tests.act == null && profile.goals.countries.includes("United States")) out.push("**Plan for the SAT/ACT.** Several US universities in our data now require it again.");
  if (profile.activities.length < 3) out.push("**Deepen your extracurriculars.** Aim for 2–3 activities where you can show leadership or results with numbers.");
  if (profile.education.seeking === "masters" && workMonths(profile) < 24) out.push(`**Build work experience** (${workMonths(profile)} months so far). Chevening needs about two years; El-Yurt Umidi master's needs more than one.`);
  if (p) {
    const dev = rankCareers(p)[0];
    if (dev?.match.develop.length) out.push(`**Build skills for ${dev.item.title}:** ${dev.match.develop.slice(0, 3).map((d) => d.name).join(", ")}.`);
    const nearMiss = rankOpportunities(p, ["scholarship"]).filter((r) => r.match.eligible === false && r.match.checks.filter((x) => x.status === "fail").length === 1).slice(0, 3);
    if (nearMiss.length) out.push(`**Unlock scholarships you narrowly miss:** ${nearMiss.map((r) => `${oLink(r.item)} — ${r.match.checks.find((x) => x.status === "fail")?.label.toLowerCase()}`).join("; ")}.`);
  }
  return {
    text: `${intro}### What to improve before applying\n${out.length ? out.map((x, i) => `${i + 1}. ${x}`).join("\n") : "Your profile already covers the main requirements we track. Focus on essays, recommendation letters and interview practice."}${nudge}`,
    suggestions: ["Build me a 6-month application plan.", "What extracurriculars stand out?", "How do I write a personal statement?"],
  };
}

function deadlines(p: StudentProfile | null, applications: Application[], nudge: string): AdvisorReply {
  const mine = applications.filter((a) => a.deadline && daysUntil(a.deadline) >= 0).sort((a, b) => a.deadline!.localeCompare(b.deadline!)).slice(0, 6);
  const pool = p ? rankOpportunities(p).filter((r) => r.match.eligible !== false).map((r) => r.item) : opportunities;
  const soon = pool.filter((o) => (monthsAhead(o.deadline.months) ?? 99) <= 2 && o.deadline.months.length < 12).slice(0, 8);
  const unis = (p ? rankUniversities(p).filter((r) => r.match.eligible !== false).map((r) => r.item) : universities).filter((u) => u.deadlines.some((d) => (monthsAhead(d.months) ?? 99) <= 2)).slice(0, 5);
  return {
    text:
      (mine.length ? `### In your planner\n${mine.map((a) => `- **${a.title}** — ${formatDate(a.deadline!)} (${daysUntil(a.deadline!)} days)`).join("\n")}\n\n` : "") +
      `### Opportunities typically closing in the next ~2 months\n${soon.length ? soon.map((o) => `- ${oLink(o)} — ${o.deadline.timing}`).join("\n") : "- Nothing in our data typically closes in the next two months."}\n\n` +
      (unis.length ? `### University deadlines in this window\n${unis.map((u) => `- ${uLink(u)} — ${u.deadlines.find((d) => (monthsAhead(d.months) ?? 99) <= 2)!.label}: ${u.deadlines.find((d) => (monthsAhead(d.months) ?? 99) <= 2)!.timing}`).join("\n")}\n\n` : "") +
      `These are typical windows from previous cycles. Always confirm the current date on the official site, then add it to your [planner](/planner).${nudge}`,
    suggestions: ["Build me a 6-month application plan.", "What scholarships am I eligible for?"],
  };
}

function careerHint(p: StudentProfile | null) {
  if (!p) return "";
  const top = rankCareers(p).slice(0, 3);
  return `\n\n**Careers that fit your profile:** ${top.map((r) => `${cLink(r.item)} (${r.match.score}%)`).join(", ")}.`;
}

function careerAnswer(e: Entities, p: StudentProfile | null, intro: string, nudge: string): AdvisorReply {
  if (e.careers.length) {
    const c = e.careers[0];
    const b = careerBrief(c, p);
    const m = p ? matchCareer(p, c) : null;
    return {
      text: `### ${c.title}\n${c.whatItIs}\n\n**Day to day**\n${c.dayToDay.map((x) => `- ${x}`).join("\n")}\n\n- **Key skills:** ${b.keySkills.join(", ")}\n- **Typical majors:** ${c.majors.join(", ")}\n- **Entry roles:** ${c.entryRoles.join(", ")}\n- **Outlook:** ${c.outlook}\n\n**How to get there:** ${c.educationPaths.join(" → ")}${m ? `\n\n**Your Career Match: ${m.score}%.** Strong: ${m.strong.slice(0, 3).join(", ") || "—"}. Develop: ${m.develop.slice(0, 3).map((d) => d.name).join(", ") || "—"}.` : ""}\n\n${link(`Explore ${c.title} on CareerPath`, `/careers/${c.slug}`)}${nudge}`,
      suggestions: [`Universities for ${c.majors[0] ?? "this field"}`, "What skills should I build?", "What competitions would strengthen my profile?"],
    };
  }
  const ranked = p ? rankCareers(p).slice(0, 4) : null;
  return {
    text: ranked
      ? `${intro}### Careers that fit you\n${ranked.map((r) => `- **${cLink(r.item)}** — ${r.match.score}% Career Match.\n  Strong: ${r.match.strong.slice(0, 3).join(", ") || "—"}. Develop: ${r.match.develop.slice(0, 3).map((d) => d.name).join(", ") || "—"}.`).join("\n")}\n\nTest your top choice with one small project or competition before committing — it's the fastest way to check fit.`
      : `### Careers you can explore\n${searchCareers("", null).slice(0, 8).map(({ c }) => `- ${cLink(c)} — ${c.summary}`).join("\n")}${nudge}`,
    suggestions: ["What skills should I build?", "How do I choose a major?", "What internships can I apply for?"],
  };
}

function skillsAnswer(p: StudentProfile | null, nudge: string): AdvisorReply {
  if (!p) {
    return { text: `The most transferable skills for students right now: **writing and communication, data analysis (Excel → Python/SQL), public speaking, project management**, and one technical skill tied to your field. Pick a career on the [Careers](/careers) page to see its exact skill list.${nudge}`, suggestions: ["What career fits my interests?"] };
  }
  const top = rankCareers(p).slice(0, 3);
  const dev = new Map<string, { name: string; for: string[] }>();
  for (const r of top) for (const d of r.match.develop) dev.set(d.slug, { name: d.name, for: [...(dev.get(d.slug)?.for ?? []), r.item.title] });
  const list = Array.from(dev.entries()).sort((a, b) => b[1].for.length - a[1].for.length).slice(0, 6);
  return {
    text: `### Skills to build next\n${list.map(([slug, d]) => `- **${link(d.name, `/careers?skill=${slug}`)}** — needed for ${d.for.join(", ")}`).join("\n") || "- You already list the core skills for your top careers. Deepen them with a project."}\n\nLearn by doing: pick one skill, finish a small project in 4 weeks, and add it to your profile and CV.`,
    suggestions: ["What competitions would strengthen my profile?", "How do I write a student CV?"],
  };
}

/** Compact, non-sensitive profile summary sent with AI requests. */
export function profileForAI(profile: StudentProfile | null, applications: Application[]) {
  if (!profile || !isProfileReady(profile)) return null;
  const p = profile;
  return {
    name: p.personal.name?.split(" ")[0] ?? null,
    country: p.personal.country, age: p.personal.age, level: p.education.level, seeking: p.education.seeking,
    field: p.education.field, major: p.education.major, graduationYear: p.education.graduationYear,
    gpa: p.education.gpa != null ? `${p.education.gpa}/${p.education.gpaScale}` : null, tests: p.tests, skills: p.skills, interests: p.interests,
    activities: p.activities.map((a) => `${a.type}: ${a.title}${a.role ? ` (${a.role})` : ""}${a.months ? `, ${a.months} months` : ""}`),
    goals: p.goals, finance: p.finance,
    planner: applications.slice(0, 20).map((a) => ({ title: a.title, status: a.status, deadline: a.deadline ?? null })),
  };
}

