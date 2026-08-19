'use client';

import { useMemo, type ReactNode } from 'react';
import type { SectionEditorProps } from '@/components/admin/editor';
import type { Project, SiteContent } from '@/lib/content/schema';
import { ImageField } from '@/components/admin/image-field';
import {
  Field,
  ItemCard,
  Panel,
  SecondaryButton,
  StringList,
  TextArea,
  TextInput,
  Toggle,
  moveItem,
} from '@/components/admin/ui';

/**
 * The Work section.
 *
 * Every field on Project is editable here; the spec rail (role, builtWith,
 * usedBy, period, impact) renders on the public page whether or not it is
 * filled, so a blank one shows an em dash rather than disappearing. The impact
 * line is given its own block because it is the single most valuable sentence
 * on the page and the easiest one to skip past.
 *
 * Nothing is blocked from saving. Where a value would be wrong rather than
 * merely missing — an image with no alt text, two projects sharing a slug — the
 * editor says so in place and leaves the decision to the owner.
 */

const orEmpty = (v: string | null) => v ?? '';
const orNull = (v: string) => (v.trim() === '' ? null : v);

const SLUG_PATTERN = /^[a-z0-9-]+$/;

/**
 * A new project has to satisfy the schema on its own, or "Add" followed by
 * "Save" fails with a Zod path the owner cannot map to a card. The slug is
 * derived from the existing ones so clicking Add twice does not create a
 * guaranteed duplicate.
 */
function emptyProject(existing: Project[]): Project {
  const taken = new Set(existing.map((p) => p.slug));
  let slug = 'new-project';
  for (let n = 2; taken.has(slug); n += 1) slug = `new-project-${n}`;

  return {
    slug,
    name: 'New project',
    tagline: '',
    description: '',
    capabilities: [],
    role: null,
    builtWith: [],
    usedBy: null,
    period: null,
    impact: null,
    liveUrl: null,
    repoUrl: null,
    image: null,
    imageAlt: null,
    featured: false,
  };
}

/** An in-place notice. Never blocks saving — it explains what will look wrong. */
function Notice({ children }: { children: ReactNode }) {
  return (
    <p
      role="alert"
      className="mt-3 border-l-2 border-accent pl-3 text-[0.875rem] leading-[1.45] text-muted"
    >
      {children}
    </p>
  );
}

/** Slugs that appear on more than one project. */
function findDuplicateSlugs(projects: Project[]): string[] {
  const counts: Record<string, number> = {};
  projects.forEach((project) => {
    const slug = project.slug.trim();
    if (slug === '') return;
    counts[slug] = (counts[slug] ?? 0) + 1;
  });
  return Object.keys(counts).filter((slug) => counts[slug] > 1);
}

export function ProjectsEditor({ content, onChange }: SectionEditorProps) {
  const projects = content.projects;

  const duplicateSlugs = useMemo(() => findDuplicateSlugs(projects), [projects]);
  const featuredCount = projects.filter((project) => project.featured).length;

  const setProjects = (next: Project[]) => {
    const nextContent: SiteContent = { ...content, projects: next };
    onChange(nextContent);
  };

  const updateProject = (index: number, patch: Partial<Project>) => {
    setProjects(
      projects.map((project, i) => (i === index ? { ...project, ...patch } : project)),
    );
  };

  const removeProject = (index: number) => {
    setProjects(projects.filter((_, i) => i !== index));
  };

  const moveProject = (index: number, delta: number) => {
    setProjects(moveItem(projects, index, delta));
  };

  const addProject = () => {
    setProjects([...projects, emptyProject(content.projects)]);
  };

  return (
    <Panel title="Projects">
      <div>
        <p className="pb-2 text-[0.8125rem] leading-[1.45] text-subtle">
          The order here is the order on the page, except that featured projects
          are always pulled to the top. {featuredCount === 0
            ? 'Nothing is featured at the moment, so the section reads as one flat list.'
            : `${featuredCount} featured right now.`}
        </p>

        {duplicateSlugs.length > 0 && (
          <Notice>
            Two or more projects share the same link name:{' '}
            <span className="font-mono">{duplicateSlugs.join(', ')}</span>. Links to
            that name will only ever reach the first one. Give each project its own.
          </Notice>
        )}

        {projects.length === 0 && (
          <p className="py-6 text-[0.9375rem] leading-[1.5] text-muted">
            No projects yet. The Work section will not render until you add one.
          </p>
        )}

        {/* Keyed by position, not by slug: the slug is one of the fields being
            typed into, so keying by it would remount the card mid-keystroke. */}
        {projects.map((project, index) => {
          const cardTitle = project.name.trim() || `Project ${index + 1}`;
          const slug = project.slug.trim();
          const slugIsDuplicate = duplicateSlugs.indexOf(slug) !== -1;
          const slugIsMalformed = slug !== '' && !SLUG_PATTERN.test(slug);
          const imageNeedsAlt = project.image !== null && orNull(orEmpty(project.imageAlt)) === null;

          return (
            <ItemCard
              key={index}
              index={index}
              title={cardTitle}
              onRemove={() => removeProject(index)}
              onMoveUp={() => moveProject(index, -1)}
              onMoveDown={() => moveProject(index, 1)}
            >
              <Field label="Name">
                {(id) => (
                  <TextInput
                    id={id}
                    value={project.name}
                    onChange={(v) => updateProject(index, { name: v })}
                    placeholder="E-commerce Management System"
                  />
                )}
              </Field>

              <Field
                label="Link name"
                hint="Lowercase letters, numbers and hyphens only — this is the anchor id in the page URL. Changing it breaks any link someone already has."
              >
                {(id) => (
                  <>
                    <TextInput
                      id={id}
                      mono
                      value={project.slug}
                      onChange={(v) => updateProject(index, { slug: v })}
                      placeholder="ems-cashflow-portal"
                    />
                    {slug === '' && (
                      <Notice>
                        A link name is required. Saving will fail until this has a value.
                      </Notice>
                    )}
                    {slugIsMalformed && (
                      <Notice>
                        Only lowercase letters, numbers and hyphens are allowed here — no
                        spaces, capitals or punctuation. Saving will fail until this is fixed.
                      </Notice>
                    )}
                    {slugIsDuplicate && (
                      <Notice>
                        Another project already uses this link name. Both cannot be reached.
                      </Notice>
                    )}
                  </>
                )}
              </Field>

              <Field label="Tagline" hint="One line, plain language.">
                {(id) => (
                  <TextInput
                    id={id}
                    value={project.tagline}
                    onChange={(v) => updateProject(index, { tagline: v })}
                    placeholder="A twelve-module operations suite, built on Google Apps Script."
                  />
                )}
              </Field>

              <Field
                label="Description"
                hint="Two to four sentences — the problem, your approach, what it does."
              >
                {(id) => (
                  <TextArea
                    id={id}
                    rows={4}
                    value={project.description}
                    onChange={(v) => updateProject(index, { description: v })}
                  />
                )}
              </Field>

              <Field
                label="Capabilities"
                hint="Notable features, one line each. These are listed under the description."
              >
                {() => (
                  <StringList
                    multiline
                    values={project.capabilities}
                    onChange={(v) => updateProject(index, { capabilities: v })}
                    placeholder="Role-based access down to individual pages"
                  />
                )}
              </Field>

              <Field label="Your role" hint='What you did on it, e.g. "Solo build". Blank shows a dash.'>
                {(id) => (
                  <TextInput
                    id={id}
                    value={orEmpty(project.role)}
                    onChange={(v) => updateProject(index, { role: orNull(v) })}
                    placeholder="Solo build"
                  />
                )}
              </Field>

              <Field label="Built with" hint="The tools it runs on. One per line.">
                {() => (
                  <StringList
                    values={project.builtWith}
                    onChange={(v) => updateProject(index, { builtWith: v })}
                    placeholder="Google Apps Script"
                  />
                )}
              </Field>

              <Field label="Used by" hint="Who actually uses it. Blank shows a dash.">
                {(id) => (
                  <TextInput
                    id={id}
                    value={orEmpty(project.usedBy)}
                    onChange={(v) => updateProject(index, { usedBy: orNull(v) })}
                    placeholder="Operations and finance teams"
                  />
                )}
              </Field>

              <Field label="Period" hint='When you built it, e.g. "2025" or "2023 — 2025".'>
                {(id) => (
                  <TextInput
                    id={id}
                    value={orEmpty(project.period)}
                    onChange={(v) => updateProject(index, { period: orNull(v) })}
                    placeholder="2025"
                  />
                )}
              </Field>

              {/* The impact line carries more weight than anything else in the
                  card, and it is empty on every project, so it gets its own
                  block rather than sitting in the run of fields. */}
              <div className="py-4">
                <div className="border border-border-strong bg-surface px-4 pb-2">
                  <Field
                    label="Impact"
                    hint='What measurably changed because this exists — "cut the hiring cycle from three weeks to six days". This is the most valuable line on the page. Leave it blank rather than guessing: a blank reads as honest, a vague claim does not.'
                  >
                    {(id) => (
                      <TextArea
                        id={id}
                        rows={2}
                        value={orEmpty(project.impact)}
                        onChange={(v) => updateProject(index, { impact: orNull(v) })}
                        placeholder="Replaced six separate trackers and closed month-end three days faster."
                      />
                    )}
                  </Field>
                </div>
              </div>

              <Field label="Live link" hint="Where someone can see it running. Blank hides the link.">
                {(id) => (
                  <TextInput
                    id={id}
                    mono
                    value={orEmpty(project.liveUrl)}
                    onChange={(v) => updateProject(index, { liveUrl: orNull(v) })}
                    placeholder="https://example.com"
                  />
                )}
              </Field>

              <Field label="Code link" hint="The repository, if it is public. Blank hides the link.">
                {(id) => (
                  <TextInput
                    id={id}
                    mono
                    value={orEmpty(project.repoUrl)}
                    onChange={(v) => updateProject(index, { repoUrl: orNull(v) })}
                    placeholder="https://github.com/…"
                  />
                )}
              </Field>

              <ImageField
                label="Screenshot"
                hint="A screenshot of the project. Leave it empty for the typographic fallback, which looks deliberate."
                value={project.image}
                onChange={(v) => updateProject(index, { image: v })}
              />

              <Field
                label="Screenshot description"
                hint="Required whenever a screenshot is set. Describe what the screenshot shows — this is what screen readers and search engines read instead of the picture."
              >
                {(id) => (
                  <>
                    <TextArea
                      id={id}
                      rows={2}
                      value={orEmpty(project.imageAlt)}
                      onChange={(v) => updateProject(index, { imageAlt: orNull(v) })}
                      placeholder="The receivables portal, showing agent and brand filters over a table."
                    />
                    {imageNeedsAlt && (
                      <Notice>
                        This project has a screenshot but no description. Anyone using a
                        screen reader gets nothing here. Add one line describing what the
                        screenshot shows.
                      </Notice>
                    )}
                  </>
                )}
              </Field>

              <Field
                label="Featured"
                hint="Featured projects lead the section and get the large layout, wherever they sit in this list. Two is a good number; more and nothing stands out."
              >
                {(id) => (
                  <Toggle
                    id={id}
                    checked={project.featured}
                    onChange={(v) => updateProject(index, { featured: v })}
                    label="Lead the Work section"
                  />
                )}
              </Field>
            </ItemCard>
          );
        })}

        <SecondaryButton onClick={addProject}>Add project</SecondaryButton>
      </div>
    </Panel>
  );
}
