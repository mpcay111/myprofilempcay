/**
 * Regenerates lib/image-sizes.ts from the PNGs in public/projects.
 *
 * Run after adding, replacing, or re-cropping any screenshot:
 *   node scripts/image-sizes.mjs
 *
 * Reads the IHDR chunk directly rather than pulling in an image library — the
 * width and height of a PNG live at a fixed byte offset, and this script
 * should never be a reason to add a dependency.
 */

import fs from 'node:fs';
import path from 'node:path';

const DIR = path.join(process.cwd(), 'public', 'projects');
const OUT = path.join(process.cwd(), 'lib', 'image-sizes.ts');

function pngSize(file) {
  const buf = fs.readFileSync(file);
  if (buf.slice(1, 4).toString() !== 'PNG') return null;
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

const entries = fs
  .readdirSync(DIR)
  .filter((f) => f.toLowerCase().endsWith('.png'))
  .map((f) => ({ src: `/projects/${f}`, ...pngSize(path.join(DIR, f)) }))
  .filter((e) => e.width)
  .sort((a, b) => a.src.localeCompare(b.src));

const body = entries
  .map((e) => `  '${e.src}': { width: ${e.width}, height: ${e.height} },`)
  .join('\n');

fs.writeFileSync(
  OUT,
  `/**
 * Intrinsic pixel dimensions of every screenshot in /public/projects.
 *
 * next/image needs real width and height to reserve layout space. These
 * screenshots range from 1.34:1 to 2.79:1, so a single declared aspect ratio
 * with object-cover would crop the wide ones badly — and cropping a screenshot
 * of a spreadsheet UI throws away the thing it is evidence of. Each image
 * therefore renders at its own natural ratio.
 *
 * Generated from the files themselves. If you replace or add a screenshot,
 * regenerate this rather than guessing:
 *
 *   node scripts/image-sizes.mjs
 */

export type ImageSize = { width: number; height: number };

export const imageSizes: Record<string, ImageSize> = {
${body}
};

/**
 * Falls back to a 16:9 box for an unknown path so a newly added screenshot
 * renders sensibly before the table is regenerated.
 */
export function sizeOf(src: string): ImageSize {
  return imageSizes[src] ?? { width: 1600, height: 900 };
}
`,
);

console.log(`Wrote ${entries.length} entries to lib/image-sizes.ts`);
