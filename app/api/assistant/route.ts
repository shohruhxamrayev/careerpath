import { NextResponse } from "next/server";

/*
 * Path Assistant API.
 * - The API key is read server-side only and never sent to the browser.
 * - If no key is configured or the upstream call fails, the client uses its rule-based fallback.
 * - Core eligibility is computed by the rule-based engine and passed in as context;
 *   the model explains and prioritises, it does not decide eligibility.
 */

export const dynamic = "force-dynamic";

const MAX_MESSAGES = 12;
const MAX_CHARS = 2000;

const SYSTEM = `You are Path Assistant, the advisor inside CareerPath — an education and career planning platform for students.

Rules:
- Use the CONTEXT JSON for anything about specific universities, scholarships, requirements, deadlines and match scores. Do not invent requirements, deadlines, figures or URLs. If something isn't in the context, say you don't have verified data and point the student to the official site.
- Eligibility and Profile Match scores come from CareerPath's rule-based engine. Explain them; never recalculate or contradict them.
- Never describe a match as a chance or probability of admission or selection.
- Deadlines in the context are typical patterns from previous cycles. Always tell students to confirm exact dates on official pages.
- Be practical and structured. Use short markdown: ### headings, bullet lists, **bold** for names. Link CareerPath pages using the relative URLs given in the context, e.g. [Chevening Scholarships](/opportunities/chevening-scholarships).
- Keep answers under about 300 words unless the student asks for a detailed plan.
- Be encouraging but honest about gaps.`;

export async function GET() {
  return NextResponse.json({ enabled: !!process.env.ANTHROPIC_API_KEY });
}

export async function POST(req: Request) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return NextResponse.json({ fallback: true, reason: "not-configured" });

  let body: { messages?: { role: string; content: string }[]; context?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ fallback: true, reason: "bad-request" }, { status: 400 });
  }

  const messages = (body.messages ?? [])
    .filter((m) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string" && m.content.trim())
    .slice(-MAX_MESSAGES)
    .map((m) => ({ role: m.role as "user" | "assistant", content: m.content.slice(0, MAX_CHARS) }));
  while (messages.length && messages[0].role !== "user") messages.shift();
  if (!messages.length) return NextResponse.json({ fallback: true, reason: "empty" }, { status: 400 });

  const context = JSON.stringify(body.context ?? {}).slice(0, 24000);

  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 30000);
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      signal: ctrl.signal,
      headers: { "content-type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || "claude-sonnet-5-5",
        max_tokens: 1200,
        system: `${SYSTEM}\n\nToday's date: ${new Date().toISOString().slice(0, 10)}.\n\nCONTEXT:\n${context}`,
        messages,
      }),
    });
    clearTimeout(timer);
    if (!r.ok) return NextResponse.json({ fallback: true, reason: "upstream" });
    const data = (await r.json()) as { content?: { type: string; text?: string }[] };
    const text = data.content?.filter((c) => c.type === "text").map((c) => c.text).join("\n").trim();
    if (!text) return NextResponse.json({ fallback: true, reason: "empty-response" });
    return NextResponse.json({ text });
  } catch {
    return NextResponse.json({ fallback: true, reason: "network" });
  }
}
