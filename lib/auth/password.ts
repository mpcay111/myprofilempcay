import 'server-only';
import crypto from 'node:crypto';

/**
 * Password verification for the single admin account.
 *
 * NODE RUNTIME ONLY. This module imports node:crypto, so anything that imports
 * it is pinned to the Node runtime. Never import it from middleware.ts or from
 * any module middleware reaches — that is a build failure, not a runtime one.
 * Edge-safe session handling lives in ./session.
 *
 * There is one user and no registration, so this is deliberately not a full
 * auth system. What it does have to get right:
 *   - the password is never stored, only a salted scrypt hash;
 *   - comparison is constant-time, so timing cannot leak the hash;
 *   - both factors are always evaluated, so response time cannot enumerate
 *     usernames.
 */

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not set. See .env.local.`);
  }
  return value;
}

/**
 * Verifies a password against a stored `scrypt:N:r:p:salt:hash` value.
 *
 * Colon-separated, not the conventional `$`-separated form, and that matters:
 * Next.js runs .env values through dotenv-expand, which treats `$16384` and
 * `$1` as variable references and expands them to nothing. A `$`-separated
 * hash silently arrives as "scrypt6384" and every correct password is
 * rejected. Colons have no meaning to dotenv or to a shell.
 */
export function verifyPassword(password: string, encoded: string): boolean {
  const parts = encoded.split(':');
  if (parts.length !== 6 || parts[0] !== 'scrypt') return false;

  const [, nRaw, rRaw, pRaw, saltHex, hashHex] = parts;
  const N = Number(nRaw);
  const r = Number(rRaw);
  const p = Number(pRaw);
  if (!Number.isInteger(N) || !Number.isInteger(r) || !Number.isInteger(p)) {
    return false;
  }

  let expected: Buffer;
  try {
    expected = Buffer.from(hashHex, 'hex');
  } catch {
    return false;
  }

  let actual: Buffer;
  try {
    actual = crypto.scryptSync(password, Buffer.from(saltHex, 'hex'), expected.length, {
      N,
      r,
      p,
      // scrypt's default memory cap sits below what N=16384 needs on some builds.
      maxmem: 256 * 1024 * 1024,
    });
  } catch {
    return false;
  }

  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
}

/**
 * Compares two strings without leaking their contents through timing.
 *
 * Both sides are hashed first so that differing lengths are still handled in
 * constant time — timingSafeEqual throws outright on a length mismatch, which
 * would itself be an oracle.
 */
export function safeEqual(a: string, b: string): boolean {
  const ha = crypto.createHash('sha256').update(a).digest();
  const hb = crypto.createHash('sha256').update(b).digest();
  return crypto.timingSafeEqual(ha, hb);
}

/**
 * Checks a login attempt. Both factors are always evaluated — returning early
 * on a bad username would make usernames enumerable by response time.
 */
export function checkCredentials(username: string, password: string): boolean {
  const expectedUser = requireEnv('ADMIN_USERNAME');
  const expectedHash = requireEnv('ADMIN_PASSWORD_HASH');

  const userOk = safeEqual(username, expectedUser);
  const passOk = verifyPassword(password, expectedHash);

  return userOk && passOk;
}
