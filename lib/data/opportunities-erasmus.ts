import type { Field, Opportunity } from "@/lib/types";
import raw from "./research/erasmus-mundus-2026.json";
import { deadline, src } from "./sources";

/**
 * Every Erasmus Mundus Joint Master listed in the European Commission's official
 * Erasmus Mundus Catalogue (EACEA), imported Nov 2026: [acronym, title, website, project page].
 * Fields are inferred from the programme title; everything else links to the consortium.
 */
type Row = [string, string, string, string];

const CATALOGUE = "https://www.eacea.ec.europa.eu/scholarships/erasmus-mundus-catalogue_en";

const RULES: [RegExp, Field[]][] = [
  [/artificial intelligence|\bai\b|data science|big data|data-intensive|data engineering|analytics|imaging|computer vision/i, ["data-science", "computer-science"]],
  [/software|cyber|security and cloud|computing|information technolog|robot|embedded|digital earth|games|\bict\b/i, ["computer-science", "engineering"]],
  [/engineering|mechatronic|photonic|microelectronic|nano|materials|structur|manufactur|energy|power|hydrogen|nuclear|electric|ship|aeronaut|textile|acoustic|mechanic|catalys|membrane|accelerator|laser|sensor|construction|infrastructure|offshore/i, ["engineering"]],
  [/physics|quantum|astro|\bspace science|chemi|spectroscop|geoscien|planetary|biolog|neuro|genom|biotech|biodiversity|ecolog|life science|toxicolog|ageing|mathemat/i, ["natural-sciences"]],
  [/mathemat|quantitative|modelling|simulation/i, ["mathematics"]],
  [/health|medic|vaccin|disease|drug|pharma|skin|physiolog|nanomedicine|one health/i, ["medicine-health"]],
  [/environment|climate|sustainab|forest|water|marine|coastal|ocean|soil|agri|food|plant|aquacultur|island|ecohydrolog|flood|groundwater|circular|renewable|green|rural|natural resource|biomass|bioeconom|insects/i, ["environment"]],
  [/econom|finance|market/i, ["economics"]],
  [/management|business|entrepreneur|innovation|tourism|leisure|sport/i, ["business"]],
  [/law|legal|intellectual property|human rights/i, ["law"]],
  [/politic|polic|governance|\bsecurity\b|defen[cs]e|strategic|global studies|european studies|eurasian|peace|humanitarian|public sector|migration/i, ["politics-ir"]],
  [/social|psycholog|criminolog|gender|diversity|migration|child|youth|\bwork\b|religio|inclusion|\bcultur/i, ["social-sciences"]],
  [/education|teaching|learning|pedagog|higher education/i, ["education"]],
  [/literatur|linguistic|lexicograph|language|history|heritage|prehistory|archaeolog|german studies|philosoph|museum|multilingual/i, ["humanities"]],
  [/\barts?\b|film|documentary|dance|theatre|animation|sound|design|creativ|choreo/i, ["arts-design"]],
  [/architect|urban|city|cities|built environment|earthen|cartograph|geospatial|geo-information/i, ["architecture"]],
  [/journalism|media|communication/i, ["media-communications"]],
];

function fieldsFor(title: string): Field[] {
  const out = new Set<Field>();
  for (const [re, fs] of RULES) if (re.test(title)) fs.forEach((f) => out.add(f));
  return out.size ? [...out].slice(0, 4) : ["social-sciences"];
}

function slugify(s: string) {
  return s
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function cleanTitle(t: string) {
  return t.replace(/\s*[│|]\s*/g, " — ").replace(/\s+/g, " ").trim();
}

export const erasmusProgrammes: Opportunity[] = (raw as Row[]).map(([acronym, title, website, project]) => {
  const name = cleanTitle(title);
  const fields = fieldsFor(name);
  const display = name.toLowerCase().includes(acronym.toLowerCase()) ? name : `${name} (${acronym})`;
  return {
    slug: `em-${slugify(acronym)}`,
    title: display,
    organization: `${acronym} consortium · Erasmus Mundus`,
    type: "scholarship",
    summary: `Erasmus Mundus Joint Master taught across several universities — EU scholarships for top applicants.`,
    overview: `${name} is an Erasmus Mundus Joint Master listed in the European Commission's official Erasmus Mundus Catalogue. Students study in at least two countries of the consortium and graduate with a joint or multiple degree. Many programmes award EU-funded Erasmus Mundus scholarships to the best-ranked applicants of any nationality; programmes nearing the end of EU funding may no longer offer them, so confirm scholarship availability on the programme website.`,
    fields,
    levels: ["undergraduate", "graduate"],
    format: "in-person",
    location: "Multiple countries (mostly Europe)",
    hostCountries: ["Europe"],
    funding: {
      kind: "varies",
      summary: "EU Erasmus Mundus scholarship for top-ranked applicants where the programme still has funding: tuition, travel and a monthly allowance.",
    },
    requirements: [
      { kind: "level", levels: ["undergraduate", "graduate"], text: "Bachelor's degree (or final-year students, if the programme allows) in a related field" },
      { kind: "nationality", text: "Open to students of any nationality" },
      { kind: "english", text: "English proficiency — test and score set by the programme" },
      { kind: "other", text: "Selection, documents and scholarship rules are set by the consortium" },
    ],
    applicationSteps: [
      "Open the programme website and read the admission and scholarship pages.",
      "Check the exact deadline for the next intake (most close between October and January).",
      "Prepare transcripts, CV, motivation letter, references and an English test.",
      "Apply through the consortium's own portal and tick the scholarship option.",
    ],
    deadline: deadline(
      "Programme deadline",
      "Usually October–January for the next autumn intake — confirm on the programme site",
      [10, 11, 12, 1],
      src("European Commission — Erasmus Mundus Catalogue", CATALOGUE, "indicative"),
    ),
    officialUrl: website,
    source: { org: "European Commission (EACEA) — Erasmus Mundus Catalogue", url: CATALOGUE, status: "verified", lastVerified: "2026-11", note: `EU project page: ${project}` },
    tags: ["Erasmus Mundus", "master's", "Europe", "multi-country", acronym],
  };
});
