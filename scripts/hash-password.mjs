/**
 * Generates the ADMIN_PASSWORD_HASH value for .env.local.
 *
 *   node scripts/hash-password.mjs
 *
 * Prompts for the password rather than taking it as an argument, so it never
 * lands in your shell history. Paste the printed line into .env.local (and
 * into Vercel's environment variables) replacing the existing one.
 *
 * The plaintext password is never written anywhere by this script.
 *
 * The encoded form is colon-separated rather than the conventional
 * `scrypt$N$r$p$...`, because Next.js expands `$NAME` inside .env values — a
 * `$`-separated hash is silently mangled before the app ever reads it.
 */

import crypto from 'node:crypto';
import readline from 'node:readline';
import { Writable } from 'node:stream';

const SCRYPT = { N: 16384, r: 8, p: 1, keylen: 64 };

/** Reads a line without echoing it to the terminal. */
function askHidden(question) {
  let muted = false;
  const mutedOut = new Writable({
    write(chunk, encoding, callback) {
      if (!muted) process.stdout.write(chunk, encoding);
      callback();
    },
  });

  const rl = readline.createInterface({
    input: process.stdin,
    output: mutedOut,
    terminal: true,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      process.stdout.write('\n');
      resolve(answer);
    });
    muted = true;
  });
}

const password = await askHidden('New admin password: ');

if (password.length < 12) {
  console.error(
    `\nRefusing: that password is ${password.length} characters. Use at least 12.`,
  );
  process.exit(1);
}

const salt = crypto.randomBytes(16);
const hash = crypto.scryptSync(password, salt, SCRYPT.keylen, SCRYPT);

const encoded = [
  'scrypt',
  SCRYPT.N,
  SCRYPT.r,
  SCRYPT.p,
  salt.toString('hex'),
  hash.toString('hex'),
].join(':');

console.log('\nReplace this line in .env.local (and in Vercel):\n');
console.log(`ADMIN_PASSWORD_HASH=${encoded}`);
console.log(
  '\nExisting sessions stay valid until they expire. To force an immediate',
  '\nlogout everywhere, also generate a new AUTH_SECRET:\n',
);
console.log(`AUTH_SECRET=${crypto.randomBytes(32).toString('base64')}`);
