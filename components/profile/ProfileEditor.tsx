"use client";

import { ArrowRight, Check, Pencil, Plus, Trash2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Badge, Button, ButtonLink, Chip, ConfirmDialog, Field, Input, Modal, Progress, Select, TagInput } from "@/components/ui";
import { useToast } from "@/components/ui/Toast";
import { careers } from "@/lib/data/careers";
import { skills } from "@/lib/data/skills";
import {
  ACTIVITY_LABELS, COUNTRIES, DEGREE_LEVEL_LABELS, FIELD_LABELS, FIELDS, INTEREST_LABELS, INTERESTS, STUDENT_LEVEL_LABELS, STUDY_DESTINATIONS,
} from "@/lib/data/taxonomy";
import { profileCompletion, type CompletionSection } from "@/lib/matching/profile";
import { useApp } from "@/lib/store/AppProvider";
import type { Activity, ActivityType, DegreeLevel, Field as FieldT, StudentLevel, StudentProfile } from "@/lib/types";
import { cn, uid } from "@/lib/utils";

const SECTIONS: { key: CompletionSection["key"]; label: string }[] = [
  { key: "personal", label: "Personal" },
  { key: "education", label: "Education" },
  { key: "tests", label: "Tests" },
  { key: "skills", label: "Skills" },
  { key: "activities", label: "Extracurriculars" },
  { key: "interests", label: "Interests" },
  { key: "goals", label: "Career goals" },
  { key: "finance", label: "Funding" },
];

const TECH_SUGGEST = Array.from(new Set(skills.filter((s) => s.category === "technical" || s.category === "analytical" || s.category === "creative").map((s) => s.name)));
const SOFT_SUGGEST = skills.filter((s) => s.category === "communication" || s.category === "leadership").map((s) => s.name).concat(["Teamwork", "Time management", "Critical thinking"]);
const LANG_SUGGEST = ["English", "Uzbek", "Russian", "Kazakh", "Kyrgyz", "Tajik", "Turkish", "German", "French", "Spanish", "Korean", "Japanese", "Chinese (Mandarin)", "Arabic"];

const num = (v: string) => (v.trim() === "" || isNaN(Number(v)) ? null : Number(v));

export function ProfileEditor() {
  const { data, updateProfile, user, deleteAccount } = useApp();
  const toast = useToast();
  const router = useRouter();
  const params = useSearchParams();
  const onboarding = params.get("onboarding") === "1";
  const [draft, setDraft] = useState<StudentProfile>(() => data!.profile);
  const [activityModal, setActivityModal] = useState<Activity | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const dirty = useMemo(() => {
    const strip = (p?: StudentProfile) => JSON.stringify(p ? { ...p, updatedAt: undefined } : null);
    return strip(draft) !== strip(data?.profile);
  }, [draft, data?.profile]);
  const completion = useMemo(() => profileCompletion(draft), [draft]);

  useEffect(() => {
    const h = (e: BeforeUnloadEvent) => {
      if (dirty) e.preventDefault();
    };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [dirty]);

  const set = <K extends keyof StudentProfile>(k: K, v: Partial<StudentProfile[K]>) =>
    setDraft((d) => ({ ...d, [k]: { ...(d[k] as object), ...(v as object) } }));

  const validate = () => {
    const e: Record<string, string> = {};
    const { age } = draft.personal;
    const { gpa, gpaScale, graduationYear } = draft.education;
    const t = draft.tests;
    if (age != null && (age < 12 || age > 80)) e.age = "Enter an age between 12 and 80.";
    if (gpa != null && (gpa < 0 || gpa > gpaScale)) e.gpa = `GPA must be between 0 and ${gpaScale}.`;
    if (graduationYear != null && (graduationYear < 1980 || graduationYear > 2040)) e.graduationYear = "Enter a year between 1980 and 2040.";
    if (t.ielts != null && (t.ielts < 0 || t.ielts > 9 || (t.ielts * 2) % 1 !== 0)) e.ielts = "IELTS is 0–9 in steps of 0.5.";
    if (t.toefl != null && (t.toefl < 0 || t.toefl > 120)) e.toefl = "TOEFL iBT is 0–120.";
    if (t.duolingo != null && (t.duolingo < 10 || t.duolingo > 160)) e.duolingo = "Duolingo is 10–160.";
    if (t.sat != null && (t.sat < 400 || t.sat > 1600)) e.sat = "SAT is 400–1600.";
    if (t.act != null && (t.act < 1 || t.act > 36)) e.act = "ACT is 1–36.";
    if (t.gre != null && (t.gre < 260 || t.gre > 340)) e.gre = "GRE is 260–340.";
    if (t.gmat != null && (t.gmat < 200 || t.gmat > 805)) e.gmat = "GMAT is 205–805.";
    if (draft.finance.budgetUSD != null && draft.finance.budgetUSD < 0) e.budget = "Budget can't be negative.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const save = () => {
    if (!validate()) {
      toast.error("Please fix the highlighted fields before saving.");
      return;
    }
    updateProfile(draft);
    toast.success("Profile saved. Your matches are updated.", { label: "See For You", href: "/for-you" });
    if (onboarding && completion.percent >= 40) router.replace("/profile");
  };

  const saveActivity = (a: Activity) => {
    setDraft((d) => ({ ...d, activities: d.activities.some((x) => x.id === a.id) ? d.activities.map((x) => (x.id === a.id ? a : x)) : [...d.activities, a] }));
    setActivityModal(null);
  };

  const sectionDone = (k: CompletionSection["key"]) => completion.sections.find((s) => s.key === k)!.done === 1;

  return (
    <div className="pb-28">
      <div className="night-band">
        <div className="container py-8">
          {onboarding && (
            <div className="mb-6 rounded-md border border-brand-200 bg-brand-50 px-4 py-3 text-[14px] text-brand-800">
              <span className="font-semibold">Welcome{user?.name ? `, ${user.name.split(" ")[0]}` : ""}.</span> Start with your education and interests — those unlock personalised recommendations. You can save at any point and come back later.
            </div>
          )}
          <p className="eyebrow mb-2">Student profile</p>
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="display text-[36px] leading-tight">{draft.personal.name || "Your profile"}</h1>
              <p className="mt-2 text-[15px] text-ink-3">
                Your profile is <span className="font-semibold text-white">{completion.percent}% complete</span>. Everything here is used by the matching engine.
              </p>
            </div>
            <ButtonLink href="/for-you" variant="nightOutline">
              View recommendations <ArrowRight className="h-4 w-4" />
            </ButtonLink>
          </div>
        </div>
      </div>

      <div className="container grid gap-8 py-8 lg:grid-cols-[260px_1fr]">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="card p-4">
            <div className="flex items-baseline justify-between">
              <span className="text-[13px] font-medium">Completion</span>
              <span className="font-mono text-[13px]">{completion.percent}%</span>
            </div>
            <Progress value={completion.percent} className="mt-2" label="Profile completion" />
            <nav aria-label="Profile sections" className="mt-4 hidden lg:block">
              <ul className="space-y-0.5">
                {SECTIONS.map((s) => (
                  <li key={s.key}>
                    <a href={`#${s.key}`} className="flex items-center justify-between rounded px-2 py-1.5 text-[13.5px] text-ink-2 hover:bg-paper">
                      {s.label}
                      {sectionDone(s.key) ? <Check className="h-3.5 w-3.5 text-ok" aria-label="Complete" /> : <span className="h-1.5 w-1.5 rounded-full bg-warn" aria-label="Incomplete" />}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
            {completion.missing.length > 0 && (
              <div className="mt-4 border-t border-line pt-4">
                <p className="mb-2 text-[12px] font-medium text-ink-2">Still missing</p>
                <ul className="space-y-1.5 text-[12.5px] text-ink-3">
                  {completion.missing.slice(0, 5).map((m) => <li key={m}>· {m}</li>)}
                  {completion.missing.length > 5 && <li>· and {completion.missing.length - 5} more</li>}
                </ul>
              </div>
            )}
          </div>
        </aside>

        <div className="space-y-6">
          {/* PERSONAL */}
          <FormCard id="personal" title="Personal details" description="Used for eligibility rules such as nationality and age limits.">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Full name" htmlFor="p-name">
                <Input id="p-name" value={draft.personal.name} onChange={(e) => set("personal", { name: e.target.value })} autoComplete="name" />
              </Field>
              <Field label="Country of citizenship" htmlFor="p-country">
                <Select id="p-country" value={draft.personal.country} onChange={(e) => set("personal", { country: e.target.value })}>
                  <option value="">Select country</option>
                  {COUNTRIES.map((c) => <option key={c}>{c}</option>)}
                </Select>
              </Field>
              <Field label="City" htmlFor="p-city">
                <Input id="p-city" value={draft.personal.city} onChange={(e) => set("personal", { city: e.target.value })} autoComplete="address-level2" />
              </Field>
              <Field label="Age" htmlFor="p-age" error={errors.age}>
                <Input id="p-age" type="number" inputMode="numeric" min={12} max={80} value={draft.personal.age ?? ""} onChange={(e) => set("personal", { age: num(e.target.value) })} />
              </Field>
            </div>
          </FormCard>

          {/* EDUCATION */}
          <FormCard id="education" title="Education" description="Your current level and the degree you're aiming for drive most eligibility checks.">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Current institution" htmlFor="e-inst" className="sm:col-span-2">
                <Input id="e-inst" value={draft.education.institution} onChange={(e) => set("education", { institution: e.target.value })} placeholder="e.g. Lyceum No. 1, Tashkent" />
              </Field>
              <Field label="Current level" htmlFor="e-level">
                <Select id="e-level" value={draft.education.level} onChange={(e) => set("education", { level: e.target.value as StudentLevel })}>
                  <option value="">Select level</option>
                  {Object.entries(STUDENT_LEVEL_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </Select>
              </Field>
              <Field label="Aiming for" htmlFor="e-seek" hint="The next degree you want to apply for.">
                <Select id="e-seek" value={draft.education.seeking} onChange={(e) => set("education", { seeking: e.target.value as DegreeLevel })}>
                  <option value="">Select degree</option>
                  {Object.entries(DEGREE_LEVEL_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </Select>
              </Field>
              <Field label="Field of study" htmlFor="e-field">
                <Select id="e-field" value={draft.education.field} onChange={(e) => set("education", { field: e.target.value as FieldT })}>
                  <option value="">Select field</option>
                  {FIELDS.map((f) => <option key={f} value={f}>{FIELD_LABELS[f]}</option>)}
                </Select>
              </Field>
              <Field label="Major / intended major" htmlFor="e-major">
                <Input id="e-major" value={draft.education.major} onChange={(e) => set("education", { major: e.target.value })} placeholder="e.g. Finance" />
              </Field>
              <Field label="Graduation year" htmlFor="e-grad" error={errors.graduationYear}>
                <Input id="e-grad" type="number" inputMode="numeric" value={draft.education.graduationYear ?? ""} onChange={(e) => set("education", { graduationYear: num(e.target.value) })} placeholder="2027" />
              </Field>
              <div>
                <label className="label" htmlFor="e-gpa">GPA / average grade</label>
                <div className="flex gap-2">
                  <Input id="e-gpa" type="number" inputMode="decimal" step="0.01" value={draft.education.gpa ?? ""} onChange={(e) => set("education", { gpa: num(e.target.value) })} />
                  <Select aria-label="GPA scale" className="w-28" value={draft.education.gpaScale} onChange={(e) => set("education", { gpaScale: Number(e.target.value) as 4 | 5 | 10 | 100 })}>
                    <option value={4}>/ 4</option>
                    <option value={5}>/ 5</option>
                    <option value={10}>/ 10</option>
                    <option value={100}>/ 100</option>
                  </Select>
                </div>
                {errors.gpa ? <p className="mt-1 text-[12px] text-bad">{errors.gpa}</p> : <p className="hint">We convert other scales to a 4.0 equivalent for matching.</p>}
              </div>
            </div>
          </FormCard>

          {/* TESTS */}
          <FormCard id="tests" title="Test scores" description="Leave blank anything you haven't taken. Planned tests can go in 'Other'.">
            <div className="grid gap-4 sm:grid-cols-3">
              {([
                ["ielts", "IELTS (overall)", "0.5"],
                ["toefl", "TOEFL iBT", "1"],
                ["duolingo", "Duolingo English Test", "1"],
                ["sat", "SAT", "10"],
                ["act", "ACT", "1"],
                ["gre", "GRE (total)", "1"],
                ["gmat", "GMAT", "1"],
              ] as const).map(([k, label, step]) => (
                <Field key={k} label={label} htmlFor={`t-${k}`} error={errors[k]}>
                  <Input id={`t-${k}`} type="number" inputMode="decimal" step={step} value={draft.tests[k] ?? ""} onChange={(e) => set("tests", { [k]: num(e.target.value) })} />
                </Field>
              ))}
              <Field label="Other tests" htmlFor="t-other" hint="e.g. 'None yet', 'IELTS planned for March', 'A-levels AAA'">
                <Input id="t-other" value={draft.tests.other} onChange={(e) => set("tests", { other: e.target.value })} />
              </Field>
            </div>
          </FormCard>

          {/* SKILLS */}
          <FormCard id="skills" title="Skills" description="Type a skill and press Enter. Matching recognises common names like SQL, Python or Excel.">
            <div className="space-y-4">
              <Field label="Technical skills" htmlFor="s-tech">
                <TagInput id="s-tech" value={draft.skills.technical} onChange={(v) => set("skills", { technical: v })} suggestions={TECH_SUGGEST} placeholder="e.g. Python, Excel, Figma" />
              </Field>
              <Field label="Soft skills" htmlFor="s-soft">
                <TagInput id="s-soft" value={draft.skills.soft} onChange={(v) => set("skills", { soft: v })} suggestions={SOFT_SUGGEST} placeholder="e.g. Public speaking, Leadership" />
              </Field>
              <Field label="Languages" htmlFor="s-lang">
                <TagInput id="s-lang" value={draft.skills.languages} onChange={(v) => set("skills", { languages: v })} suggestions={LANG_SUGGEST} placeholder="e.g. Uzbek, English, Russian" />
              </Field>
            </div>
          </FormCard>

          {/* ACTIVITIES */}
          <FormCard
            id="activities"
            title="Extracurriculars & experience"
            description="Clubs, leadership, volunteering, competitions, projects, research and work. Work months count toward experience requirements."
            action={<Button variant="secondary" size="sm" onClick={() => setActivityModal({ id: uid(), type: "club", title: "" })}><Plus className="h-4 w-4" /> Add</Button>}
          >
            {draft.activities.length === 0 ? (
              <div className="rounded border border-dashed border-line-strong px-4 py-8 text-center">
                <p className="text-[14px] font-medium">No activities yet</p>
                <p className="mt-1 text-[13px] text-ink-3">Add anything you&apos;ve done outside class — it strengthens matches for selective programmes and fellowships.</p>
                <Button className="mt-4" size="sm" onClick={() => setActivityModal({ id: uid(), type: "club", title: "" })}><Plus className="h-4 w-4" /> Add your first activity</Button>
              </div>
            ) : (
              <ul className="divide-y divide-line rounded border border-line">
                {draft.activities.map((a) => (
                  <li key={a.id} className="flex items-start gap-3 p-3.5">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[14px] font-medium">{a.title}</span>
                        <Badge>{ACTIVITY_LABELS[a.type]}</Badge>
                      </div>
                      <p className="mt-0.5 text-[12.5px] text-ink-3">{[a.role, a.organization, a.months ? `${a.months} months` : ""].filter(Boolean).join(" · ")}</p>
                      {a.description && <p className="mt-1 text-[13px] text-ink-2">{a.description}</p>}
                    </div>
                    <button onClick={() => setActivityModal(a)} className="rounded p-1.5 text-ink-3 hover:bg-paper hover:text-ink" aria-label={`Edit ${a.title}`}><Pencil className="h-4 w-4" /></button>
                    <button onClick={() => setDraft((d) => ({ ...d, activities: d.activities.filter((x) => x.id !== a.id) }))} className="rounded p-1.5 text-ink-3 hover:bg-bad-bg hover:text-bad" aria-label={`Remove ${a.title}`}><Trash2 className="h-4 w-4" /></button>
                  </li>
                ))}
              </ul>
            )}
          </FormCard>

          {/* INTERESTS */}
          <FormCard id="interests" title="Interests" description="Pick everything that genuinely interests you. Two or more give better recommendations.">
            <div className="flex flex-wrap gap-2">
              {INTERESTS.map((i) => (
                <Chip key={i} active={draft.interests.includes(i)} onClick={() => setDraft((d) => ({ ...d, interests: d.interests.includes(i) ? d.interests.filter((x) => x !== i) : [...d.interests, i] }))}>
                  {draft.interests.includes(i) && <Check className="h-3.5 w-3.5" />}
                  {INTEREST_LABELS[i]}
                </Chip>
              ))}
            </div>
          </FormCard>

          {/* GOALS */}
          <FormCard id="goals" title="Career goals" description="Careers and destinations you're considering. Nothing here is binding.">
            <div className="space-y-5">
              <div>
                <p className="label">Careers you&apos;re considering</p>
                <div className="flex flex-wrap gap-2">
                  {careers.map((c) => (
                    <Chip key={c.slug} active={draft.goals.careers.includes(c.slug)} onClick={() => set("goals", { careers: draft.goals.careers.includes(c.slug) ? draft.goals.careers.filter((x) => x !== c.slug) : [...draft.goals.careers, c.slug] })}>
                      {draft.goals.careers.includes(c.slug) && <Check className="h-3.5 w-3.5" />}
                      {c.title}
                    </Chip>
                  ))}
                </div>
              </div>
              <Field label="Industries" htmlFor="g-ind">
                <TagInput id="g-ind" value={draft.goals.industries} onChange={(v) => set("goals", { industries: v })} suggestions={["Banking", "Consulting", "Technology", "Government", "International development", "Healthcare", "Energy", "Education", "Media", "Startups"]} placeholder="e.g. Banking, Technology" />
              </Field>
              <div>
                <p className="label">Preferred study or work destinations</p>
                <div className="flex flex-wrap gap-2">
                  {STUDY_DESTINATIONS.map((c) => (
                    <Chip key={c} active={draft.goals.countries.includes(c)} onClick={() => set("goals", { countries: draft.goals.countries.includes(c) ? draft.goals.countries.filter((x) => x !== c) : [...draft.goals.countries, c] })}>
                      {draft.goals.countries.includes(c) && <Check className="h-3.5 w-3.5" />}
                      {c}
                    </Chip>
                  ))}
                </div>
              </div>
            </div>
          </FormCard>

          {/* FINANCE */}
          <FormCard id="finance" title="Funding" description="Used for financial fit — tuition levels and scholarship types.">
            <div className="grid gap-3 sm:grid-cols-3">
              {([
                ["full", "Full scholarship required", "I can only study with full funding."],
                ["partial", "Partial scholarship", "I can contribute but need support."],
                ["self", "Self-funded", "I or my family can pay up to a budget."],
              ] as const).map(([k, label, desc]) => (
                <label key={k} className={cn("cursor-pointer rounded border p-3.5 transition-colors", draft.finance.need === k ? "border-brand-600 bg-brand-50" : "border-line-strong bg-surface hover:border-ink-4")}>
                  <input type="radio" name="need" className="sr-only" checked={draft.finance.need === k} onChange={() => set("finance", { need: k })} />
                  <span className="flex items-center gap-2 text-[14px] font-medium">
                    <span className={cn("flex h-4 w-4 items-center justify-center rounded-full border", draft.finance.need === k ? "border-brand-600" : "border-line-strong")}>
                      {draft.finance.need === k && <span className="h-2 w-2 rounded-full bg-brand-600" />}
                    </span>
                    {label}
                  </span>
                  <span className="mt-1 block pl-6 text-[12.5px] text-ink-3">{desc}</span>
                </label>
              ))}
            </div>
            <Field label="Annual budget for tuition (USD)" htmlFor="f-budget" className="mt-4 max-w-xs" error={errors.budget} hint="Approximate is fine.">
              <Input id="f-budget" type="number" inputMode="numeric" step={1000} value={draft.finance.budgetUSD ?? ""} onChange={(e) => set("finance", { budgetUSD: num(e.target.value) })} placeholder="e.g. 15000" />
            </Field>
          </FormCard>

          <div className="rounded-md border border-line bg-surface p-5">
            <h2 className="text-[15px] font-semibold">Account</h2>
            <p className="mt-1 text-[13px] text-ink-3">Signed in as {user?.email}. Deleting your account removes your profile, saved items and planner permanently.</p>
            <Button variant="secondary" size="sm" className="mt-4 text-bad" onClick={() => setConfirmDelete(true)}>
              <Trash2 className="h-4 w-4" /> Delete account
            </Button>
          </div>
        </div>
      </div>

      {/* Save bar */}
      <div className={cn("fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 backdrop-blur transition-transform duration-200", dirty ? "translate-y-0" : "translate-y-full")} aria-hidden={!dirty}>
        <div className="container flex items-center justify-between gap-3 py-3">
          <p className="text-[13px] text-ink-3">You have unsaved changes.</p>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => { setDraft(data!.profile); setErrors({}); }} tabIndex={dirty ? 0 : -1}>Discard</Button>
            <Button onClick={save} tabIndex={dirty ? 0 : -1}>Save profile</Button>
          </div>
        </div>
      </div>

      <ActivityModal activity={activityModal} onClose={() => setActivityModal(null)} onSave={saveActivity} />
      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        danger
        title="Delete your account?"
        message="This permanently removes your profile, saved items, applications and tasks. This can't be undone."
        confirmLabel="Delete account"
        onConfirm={async () => {
          await deleteAccount();
          toast.success("Your account has been deleted.");
          router.push("/");
        }}
      />
    </div>
  );
}

function FormCard({ id, title, description, action, children }: { id: string; title: string; description?: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section id={id} className="card scroll-mt-24 p-5 sm:p-6" aria-labelledby={`${id}-h`}>
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 id={`${id}-h`} className="text-[16px] font-semibold">{title}</h2>
          {description && <p className="mt-1 text-[13px] text-ink-3">{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function ActivityModal({ activity, onClose, onSave }: { activity: Activity | null; onClose: () => void; onSave: (a: Activity) => void }) {
  const [a, setA] = useState<Activity | null>(activity);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => {
    setA(activity);
    setErr(null);
  }, [activity]);
  if (!a) return null;
  return (
    <Modal
      open={!!activity}
      onClose={onClose}
      title={a.title ? "Edit activity" : "Add activity"}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={() => (a.title.trim() ? onSave({ ...a, title: a.title.trim() }) : setErr("Give the activity a title."))}>Save activity</Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Type" htmlFor="a-type">
          <Select id="a-type" value={a.type} onChange={(e) => setA({ ...a, type: e.target.value as ActivityType })}>
            {Object.entries(ACTIVITY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </Select>
        </Field>
        <Field label="Duration (months)" htmlFor="a-months">
          <Input id="a-months" type="number" min={0} inputMode="numeric" value={a.months ?? ""} onChange={(e) => setA({ ...a, months: num(e.target.value) ?? undefined })} />
        </Field>
        <Field label="Title" htmlFor="a-title" className="sm:col-span-2" error={err ?? undefined}>
          <Input id="a-title" value={a.title} onChange={(e) => setA({ ...a, title: e.target.value })} placeholder="e.g. Debate Club, Data internship" />
        </Field>
        <Field label="Role" htmlFor="a-role">
          <Input id="a-role" value={a.role ?? ""} onChange={(e) => setA({ ...a, role: e.target.value })} placeholder="e.g. President" />
        </Field>
        <Field label="Organisation" htmlFor="a-org">
          <Input id="a-org" value={a.organization ?? ""} onChange={(e) => setA({ ...a, organization: e.target.value })} />
        </Field>
        <Field label="What did you do?" htmlFor="a-desc" className="sm:col-span-2">
          <textarea id="a-desc" rows={3} className="input" value={a.description ?? ""} onChange={(e) => setA({ ...a, description: e.target.value })} placeholder="One or two sentences with results, if you can." />
        </Field>
      </div>
    </Modal>
  );
}
