// Imported from subpaths rather than the package root on purpose. The barrel
// export pulls in JWE decryption, which reaches CompressionStream — a Node API
// the Edge runtime does not have. We only ever sign and verify JWS, so that
// code is never executed, but the bundler still traces it into the middleware
// bundle and warns. These two imports carry only what is used.
import { SignJWT } from 'jose/jwt/sign';
import { jwtVerify } from 'jose/jwt/verify';

/**
 * Session issuing and verification.
 *
 * EDGE-SAFE ON PURPOSE. This module must never import node:crypto, directly or
 * transitively, because middleware.ts imports it and middleware runs on the
 * Edge runtime — where a `node:` import is not a runtime error but a build
 * failure. Password checking, which does need node:crypto, lives in the
 * sibling ./password module and is imported only from Node-runtime code.
 *
 * That split is the whole reason these are two files rather than one.
 */

export const SESSION_COOKIE = 'mpc_admin_session';
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // one week

/** Throws at call time rather than import time, so a missing env var surfaces
 *  as a clear runtime error rather than a blank page at startup. */
function secretKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error('AUTH_SECRET is not set. See .env.local.');
  }
  return new TextEncoder().encode(secret);
}

export type Session = { sub: string; iat: number; exp: number };

export async function createSession(username: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  return new SignJWT({})
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(username)
    .setIssuedAt(now)
    .setExpirationTime(now + SESSION_TTL_SECONDS)
    .sign(secretKey());
}

/**
 * Returns the session, or null for anything that is not a currently valid
 * token. Never throws — callers treat null as "not signed in", and a missing
 * AUTH_SECRET must read as "nobody is signed in" rather than crashing every
 * request through middleware.
 */
export async function verifySession(token: string | undefined): Promise<Session | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey(), { algorithms: ['HS256'] });
    if (!payload.sub) return null;
    return payload as unknown as Session;
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
