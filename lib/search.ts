import { careers } from "@/lib/data/careers";
import { opportunities } from "@/lib/data/opportunities";
import { skills } from "@/lib/data/skills";
import { FIELD_LABELS, OPPORTUNITY_TYPE_LABELS } from "@/lib/data/taxonomy";
import { universities } from "@/lib/data/universities";

export type SearchKind = "university" | "opportunity" | "career" | "program" | "skill";

export interface SearchDoc {
  kind: SearchKind;
  id: string;
  title: string;
  subtitle: string;
  href: string;
  text: string; // lowercased haystack
  titleLc: string;
}

export const SEARCH_KIND_LABELS: Record<SearchKind, string> = {
  university: "Universities",
  opportunity: "Opportunities",
  career: "Careers",
  program: "Programs",
  skill: "Skills",
};

let index: SearchDoc[] | null = null;

function build(): SearchDoc[] {
  const docs: SearchDoc[] = [];
  const add = (d: Omit<SearchDoc, "titleLc" | "text"> & { text: string }) => docs.push({ ...d, titleLc: d.title.toLowerCase(), text: d.text.toLowerCase() });
  for (const u of universities) {
    add({
      kind: "university", id: u.slug, title: u.name, subtitle: `${u.city}, ${u.country}`, href: `/universities/${u.slug}`,
      text: [u.name, u.shortName, u.city, u.country, u.region, u.overview, ...u.fields.map((f) => FIELD_LABELS[f]), ...u.notablePrograms].join(" "),
    });
    for (const p of u.notablePrograms) {
      add({ kind: "program", id: `${u.slug}:${p}`, title: p, subtitle: u.shortName ?? u.name, href: `/universities/${u.slug}#programs`, text: `${p} ${u.name} ${u.shortName ?? ""} ${u.country}` });
    }
  }
  for (const o of opportunities) {
    add({
      kind: "opportunity", id: o.slug, title: o.title, subtitle: `${OPPORTUNITY_TYPE_LABELS[o.type]} · ${o.organization}`, href: `/opportunities/${o.slug}`,
      text: [o.title, o.organization, o.summary, o.location, OPPORTUNITY_TYPE_LABELS[o.type], ...o.tags, ...(o.fields === "any" ? [] : o.fields.map((f) => FIELD_LABELS[f]))].join(" "),
    });
  }
  for (const c of careers) {
    add({
      kind: "career", id: c.slug, title: c.title, subtitle: c.family, href: `/careers/${c.slug}`,
      text: [c.title, c.family, c.summary, ...c.majors, ...c.entryRoles, ...c.relatedFields.map((f) => FIELD_LABELS[f]), ...c.interests].join(" "),
    });
  }
  for (const s of skills) {
    add({ kind: "skill", id: s.slug, title: s.name, subtitle: s.summary, href: `/careers?skill=${s.slug}`, text: [s.name, s.summary, ...s.aliases].join(" ") });
  }
  return docs;
}

export function searchAll(query: string, kinds?: SearchKind[]): SearchDoc[] {
  index ??= build();
  const tokens = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
  if (!tokens.length) return [];
  const scored: { d: SearchDoc; s: number }[] = [];
  for (const d of index) {
    if (kinds && !kinds.includes(d.kind)) continue;
    if (!tokens.every((t) => d.text.includes(t))) continue;
    let s = 0;
    for (const t of tokens) {
      if (d.titleLc.startsWith(t)) s += 6;
      else if (new RegExp(`\\b${t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`).test(d.titleLc)) s += 4;
      else if (d.titleLc.includes(t)) s += 2;
      else s += 1;
    }
    if (d.kind === "program") s -= 1;
    scored.push({ d, s });
  }
  return scored.sort((a, b) => b.s - a.s || a.d.title.localeCompare(b.d.title)).map((x) => x.d);
}
