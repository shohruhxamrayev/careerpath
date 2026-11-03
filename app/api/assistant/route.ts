import { NextResponse } from "next/server";
import { geminiKey, runGemini } from "@/lib/ai/gemini";
import { AI_TOOLS, DATASET_SUMMARY, prefetchContext, runTool, TOOL_LABELS } from "@/lib/ai/server-tools";
import { normalizeProfile } from "@/lib/matching/profile";
import type { StudentProfile } from "@/lib/types";

/*
 * Path Assistant API — AI advisor with tool use over CareerPath's dataset.
 * - The API key is server-side only.
 * - Streams NDJSON events: {t:"step",label} · {t:"delta",text} · {t:"done"} · {t:"fallback"}.
 * - If no key is configured or anything fails before text is produced, the client uses the offline advisor.
 * - Eligibility and Profile Match come from the rule-based engine via tools; the model explains them.
 */

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MAX_MESSAGES = 16;
const MAX_CHARS = 3000;
const MAX_TOOL_ROUNDS = 6;

function systemPrompt(profileSummary: string) {
  return `You are **Path Assistant**, the senior education and career advisor inside CareerPath — a planning platform used mainly by students from Uzbekistan and Central Asia applying to universities, scholarships, competitions and internships worldwide.

## How you work
- You have tools over CareerPath's sourced dataset (${DATASET_SUMMARY()}) and a library of checked advising guides. **Use tools before answering** any question about specific universities, programmes, requirements, deadlines, costs, eligibility or the student's own options. Call several tools when useful (e.g. get_my_recommendations, then search_opportunities).
- For personal questions ("what should I…", "am I eligible…", "what fits me"), call get_my_recommendations first.
- For essays, tests, visas, funding, interviews, CVs, choosing countries/majors, call get_guide for the topic.
- For any specific job or profession (nurse, pilot, chef, actuary…), call search_occupations / get_occupation — all 1,016 O*NET occupations with US pay and outlook; link the /occupations page and say pay figures are US.
- For internships or first jobs open right now, call search_live_jobs and give the original posting links; point to the full live board at [Live jobs](/jobs). For online courses to learn a skill, call search_courses (Coursera catalogue) alongside search_certifications. Individual Erasmus Mundus master's programmes are in search_opportunities (query the field or the programme name).
- You may add general expert knowledge beyond the dataset (strategy, how systems work), but **never invent specific figures, deadlines, requirements or URLs**. If something isn't in tool results, say you don't have verified data and send the student to the official site.
- Each fact has a verification status (verified / indicative / unverified). Mention when something important is indicative or unverified.
- Deadlines are typical windows from previous cycles; tell students to confirm exact dates.
- Profile Match and eligibility come from CareerPath's engine. Explain them; never recalculate them. **Never describe anything as a chance or probability of admission.**

## Style
- Act like an experienced, warm, direct counsellor: give a clear recommendation, the reasoning, and concrete next steps. Be honest about gaps.
- Use markdown: short ### headings, bullet lists, **bold** names, and tables for comparisons. Link CareerPath pages with the relative URLs from tool results, e.g. [Chevening Scholarships](/opportunities/chevening-scholarships). Use official URLs only as returned by tools.
- Default to under ~250 words; go longer only for plans, comparisons or when asked.
- Reply in the student's language (English, Uzbek or Russian) if they write in it.
- Stay on education, careers and student life. Politely decline unrelated or harmful requests.
- Finish with one line exactly in this format, giving three short follow-up questions the student might ask next:
<<FOLLOWUPS>> question one | question two | question three

## Context
Today's date: ${new Date().toISOString().slice(0, 10)}.
${profileSummary}`;
}

export async function GET() {
  return NextResponse.json({ enabled: !!(process.env.ANTHROPIC_API_KEY || geminiKey()), provider: process.env.ANTHROPIC_API_KEY ? "claude" : geminiKey() ? "gemini" : null });
}

type Block = { type: "text"; text: string } | { type: "tool_use"; id: string; name: string; input: unknown };
type Msg = { role: "user" | "assistant"; content: string | unknown[] };

export async function POST(req: Request) {
  const key = process.env.ANTHROPIC_API_KEY;
  const useGemini = !key && !!geminiKey();
  if (!key && !useGemini) return NextResponse.json({ fallback: true, reason: "not-configured" });

  let body: { messages?: { role: string; content: string }[]; profile?: Partial<StudentProfile> | null; planner?: { title: string; status: string; deadline: string | null }[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ fallback: true, reason: "bad-request" }, { status: 400 });
  }

  const history: Msg[] = (body.messages ?? [])
    .filter((m) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string" && m.content.trim())
    .slice(-MAX_MESSAGES)
    .map((m) => ({ role: m.role as "user" | "assistant", content: m.content.replace(/<<FOLLOWUPS>>.*$/s, "").slice(0, MAX_CHARS) }));
  while (history.length && history[0].role !== "user") history.shift();
  if (!history.length) return NextResponse.json({ fallback: true, reason: "empty" }, { status: 400 });

  const profile = body.profile ? normalizeProfile(body.profile) : null;
  const planner = (body.planner ?? []).slice(0, 30);
  const summary = profile
    ? `The student is signed in. Basic profile: ${JSON.stringify({ name: profile.personal.name?.split(" ")[0], country: profile.personal.country, level: profile.education.level, seeking: profile.education.seeking, field: profile.education.field, major: profile.education.major, goals: profile.goals })}. Use get_my_recommendations for matches.`
    : "The student is not signed in (no profile). Answer generally and suggest creating a profile for personalised matches.";
  const lastQ = String([...history].reverse().find((m) => m.role === "user")?.content ?? "");
  const pack = JSON.stringify(prefetchContext(lastQ, profile, planner)).slice(0, 28000);
  const system = `${systemPrompt(summary)}

## Pre-fetched data for the latest question
CareerPath already looked this up for you. If it covers the question, answer directly WITHOUT calling tools (faster for the student). Call tools only for anything missing.
${pack}`;
  const model = process.env.ANTHROPIC_MODEL || "claude-sonnet-5-5";

  const enc = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (o: unknown) => controller.enqueue(enc.encode(JSON.stringify(o) + "\n"));
      let produced = false;
      send({ t: "step", label: "Reading CareerPath data" });
      try {
        if (useGemini) {
          const tracked = (o: unknown) => {
            if ((o as { t?: string }).t === "delta") produced = true;
            send(o);
          };
          produced = (await runGemini({ history: history as { role: "user" | "assistant"; content: string }[], system, profile, planner, send: tracked })) || produced;
          send(produced ? { t: "done" } : { t: "fallback" });
          return;
        }
        const messages: Msg[] = [...history];
        for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
          const ctrl = new AbortController();
          const timer = setTimeout(() => ctrl.abort(), 45000);
          const r = await fetch(`${process.env.ANTHROPIC_BASE_URL || "https://api.anthropic.com"}/v1/messages`, {
            method: "POST",
            signal: ctrl.signal,
            headers: { "content-type": "application/json", "x-api-key": key!, "anthropic-version": "2023-06-01" },
            body: JSON.stringify({ model, max_tokens: 2500, system, tools: AI_TOOLS, messages, stream: true }),
          });
          if (!r.ok || !r.body) {
            clearTimeout(timer);
            throw new Error(`upstream ${r.status}`);
          }
          const blocks: Block[] = [];
          const json: Record<number, string> = {};
          let stop = "";
          const reader = r.body.getReader();
          const dec = new TextDecoder();
          let buf = "";
          for (;;) {
            const { done, value } = await reader.read();
            if (done) break;
            buf += dec.decode(value, { stream: true });
            let nl: number;
            while ((nl = buf.indexOf("\n")) >= 0) {
              const line = buf.slice(0, nl).trim();
              buf = buf.slice(nl + 1);
              if (!line.startsWith("data:")) continue;
              let ev: { type: string; index: number; content_block?: { type: string; id?: string; name?: string }; delta?: { type: string; text?: string; partial_json?: string; stop_reason?: string } };
              try {
                ev = JSON.parse(line.slice(5));
              } catch {
                continue;
              }
              if (ev.type === "content_block_start" && ev.content_block) {
                if (ev.content_block.type === "text") blocks[ev.index] = { type: "text", text: "" };
                else if (ev.content_block.type === "tool_use") {
                  blocks[ev.index] = { type: "tool_use", id: ev.content_block.id!, name: ev.content_block.name!, input: {} };
                  json[ev.index] = "";
                  send({ t: "step", label: TOOL_LABELS[ev.content_block.name!] ?? "Working" });
                }
              } else if (ev.type === "content_block_delta" && ev.delta) {
                if (ev.delta.type === "text_delta" && ev.delta.text) {
                  const b = blocks[ev.index];
                  if (b?.type === "text") b.text += ev.delta.text;
                  produced = true;
                  send({ t: "delta", text: ev.delta.text });
                } else if (ev.delta.type === "input_json_delta") json[ev.index] = (json[ev.index] ?? "") + (ev.delta.partial_json ?? "");
              } else if (ev.type === "content_block_stop") {
                const b = blocks[ev.index];
                if (b?.type === "tool_use") {
                  try {
                    b.input = json[ev.index] ? JSON.parse(json[ev.index]) : {};
                  } catch {
                    b.input = {};
                  }
                }
              } else if (ev.type === "message_delta" && ev.delta?.stop_reason) stop = ev.delta.stop_reason;
            }
          }
          clearTimeout(timer);
          const content = blocks.filter(Boolean).filter((b) => b.type !== "text" || b.text.trim());
          if (stop !== "tool_use") break;
          messages.push({ role: "assistant", content });
          const results = await Promise.all(
            content
              .filter((b): b is Extract<Block, { type: "tool_use" }> => b.type === "tool_use")
              .map(async (b) => {
                let out: unknown;
                try {
                  out = await runTool(b.name, b.input, profile, planner);
                } catch {
                  out = { error: "Tool failed" };
                }
                return { type: "tool_result", tool_use_id: b.id, content: JSON.stringify(out).slice(0, 30000) };
              }),
          );
          messages.push({ role: "user", content: results });
          if (produced) send({ t: "delta", text: "\n\n" });
        }
        send(produced ? { t: "done" } : { t: "fallback" });
      } catch (err) {
        // reason helps diagnose provider problems; never includes the key
        send(produced ? { t: "done", partial: true } : { t: "fallback", reason: String((err as Error)?.message ?? "error").slice(0, 240) });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, { headers: { "content-type": "application/x-ndjson; charset=utf-8", "cache-control": "no-store" } });
}
