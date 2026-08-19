'use server';

import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import {
  SESSION_COOKIE,
  createSession,
  sessionCookieOptions,
  verifySession,
} from '@/lib/auth/session';
import { checkCredentials } from '@/lib/auth/password';
import { checkThrottle, clearFailures, clientIp, recordAttempt } from '@/lib/rate-limit';
import { siteContentSchema } from '@/lib/content/schema';
import { saveContent } from '@/lib/content/source';

/**
 * Server actions for the admin.
 *
 * Every mutating action re-checks the session itself rather than trusting
 * middleware. Server actions are addressable POST endpoints — a matcher typo
 * or a future route move must not turn one into an unauthenticated write.
 */

async function requireSession(): Promise<void> {
  const session = await verifySession(cookies().get(SESSION_COOKIE)?.value);
  if (!session) redirect('/admin/login');
}

/* ── Auth ───────────────────────────────────────────────────────────────── */

export type LoginState = { error: string | null };

export async function login(
  _previous: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const username = String(formData.get('username') ?? '');
  const password = String(formData.get('password') ?? '');
  const next = String(formData.get('next') ?? '/admin');

  const ip = clientIp(headers());

  const throttle = await checkThrottle(ip);
  if (!throttle.allowed) {
    return {
      error: `Too many failed attempts. Try again in ${throttle.retryAfterMinutes} minute${
        throttle.retryAfterMinutes === 1 ? '' : 's'
      }.`,
    };
  }

  let ok = false;
  try {
    ok = checkCredentials(username, password);
  } catch (cause) {
    // Missing env vars — say so plainly rather than reporting a wrong password.
    return { error: cause instanceof Error ? cause.message : 'Auth is misconfigured.' };
  }

  await recordAttempt(ip, ok);

  if (!ok) {
    // One message for both wrong username and wrong password, so the form
    // cannot be used to discover which half was right.
    return { error: 'Incorrect username or password.' };
  }

  await clearFailures(ip);

  cookies().set(SESSION_COOKIE, await createSession(username), sessionCookieOptions);

  // Only ever redirect to a path on this site. Accepting an absolute URL here
  // would make the login form an open redirect.
  redirect(next.startsWith('/') && !next.startsWith('//') ? next : '/admin');
}

export async function logout(): Promise<void> {
  cookies().delete(SESSION_COOKIE);
  redirect('/admin/login');
}

/* ── Content ────────────────────────────────────────────────────────────── */

export type SaveState = { ok: boolean; message: string | null };

/**
 * Saves a whole content document.
 *
 * The admin edits one section at a time but always submits the complete
 * document, because the store is a single JSON row. The client reads the
 * current document, replaces one branch, and posts the result.
 */
export async function saveContentAction(
  _previous: SaveState,
  formData: FormData,
): Promise<SaveState> {
  await requireSession();

  const raw = formData.get('document');
  if (typeof raw !== 'string') {
    return { ok: false, message: 'Nothing was submitted.' };
  }

  let candidate: unknown;
  try {
    candidate = JSON.parse(raw);
  } catch {
    return { ok: false, message: 'The submitted content was not valid JSON.' };
  }

  const parsed = siteContentSchema.safeParse(candidate);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .slice(0, 5)
      .map((i) => `${i.path.join('.') || 'document'}: ${i.message}`)
      .join('; ');
    return { ok: false, message: issues };
  }

  const note = String(formData.get('note') ?? '') || undefined;
  const result = await saveContent(parsed.data, note);

  if (!result.ok) return { ok: false, message: result.error };
  return { ok: true, message: 'Saved. The live site is updated.' };
}
