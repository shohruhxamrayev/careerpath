import type { Metadata } from "next";
import { ButtonLink, PageHeader } from "@/components/ui";
import { DATASET_COMPILED } from "@/lib/data/sources";

export const metadata: Metadata = { title: "How matching works", description: "How CareerPath calculates Profile Match, where its data comes from, and how your data is handled." };

export default function MethodologyPage() {
  const compiled = new Date(DATASET_COMPILED + "-01").toLocaleDateString("en-GB", { month: "long", year: "numeric" });
  return (
    <>
      <PageHeader eyebrow="About" title="How matching and data work" description="Transparent rules, sourced data, and no admission predictions." />
      <div className="container grid gap-10 py-10 lg:grid-cols-[220px_1fr]">
        <nav aria-label="On this page" className="lg:sticky lg:top-24 lg:self-start">
          <ul className="space-y-1 text-[13.5px]">
            {[["matching", "Profile Match"], ["opportunities", "Eligibility vs. fit"], ["careers", "Career Match"], ["ai", "Path Assistant"], ["data", "Data & sources"], ["privacy", "Privacy & security"]].map(([id, l]) => (
              <li key={id}><a href={`#${id}`} className="block rounded px-2 py-1.5 text-ink-2 hover:bg-surface">{l}</a></li>
            ))}
          </ul>
        </nav>
        <article className="prose-cp max-w-2xl text-[15px]">
          <section id="matching" className="scroll-mt-24">
            <h2 className="mb-3 text-[20px] font-semibold">Profile Match for universities</h2>
            <p>Profile Match is an informational score from 0–100% that compares your profile with a university&apos;s published criteria. It combines five components:</p>
            <ul>
              <li><strong>Eligibility match (25%)</strong> — whether the degree level you want is offered, your English score against the usual minimum, and testing requirements.</li>
              <li><strong>Academic fit (20%)</strong> — your GPA (converted to a 4.0 scale) compared with the general selectivity of the university.</li>
              <li><strong>Interest / major fit (25%)</strong> — whether your intended field is offered, or related fields from your interests.</li>
              <li><strong>Profile alignment (15%)</strong> — preferred destinations and depth of extracurriculars.</li>
              <li><strong>Financial fit (15%)</strong> — your funding needs or budget against indicative tuition and the types of aid available.</li>
            </ul>
            <p><strong>This is an informational match based on published criteria. It does not predict admission.</strong> Admission decisions depend on essays, recommendations, competition and many factors no tool can see.</p>
          </section>

          <section id="opportunities" className="mt-10 scroll-mt-24">
            <h2 className="mb-3 text-[20px] font-semibold">Eligibility vs. personal fit for opportunities</h2>
            <p>Each opportunity stores its requirements as structured rules — level of study, age range, English score, GPA, work experience, nationality and field. Each rule is checked against your profile and marked <em>met</em>, <em>check</em>, <em>not met</em> or <em>unknown</em>.</p>
            <p>Eligibility (60% of the score) is kept separate from personal fit (40%) — how well the opportunity aligns with your field, goals, destinations and funding needs. If any rule is not met, the opportunity is marked <strong>Not eligible</strong> and its score is capped, so it never appears as a top recommendation.</p>
            <p>Rules that can only be confirmed on the official page — such as country eligibility lists that change each cycle — are shown as items to check, not as passes.</p>
          </section>

          <section id="careers" className="mt-10 scroll-mt-24">
            <h2 className="mb-3 text-[20px] font-semibold">Career Match</h2>
            <p>Career Match compares your interests, field of study, listed skills, stated career goals and relevant activities with each career&apos;s profile. It shows the strengths behind the score and the key skills still to develop, with free resources where available.</p>
          </section>

          <section id="ai" className="mt-10 scroll-mt-24">
            <h2 className="mb-3 text-[20px] font-semibold">Path Assistant</h2>
            <p>The assistant never decides eligibility. It receives the results of the rule-based engine and the sourced dataset, and explains them, prioritises options and builds plans. When an AI service isn&apos;t configured or is unavailable, a built-in assistant answers common questions directly from the matching engine, so it always works.</p>
          </section>

          <section id="data" className="mt-10 scroll-mt-24">
            <h2 className="mb-3 text-[20px] font-semibold">Data & sources</h2>
            <p>The seed dataset was compiled in {compiled}. Every time-sensitive fact carries a source organisation, a link to the official page and one of three statuses:</p>
            <ul>
              <li><strong>Verified</strong> — checked against the source on the date shown (for example, QS 2027 ranks).</li>
              <li><strong>Indicative — confirm</strong> — reliable general guidance from the official source; exact figures vary by programme or cycle.</li>
              <li><strong>Not yet verified</strong> — not checked for the current cycle. Always confirm before relying on it.</li>
            </ul>
            <p>Deadlines describe the typical timing from previous cycles, never confirmed dates. Tuition is shown as an indicative band. Where a figure isn&apos;t known with confidence it is left out and labelled. Application links go to official university or programme websites only.</p>
            <p>CareerPath is independent and is not affiliated with any university, government or organisation listed.</p>
          </section>

          <section id="privacy" className="mt-10 scroll-mt-24">
            <h2 className="mb-3 text-[20px] font-semibold">Privacy & security</h2>
            <p>Your profile, saved items and planner are private to your account. With the cloud database enabled, row-level security ensures students can only read and edit their own records. In local mode, your data stays in this browser and passwords are stored only as salted hashes.</p>
            <p>When the AI assistant is enabled, a summary of your profile and matches is sent to the AI provider only to answer your question. API keys are kept on the server and never exposed to the browser.</p>
            <p>You can delete your account and all associated data at any time from your profile.</p>
          </section>

          <div className="mt-10 flex flex-wrap gap-2">
            <ButtonLink href="/profile">Build your profile</ButtonLink>
            <ButtonLink href="/for-you" variant="secondary">See your matches</ButtonLink>
          </div>
        </article>
      </div>
    </>
  );
}
