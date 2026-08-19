/**
 * Session issuing and verification — HS256 JWTs on Web Crypto, no dependencies.
 *
 * WHY NOT jose. This module is imported by middleware.ts, which Vercel compiles
 * into an Edge Function through its own bundler. That bundler could not resolve
 * jose's subpath exports (`jose/jwt/sign`), and left them as unbundled
 * externals, failing the deploy with "referencing unsupported modules". The
 * package root would very likely bundle, but it reaches JWE and a
 * CompressionStream reference that the Edge runtime does not have — which is
 * the warning that prompted the subpath change in the first place. Rather than
 * keep trading one of those for the other, the ~60 lines below use only Web
 * Crypto, which the Edge runtime implements natively and no bundler has to
 * resolve.
 *
 * SECURITY NOTES, because hand-rolled JWT is where people get hurt:
 *   - The algorithm is pinned to HS256. The token's own `alg` header is checked
 *     against it and rejected on mismatch, so neither `none` nor an asymmetric
 *     algorithm can be substituted. The header is never used to *select* the
 *     verification algorithm.
 *   - The signature is verified before any claim is read, so a forged payload
 *     is never parsed, let alone trusted.
 *   - crypto.subtle.verify does the comparison, which is constant-time.
 *   - Expiry is required. A token with no `exp` is rejected rather than treated
 *     as eternal.
 *
 * The output is a standard compact JWS, verified byte-for-byte against jose in
 * the test suite, so this stays interoperable with the wider ecosystem.
 */

export const SESSION_COOKIE = 'mpc_admin_session';
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // one week

export type Session = { sub: string; iat: number; exp: number };

/* ── base64url ──────────────────────────────────────────────────────────── */

function toBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(value: string) {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(padded + '='.repeat((4 - (padded.length % 4)) % 4));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

const encoder = new TextEncoder();
const decoder = new TextDecoder();

/* ── Key ────────────────────────────────────────────────────────────────── */

/** Throws at call time rather than import time, so a missing env var surfaces
 *  as a clear runtime error rather than a blank page at startup. */
function secretBytes() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error('AUTH_SECRET is not set. See .env.local.');
  return encoder.encode(secret);
}

async function hmacKey(usage: 'sign' | 'verify'): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    secretBytes(),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    [usage],
  );
}

/* ── Issue ──────────────────────────────────────────────────────────────── */

export async function createSession(username: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000);

  const header = toBase64Url(encoder.encode(JSON.stringify({ alg: 'HS256', typ: 'JWT' })));
  const payload = toBase64Url(
    encoder.encode(JSON.stringify({ sub: username, iat: now, exp: now + SESSION_TTL_SECONDS })),
  );

  const signingInput = `${header}.${payload}`;
  const signature = await crypto.subtle.sign(
    'HMAC',
    await hmacKey('sign'),
    encoder.encode(signingInput),
  );

  return `${signingInput}.${toBase64Url(new Uint8Array(signature))}`;
}

/* ── Verify ─────────────────────────────────────────────────────────────── */

/**
 * Returns the session, or null for anything that is not a currently valid
 * token. Never throws — callers treat null as "not signed in", and a missing
 * AUTH_SECRET must read as "nobody is signed in" rather than crashing every
 * request that passes through middleware.
 */
export async function verifySession(token: string | undefined): Promise<Session | null> {
  if (!token) return null;

  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [header, payload, signature] = parts;

    // Pin the algorithm. Reading `alg` to decide how to verify is the classic
    // JWT vulnerability; here it is only ever compared against the one value
    // this system issues.
    const parsedHeader = JSON.parse(decoder.decode(fromBase64Url(header))) as {
      alg?: unknown;
    };
    if (parsedHeader.alg !== 'HS256') return null;

    const valid = await crypto.subtle.verify(
      'HMAC',
      await hmacKey('verify'),
      fromBase64Url(signature),
      encoder.encode(`${header}.${payload}`),
    );
    if (!valid) return null;

    // Only now is the payload trusted enough to read.
    const claims = JSON.parse(decoder.decode(fromBase64Url(payload))) as Partial<Session>;

    if (typeof claims.sub !== 'string' || claims.sub === '') return null;
    if (typeof claims.exp !== 'number') return null;
    if (claims.exp <= Math.floor(Date.now() / 1000)) return null;

    return {
      sub: claims.sub,
      iat: typeof claims.iat === 'number' ? claims.iat : 0,
      exp: claims.exp,
    };
  } catch {
    return null;
  }
}

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  maxAge: SESSION_TTL_SECONDS,
};

/* ── Redirect safety ────────────────────────────────────────────────────── */

/**
 * Resolves the post-login `next` target to a safe same-site admin path.
 *
 * The obvious guard — `startsWith('/') && !startsWith('//')` — is a string
 * test, and the browser does not use string tests. For a special scheme the
 * URL parser treats the backslash in `/\evil.com` as a second slash, so that
 * value passes a `//` check and still resolves to `https://evil.com`. Tab, CR
 * and LF are stripped before parsing, so `/%09/evil.com` does the same.
 *
 * That matters more here than the usual open-redirect case: the victim is the
 * one admin, the bounce happens the instant after they type a password that
 * has just been proven correct on the genuine domain, and the destination is a
 * clone asking them to "sign in again". There is no second account and no MFA
 * behind that password.
 *
 * So: resolve against a sentinel origin and compare origins, which runs the
 * same parser the browser will. Then require the result to be inside /admin —
 * nothing else is a useful place to land after signing in.
 */
export function safeNext(raw: unknown): string {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (typeof value !== 'string' || value === '') return '/admin';

  const base = 'https://sentinel.invalid';
  let url: URL;
  try {
    url = new URL(value, base);
  } catch {
    return '/admin';
  }

  // Any value that escapes the sentinel origin was going off-site.
  if (url.origin !== base) return '/admin';
  if (!url.pathname.startsWith('/admin')) return '/admin';

  return url.pathname + url.search;
}
