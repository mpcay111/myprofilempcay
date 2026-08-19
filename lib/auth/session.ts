import { SignJWT, jwtVerify } from 'jose';

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
