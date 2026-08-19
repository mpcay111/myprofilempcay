import { z } from 'zod';

/**
 * The shape of the site's content, as stored in Supabase.
 *
 * Once content lives in a database it is no longer compile-time checked, so
 * everything read back gets validated here before it reaches a component. A
 * malformed or partially-written row then fails loudly at the data layer and
 * falls back to the file, rather than crashing a section mid-render.
 *
 * This mirrors the types in content/profile.ts. If you add a field there, add
 * it here — the seed script compares the two and will refuse to run if they
 * have drifted.
 */

/** Trimmed, and empty strings normalise to null so a cleared form field does
 *  not become the string "". */
const nullableText = z
  .string()
  .trim()
  .transform((v) => (v === '' ? null : v))
  .nullable();

const text = z.string().trim();

/** A path under /public, a Supabase Storage URL, or null. */
const imageRef = z
  .string()
  .trim()
  .transform((v) => (v === '' ? null : v))
  .nullable()
  .refine(
    (v) => v === null || v.startsWith('/') || v.startsWith('https://'),
    { message: 'Image must be a /public path or an https URL' },
  );

export const identitySchema = z.object({
  name: text.min(1, 'Name is required'),
  credentials: nullableText,
  role: text.min(1, 'Role is required'),
  disciplines: z.array(text).max(6, 'Six disciplines is already too many'),
  location: nullableText,
  statement: text.min(1, 'The statement is the first thing anyone reads'),
  siteUrl: z.string().trim().url('Must be a full URL, e.g. https://example.com'),
  availableForWork: z.boolean(),
  availabilityNote: nullableText,
  /**
   * Profile photo, shown beside the name at the top of the page.
   * Distinct from `about.portrait`, which is the larger image further down.
   */
  photo: imageRef.default(null),
  /** Optional hero background image. Null keeps the plain paper ground. */
  backgroundImage: imageRef.default(null),
});

export const socialLinkSchema = z.object({
  label: text.min(1),
  href: text.min(1),
  handle: text.min(1),
});

export const projectSchema = z.object({
  slug: text
    .min(1)
    .regex(/^[a-z0-9-]+$/, 'Lowercase letters, numbers and hyphens only'),
  name: text.min(1),
  tagline: text,
  description: text,
  capabilities: z.array(text),
  role: nullableText,
  builtWith: z.array(text),
  usedBy: nullableText,
  period: nullableText,
  impact: nullableText,
  liveUrl: nullableText,
  repoUrl: nullableText,
  image: imageRef,
  imageAlt: nullableText,
  featured: z.boolean(),
});

export const experienceEntrySchema = z.object({
  company: text.min(1),
  title: text.min(1),
  start: text,
  end: text,
  location: nullableText,
  summary: text,
  highlights: z.array(text),
  tags: z.array(text),
});

export const scopeAreaSchema = z.object({
  label: text.min(1),
  description: text,
});

export const expertiseGroupSchema = z.object({
  label: text.min(1),
  items: z.array(text),
});

export const educationEntrySchema = z.object({
  institution: text.min(1),
  qualification: text,
  period: text,
});

export const aboutSchema = z.object({
  paragraphs: z.array(text),
  portrait: imageRef,
});

export const navItemSchema = z.object({
  id: text.regex(/^[a-z-]+$/, 'Anchor ids are lowercase and hyphenated'),
  label: text.min(1),
});

/**
 * The site's default appearance. 'system' follows the visitor's own device
 * setting, which is the respectful default; the other two override it.
 * A visitor's explicit choice in the header always wins over this.
 */
export const themeSchema = z.enum(['system', 'light', 'dark']);
export type ThemeSetting = z.infer<typeof themeSchema>;

export const siteContentSchema = z.object({
  identity: identitySchema,
  theme: themeSchema.default('system'),
  email: z.string().trim().email('Must be a valid email address'),
  phone: text,
  showPhone: z.boolean(),
  socials: z.array(socialLinkSchema),
  projects: z.array(projectSchema),
  experience: z.array(experienceEntrySchema),
  scope: z.array(scopeAreaSchema),
  expertise: z.array(expertiseGroupSchema),
  education: z.array(educationEntrySchema),
  certifications: z.array(text),
  languages: z.array(text),
  about: aboutSchema,
  navigation: z.array(navItemSchema),
  careerStartYear: z.number().int().min(1950).max(2100),
  careerStartMonth: z.number().int().min(1).max(12),
});

export type SiteContent = z.infer<typeof siteContentSchema>;
export type Identity = z.infer<typeof identitySchema>;
export type Project = z.infer<typeof projectSchema>;
export type ExperienceEntry = z.infer<typeof experienceEntrySchema>;
export type ScopeArea = z.infer<typeof scopeAreaSchema>;
export type ExpertiseGroup = z.infer<typeof expertiseGroupSchema>;
export type EducationEntry = z.infer<typeof educationEntrySchema>;
export type AboutContent = z.infer<typeof aboutSchema>;
export type SocialLink = z.infer<typeof socialLinkSchema>;
export type NavItem = z.infer<typeof navItemSchema>;

/**
 * Featured projects first, original order preserved within each group.
 * Kept here rather than in the admin so the public page's ordering rule is
 * defined once, next to the shape it applies to.
 */
export function orderProjects(projects: Project[]): Project[] {
  return [...projects.filter((p) => p.featured), ...projects.filter((p) => !p.featured)];
}

/** Every distinct technology mentioned, for the JSON-LD knowsAbout field. */
export function allTechnologies(content: SiteContent): string[] {
  return Array.from(
    new Set([
      ...content.projects.flatMap((p) => p.builtWith),
      ...content.expertise.flatMap((g) => g.items),
    ]),
  ).filter((t) => !t.startsWith('['));
}
