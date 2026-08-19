import 'server-only';
import { unstable_cache, revalidateTag } from 'next/cache';
import { siteContentSchema, type SiteContent } from '@/lib/content/schema';
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';
import * as seed from '@/content/profile';

/**
 * The single entry point for reading site content.
 *
 * Order of precedence:
 *   1. The document in Supabase, if it is present and valid.
 *   2. The seed content compiled into content/profile.ts.
 *
 * The fallback is not a nicety — it is what keeps the site up. A missing env
 * var, an unreachable database, or a row that fails validation all degrade to
 * the last known-good content that shipped with the build, rather than to an
 * error page. The admin still refuses to *save* in those conditions, so the
 * fallback can never silently mask a broken write.
 */

export const CONTENT_TAG = 'site-content';

/** The content compiled into the repo, shaped to the schema. */
export function seedContent(): SiteContent {
  const parsed = siteContentSchema.safeParse({
    identity: { ...seed.identity, photo: null, backgroundImage: null },
    theme: 'system' as const,
    email: seed.email,
    phone: seed.phone,
    showPhone: seed.showPhone,
    socials: seed.socials,
    projects: seed.projects,
    experience: seed.experience,
    scope: seed.scope,
    expertise: seed.expertise,
    education: seed.education,
    certifications: seed.certifications,
    languages: seed.languages,
    about: seed.about,
    navigation: seed.navigation.map((n) => ({ id: n.id, label: n.label })),
    careerStartYear: seed.careerStartYear,
    careerStartMonth: seed.careerStartMonth,
  });

  if (!parsed.success) {
    // The seed is compiled from source, so this means profile.ts and schema.ts
    // have drifted apart. That is a developer error, not a runtime condition,
    // and it should stop the build rather than ship a half-rendered site.
    throw new Error(
      'content/profile.ts no longer satisfies the content schema:\n' +
        JSON.stringify(parsed.error.flatten(), null, 2),
    );
  }

  return parsed.data;
}

async function readFromDatabase(): Promise<SiteContent | null> {
  if (!isSupabaseConfigured()) return null;

  try {
    const { data, error } = await supabaseAdmin()
      .from('site_content')
      .select('data')
      .eq('id', 1)
      .maybeSingle();

    if (error) {
      console.error('[content] Supabase read failed, using seed:', error.message);
      return null;
    }
    if (!data) return null;

    const parsed = siteContentSchema.safeParse(data.data);
    if (!parsed.success) {
      console.error(
        '[content] Stored document failed validation, using seed:',
        JSON.stringify(parsed.error.flatten().fieldErrors),
      );
      return null;
    }

    return parsed.data;
  } catch (cause) {
    console.error('[content] Supabase unreachable, using seed:', cause);
    return null;
  }
}

/**
 * Cached across requests and invalidated on save, so a published page does not
 * hit the database on every visit. The cache key is static because there is
 * exactly one document.
 */
const cachedContent = unstable_cache(
  async (): Promise<SiteContent> => (await readFromDatabase()) ?? seedContent(),
  ['site-content-v1'],
  { tags: [CONTENT_TAG] },
);

export async function getContent(): Promise<SiteContent> {
  return cachedContent();
}

/** Reads straight past the cache. The admin needs the current row, not a
 *  possibly stale copy, or it would save edits on top of old data. */
export async function getContentUncached(): Promise<SiteContent> {
  return (await readFromDatabase()) ?? seedContent();
}

/**
 * Whether a document has ever been saved.
 *
 * Distinguishes "the site is showing the seed because nobody has saved yet"
 * from "the site is showing the seed because the database is unreachable".
 * The admin needs that distinction: on a fresh install the content on screen
 * is identical to the seed, so a dirty check alone would leave the Save button
 * disabled and there would be no way to perform the very first save.
 */
export async function hasStoredContent(): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  try {
    const { data, error } = await supabaseAdmin()
      .from('site_content')
      .select('id')
      .eq('id', 1)
      .maybeSingle();
    return !error && Boolean(data);
  } catch {
    return false;
  }
}

/**
 * Writes a new document, snapshotting the previous one first.
 *
 * The snapshot is taken before the overwrite and inside the same request, so a
 * mistaken save is always recoverable from content_revisions even though the
 * two statements are not in one transaction — the worst case is an orphaned
 * revision, never a lost one.
 */
export async function saveContent(
  next: SiteContent,
  note?: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!isSupabaseConfigured()) {
    return {
      ok: false,
      error:
        'Supabase is not configured, so there is nowhere to save. Set ' +
        'NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.',
    };
  }

  const parsed = siteContentSchema.safeParse(next);
  if (!parsed.success) {
    return {
      ok: false,
      error: Object.entries(parsed.error.flatten().fieldErrors)
        .map(([field, messages]) => `${field}: ${(messages ?? []).join(', ')}`)
        .join('; '),
    };
  }

  const db = supabaseAdmin();

  const { data: previous } = await db
    .from('site_content')
    .select('data')
    .eq('id', 1)
    .maybeSingle();

  if (previous?.data) {
    const { error } = await db
      .from('content_revisions')
      .insert({ data: previous.data, note: note ?? null });
    if (error) {
      // Refuse rather than overwrite unrecoverably.
      return { ok: false, error: `Could not snapshot the previous version: ${error.message}` };
    }
  }

  const { error } = await db
    .from('site_content')
    .upsert({ id: 1, data: parsed.data, updated_at: new Date().toISOString() });

  if (error) return { ok: false, error: error.message };

  revalidateTag(CONTENT_TAG);
  return { ok: true };
}
