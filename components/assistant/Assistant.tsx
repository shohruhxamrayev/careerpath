"use client";

import { ArrowUp, Info, RotateCcw, Sparkles, UserRound } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Markdown } from "@/components/assistant/Markdown";
import { LogoMark } from "@/components/brand/Logo";
import { Button } from "@/components/ui";
import { buildAIContext, fallbackAnswer } from "@/lib/ai/fallback";
import { isProfileReady } from "@/lib/matching/profile";
import { useApp } from "@/lib/store/AppProvider";
import { cn } from "@/lib/utils";

interface Msg {
  role: "user" | "assistant";
  content: string;
  source?: "ai" | "verified";
}

const PROMPTS = [
  "What scholarships am I eligible for?",
  "What universities should I consider?",
  "What competitions would strengthen my profile?",
  "What career fits my interests?",
  "What should I improve before applying?",
  "Build me a 6-month application plan.",
];

const STORE_KEY = (id: string) => `cp:chat:${id}`;

export function Assistant() {
  const { user, data, ready } = useApp();
  const [aiEnabled, setAiEnabled] = useState<boolean | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const profile = data?.profile ?? null;
  const personalised = !!user && isProfileReady(profile);

  useEffect(() => {
    fetch("/api/assistant")
      .then((r) => (r.ok ? r.json() : { enabled: false }))
      .then((d) => setAiEnabled(!!d.enabled))
      .catch(() => setAiEnabled(false));
  }, []);

  // Restore this user's conversation for the session.
  useEffect(() => {
    if (!ready) return;
    try {
      const raw = sessionStorage.getItem(STORE_KEY(user?.id ?? "guest"));
      setMessages(raw ? JSON.parse(raw) : []);
    } catch {
      setMessages([]);
    }
  }, [ready, user?.id]);

  useEffect(() => {
    try {
      sessionStorage.setItem(STORE_KEY(user?.id ?? "guest"), JSON.stringify(messages.slice(-30)));
    } catch {
      /* storage unavailable — conversation still works in memory */
    }
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, user?.id]);

  const send = async (text: string) => {
    const q = text.trim();
    if (!q || busy) return;
    const next: Msg[] = [...messages, { role: "user", content: q }];
    setMessages(next);
    setInput("");
    setBusy(true);

    let reply: Msg | null = null;
    if (aiEnabled) {
      try {
        const r = await fetch("/api/assistant", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            messages: next.map(({ role, content }) => ({ role, content })),
            context: buildAIContext(personalised ? profile : null, data?.applications ?? []),
          }),
        });
        const d = r.ok ? await r.json() : { fallback: true };
        if (d.text) reply = { role: "assistant", content: d.text, source: "ai" };
      } catch {
        /* fall through to the verified fallback */
      }
    }
    if (!reply) {
      await new Promise((res) => setTimeout(res, 350));
      reply = { role: "assistant", content: fallbackAnswer(q, user ? profile : null, data?.applications ?? []), source: "verified" };
    }
    setMessages((m) => [...m, reply!]);
    setBusy(false);
    inputRef.current?.focus();
  };

  return (
    <div className="flex flex-1 flex-col">
      <div className="night-band">
        <div className="container flex flex-col gap-3 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <LogoMark className="h-9 w-9" />
            <div>
              <h1 className="text-[18px] font-semibold">Path Assistant</h1>
              <p className="text-[13px] text-night-300">{personalised ? "Using your profile and CareerPath's verified data" : "Using CareerPath's verified data"}</p>
            </div>
          </div>
          {messages.length > 0 && (
            <Button variant="nightOutline" size="sm" onClick={() => setMessages([])}>
              <RotateCcw className="h-4 w-4" /> New conversation
            </Button>
          )}
        </div>
      </div>

      {aiEnabled === false && (
        <div className="border-b border-line bg-info-bg">
          <p className="container flex items-start gap-2 py-2.5 text-[13px] text-info">
            <Info className="mt-0.5 h-4 w-4 shrink-0" />
            AI assistance is currently limited. You can still explore verified recommendations using your profile — answers below come from CareerPath&apos;s matching engine.
          </p>
        </div>
      )}

      <div className="container flex max-w-3xl flex-1 flex-col py-6">
        {messages.length === 0 ? (
          <div className="night relative -mx-4 flex flex-1 flex-col items-center justify-center overflow-hidden rounded-none bg-night-950 px-4 py-14 text-center sm:mx-0 sm:rounded-2xl sm:px-8">
            <div className="night-grid pointer-events-none absolute inset-0 opacity-60 [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" aria-hidden />
            <div className="pointer-events-none absolute left-1/2 top-0 h-[300px] w-[520px] -translate-x-1/2 rounded-full bg-mint/10 blur-[100px]" aria-hidden />
            <div className="relative mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-mint/25 bg-mint/10 text-mint shadow-[0_0_40px_-8px_rgba(94,234,176,0.5)]">
              <Sparkles className="h-6 w-6" />
            </div>
            <h2 className="display relative text-[34px] leading-tight text-white sm:text-[40px]">How can I help you <span className="font-serif italic text-mint">plan?</span></h2>
            <p className="relative mt-3 max-w-md text-[14.5px] text-night-300">
              Ask about scholarships, universities, careers or your application timeline.{" "}
              {!user ? <><Link href="/signup?next=/assistant" className="text-mint underline-offset-4 hover:underline">Create a profile</Link> for personalised answers.</> : !personalised ? <><Link href="/profile" className="text-mint underline-offset-4 hover:underline">Complete your profile</Link> for personalised answers.</> : null}
            </p>
            <div className="relative mt-8 grid w-full gap-2 sm:grid-cols-2">
              {PROMPTS.map((p) => (
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
                <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full", m.role === "user" ? "bg-ink/[0.06] text-ink-2" : "bg-brand-700 text-white")} aria-hidden>
                  {m.role === "user" ? <UserRound className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
                </div>
                <div className={cn("min-w-0 max-w-[85%]", m.role === "user" ? "rounded-lg bg-brand-700 px-4 py-2.5 text-[14px] text-white" : "card px-4 py-3")}>
                  <span className="sr-only">{m.role === "user" ? "You said:" : "Path Assistant:"}</span>
                  {m.role === "user" ? <p className="whitespace-pre-wrap">{m.content}</p> : <Markdown text={m.content} />}
                  {m.role === "assistant" && (
                    <p className="mt-2 border-t border-line pt-2 text-[11.5px] text-ink-4">
                      {m.source === "ai" ? "AI explanation based on CareerPath data — confirm details on official sites." : "From CareerPath's matching engine and sourced dataset."}
                    </p>
                  )}
                </div>
              </div>
            ))}
            {busy && (
              <div className="flex gap-3" role="status" aria-label="Path Assistant is thinking">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-700 text-white"><Sparkles className="h-4 w-4" /></div>
                <div className="card flex items-center gap-1.5 px-4 py-3.5">
                  {[0, 1, 2].map((d) => <span key={d} className="h-1.5 w-1.5 animate-pulse rounded-full bg-ink-4" style={{ animationDelay: `${d * 150}ms` }} />)}
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>
        )}
      </div>

      <div className="sticky bottom-0 border-t border-line bg-paper/95 backdrop-blur">
        <form
          className="container max-w-3xl py-3"
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
        >
          <div className="flex items-end gap-2 rounded-lg border border-line-strong bg-surface p-1.5 focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-100">
            <label htmlFor="chat-input" className="sr-only">Ask Path Assistant</label>
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
              placeholder="Ask about scholarships, universities, careers…"
              className="max-h-40 min-h-[40px] flex-1 resize-none bg-transparent px-2.5 py-2 text-[14.5px] outline-none placeholder:text-ink-4"
            />
            <Button type="submit" size="sm" className="h-9 w-9 shrink-0 p-0" disabled={!input.trim() || busy} aria-label="Send message">
              <ArrowUp className="h-4 w-4" />
            </Button>
          </div>
          <p className="mt-1.5 text-center text-[11.5px] text-ink-4">Path Assistant can make mistakes. Requirements and deadlines should be confirmed on official sites.</p>
        </form>
      </div>
    </div>
  );
}
