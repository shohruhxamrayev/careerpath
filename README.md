# CareerPath

**Find your path. Build your future.** A personalised education, opportunity and career platform for students. One detailed profile drives matches for universities, scholarships, competitions, internships, careers and skills, and a planner tracks every application.

## Quick start

```bash
npm install
npm run dev        # http://localhost:3000
```

Production build:

```bash
npm run build && npm start
```

No configuration is needed. Without environment variables the app runs fully in **local mode**: accounts and data are stored in the browser (passwords as salted PBKDF2 hashes), and the assistant uses its built-in rule-based engine.

## Environment variables (optional)

Copy `.env.example` to `.env.local`.

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Switches auth and storage to Supabase. Run `supabase/schema.sql` in the SQL editor first (tables + Row Level Security). |
| `ANTHROPIC_API_KEY` | Enables AI explanations in Path Assistant. Server-side only. |
| `ANTHROPIC_MODEL` | Optional model override (default `claude-sonnet-5-5`). |

If the AI key is missing or a request fails, the assistant silently falls back to verified, rule-based answers. It never shows an API error.

## Routes

| Route | What it does |
| --- | --- |
| `/` | Dark showcase landing page: interactive 3D globe of all universities, scroll story, 3D career constellation, live example-profile preview from the real matching engine |
| `/signup`, `/login`, `/reset-password` | Authentication (local or Supabase) |
| `/profile` | Full student profile editor with completion % and missing-field list |
| `/universities`, `/universities/[slug]` | Search, 10 filters, sorting, URL-shareable state, grid or 3D globe view; detail pages with a location globe, with sourced requirements and Profile Match |
| `/opportunities`, `/opportunities/[slug]` | 10 opportunity types, deadline radar, filters, eligibility-only view; detail pages with rule-by-rule eligibility |
| `/careers`, `/careers/[slug]` | Career paths with skills, routes, entry roles, resources and Career Match |
| `/for-you` | Personalised recommendations, each with its reason, plus next steps |
| `/planner` | Overview, applications, tasks, calendar and saved items |
| `/search` | Categorised global search (also ⌘K / Ctrl+K anywhere) |
| `/assistant` | Path Assistant |
| `/methodology` | How matching, data sources and privacy work |

## Project structure

```
app/                 routes (App Router) + API route for the assistant
components/          UI kit, cards, filters, planner, assistant, layout
lib/data/            seed data: universities, opportunities, careers, skills, taxonomy, sources
lib/matching/        rule-based engine: profile, university, opportunity, career, recommendations
lib/ai/              assistant fallback engine + AI context builder
lib/auth/            local auth fallback + Supabase client
lib/store/           app state provider + local/Supabase repositories
supabase/schema.sql  database schema with Row Level Security
```

## Design

- **Hybrid look:** dark cinematic showcase (home, page headers, footer) and light, high-contrast tool pages for reading and planning.
- **Type:** Bricolage Grotesque (display), Instrument Serif italic (accents), Geist Sans/Mono (UI and data). All self-hosted.
- **3D:** three.js via @react-three/fiber, loaded lazily on the client only. Falls back to a static view without WebGL and respects reduced-motion. Land dots come from Natural Earth via `scripts/build-globe-land.mjs`.

## Dataset

119 universities in 27 countries (QS World University Rankings 2027 positions where published), 101 opportunities across 10 types, 18 careers. Research log: `lib/data/research/NOTES.md`.

## Matching

- **Universities — Profile Match** = eligibility (25%) + academic fit (20%) + interest/major fit (25%) + profile alignment (15%) + financial fit (15%).
- **Opportunities** keep eligibility (60%) separate from personal fit (40%). Any unmet rule marks the item *Not eligible* and caps its score.
- **Careers** compare interests, field, skills, goals and activities, and list strengths and skills to develop.
- Every match states that it is informational and **does not predict admission**.

## Data honesty

- Seed data compiled November 2026. Every time-sensitive fact carries a source, an organisation and a status: `verified`, `indicative` or `unverified`.
- QS 2027 ranks are included only where checked against the published table.
- Deadlines are typical timing from previous cycles, never claimed as confirmed dates. Students enter confirmed dates in the planner.
- Tuition uses indicative bands. Figures not known with confidence are left out and labelled.
- Application links point to official university or programme domains only.

**Before launch:** have someone verify the `indicative` and `unverified` fields for the current cycle and set `status: "verified"` with a `lastVerified` month.

## Testing performed

- `tsc` and ESLint pass with no errors. The production build generates 254 pages.
- A crawler followed every internal link (434 URLs): no broken links, and no console errors besides the intentional 404 test.
- An end-to-end browser suite of 18 journeys passed with zero console or page errors: signup validation, profile build and persistence, field validation, For You, eligibility breakdowns, filters with URL state, save and add-to-planner, planner tasks/status/calendar/saved/custom/remove, Career Match, global search and empty states, all six assistant example questions, logout/login redirect, password reset, guest redirect, and mobile (390px) layouts with the filter drawer and mobile nav. Layouts were also checked at 1280px and 820px with no horizontal overflow.
