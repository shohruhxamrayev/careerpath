-- CareerPath database schema (Supabase / Postgres)
-- Run in the Supabase SQL editor. Public catalogue tables are readable by everyone;
-- private student data is protected by Row Level Security so students only see their own rows.

create extension if not exists "pgcrypto";

-- ───────────── Catalogue (public, read-only to clients) ─────────────

create table if not exists sources (
  id uuid primary key default gen_random_uuid(),
  org text not null,
  url text not null,
  status text not null check (status in ('verified','indicative','unverified')),
  last_verified date,
  note text
);

create table if not exists universities (
  slug text primary key,
  name text not null,
  short_name text,
  country text not null,
  country_code char(2) not null,
  city text not null,
  region text not null,
  website text not null,
  admissions_url text not null,
  application_platform jsonb,
  type text check (type in ('public','private')),
  founded int,
  overview text not null,
  language_of_instruction text,
  selectivity text check (selectivity in ('most','high','moderate','accessible')),
  qs_rank_2026 int,
  tuition_band text,
  tuition_display text,
  tuition_source uuid references sources(id),
  aid_kind text,
  aid_summary text,
  aid_source uuid references sources(id),
  international_note text,
  updated_at timestamptz default now()
);

create table if not exists university_programs (
  id uuid primary key default gen_random_uuid(),
  university_slug text not null references universities(slug) on delete cascade,
  name text not null,
  field text not null,
  levels text[] not null default '{}'
);

create table if not exists university_requirements (
  id uuid primary key default gen_random_uuid(),
  university_slug text not null references universities(slug) on delete cascade,
  kind text not null check (kind in ('english','testing','academic','other')),
  ielts numeric(2,1),
  toefl int,
  policy text,
  note text,
  source_id uuid references sources(id)
);

create table if not exists university_deadlines (
  id uuid primary key default gen_random_uuid(),
  university_slug text not null references universities(slug) on delete cascade,
  label text not null,
  timing text not null,
  months int[] not null default '{}',
  source_id uuid references sources(id)
);

create table if not exists opportunities (
  slug text primary key,
  title text not null,
  organization text not null,
  type text not null,
  summary text not null,
  overview text not null,
  fields text[],           -- null = any field
  levels text[] not null,
  format text not null,
  location text,
  host_countries text[] default '{}',
  funding_kind text,
  funding_summary text,
  application_steps text[] default '{}',
  deadline_label text,
  deadline_timing text,
  deadline_months int[] default '{}',
  official_url text not null,
  source_id uuid references sources(id),
  tags text[] default '{}'
);

-- Scholarships are opportunities of type 'scholarship'; this view keeps a named entry point.
create or replace view scholarships as select * from opportunities where type = 'scholarship';

create table if not exists opportunity_requirements (
  id uuid primary key default gen_random_uuid(),
  opportunity_slug text not null references opportunities(slug) on delete cascade,
  kind text not null check (kind in ('level','age','english','gpa','work','nationality','field','other')),
  payload jsonb not null default '{}'::jsonb,  -- e.g. {"min":18,"max":28}
  text text not null
);

create table if not exists careers (
  slug text primary key,
  title text not null,
  family text,
  summary text,
  what_it_is text,
  day_to_day text[],
  related_fields text[],
  interests text[],
  education_paths text[],
  entry_roles text[],
  extracurriculars text[],
  majors text[],
  outlook text
);

create table if not exists skills (
  slug text primary key,
  name text not null,
  category text,
  summary text,
  why_it_matters text,
  aliases text[] default '{}'
);

create table if not exists career_skills (
  career_slug text references careers(slug) on delete cascade,
  skill_slug text references skills(slug) on delete cascade,
  primary key (career_slug, skill_slug)
);

-- ───────────── Private student data ─────────────

create table if not exists student_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,   -- StudentProfile document (see lib/types.ts)
  updated_at timestamptz not null default now()
);

create table if not exists saved_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('university','opportunity','career')),
  slug text not null,
  saved_at timestamptz not null default now(),
  unique (user_id, kind, slug)
);

create table if not exists applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('university','opportunity','custom')),
  slug text,
  title text not null,
  subtitle text,
  status text not null default 'interested'
    check (status in ('interested','preparing','applied','interview','accepted','rejected')),
  deadline date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists planner_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  application_id uuid references applications(id) on delete set null,
  title text not null,
  due date,
  done boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  body text,
  link text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists saved_items_user_idx on saved_items(user_id);
create index if not exists applications_user_idx on applications(user_id);
create index if not exists planner_tasks_user_idx on planner_tasks(user_id, due);

-- ───────────── Row Level Security ─────────────

alter table sources enable row level security;
alter table universities enable row level security;
alter table university_programs enable row level security;
alter table university_requirements enable row level security;
alter table university_deadlines enable row level security;
alter table opportunities enable row level security;
alter table opportunity_requirements enable row level security;
alter table careers enable row level security;
alter table skills enable row level security;
alter table career_skills enable row level security;

do $$
declare t text;
begin
  foreach t in array array['sources','universities','university_programs','university_requirements','university_deadlines',
                           'opportunities','opportunity_requirements','careers','skills','career_skills']
  loop
    execute format('drop policy if exists "public read" on %I', t);
    execute format('create policy "public read" on %I for select using (true)', t);
  end loop;
end $$;

alter table student_profiles enable row level security;
alter table saved_items enable row level security;
alter table applications enable row level security;
alter table planner_tasks enable row level security;
alter table notifications enable row level security;

do $$
declare t text;
begin
  foreach t in array array['student_profiles','saved_items','applications','planner_tasks','notifications']
  loop
    execute format('drop policy if exists "owner select" on %I', t);
    execute format('drop policy if exists "owner insert" on %I', t);
    execute format('drop policy if exists "owner update" on %I', t);
    execute format('drop policy if exists "owner delete" on %I', t);
    execute format('create policy "owner select" on %I for select using (auth.uid() = user_id)', t);
    execute format('create policy "owner insert" on %I for insert with check (auth.uid() = user_id)', t);
    execute format('create policy "owner update" on %I for update using (auth.uid() = user_id) with check (auth.uid() = user_id)', t);
    execute format('create policy "owner delete" on %I for delete using (auth.uid() = user_id)', t);
  end loop;
end $$;
