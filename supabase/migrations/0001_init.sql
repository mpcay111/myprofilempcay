-- ═══════════════════════════════════════════════════════════════════════════
--  Portfolio CMS — initial schema
--
--  Run this once in your Supabase project:
--    Dashboard > SQL Editor > New query > paste > Run
--
--  Safe to re-run: every statement is idempotent.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── Content ────────────────────────────────────────────────────────────────
--  One row, holding the whole site as a single JSON document.
--
--  A normalised schema (projects, experience, skills as separate tables) would
--  be the textbook answer, but nothing here is ever queried in parts — every
--  page render reads the entire document at once, and every save rewrites it
--  atomically. Normalising would buy joins nobody performs and cost a
--  multi-table transaction on every edit. The shape is enforced by a Zod
--  schema at the application boundary instead.

create table if not exists public.site_content (
  id         smallint primary key default 1,
  data       jsonb       not null,
  updated_at timestamptz not null default now(),

  -- Enforces the singleton: there is one site, so there is one row.
  constraint site_content_singleton check (id = 1)
);

comment on table public.site_content is
  'Singleton row holding the entire portfolio content document.';

-- ── Revisions ──────────────────────────────────────────────────────────────
--  Every save snapshots the previous document before overwriting it. The admin
--  is a single text-editing surface with no undo of its own, so this is the
--  only thing standing between a mistaken paste and lost work.

create table if not exists public.content_revisions (
  id         bigint generated always as identity primary key,
  data       jsonb       not null,
  note       text,
  created_at timestamptz not null default now()
);

create index if not exists content_revisions_created_at_idx
  on public.content_revisions (created_at desc);

comment on table public.content_revisions is
  'Append-only history. Each row is site_content.data as it was before a save.';

-- ── Login attempts ─────────────────────────────────────────────────────────
--  Throttling state for the admin login. Serverless functions do not share
--  memory, so an in-process counter would reset on every cold start and give
--  no protection at all.

create table if not exists public.login_attempts (
  id         bigint generated always as identity primary key,
  ip         text        not null,
  successful boolean     not null,
  created_at timestamptz not null default now()
);

create index if not exists login_attempts_ip_created_at_idx
  on public.login_attempts (ip, created_at desc);

comment on table public.login_attempts is
  'Rate limiting for the admin login. Pruned to the last 24h on each write.';

-- ── Row level security ─────────────────────────────────────────────────────
--  RLS on, and deliberately NO policies. Postgres denies by default, so with
--  RLS enabled and no policy present, the anon and authenticated roles can
--  read and write nothing. Only the service role key — which lives in a server
--  environment variable and never reaches the browser — can touch these tables.
--
--  This is what makes it safe for site_content to be readable by the public
--  website: the website reads it on the server, not in the visitor's browser.

alter table public.site_content      enable row level security;
alter table public.content_revisions enable row level security;
alter table public.login_attempts    enable row level security;

-- ── Storage ────────────────────────────────────────────────────────────────
--  Bucket for uploaded screenshots, portraits and background images.
--  Public read: these images are displayed on a public website, so there is
--  nothing to hide, and public URLs let next/image cache them at the edge.
--  Writes still require the service role key.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'portfolio-media',
  'portfolio-media',
  true,
  10485760, -- 10 MB
  array['image/png', 'image/jpeg', 'image/webp', 'image/avif', 'image/gif']
)
on conflict (id) do update
  set public             = excluded.public,
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Anyone may read an object in this bucket; nobody may write without the
-- service role, which bypasses RLS.
drop policy if exists "portfolio_media_public_read" on storage.objects;
create policy "portfolio_media_public_read"
  on storage.objects for select
  using (bucket_id = 'portfolio-media');
