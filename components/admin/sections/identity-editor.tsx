'use client';

import type { SectionEditorProps } from '@/components/admin/editor';
import type { Appearance, Identity, SiteContent } from '@/lib/content/schema';
import { ACCENTS, MONO_LABELS, SANS_LABELS } from '@/lib/appearance';
import { Field, Panel, StringList, TextArea, TextInput, Toggle } from '@/components/admin/ui';
import { ImageField } from '@/components/admin/image-field';

/**
 * Identity — the hero: who the owner is, what they do, and whether they are
 * open to work. Also holds the career start date, because the years-of-
 * experience figure in the hero is derived from it and belongs next to the
 * text it appears in, not in a settings screen the owner never opens.
 */

const orEmpty = (v: string | null) => v ?? '';
const orNull = (v: string) => (v.trim() === '' ? null : v);

/** Same hairline treatment as the shared primitives, for the two controls
 *  (number, select) the primitives do not cover. */
const inputBase =
  'w-full border-b border-border bg-transparent pb-2 text-[0.9375rem] leading-[1.5] text-foreground outline-none transition-colors focus:border-accent';

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const;

export function IdentityEditor({ content, onChange }: SectionEditorProps) {
  const identity = content.identity;

  const setIdentity = <K extends keyof Identity>(key: K, value: Identity[K]) => {
    onChange({ ...content, identity: { ...identity, [key]: value } });
  };

  const setAppearance = <K extends keyof Appearance>(key: K, value: Appearance[K]) => {
    onChange({ ...content, appearance: { ...content.appearance, [key]: value } });
  };

  return (
    <div>
      <Panel title="Identity">
        <Field label="Name">
          {(id) => (
            <TextInput
              id={id}
              value={identity.name}
              onChange={(v) => setIdentity('name', v)}
              placeholder="Full name"
            />
          )}
        </Field>

        <Field
          label="Credentials"
          hint="Post-nominals shown after the name, like CLSSGB. Leave blank for none."
        >
          {(id) => (
            <TextInput
              id={id}
              value={orEmpty(identity.credentials)}
              onChange={(v) => setIdentity('credentials', orNull(v))}
              placeholder="CLSSGB"
            />
          )}
        </Field>

        <Field label="Role">
          {(id) => (
            <TextInput
              id={id}
              value={identity.role}
              onChange={(v) => setIdentity('role', v)}
              placeholder="Operations Director"
            />
          )}
        </Field>

        <Field
          label="Disciplines"
          hint="The short list of other hats, shown under the role. Six at most — a long list reads as a shopping list."
        >
          {() => (
            <StringList
              values={identity.disciplines}
              onChange={(next) => setIdentity('disciplines', next)}
              placeholder="Systems design"
            />
          )}
        </Field>

        {identity.disciplines.length > 6 && (
          <p
            role="alert"
            className="border-l-2 border-accent pl-3 text-[0.875rem] leading-[1.45] text-muted"
          >
            {identity.disciplines.length} disciplines. Six is the maximum — saving
            will fail until you remove {identity.disciplines.length - 6} of them.
          </p>
        )}

        <Field label="Location" hint="City and country. Leave blank to show no location.">
          {(id) => (
            <TextInput
              id={id}
              value={orEmpty(identity.location)}
              onChange={(v) => setIdentity('location', orNull(v))}
              placeholder="Dubai, UAE"
            />
          )}
        </Field>

        <Field
          label="Statement"
          hint="The opening paragraph — the first thing anyone reads. Two or three sentences."
        >
          {(id) => (
            <TextArea
              id={id}
              value={identity.statement}
              rows={4}
              onChange={(v) => setIdentity('statement', v)}
            />
          )}
        </Field>

        <Field
          label="Site URL"
          hint="The live domain. Used for the sitemap, the canonical URL and the social share card, so it must be the full address starting with https://"
        >
          {(id) => (
            <TextInput
              id={id}
              mono
              value={identity.siteUrl}
              onChange={(v) => setIdentity('siteUrl', v)}
              placeholder="https://example.com"
            />
          )}
        </Field>
      </Panel>

      <Panel title="Availability">
        <Field label="Available for work">
          {(id) => (
            <Toggle
              id={id}
              checked={identity.availableForWork}
              onChange={(v) => setIdentity('availableForWork', v)}
              label="Show that you are open to new work"
            />
          )}
        </Field>

        <Field
          label="Availability note"
          hint='Only appears while "available for work" is on. One line, e.g. what kind of work you are open to.'
        >
          {(id) => (
            <TextInput
              id={id}
              value={orEmpty(identity.availabilityNote)}
              onChange={(v) => setIdentity('availabilityNote', orNull(v))}
              placeholder="Open to fractional and advisory work"
            />
          )}
        </Field>
      </Panel>

      <Panel title="Appearance">
        <Field
          label="Accent colour"
          hint="Used sparingly — section numbers, the current role, links on hover. Every option here was checked for readability against both the light and dark backgrounds, which is why it is a list rather than a colour picker."
        >
          {(id) => (
            <select
              id={id}
              value={content.appearance.accent}
              onChange={(e) =>
                setAppearance('accent', e.target.value as Appearance['accent'])
              }
              className={inputBase}
            >
              {Object.entries(ACCENTS).map(([value, def]) => (
                <option key={value} value={value}>
                  {def.label}
                </option>
              ))}
            </select>
          )}
        </Field>

        <Field
          label="Body typeface"
          hint="Carries everything except the small monospace labels."
        >
          {(id) => (
            <select
              id={id}
              value={content.appearance.sans}
              onChange={(e) => setAppearance('sans', e.target.value as Appearance['sans'])}
              className={inputBase}
            >
              {Object.entries(SANS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          )}
        </Field>

        <Field
          label="Label typeface"
          hint="The small uppercase labels, dates, figures and tags."
        >
          {(id) => (
            <select
              id={id}
              value={content.appearance.mono}
              onChange={(e) => setAppearance('mono', e.target.value as Appearance['mono'])}
              className={inputBase}
            >
              {Object.entries(MONO_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          )}
        </Field>

        <Field
          label="Site theme"
          hint="The default a visitor sees on their first visit. 'Match device' follows their own light/dark setting, which is usually the kindest choice. Either way there is a toggle in the site header, and a visitor's own choice is remembered on their device and overrides this."
        >
          {(id) => (
            <select
              id={id}
              value={content.theme}
              onChange={(e) =>
                onChange({
                  ...content,
                  theme: e.target.value as SiteContent['theme'],
                })
              }
              className={inputBase}
            >
              <option value="system">Match device</option>
              <option value="light">Always light</option>
              <option value="dark">Always dark</option>
            </select>
          )}
        </Field>
      </Panel>

      <Panel title="Profile photo">
        <ImageField
          label="Profile photo"
          hint="Shown beside your name at the top of the page. It is cropped to a square, so a head-and-shoulders shot with a little room around your head works best. Leave empty for no photo."
          value={identity.photo}
          onChange={(v) => setIdentity('photo', v)}
        />
      </Panel>

      <Panel title="Hero background">
        <ImageField
          label="Background image"
          hint="Optional photo behind the hero. Leave empty for the plain paper background — that is the current design, and usually the better choice."
          value={identity.backgroundImage}
          onChange={(v) => setIdentity('backgroundImage', v)}
        />
      </Panel>

      <Panel title="Career start">
        <Field
          label="Year"
          hint="The years-of-experience figure in the hero is calculated from this month and year."
        >
          {(id) => (
            <input
              id={id}
              type="number"
              inputMode="numeric"
              min={1950}
              max={2100}
              step={1}
              value={content.careerStartYear}
              onChange={(e) => {
                const parsed = Number.parseInt(e.target.value, 10);
                // Only NaN is refused. Rejecting out-of-range values here would
                // make the field impossible to type in at all: editing 2013
                // passes through "201" and "2", and a controlled input whose
                // state never moves snaps straight back to the old value on
                // every keystroke. Out-of-range is reported below instead.
                if (!Number.isFinite(parsed)) return;
                onChange({ ...content, careerStartYear: parsed });
              }}
              className={inputBase}
            />
          )}
        </Field>

        {(content.careerStartYear < 1950 || content.careerStartYear > 2100) && (
          <p
            role="alert"
            className="border-l-2 border-accent pl-3 text-[0.875rem] leading-[1.45] text-muted"
          >
            The year must be between 1950 and 2100. Saving will fail until it is.
          </p>
        )}

        <Field label="Month">
          {(id) => (
            <select
              id={id}
              value={String(content.careerStartMonth)}
              onChange={(e) => {
                const parsed = Number.parseInt(e.target.value, 10);
                if (!Number.isFinite(parsed)) return;
                if (parsed < 1 || parsed > 12) return;
                onChange({ ...content, careerStartMonth: parsed });
              }}
              className={inputBase}
            >
              {MONTHS.map((month, index) => (
                <option key={month} value={index + 1}>
                  {month}
                </option>
              ))}
            </select>
          )}
        </Field>
      </Panel>
    </div>
  );
}
