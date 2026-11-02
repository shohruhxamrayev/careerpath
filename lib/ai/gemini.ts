import { AI_TOOLS, runTool, TOOL_LABELS } from "@/lib/ai/server-tools";
import type { StudentProfile } from "@/lib/types";

/*
 * Google Gemini provider for the Path Advisor (free tier friendly).
 * Same tools as the Claude provider; streams text deltas and tool steps through `send`.
 * Returns true if any text was produced. Throws on unrecoverable errors so the client can fall back.
 */

type Send = (o: unknown) => void;
type Planner = { title: string; status: string; deadline: string | null }[];
type Part = { text?: string; thought?: boolean; functionCall?: { name: string; args?: Record<string, unknown> }; functionResponse?: unknown; thoughtSignature?: string };
type Content = { role: "user" | "model"; parts: Part[] };

const MAX_ROUNDS = 6;
// Tried in order: an explicit GEMINI_MODEL, then the rolling "latest Flash" alias, then stable fallbacks.
const MODELS = () => Array.from(new Set([process.env.GEMINI_MODEL, "gemini-flash-latest", "gemini-2.5-flash", "gemini-flash-lite-latest", "gemini-2.5-flash-lite"].filter(Boolean) as string[]));

/** Convert our JSON-schema tool definitions into Gemini function declarations (OpenAPI subset). */
function clean(schema: unknown): unknown {
  if (Array.isArray(schema)) return schema.map(clean);
  if (!schema || typeof schema !== "object") return schema;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(schema)) {
    if (k === "minItems" || k === "maxItems" || k === "additionalProperties") continue;
    out[k] = clean(v);
  }
  return out;
}
const DECLARATIONS = AI_TOOLS.map((t) => {
  const params = clean(t.input_schema) as { properties?: Record<string, unknown> };
  return { name: t.name, description: t.description, ...(params.properties && Object.keys(params.properties).length ? { parameters: params } : {}) };
});

export function geminiKey() {
  return process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "";
}

export async function runGemini(opts: {
  history: { role: "user" | "assistant"; content: string }[];
  system: string;
  profile: StudentProfile | null;
  planner: Planner;
  send: Send;
}): Promise<boolean> {
  const key = geminiKey();
  const contents: Content[] = opts.history.map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] }));
  let produced = false;
  const models = MODELS();
  let mi = 0;

  for (let round = 0; round < MAX_ROUNDS; round++) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 45000);
    const base = process.env.GEMINI_BASE_URL || "https://generativelanguage.googleapis.com";
    const r = await fetch(`${base}/v1beta/models/${models[mi]}:streamGenerateContent?alt=sse`, {
      method: "POST",
      signal: ctrl.signal,
      headers: { "content-type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: opts.system }] },
        contents,
        tools: [{ functionDeclarations: DECLARATIONS }],
        generationConfig: { temperature: 0.4, maxOutputTokens: 3000 },
      }),
    });
    if (!r.ok || !r.body) {
      clearTimeout(timer);
      // unknown model or quota exhausted on this model → try the next one (before any text was sent)
      if ((r.status === 404 || r.status === 400 || r.status === 429 || r.status >= 500) && mi < models.length - 1 && !produced) {
        mi++;
        round--;
        continue;
      }
      let detail = "";
      try {
        detail = ((await r.json()) as { error?: { message?: string } }).error?.message?.slice(0, 200) ?? "";
      } catch {
        /* no body */
      }
      throw new Error(`gemini ${r.status} ${models[mi]}: ${detail}`);
    }

    const modelParts: Part[] = [];
    const calls: { name: string; args: Record<string, unknown> }[] = [];
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
        let ev: { candidates?: { content?: { parts?: Part[] } }[] };
        try {
          ev = JSON.parse(line.slice(5));
        } catch {
          continue;
        }
        for (const part of ev.candidates?.[0]?.content?.parts ?? []) {
          modelParts.push(part); // keep parts verbatim (incl. thought signatures) for the next round
          if (part.thought) continue;
          if (part.functionCall) {
            calls.push({ name: part.functionCall.name, args: part.functionCall.args ?? {} });
            opts.send({ t: "step", label: TOOL_LABELS[part.functionCall.name] ?? "Working" });
          } else if (part.text) {
            produced = true;
            opts.send({ t: "delta", text: part.text });
          }
        }
      }
    }
    clearTimeout(timer);
    if (!calls.length) break;

    contents.push({ role: "model", parts: modelParts });
    contents.push({
      role: "user",
      parts: calls.map((c) => {
        let result: unknown;
        try {
          result = runTool(c.name, c.args, opts.profile, opts.planner);
        } catch {
          result = { error: "Tool failed" };
        }
        // keep payloads compact for free-tier token limits
        const json = JSON.stringify(result);
        return { functionResponse: { name: c.name, response: { result: json.length > 24000 ? JSON.parse(JSON.stringify(result, (_k, v) => (typeof v === "string" && v.length > 300 ? v.slice(0, 300) + "…" : v))) : result } } };
      }),
    });
    if (produced) opts.send({ t: "delta", text: "\n\n" });
  }
  return produced;
}
