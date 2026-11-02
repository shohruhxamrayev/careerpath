"use client";

import { ArrowUp, BadgeCheck, BookOpen, Check, Compass, Copy, FileText, GraduationCap, Info, Loader2, Plane, RotateCcw, Sparkles, Trophy, UserRound, Wallet } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Markdown } from "@/components/assistant/Markdown";
import { Button } from "@/components/ui";
import { advise, STARTER_PROMPTS } from "@/lib/ai/advisor";
import { datasetStats } from "@/lib/ai/tools";
import { describeStudent, isProfileReady, profileCompletion } from "@/lib/matching/profile";
import { useApp } from "@/lib/store/AppProvider";
import { cn } from "@/lib/utils";

interface Msg {
  role: "user" | "assistant";
  content: string;
  source?: "ai" | "verified";
  steps?: string[];
  suggestions?: string[];
  sources?: { label: string; url: string }[];
  pending?: boolean;
}

const TOPICS: { icon: React.ElementType; label: string; prompts: string[] }[] = [
  { icon: GraduationCap, label: "Universities", prompts: ["What universities should I consider?", "Universities in Germany for computer science", "Compare Warwick vs Manchester", "How do I build a balanced university list?"] },
  { icon: Wallet, label: "Funding", prompts: ["What scholarships am I eligible for?", "Fully funded scholarships for a master's", "Tell me about El-Yurt Umidi", "How does financial aid work?"] },
  { icon: Trophy, label: "Opportunities", prompts: ["What competitions would strengthen my profile?", "Competitions for high school students", "Internships in finance", "What extracurriculars stand out?"] },
  { icon: FileText, label: "Applications", prompts: ["How do I write a personal statement?", "Who should write my recommendation letters?", "How do I prepare for a scholarship interview?", "Build me a 6-month application plan."] },
  { icon: Plane, label: "Tests & visas", prompts: ["IELTS, TOEFL or Duolingo — which should I take?", "Do I need the SAT?", "What do I need for a UK student visa?", "How does the German blocked account work?"] },
  { icon: Compass, label: "Careers", prompts: ["What career fits my interests?", "What skills should I build?", "How do I choose a major?", "Tell me about data scientist"] },
];

const STORE_KEY = (id: string) => `cp:chat:${id}`;
const STATS = datasetStats();

function splitFollowUps(text: string): { body: string; followUps: string[] } {
  const i = text.indexOf("<<FOLLOWUPS>>");
  if (i < 0) return { body: text, followUps: [] };
  return { body: text.slice(0, i).trimEnd(), followUps: text.slice(i + 13).split("|").map((x) => x.trim().replace(/^[-•\d.]+\s*/, "")).filter((x) => x.length > 3).slice(0, 3) };
}

export function Assistant() {
  const { user, data, ready } = useApp();
  const [aiEnabled, setAiEnabled] = useState<boolean | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [topic, setTopic] = useState(0);
  const [copied, setCopied] = useState<number | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const profile = data?.profile ?? null;
  const personalised = !!user && isProfileReady(profile);
  const completion = profile ? profileCompletion(profile).percent : 0;

  useEffect(() => {
    fetch("/api/assistant")
      .then((r) => (r.ok ? r.json() : { enabled: false }))
      .then((d) => setAiEnabled(!!d.enabled))
      .catch(() => setAiEnabled(false));
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      const raw = sessionStorage.getItem(STORE_KEY(user?.id ?? "guest"));
      setMessages(raw ? (JSON.parse(raw) as Msg[]).filter((m) => !m.pending) : []);
    } catch {
      setMessages([]);
    }
  }, [ready, user?.id]);

  useEffect(() => {
    try {
      sessionStorage.setItem(STORE_KEY(user?.id ?? "guest"), JSON.stringify(messages.filter((m) => !m.pending).slice(-30)));
    } catch {
      /* storage unavailable — conversation still works in memory */
    }
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, user?.id]);

  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [input]);

  const patchLast = (fn: (m: Msg) => Msg) => setMessages((all) => all.map((m, i) => (i === all.length - 1 ? fn(m) : m)));

  const send = useCallback(
    async (text: string) => {
      const q = text.trim();
      if (!q || busy) return;
      const history: Msg[] = [...messages, { role: "user", content: q }];
      setMessages([...history, { role: "assistant", content: "", steps: [], pending: true }]);
      setInput("");
      setBusy(true);

      let done = false;
      if (aiEnabled) {
        try {
          const r = await fetch("/api/assistant", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              messages: history.map(({ role, content }) => ({ role, content })),
              profile: user ? profile : null,
              planner: (data?.applications ?? []).map((a) => ({ title: a.title, status: a.status, deadline: a.deadline ?? null })),
            }),
          });
          if (r.ok && r.body && (r.headers.get("content-type") ?? "").includes("ndjson")) {
            const reader = r.body.getReader();
            const dec = new TextDecoder();
            let buf = "";
            let text = "";
            let fallback = false;
            for (;;) {
              const { done: d, value } = await reader.read();
              if (d) break;
              buf += dec.decode(value, { stream: true });
              let nl: number;
              while ((nl = buf.indexOf("\n")) >= 0) {
                const line = buf.slice(0, nl);
                buf = buf.slice(nl + 1);
                if (!line.trim()) continue;
                const ev = JSON.parse(line) as { t: string; label?: string; text?: string };
                if (ev.t === "step") patchLast((m) => ({ ...m, steps: [...(m.steps ?? []), ev.label!] }));
                else if (ev.t === "delta") {
                  text += ev.text ?? "";
                  const t = text;
                  patchLast((m) => ({ ...m, content: t, source: "ai" }));
                } else if (ev.t === "fallback") fallback = true;
              }
            }
            if (!fallback && text.trim()) {
              const { body, followUps } = splitFollowUps(text);
              patchLast((m) => ({ ...m, content: body, suggestions: followUps, pending: false, source: "ai" }));
              done = true;
            }
          }
        } catch {
          /* fall through to the offline advisor */
        }
      }
      if (!done) {
        await new Promise((res) => setTimeout(res, 300));
        const reply = advise(q, user ? profile : null, data?.applications ?? []);
        patchLast(() => ({ role: "assistant", content: reply.text, suggestions: reply.suggestions, sources: reply.sources, source: "verified", steps: [] }));
      }
      setBusy(false);
      inputRef.current?.focus();
    },
    [aiEnabled, busy, data?.applications, messages, profile, user],
  );

  const copy = async (i: number, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(i);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      /* clipboard unavailable */
    }
  };

  const lastAssistant = messages.length - 1;

  return (
    <div className="flex flex-1 flex-col">
      <div className="night-band">
        <div className="container flex flex-col gap-3 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-mint/25 bg-mint/10 text-mint">
              <Sparkles className="h-5 w-5" />
              <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-night-900 bg-mint" aria-hidden />
            </div>
            <div>
              <h1 className="font-display text-[19px] font-semibold text-white">Path Advisor</h1>
              <p className="text-[13px] text-night-300">
                {aiEnabled ? "AI advisor grounded in CareerPath's sourced data" : "Advisor powered by CareerPath's verified data and matching engine"}
              </p>
            </div>
          </div>
          {messages.length > 0 && (
            <Button variant="nightOutline" size="sm" onClick={() => setMessages([])} disabled={busy}>
              <RotateCcw className="h-4 w-4" /> New conversation
            </Button>
          )}
        </div>
      </div>

      <div className="container grid flex-1 gap-6 py-6 lg:grid-cols-[280px_minmax(0,1fr)] [&>*]:min-w-0">
        {/* Sidebar */}
        <aside className="hidden space-y-4 lg:block">
          <div className="card p-4">
            <p className="font-mono text-[10.5px] uppercase tracking-wider text-ink-4">Advising</p>
            {personalised ? (
              <>
                <p className="mt-1.5 text-[14px] font-medium text-ink">{profile?.personal.name || "Your profile"}</p>
                <p className="mt-0.5 text-[12.5px] leading-snug text-ink-3">{describeStudent(profile!)}</p>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-line">
                  <div className="h-full rounded-full bg-brand-600" style={{ width: `${completion}%` }} />
                </div>
                <p className="mt-1.5 text-[12px] text-ink-3">Profile {completion}% complete · <Link href="/profile" className="link">Edit</Link></p>
              </>
            ) : (
              <p className="mt-1.5 text-[13px] leading-relaxed text-ink-3">
                {user ? <><Link href="/profile" className="link">Complete your profile</Link> so answers use your grades, tests and goals.</> : <><Link href="/signup?next=/assistant" className="link">Create a profile</Link> to get eligibility checks and personal matches.</>}
              </p>
            )}
          </div>
          <div className="card p-2">
            <p className="px-2 pb-1 pt-2 font-mono text-[10.5px] uppercase tracking-wider text-ink-4">Ask about</p>
            {TOPICS.map((t) => (
              <details key={t.label} className="group">
                <summary className="flex cursor-pointer list-none items-center gap-2.5 rounded-md px-2 py-2 text-[13.5px] text-ink-2 hover:bg-paper [&::-webkit-details-marker]:hidden">
                  <t.icon className="h-4 w-4 text-brand-600" /> {t.label}
                </summary>
                <div className="mb-1 ml-8 space-y-0.5">
                  {t.prompts.map((p) => (
                    <button key={p} disabled={busy} onClick={() => send(p)} className="block w-full rounded px-2 py-1.5 text-left text-[12.5px] leading-snug text-ink-3 hover:bg-paper hover:text-ink disabled:opacity-50">
                      {p}
                    </button>
                  ))}
                </div>
              </details>
            ))}
          </div>
          <div className="rounded-lg border border-line bg-paper p-3.5 text-[12px] leading-relaxed text-ink-3">
            <BadgeCheck className="mb-1 h-4 w-4 text-ok" />
            Answers draw on {STATS.universities} universities, {STATS.opportunities} opportunities and {STATS.careers} careers with sources. Profile Match is never a chance of admission.
          </div>
        </aside>

        {/* Conversation */}
        <div className="flex min-h-[60vh] flex-col">
          {aiEnabled === false && messages.length === 0 && (
            <p className="mb-4 flex items-start gap-2 rounded-lg border border-line bg-info-bg px-3.5 py-2.5 text-[13px] text-info">
              <Info className="mt-0.5 h-4 w-4 shrink-0" />
              Running on CareerPath&apos;s built-in advisor: answers come straight from the sourced dataset and matching engine.
            </p>
          )}

          {messages.length === 0 ? (
            <div className="night relative flex flex-1 flex-col items-center justify-center overflow-hidden rounded-2xl bg-night-950 px-5 py-12 text-center sm:px-8">
              <div className="night-grid pointer-events-none absolute inset-0 opacity-60 [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" aria-hidden />
              <div className="pointer-events-none absolute left-1/2 top-0 h-[300px] w-[520px] -translate-x-1/2 rounded-full bg-mint/10 blur-[100px]" aria-hidden />
              <div className="relative mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-mint/25 bg-mint/10 text-mint shadow-[0_0_40px_-8px_rgba(140,207,180,0.5)]">
                <Sparkles className="h-6 w-6" />
              </div>
              <h2 className="display relative text-[32px] leading-tight text-white sm:text-[40px]">Your personal <span className="font-serif italic text-mint">study-abroad</span> advisor</h2>
              <p className="relative mt-3 max-w-lg text-[14.5px] text-night-300">
                Compare universities, check scholarship eligibility, plan deadlines, and get straight answers on essays, tests and visas.
                {!user ? <> <Link href="/signup?next=/assistant" className="text-mint underline-offset-4 hover:underline">Create a profile</Link> for personal advice.</> : !personalised ? <> <Link href="/profile" className="text-mint underline-offset-4 hover:underline">Complete your profile</Link> for personal advice.</> : null}
              </p>
              <div className="relative mt-7 flex flex-wrap justify-center gap-1.5" role="tablist" aria-label="Topics">
                {TOPICS.map((t, i) => (
                  <button key={t.label} role="tab" aria-selected={topic === i} onClick={() => setTopic(i)} className={cn("inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12.5px] transition-colors", topic === i ? "border-mint/50 bg-mint/10 text-white" : "border-white/10 text-night-300 hover:text-white")}>
                    <t.icon className="h-3.5 w-3.5" /> {t.label}
                  </button>
                ))}
              </div>
              <div className="relative mt-4 grid w-full max-w-2xl gap-2 sm:grid-cols-2">
                {(topic === 0 ? STARTER_PROMPTS.slice(0, 2).concat(TOPICS[0].prompts.slice(1, 3)) : TOPICS[topic].prompts).map((p) => (
                  <button key={p} onClick={() => send(p)} className="group flex items-center justify-between gap-3 rounded-lg border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-left text-[13.5px] text-night-100 transition-colors hover:border-mint/40 hover:bg-mint/[0.06] hover:text-white">
                    {p}
                    <ArrowUp className="h-3.5 w-3.5 shrink-0 rotate-45 text-night-400 transition-colors group-hover:text-mint" />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex-1 space-y-6" aria-live="polite">
              {messages.map((m, i) => (
                <div key={i} className={cn("flex gap-3", m.role === "user" && "flex-row-reverse")}>
                  <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full", m.role === "user" ? "bg-ink/[0.06] text-ink-2" : "bg-night-900 text-mint")} aria-hidden>
                    {m.role === "user" ? <UserRound className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
                  </div>
                  {m.role === "user" ? (
                    <div className="max-w-[85%] rounded-2xl rounded-tr-md bg-night-900 px-4 py-2.5 text-[14.5px] text-white">
                      <span className="sr-only">You said:</span>
                      <p className="whitespace-pre-wrap">{m.content}</p>
                    </div>
                  ) : (
                    <div className="min-w-0 flex-1">
                      <span className="sr-only">Path Advisor:</span>
                      {!!m.steps?.length && (
                        <ul className="mb-2.5 flex flex-wrap gap-1.5" aria-label="Advisor steps">
                          {m.steps.map((s, j) => {
                            const active = m.pending && j === m.steps!.length - 1 && !m.content;
                            return (
                              <li key={j} className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-2.5 py-1 text-[11.5px] text-ink-3">
                                {active ? <Loader2 className="h-3 w-3 animate-spin text-brand-600" /> : <Check className="h-3 w-3 text-ok" />} {s}
                              </li>
                            );
                          })}
                        </ul>
                      )}
                      <div className="card px-5 py-4">
                        {m.content ? (
                          <Markdown text={m.pending ? splitFollowUps(m.content).body : m.content} />
                        ) : (
                          <div className="flex items-center gap-1.5 py-1" role="status" aria-label="Path Advisor is thinking">
                            {[0, 1, 2].map((d) => <span key={d} className="h-1.5 w-1.5 animate-pulse rounded-full bg-ink-4" style={{ animationDelay: `${d * 150}ms` }} />)}
                          </div>
                        )}
                        {!m.pending && m.content && (
                          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-2.5">
                            <p className="flex items-center gap-1.5 text-[11.5px] text-ink-4">
                              {m.source === "ai" ? <Sparkles className="h-3 w-3" /> : <BookOpen className="h-3 w-3" />}
                              {m.source === "ai" ? "AI advice grounded in CareerPath data — confirm details on official sites." : "From CareerPath's sourced dataset and matching engine."}
                            </p>
                            <button onClick={() => copy(i, m.content)} className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11.5px] text-ink-4 hover:bg-paper hover:text-ink">
                              {copied === i ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />} {copied === i ? "Copied" : "Copy"}
                            </button>
                          </div>
                        )}
                        {!!m.sources?.length && !m.pending && (
                          <p className="mt-2 text-[11.5px] text-ink-4">
                            Sources: {m.sources.map((s, j) => <a key={j} href={s.url} target="_blank" rel="noopener noreferrer" className="mr-2 underline underline-offset-2 hover:text-ink">{s.label}</a>)}
                          </p>
                        )}
                      </div>
                      {i === lastAssistant && !m.pending && !!m.suggestions?.length && (
                        <div className="mt-3 flex flex-wrap gap-2" aria-label="Suggested follow-ups">
                          {m.suggestions.map((s) => (
                            <button key={s} onClick={() => send(s)} disabled={busy} className="rounded-full border border-line-strong bg-surface px-3 py-1.5 text-left text-[12.5px] text-ink-2 transition-colors hover:border-brand-500 hover:text-brand-700 disabled:opacity-50">
                              {s}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
              <div ref={endRef} />
            </div>
          )}

          <form
            className="sticky bottom-0 mt-6 bg-paper/95 pb-3 pt-2 backdrop-blur"
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
          >
            <div className="flex items-end gap-2 rounded-xl border border-line-strong bg-surface p-1.5 shadow-lift focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-100">
              <label htmlFor="chat-input" className="sr-only">Ask Path Advisor</label>
              <textarea
                id="chat-input"
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send(input);
                  }
                }}
                rows={1}
                maxLength={2000}
                placeholder="Ask anything — universities, scholarships, essays, visas, careers…"
                className="max-h-40 min-h-[42px] flex-1 resize-none bg-transparent px-2.5 py-2.5 text-[14.5px] shadow-none outline-none ring-0 placeholder:text-ink-4 focus:outline-none focus-visible:outline-none focus-visible:ring-0"
              />
              <Button type="submit" size="sm" className="h-10 w-10 shrink-0 rounded-lg p-0" disabled={!input.trim() || busy} aria-label="Send message">
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUp className="h-4 w-4" />}
              </Button>
            </div>
            <p className="mt-1.5 text-center text-[11.5px] text-ink-4">Path Advisor can make mistakes. Confirm requirements and deadlines on official sites.</p>
          </form>
        </div>
      </div>
    </div>
  );
}
