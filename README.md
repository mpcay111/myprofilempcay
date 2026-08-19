# Portfolio — Mark Anthony Cayanan

A single-page portfolio for an e-commerce operations director who builds his own
operational systems. Next.js 14 (App Router), TypeScript, Tailwind CSS.

---

## Running it

```bash
npm install
```

```bash
npm run dev
```

Then open http://localhost:3000.

```bash
npm run build
```

---

## Editing the content

There are two ways in, and they are the same content:

- **[`/admin`](#the-admin-page)** — a browser editor, no code. This is the one to
  use day to day. Requires the Supabase setup below.
- **`content/profile.ts`** — the seed content compiled into the repo. It is what
  the site shows before the database is set up, and what it falls back to if the
  database is ever unreachable. Once you have saved from the admin, the database
  is the source of truth and edits to this file no longer change the live site.

Anything still wrapped in `[SQUARE BRACKETS]` is an unfilled placeholder.
Search `content/profile.ts` for `[` to find every one, or just look for the
dotted teal underlines on the page.

Placeholders behave deliberately:

- **In prose**, they render on the page with a dotted teal underline. You can't
  fill in what you can't see, but they're marked so they're never mistaken for
  finished writing.
- **In the spec rail** (Role / Built with / Used by / Period / Impact), a missing
  value renders as an em dash. In a column of hard specifics, an honest blank
  reads better than a bracketed note.
- **In machine-readable output** — JSON-LD, meta tags, the OG image — they are
  stripped entirely, so a half-finished site never publishes `[Year]` to Google.

### The biggest remaining gap

Every project's `impact` field is `null`. The write-ups describe what each system
*does* very well, but not what changed because of it. `impact` is the last row of
every spec rail, so right now the strongest section on the site ends on seven em
dashes.

"Cut the hiring cycle from three weeks to six days" is worth more than any
feature list. Fill those in wherever you can remember real figures — and leave
the rest `null` rather than inventing them. A blank is credible; a vague
superlative is not.

### Before publishing

All of these are editable from `/admin` under the tab named in brackets:

- **Site URL** *(Identity)* — still `example.com`. It drives the canonical URL,
  the sitemap, `robots.txt`, and the social card. Set it before you share a link.
- **LinkedIn URL** *(Contact)* — still `[username]`. Until it is filled, the site
  deliberately shows your name as plain text rather than linking to a 404.
- **Show phone** *(Contact)* — off. Your number is stored but is not rendered, not
  in the JSON-LD, and not in the page source. A résumé goes to people you chose;
  a website is readable by scrapers.
- **Available for work** *(Identity)* — off. Turn it on for the availability badge.

---

## Screenshots

Project screenshots live in `public/projects/` and are referenced by the `image`
field, with `imageAlt` required alongside.

They render at their **natural aspect ratio** — these captures range from 1.34:1
to 2.79:1, and forcing them into a shared box would crop 20–36% off the wide ones.
Cropping a screenshot of a spreadsheet UI throws away the thing it's evidence of.

`lib/image-sizes.ts` holds the real pixel dimensions so `next/image` can reserve
correct layout space. After adding or replacing any screenshot:

```bash
node scripts/image-sizes.mjs
```

Two projects have `image: null` on purpose — the only available captures showed
an identifiable client brand, live campaign names, or a named employee alongside
their scores. They render a typographic fallback instead, which is intended, not
broken. If you want screenshots there, redact them first.

---

## The admin page

The site's content lives in a Supabase database and is edited at **`/admin`**.
One account has access; there is no registration and no password reset.

### First-time setup

**1. Create a Supabase project.** Free tier at [supabase.com](https://supabase.com).
Pick a region near you — `ap-southeast-1` (Singapore) is closest to Manila.

**2. Run the migration.** In the Supabase dashboard: **SQL Editor → New query**,
paste the whole of [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql),
and Run. It creates three tables and a storage bucket, and is safe to re-run.

**3. Fill in `.env.local`.** From **Project Settings → API**, copy:

| Supabase dashboard | `.env.local` variable |
| --- | --- |
| Project URL | `NEXT_PUBLIC_SUPABASE_URL` |
| `service_role` key (under "Project API keys" — click to reveal) | `SUPABASE_SERVICE_ROLE_KEY` |

`.env.local` also holds `ADMIN_PHONE`. The phone number is kept out of the repo
on purpose: a number committed once stays in the git history even if the line is
deleted later, and a repo can be made public at any time. Set it in Vercel too if
you ever turn `showPhone` on.

The `service_role` key is a **full-access credential** — it bypasses every
database permission. It is only ever read on the server, never sent to the
browser. Never paste it into a chat, a screenshot, or a public repo. `.env.local`
is already gitignored.

**4. Restart the dev server** — Next reads env vars at startup.

**5. Sign in at `/admin` and press Save once.** The database starts empty, so the
admin loads the content compiled into `content/profile.ts`. Saving writes it into
Supabase, and from then on the database is the source of truth.

### Deploying

Set the same four variables in **Vercel → Project Settings → Environment
Variables** before deploying, or the live admin will load but refuse to save.

### Changing the password

```bash
node scripts/hash-password.mjs
```

It prompts (without echoing), prints a new `ADMIN_PASSWORD_HASH` line, and also
offers a fresh `AUTH_SECRET` — changing that one signs out every existing
session immediately. Update both `.env.local` and Vercel.

Your password is never stored anywhere, in this repo or in the database. What is
stored is a salted scrypt hash, which cannot be reversed into the password.

### How it holds together

- **Content** is one JSON document in `site_content`. Every page render reads the
  whole thing, so normalising it into separate tables would buy joins nobody
  performs. Its shape is enforced by a Zod schema at the application boundary
  ([`lib/content/schema.ts`](lib/content/schema.ts)).
- **Every save snapshots the previous version** into `content_revisions` before
  overwriting, and refuses to save at all if the snapshot fails. There is no
  restore button in the admin yet — recovery is a query in the Supabase SQL
  Editor:

  ```sql
  -- see what is there, newest first
  select id, note, created_at from content_revisions order by created_at desc limit 20;

  -- put one back (this becomes the live site immediately)
  update site_content
     set data = (select data from content_revisions where id = <the id>),
         updated_at = now()
   where id = 1;
  ```

  After restoring, open the admin and press Save once so the cached copy the
  public page reads is refreshed.
- **The site falls back to `content/profile.ts`** whenever the database is
  unreachable, unconfigured, or holds a document that fails validation. A
  database outage degrades the site to its last shipped content rather than to an
  error page. The admin still refuses to *save* in those conditions, so the
  fallback can never quietly hide a broken write.
- **Reads are cached** and invalidated on save, so visitors do not each trigger a
  database round trip.
- **Row level security is on with no policies**, which in Postgres means deny-all.
  Only the service role key can reach the tables, and it lives on the server.
- **Login is throttled** — eight failures from one IP within fifteen minutes
  locks that IP out. State lives in Postgres, because serverless functions do not
  share memory and an in-process counter would reset on every cold start.
- **Uploads are checked by magic number**, not by the declared MIME type, which
  is attacker-controlled. Files are renamed to a UUID on the way in.

### Images

Uploads go to Supabase Storage and are referenced by absolute URL. Screenshots
still render at their natural aspect ratio — the no-cropping rule applies to
uploaded images too.

There are three separate image slots, all optional:

| Slot | Admin tab | Where it appears |
| --- | --- | --- |
| **Profile photo** | Identity | Beside your name at the top of the page. Cropped square, so leave a little room around your head. When it is set, the name is scaled down a step so it still holds two lines rather than three. |
| **Hero background** | Identity | Behind the whole opening screen, under a scrim. Usually better left empty. |
| **Portrait** | About | The larger image in the About section. Cropped to a tall 4:5. |

Removing an image from a slot does **not** delete it from storage — the object
stays at its public URL. Delete it in the Supabase dashboard under
**Storage → portfolio-media** if you want it actually gone.

Images already in `public/projects/` keep working; the two systems coexist, and
`lib/image-sizes.ts` covers the local ones.

---

## Design system

Called **DATUM** — a technical register rather than a brochure. The governing
idea is that the page should read like a well-made spec sheet.

- **Ground** is warm paper (`#FAF8F5`), ink is cool. A single deep-teal accent,
  used scarcely — it marks data and state, never decoration.
- **Structure is drawn with hairlines.** No filled cards, no shadows, no rounded
  corners (the availability dot is the one exception).
- **Monospace is a data register**, not a decorative face: section marks, spec
  labels, dates, figures, tags.
- **Tabular figures are on globally**, so every number in every column lines up.

Colours are HSL triples in `app/globals.css`, exposed as Tailwind tokens
(`bg-background`, `text-muted`, `border-border-strong`, `text-accent`, …). The
computed contrast ratio is written beside each one. **If you change a colour,
recompute** — `--subtle` carries the 11px labels and was tuned specifically to
clear 4.5:1 rather than being treated as decorative.

Dark mode follows the OS by default and is also available via a `.dark` class if
you add a toggle later.

### Shared pieces

| File | What it is |
| --- | --- |
| `components/section.tsx` | The section shell — the numbered mono spine that makes six unlike sections read as one document |
| `components/spec.tsx` | `SpecList` / `SpecRow` / `Token` — the spec-rail device and the hairline chip |
| `components/rule.tsx` | The self-drawing hairline; the only motion anyone consciously registers |
| `components/reveal.tsx` | Scroll entrance primitive |
| `components/placeholder-text.tsx` | `Copy` and `SpecValue` — placeholder handling |

Both motion primitives already honour `prefers-reduced-motion`, so components
don't re-handle it.

---

## Deploying

Push to a Git host and import the repo at [vercel.com/new](https://vercel.com/new).
No environment variables, no database, no build configuration needed.

Set `identity.siteUrl` to the production domain before the first deploy, or the
canonical URL, sitemap and social card will all point at `example.com`.
