/**
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
  '/projects/ads-metrics-dashboard.png': { width: 1872, height: 803 },
  '/projects/ems-account-receivable.png': { width: 1908, height: 685 },
  '/projects/ems-cashflow-entry.png': { width: 1913, height: 567 },
  '/projects/ems-shipment-tracking.png': { width: 1906, height: 483 },
  '/projects/ems-sign-in.png': { width: 429, height: 448 },
  '/projects/kpi-department-summary.png': { width: 455, height: 492 },
  '/projects/kpi-scoring-table.png': { width: 952, height: 434 },
  '/projects/kpi-tracker-scores.png': { width: 1194, height: 767 },
  '/projects/recruitment-actions.png': { width: 1282, height: 540 },
  '/projects/recruitment-scheduling.png': { width: 885, height: 662 },
  '/projects/task-management-designers.png': { width: 1646, height: 361 },
  '/projects/task-management-grid.png': { width: 1746, height: 670 },
};

/**
 * Falls back to a 16:9 box for an unknown path so a newly added screenshot
 * renders sensibly before the table is regenerated.
 */
export function sizeOf(src: string): ImageSize {
  return imageSizes[src] ?? { width: 1600, height: 900 };
}
