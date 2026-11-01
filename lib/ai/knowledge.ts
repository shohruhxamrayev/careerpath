/*
 * Advisor knowledge base — expert guidance used by Path Assistant (offline engine and AI tool).
 * Time-sensitive figures carry a source and were checked in November 2026. Students must confirm on official pages.
 */

export interface Guide {
  id: string;
  title: string;
  /** Lowercase regex fragments that signal this topic. */
  match: RegExp;
  body: string;
  sources?: { label: string; url: string }[];
  followUps: string[];
}

export const GUIDES: Guide[] = [
  {
    id: "personal-statement",
    title: "Writing a personal statement",
    match: /personal statement|college essay|common app essay|ucas statement|motivation letter|motivational letter|admission essay|write (my|an|the) essay|essay tips|essay help/,
    body: `### Writing a personal statement that works

**What admissions readers want:** evidence of curiosity, initiative and fit — shown through specific moments, not adjectives.

**Format depends on the system**
- **UCAS (UK, 2026 entry onwards):** three questions instead of one free essay — *why this course*, *how your studies prepared you*, and *what you've done outside education*. Each answer needs at least **350 characters**; the total limit is still **4,000 characters** including spaces.
- **Common App (US):** one essay of up to **650 words** on one of seven prompts, plus each university's own supplements.
- **Europe/Asia masters & scholarships:** usually a motivation letter of 1–2 pages, focused on academic goals and fit.

**A structure that works**
1. **Open with a concrete moment** — a problem you tried to solve, not "Since childhood I have loved…".
2. **Show the thread** — 2–3 experiences that connect (a class, a project, a competition) and what each taught you.
3. **Reflect** — what changed in how you think. This is what separates strong essays.
4. **Look forward** — why *this* course/university/country is the next step, with one or two specifics (a module, a lab, a professor).

**Common mistakes**
- Listing achievements already in your activity list.
- Generic praise of the university that could fit any school.
- Writing what you think they want instead of your own voice.
- Not getting feedback: give drafts to a teacher and one person who doesn't know you well.

**Process:** brain-dump → outline → ugly first draft → cut 30% → read aloud → feedback → final polish. Start **at least 8 weeks** before the deadline.`,
    sources: [
      { label: "UCAS — how to write your personal statement", url: "https://www.ucas.com/applying/applying-to-university/writing-your-personal-statement/how-to-write-your-personal-statement" },
      { label: "Common App essay prompts", url: "https://www.commonapp.org/blog/announcing-2026-2027-common-app-essay-prompts/" },
    ],
    followUps: ["How do I write a statement of purpose for a master's?", "Who should write my recommendation letters?", "Build me a 6-month application plan."],
  },
  {
    id: "sop",
    title: "Statement of purpose (master's / PhD)",
    match: /statement of purpose|\bsop\b|research proposal|research statement|master'?s essay|phd application essay/,
    body: `### Statement of purpose for a master's or PhD

A statement of purpose is a **professional argument**: you are ready for this programme and it is the right step for a clear goal.

**Structure (about 800–1,000 words unless the programme says otherwise)**
1. **Goal** — the problem or field you want to work on, stated specifically.
2. **Preparation** — your degree, key courses, thesis/projects, work experience. Use numbers and outcomes.
3. **Research or professional fit** — name 1–3 faculty members, labs, modules or tracks and explain the connection. For PhDs, briefly describe the questions you want to pursue.
4. **Why now** — what you learned from work or study that makes this the right time.
5. **After the degree** — a realistic plan (role, sector, country). Scholarships such as Chevening and Fulbright weigh this heavily.

**PhD applicants:** many European and UK programmes also want a **research proposal** (often 1,500–3,000 words): question, context, method, feasibility, timeline. Email a potential supervisor first with a short summary and your CV.

**Tips:** tailor every statement; avoid restating your CV line by line; keep a confident, specific tone.`,
    followUps: ["How do I email a professor about research?", "What are the best scholarships for a master's?", "How do I prepare for a scholarship interview?"],
  },
  {
    id: "recommendations",
    title: "Recommendation letters",
    match: /recommendation|reference letter|letter of rec|\blor\b|referee/,
    body: `### Getting strong recommendation letters

**Who to ask**
- **Undergraduate (US):** usually two teachers from core academic subjects (ideally final-year) plus your school counselor. UK UCAS uses **one reference**, normally written by your school.
- **Master's/PhD:** two or three academics who taught or supervised you; one employer reference is fine for professional programmes.
- Choose people who know your work well over people with impressive titles.

**How to ask**
1. Ask **4–6 weeks** before the first deadline, in person if possible.
2. Send a short "brag sheet": the programmes and deadlines, your CV, 3–4 specific things you did in their class/team, and your goals.
3. Make submission easy — list portals and dates in one message.
4. Send a polite reminder one week before, and a thank-you afterwards with the results.

**If your referee asks you to draft it:** write factual bullet points of what they observed, not a finished letter. Many programmes treat self-written letters as a serious problem.`,
    followUps: ["How do I write a personal statement?", "What should my student CV include?"],
  },
  {
    id: "interviews",
    title: "University and scholarship interviews",
    match: /interview/,
    body: `### Preparing for interviews

**University interviews** (Oxford/Cambridge, medicine, some US alumni interviews) test how you think, not memorised answers.
- Revise what you wrote in your application — you'll be asked about it.
- Practise **thinking aloud** on unfamiliar problems in your subject.
- Prepare 2 thoughtful questions about the course.

**Scholarship interviews** (Chevening, Fulbright, Erasmus Mundus, El-Yurt Umidi, etc.) test leadership, clarity of goals and impact.
- Use the **STAR** method (Situation, Task, Action, Result) for 5–6 core stories: leadership, teamwork, conflict, failure, initiative, influence.
- Know your **post-study plan** in detail: role, organisation types, how you'll use the degree back home.
- Read the scholarship's stated criteria and map one story to each.

**Practical checklist:** stable internet and quiet room for online interviews, documents on hand, formal clothing, a mock interview with someone who will push back.`,
    followUps: ["Tell me about Chevening", "Tell me about Fulbright", "What should I improve before applying?"],
  },
  {
    id: "english-tests",
    title: "English tests: IELTS, TOEFL, Duolingo",
    match: /ielts|toefl|duolingo|\bdet\b|english test|english requirement|language certificate|pte|cambridge english/,
    body: `### Choosing an English test

| Test | Scale | Typical requirement | Notes |
| --- | --- | --- | --- |
| **IELTS Academic** | 0–9 bands | 6.5–7.0 overall (often 6.0+ per section) | Most widely accepted; UK visas need a UKVI-approved test unless the university assesses you itself |
| **TOEFL iBT** | 1–6 (new scale from 2026) and 0–120 | about 90–100 on the 0–120 scale | ETS reports both scales during the transition |
| **Duolingo English Test** | 10–160 | about 115–125 | Online, fast results; accepted by many US universities, fewer elsewhere |

**How to choose**
- Check **every** university on your list — the test they all accept is the right one. In our data each university page shows its English requirement.
- Scores are normally **valid for two years**.
- Section minimums matter: a 7.0 overall with 5.5 in writing can still be rejected.
- Some universities waive the test if you studied in English — check the exact rule.

**Preparation:** take a full practice test first, then spend 4–8 weeks on your weakest section. For IELTS writing, practise Task 2 essays timed (40 minutes) and get them marked.`,
    sources: [
      { label: "IELTS", url: "https://ielts.org" },
      { label: "TOEFL iBT", url: "https://www.ets.org/toefl.html" },
      { label: "Duolingo English Test", url: "https://englishtest.duolingo.com" },
    ],
    followUps: ["Which universities accept IELTS 6.5?", "Do I need the SAT?", "Build me a 6-month application plan."],
  },
  {
    id: "sat-act",
    title: "SAT and ACT",
    match: /\bsat\b|\bact\b|test[- ]optional|standardi[sz]ed test/,
    body: `### SAT and ACT for US admission

- The **SAT** is digital, adaptive, about 2 hours 14 minutes, scored **400–1600** (Reading & Writing + Math).
- The **ACT** is scored 1–36. Either is accepted wherever testing is required.
- **Policies differ by university.** Several highly selective US universities (for example MIT, Harvard, Yale, Dartmouth, Brown and Caltech) have **reinstated testing requirements**; others are test-optional or test-free. Each university page on CareerPath shows its current policy and source.

**Strategy**
- If your score is at or above the university's middle 50% range, submit it — even when optional.
- For international applicants, a strong score helps readers interpret an unfamiliar grading system.
- Plan **2 attempts**: first sitting about 6 months before deadlines, a retake 2–3 months before.
- Free practice: **Khan Academy** official SAT practice and College Board's Bluebook app.`,
    sources: [{ label: "College Board — SAT", url: "https://satsuite.collegeboard.org/sat" }],
    followUps: ["Which US universities meet full need for international students?", "How does financial aid work in the US?"],
  },
  {
    id: "gre-gmat",
    title: "GRE and GMAT",
    match: /\bgre\b|\bgmat\b|graduate test/,
    body: `### GRE and GMAT

- **GRE General Test:** about 2 hours; Verbal and Quant scored 130–170 each, Writing 0–6. Accepted by most graduate programmes and many business schools.
- **GMAT Focus Edition:** 2 hours 15 minutes; scored 205–805. Mainly for business school.
- Many European and UK master's programmes do **not** require either; US programmes, especially in economics, finance and business, often do.
- Check each programme — "recommended" usually means a good score helps.

**Prep:** 6–10 weeks of steady practice. Use official practice tests (ETS PowerPrep, GMAC Official Practice) to set a baseline and target.`,
    followUps: ["What are the best scholarships for a master's?", "How do I write a statement of purpose?"],
  },
  {
    id: "financial-aid",
    title: "How financial aid works",
    match: /financial aid|need[- ]blind|need[- ]aware|css profile|full need|afford|scholarship strategy|how (do|can) i (get|win) (a )?scholarship|funding options|how to pay|cannot pay|can't afford/,
    body: `### How funding works for international students

**United States**
- **Need-blind for internationals** (a very small group, e.g. Harvard, Yale, Princeton, MIT, Amherst, Dartmouth): your ability to pay doesn't affect admission, and they meet full demonstrated need.
- **Need-aware with full need met** (e.g. many top private universities): asking for aid can affect admission, but if admitted your need is met.
- **Merit scholarships**: common at less selective private universities and some public ones.
- You'll usually submit the **CSS Profile** plus family financial documents.

**UK & Europe**
- Undergraduate aid is limited; look for **university merit scholarships** and **government programmes** (Chevening for master's, DAAD in Germany, Stipendium Hungaricum, Türkiye Burslari, Erasmus Mundus).
- Germany and Norway's public universities charge little or no tuition — living costs become the main budget item.

**Asia**
- Strong government scholarships: **MEXT (Japan), GKS (Korea), Chinese Government Scholarship, Taiwan Scholarship**.

**Strategy that works**
1. Decide your realistic annual budget first.
2. Build a list where every option is affordable *if* you get the funding you're targeting — plus 2 options affordable without it.
3. Apply to **4–8 scholarships**, not one. Most are competitive.
4. For Uzbek citizens, El-Yurt Umidi can fund study at accredited universities abroad.`,
    followUps: ["What scholarships am I eligible for?", "Which US universities meet full need for international students?", "Tell me about El-Yurt Umidi"],
  },
  {
    id: "uk-visa",
    title: "UK Student visa and Graduate route",
    match: /(uk|british|britain|england)\b.{0,25}visa|visa.{0,25}\b(uk|britain|england)\b|\bcas\b|graduate route|graduate visa|psw|post[- ]study work.*uk|uk.*post[- ]study|uk.*work after/,
    body: `### Studying in the UK: visa essentials

**Student visa**
- You need a **Confirmation of Acceptance for Studies (CAS)** from a licensed university.
- **Money to support yourself** (if you haven't lived in the UK for 12 months): **£1,529 per month in London** or **£1,171 per month outside London**, for up to 9 months — on top of any unpaid first-year tuition. Funds usually must be held for 28 consecutive days.
- You'll also pay the visa fee and the **Immigration Health Surcharge**.
- English: usually a Secure English Language Test (e.g. IELTS for UKVI) unless your university assesses you.

**Working**
- Degree-level students can normally work up to **20 hours a week** in term time.
- **Graduate visa:** **2 years** if you apply before 1 January 2027, and **18 months if you apply on or after 1 January 2027** (3 years for PhD graduates).

Always check the latest rules on GOV.UK before applying.`,
    sources: [
      { label: "GOV.UK — Student visa: money you need", url: "https://www.gov.uk/student-visa/money" },
      { label: "GOV.UK — Graduate visa", url: "https://www.gov.uk/graduate-visa" },
    ],
    followUps: ["Universities in the UK that fit me", "Tell me about Chevening", "How much does it cost to study in the UK?"],
  },
  {
    id: "us-visa",
    title: "US F-1 visa and OPT",
    match: /\bf-?1\b|(\bus\b|usa|america|united states).{0,25}visa|visa.{0,25}(\bus\b|usa|america|united states)|\bi-?20\b|\bopt\b|sevis|work after.*(us|usa|america)/,
    body: `### Studying in the US: visa essentials

1. Get admitted and receive your **Form I-20** from the university (you'll show proof of funding for at least the first year).
2. Pay the **SEVIS I-901 fee**.
3. Complete the **DS-160** and book an interview at a US embassy or consulate.
4. At the interview: explain your study plan, funding and ties to home clearly and briefly.

**Working**
- On-campus work is limited during term time.
- **OPT:** up to **12 months** of work in your field after graduation.
- **STEM OPT extension:** a further **24 months** for eligible STEM degrees.

Rules and processing times change — confirm on official US government pages.`,
    sources: [
      { label: "USCIS — STEM OPT", url: "https://www.uscis.gov/working-in-the-united-states/students-and-exchange-visitors/optional-practical-training-extension-for-stem-students-stem-opt" },
      { label: "travel.state.gov — Student visa", url: "https://travel.state.gov/content/travel/en/us-visas/study/student-visa.html" },
    ],
    followUps: ["Which US universities meet full need for international students?", "Do I need the SAT?"],
  },
  {
    id: "germany",
    title: "Studying in Germany",
    match: /germany|german universit|blocked account|sperrkonto|daad|uni-assist|study in german/,
    body: `### Studying in Germany

- **Tuition:** most public universities charge no tuition, only a semester contribution (often a few hundred euros, sometimes including a transport ticket). **Baden-Württemberg** charges non-EU students **€1,500 per semester**; TUM also charges tuition to non-EU students.
- **Living costs / blocked account:** for 2026 the required amount is **€992 per month (€11,904 per year)**.
- **Language:** many master's programmes are taught in English; most bachelor's programmes are in German (usually TestDaF or DSH required).
- **Applications:** often through **uni-assist** or directly to the university. Winter semester deadlines are commonly around 15 July (earlier for international applicants at some universities).
- **Funding:** DAAD scholarships, Deutschlandstipendium (merit, €300/month), and programme-specific grants.
- **After graduation:** an 18-month residence permit to look for work is available.`,
    sources: [
      { label: "DAAD — Study in Germany", url: "https://www.daad.de/en/study-and-research-in-germany/" }
    ],
    followUps: ["Universities in Germany", "Tell me about DAAD scholarships", "Which countries have low tuition?"],
  },
  {
    id: "el-yurt-umidi",
    title: "El-Yurt Umidi Foundation scholarship (Uzbekistan)",
    match: /el[- ]?yurt|eyuf|umidi/,
    body: `### El-Yurt Umidi Foundation scholarship

A state foundation of Uzbekistan that funds **citizens of Uzbekistan** to study at leading universities abroad (bachelor's, master's, PhD and internships).

**Typical eligibility (2026/27 cycle — confirm the current rules)**
- Citizenship of Uzbekistan.
- **Age:** bachelor's applicants generally up to 30; master's about 22–40; doctoral about 25–45.
- **Work experience:** master's more than 1 year, doctoral more than 2 years.
- **English:** commonly IELTS Academic **6.0+** for bachelor's and **7.0+** for master's/doctoral (or equivalent). An unconditional offer may exempt you.
- **Admission letter** from an eligible foreign university (conditional offers may be accepted under the rules).
- **Priority fields:** STEM, energy, agriculture and water management, transport, architecture and construction, healthcare and public administration.
- Funding typically covers tuition, living stipend, travel, insurance and study materials, with an obligation to work in Uzbekistan after graduating.

**Watch out:** the online application window is short (often about three weeks). Have your offer letter, test certificate and documents ready in advance.`,
    sources: [{ label: "El-Yurt Umidi Foundation (official)", url: "https://eyuf.uz" }],
    followUps: ["Universities that accept IELTS 6.0", "Build me a 6-month application plan.", "How do I prepare for a scholarship interview?"],
  },
  {
    id: "university-list",
    title: "Building a balanced university list",
    match: /how many universit|balanced list|reach|safety school|target school|shortlist|which universities should i apply|choose (a )?universit|pick (a )?universit/,
    body: `### Building a balanced university list

Aim for **8–12 applications** (fewer in the UK, where UCAS allows 5 choices).

| Tier | Share | What it means |
| --- | --- | --- |
| **Ambitious** | 2–3 | Your profile is below the typical admitted student, or the university is extremely selective |
| **Good fit** | 4–5 | Your grades/tests sit inside their typical range and you meet every requirement |
| **Likely** | 2–3 | You're comfortably above requirements — and you'd genuinely be happy to attend |

**Check for every university**
1. You meet the **hard requirements** (English, subjects, tests).
2. You can **afford** it with realistic funding.
3. The **programme** fits — read the module list, not just the ranking.
4. **Outcomes:** internships, graduate jobs, post-study work rights.

CareerPath's Profile Match ranks universities by how well they fit your profile. It doesn't predict admission, but it's a good way to sort a long list into these tiers.`,
    followUps: ["What universities should I consider?", "Compare two universities for me", "Which countries have low tuition?"],
  },
  {
    id: "choose-country",
    title: "Choosing a study destination",
    match: /which country|best country|where (should|can) i study|study abroad (in|where)|compare countries|cheapest country|low tuition|cheap (universit|countr)|affordable/,
    body: `### Choosing where to study

| Destination | Bachelor's length | Tuition for internationals | Work after study |
| --- | --- | --- | --- |
| **US** | 4 years | High; strong aid at some universities | OPT 12 months (+24 for STEM) |
| **UK** | 3 years (4 in Scotland) | High | Graduate visa: 2 years, 18 months from 2027 |
| **Germany** | 3 years | Mostly free at public universities | 18-month job-search permit |
| **Netherlands** | 3–4 years | Moderate | 1-year orientation year |
| **South Korea / Japan** | 4 years | Low–moderate; strong government scholarships | Job-seeking visas available |
| **Hungary / Poland / Czechia / Türkiye** | 3–4 years | Low; government scholarships | Varies |
| **Canada / Australia** | 3–4 years | High | Post-study work permits |

**Decide with three questions**
1. What can your family afford per year, including living costs?
2. Where do you want to work after graduating?
3. Which language can you study in now?

Ask me "universities in [country]" to see options from the dataset.`,
    followUps: ["Universities in Germany", "Universities in South Korea", "What scholarships am I eligible for?"],
  },
  {
    id: "cv",
    title: "Student CV / resume",
    match: /\bcv\b|resume|résumé|curriculum vitae/,
    body: `### A strong student CV (1 page)

1. **Header:** name, city/country, email, phone, LinkedIn/GitHub/portfolio.
2. **Education:** school/university, dates, GPA or grades, relevant courses, test scores.
3. **Experience:** internships, jobs, research, volunteering — newest first.
4. **Projects & competitions:** what you built or won, with outcomes.
5. **Skills & languages:** tools (Excel, Python, Figma…), languages with level (e.g. IELTS 7.0).

**Write every bullet as action + result:** "Organised a 120-student debate tournament, raising 3,000,000 UZS for school supplies", not "Responsible for events".

Use a clean layout, one font, no photo unless the country expects one, and save as PDF named *Firstname-Lastname-CV.pdf*.`,
    followUps: ["What internships can I apply for?", "What skills should I build for my career?"],
  },
  {
    id: "research",
    title: "Finding research and emailing professors",
    match: /email (a )?professor|cold email|research (position|opportunit|experience|assistant)|find (a )?supervisor|contact (a )?professor/,
    body: `### Getting research experience

**Where to look:** your own university's labs first, then summer research programmes (many are listed on CareerPath as summer programmes and fellowships), then remote projects with professors abroad.

**Cold-email template (keep it under 150 words)**
> **Subject:** Prospective research assistant — [topic]
> Dear Professor [Name], I'm a [year] student in [field] at [university]. I read your paper on [specific paper] and was interested in [one specific idea]. I've [relevant skill/project, e.g. analysed X with Python]. Would you have room for a student to help with [specific task] this [term/summer]? I've attached my CV. Thank you for your time.

**Tips:** send to 10–20 professors, personalise each one, follow up once after 7–10 days, and accept small unpaid tasks first — they often lead to papers and strong recommendation letters.`,
    followUps: ["What competitions would strengthen my profile?", "How do I write a statement of purpose?"],
  },
  {
    id: "extracurriculars",
    title: "Extracurriculars that stand out",
    match: /extracurricular|activities|stand out|spike|make my (application|profile) (strong|better)|impress (admissions|universities)/,
    body: `### Extracurriculars that stand out

Admissions and scholarship panels value **depth, initiative and impact** over a long list.

- **Go deep in 2–3 things** connected to your intended field.
- **Create, don't just join:** start a project, club, newsletter, app or community initiative.
- **Measure impact:** people reached, money raised, users, rankings, publications.
- **Compete with purpose:** olympiads, hackathons, case and essay competitions build evidence and network (see competitions on CareerPath).
- **Show continuity:** two years of steady commitment beats ten one-day events.

A simple test: could someone describe your profile in one sentence ("the student who built a water-quality sensor network for her district")? That's a strong profile.`,
    followUps: ["What competitions would strengthen my profile?", "What should I improve before applying?"],
  },
  {
    id: "timeline",
    title: "General application timeline",
    match: /when should i start|application timeline|when to apply|how early|admission cycle|application season/,
    body: `### Typical application timeline (for study starting next September)

| When | What |
| --- | --- |
| **12–18 months before** | Research countries, programmes and scholarships; start English/SAT/GRE prep |
| **9–12 months** | Take tests; shortlist; ask referees; start essays |
| **Sep–Oct** | UK Oxford/Cambridge & medicine (mid-Oct), US Early Decision/Action (around 1 Nov), Chevening (early Nov) |
| **Nov–Jan** | US regular decision (Jan), most UK UCAS (late Jan), many European master's and government scholarships |
| **Feb–May** | Results, interviews, scholarship decisions; compare offers (US reply date 1 May) |
| **Jun–Aug** | Visa, accommodation, final documents |

Use the [Roadmap](/roadmap) to turn this into your own month-by-month plan with real deadlines.`,
    followUps: ["Build me a 6-month application plan.", "What deadlines are coming up?"],
  },
  {
    id: "major",
    title: "Choosing a major",
    match: /which major|choose (a |my )?major|what (should i|to) study|what subject|choose (a )?(degree|course|field)/,
    body: `### Choosing a major

1. **Start with problems you enjoy working on**, not job titles. Which classes make time fly?
2. **Test cheaply:** a short online course, a competition or a small project in 2–3 candidate fields.
3. **Check the curriculum:** read the actual modules for the first two years.
4. **Look at outcomes:** typical first jobs, further study, salary ranges in the country where you want to work.
5. **Keep options open:** US liberal arts systems let you declare later; UK/Europe ask you to choose upfront.

Try the [Careers](/careers) page — each career shows related majors, skills and opportunities.`,
    followUps: ["What career fits my interests?", "What skills should I build?"],
  },
  {
    id: "costs",
    title: "Budgeting for study abroad",
    match: /cost of living|how much (does|will) it cost|budget|living cost|expenses|total cost/,
    body: `### Budgeting for study abroad

Build your budget from five parts:
1. **Tuition** — from each university page (CareerPath shows bands and the official source).
2. **Living costs** — rent, food, transport, phone. Visa rules give a useful floor: UK £1,171–£1,529/month; Germany €992/month (2026).
3. **One-off costs** — visa fees, health surcharge or insurance, flights, deposits, test fees.
4. **Application costs** — test fees, application fees, document translation.
5. **Buffer** — 10–15% for surprises.

Then subtract realistic funding (scholarships you're eligible for, family contribution, part-time work within visa limits). If the gap is above zero, add lower-cost destinations or more scholarships to your plan.`,
    sources: [{ label: "GOV.UK — Student visa money", url: "https://www.gov.uk/student-visa/money" }],
    followUps: ["Which countries have low tuition?", "What scholarships am I eligible for?"],
  },
  {
    id: "scams",
    title: "Avoiding agencies and scams",
    match: /agency|agent|consultant|scam|fraud|guarantee(d)? admission|pay someone/,
    body: `### Agencies and scams

- No legitimate agent can **guarantee admission** or a scholarship. Treat that promise as a red flag.
- Never pay for "scholarship applications" that are free on the official site.
- Always apply through the **official portal** (CareerPath only links to official domains).
- If you use an agency, check whether the university lists it as an official partner, get a written contract and keep control of your own email and portal passwords.`,
    followUps: ["What scholarships am I eligible for?", "How does financial aid work?"],
  },
];

export function findGuide(q: string): Guide | null {
  const s = q.toLowerCase();
  let best: Guide | null = null;
  let bestIdx = Infinity;
  for (const g of GUIDES) {
    const m = s.match(g.match);
    if (m && m.index !== undefined && m.index < bestIdx) {
      best = g;
      bestIdx = m.index;
    }
  }
  return best;
}

export function getGuide(id: string) {
  return GUIDES.find((g) => g.id === id) ?? null;
}
