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

Set the same variables in **Vercel → Project Settings → Environment Variables**
before deploying, or the live admin will load but refuse to save.
`NEXT_PUBLIC_SUPABASE_URL` is read at *build* time — it decides which image host
is permitted — so it has to exist before the build that should serve uploads.

`vercel.json` pins `"framework": "nextjs"`. That is not decoration. Without it
the project relies on the dashboard's Framework Preset, and if that is not set
to Next.js the build still *succeeds* — Vercel runs `npm run build`, then throws
away `.next` and publishes `public/` as a plain static site. The result is a
green deployment where every route 404s, `/_next/static/*` is missing, and the
only things served are the raw files under `public/`. It looks like a routing
bug and is really a project setting, so it is pinned in the repo where it cannot
drift.

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

### Text formatting

A very small inline markup works in any paragraph, description or bullet:

| Syntax | Result |
| --- | --- |
| `**bold**` | strong emphasis |
| `*italic*` | light emphasis |
| `==highlight==` | the accent colour |
| `[label](https://…)` | a link, opening in a new tab |

Anything else stays literal. The admin has a collapsed reference under the
editor that renders each example through the real parser, so the help cannot
drift from the behaviour.

It deliberately is **not** rich text. Storing HTML and rendering it with
`dangerouslySetInnerHTML` would make every content field a script-injection
point on a public page. This parser emits React elements instead, so there is
nothing to sanitise: raw HTML stays literal text, and a `javascript:` or
`data:` href never becomes a link. Link URLs must be written with an explicit
`http://` or `https://` scheme, so what is typed is what is linked.

### Appearance

Admin → Identity → **Appearance**: accent colour, body typeface, label typeface.

Eight accents, and the list is fixed rather than a colour picker for a reason.
The accent is used on 11px labels, and the site has two grounds — warm paper and
dark ink — so a colour readable on one can fail on the other. Each option's
lightness was searched per hue for a comfortable margin against both, and the
measured ratios are recorded next to each entry in
[`lib/appearance.ts`](lib/appearance.ts): every one clears ≥6:1 on light, ≥8:1
on dark, and ≥6.4:1 for white text sitting on the accent. If you add one, run
the numbers rather than eyeballing it.

The alternate typefaces are declared with `preload: false`, so choosing one
costs a font fetch and the unused families cost nothing but a few lines of CSS.

### Videos

Admin → **Videos**. Upload the video to YouTube or Vimeo first — an unlisted
YouTube video is not searchable and is only reachable through this site — then
paste its link. The section hides itself from the page *and* the menu while the
list is empty.

Links rather than uploads, deliberately: the Supabase free tier allows 5 GB of
downloads a month and every play of an uploaded file re-downloads it, so one
80 MB video watched ~60 times exhausts the tier. Embeds stream from the video
host's CDN at whatever quality the connection carries and cost this site
nothing.

Two properties worth knowing:

- **The pasted URL is never rendered.** [`lib/video.ts`](lib/video.ts) extracts
  the video id, validates it against a strict pattern, and rebuilds the embed
  URL from a fixed template for a known host. Lookalike domains
  (`youtube.com.evil.com`), `javascript:` URLs, and arbitrary iframes are all
  structurally impossible, and the admin validates with the same parser the
  page uses.
- **Players load on click, not on page load.** Each video renders as a
  thumbnail facade (YouTube) or a play card (Vimeo); the click that swaps in
  the real player is the click that starts playback. Three videos cost three
  thumbnails, not three player SDKs — and the embed uses youtube-nocookie.com,
  which sets no tracking cookies until the visitor actually plays.

### Logo bar

Admin → **Logo bar**. A slow band of company logos directly under the menu.
It is not a section — it does not appear in the running order or the menu —
and it hides itself entirely while the list is empty.

Upload **PNGs with a transparent background.** Logos are drawn as flat
silhouettes so a single upload reads on both the light and the dark site; a
logo sitting on a white rectangle becomes a solid black rectangle. Hovering a
logo restores its real colours.

Three things here are less obvious than they look, and all three were caught by
measuring the running page rather than reading the markup:

- **The silhouette is a CSS custom property, not a `dark:` variant.** The site
  has *three* theme states, and the most common one — "follow my device" —
  sets no class at all, so it is matched by a media query. A `dark:` variant
  would have left the logos black on the dark ground for exactly the visitors
  the treatment protects.
- **That filter must never be transitioned.** CSS interpolates filter lists
  function by function; with a transition on it, the toggle measurably stuck at
  `invert(0)` — a no-op — leaving black logos on the dark ground. Both themes
  now declare the same function list and the swap is instant.
- **The pause button sets an inline style.** As a Tailwind class it silently did
  nothing: `animate-marquee` sets the `animation` *shorthand*, which resets
  `animation-play-state` to `running`, and it is emitted after the arbitrary
  utility at equal specificity. The class was on the element and the animation
  kept running.

That button matters — WCAG 2.2.2 requires a way to stop anything that moves by
itself for more than five seconds, and hover-pause does not count because
keyboard and touch users have no hover. Anyone whose system asks for reduced
motion gets a still bar and never has to press anything.

### Section order

Admin → **Sections**. One list drives the order of the page *and* the header
menu, so the two can never disagree — they used to be separate fields that
could. Each row can be reordered, renamed, or hidden.

The numbering down the left margin (01, 02, …) is derived from position, so
reordering renumbers the page automatically. Hiding a section keeps its content
and does not consume a number: hide the third of six and the fourth becomes 03.

Sections cannot be added or removed, because each id maps to a React component —
`resolveSections()` guarantees every known section renders exactly once even if
the stored document is partial or hand-edited, so a section can never silently
vanish. The hero is always first and the footer always last; neither is
orderable, because a hero that is not at the top and a footer that is not at the
bottom are not those things.

### Theme

Both palettes already existed in `globals.css`; what was added is the choosing.
Three places, one mechanism:

- **Site default** — Admin → Identity → Appearance. *Match device* (follows the
  visitor's own light/dark setting), *Always light*, or *Always dark*.
- **Visitor toggle** — in the site header. Cycles device → light → dark and is
  remembered per device. A visitor's choice always beats the site default.
- **Admin toggle** — same control in the admin header, same storage key, so a
  choice made in one follows you to the other.

`system` is the *absence* of a class on `<html>`, not a class of its own — the
`prefers-color-scheme` block in `globals.css` handles it, guarded by
`:not(.light)` so an explicit light choice still wins on a dark device.

The class is set by a small inline script in `<head>` ([`lib/theme.ts`](lib/theme.ts)).
It has to be inline and synchronous: anything deferred runs after the browser
has painted, so someone who chose dark would get a white flash on every
navigation. That is also why `<html>` carries `suppressHydrationWarning` — the
script deliberately changes the class before React hydrates.

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
