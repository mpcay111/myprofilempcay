import 'server-only';
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';

/**
 * Login throttling, backed by Postgres.
 *
 * An in-process counter would be useless here: serverless functions do not
 * share memory and are recycled constantly, so an attacker gets a fresh
 * allowance with every cold start. The state has to be somewhere both shared
 * and durable, which is the database we already have.
 */

const WINDOW_MINUTES = 15;
const MAX_FAILURES = 8;

export type Throttle = { allowed: true } | { allowed: false; retryAfterMinutes: number };

/**
 * Best-effort client IP.
 *
 * These headers are attacker-controlled in general, but on Vercel the platform
 * overwrites x-forwarded-for at the edge, so the first entry is trustworthy
 * there. Locally it is absent and everything collapses to one bucket, which is
 * the safe direction to fail — stricter, not looser.
 */
export function clientIp(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return headers.get('x-real-ip')?.trim() || 'unknown';
}

export async function checkThrottle(ip: string): Promise<Throttle> {
  if (!isSupabaseConfigured()) return { allowed: true };

  const since = new Date(Date.now() - WINDOW_MINUTES * 60_000).toISOString();

  try {
    const { data, error } = await supabaseAdmin()
      .from('login_attempts')
      .select('created_at')
      .eq('ip', ip)
      .eq('successful', false)
      .gte('created_at', since)
      .order('created_at', { ascending: true });

    if (error || !data) return { allowed: true };
    if (data.length < MAX_FAILURES) return { allowed: true };

    // Locked until the oldest failure in the window ages out.
    const oldest = new Date(data[0].created_at).getTime();
    const unlockAt = oldest + WINDOW_MINUTES * 60_000;
    const minutes = Math.max(1, Math.ceil((unlockAt - Date.now()) / 60_000));

    return { allowed: false, retryAfterMinutes: minutes };
  } catch {
    // A throttling backend that is down must not lock the owner out of their
    // own site. Failing open here is deliberate: the password is still the
    // real barrier, and this only shapes how fast it can be guessed.
    return { allowed: true };
  }
}

export async function recordAttempt(ip: string, successful: boolean): Promise<void> {
  if (!isSupabaseConfigured()) return;

  try {
    const db = supabaseAdmin();
    await db.from('login_attempts').insert({ ip, successful });

    // Opportunistic prune, so the table cannot grow without bound. Cheap
    // because of the (ip, created_at) index and it runs off the response path
    // often enough to keep the table small.
    if (Math.random() < 0.05) {
      const cutoff = new Date(Date.now() - 24 * 60 * 60_000).toISOString();
      await db.from('login_attempts').delete().lt('created_at', cutoff);
    }
  } catch {
    // Never let bookkeeping failure break a login.
  }
}

/** Clears the lockout after a correct password, so one bad streak does not
 *  keep the owner waiting once they get it right. */
export async function clearFailures(ip: string): Promise<void> {
  if (!isSupabaseConfigured()) return;
  try {
    await supabaseAdmin()
      .from('login_attempts')
      .delete()
      .eq('ip', ip)
      .eq('successful', false);
  } catch {
    /* non-fatal */
  }
}
