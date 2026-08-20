'use client';

import type { SectionEditorProps } from '@/components/admin/editor';
import type { ExperienceEntry } from '@/lib/content/schema';
import {
  Field,
  ItemCard,
  Panel,
  SecondaryButton,
  StringList,
  TextArea,
  TextInput,
  moveItem,
} from '@/components/admin/ui';

/**
 * The work history.
 *
 * Array order is what the page renders, so the reorder controls on each card
 * are the only way to change how the timeline reads. Everything else is plain
 * text — dates are free text rather than a date picker because "Present",
 * "Mar 2023" and "Dec 2013" all have to print exactly as typed.
 */

const orEmpty = (v: string | null) => v ?? '';
const orNull = (v: string) => (v.trim() === '' ? null : v);

const emptyEntry = (): ExperienceEntry => ({
  company: 'New company',
  title: 'New role',
  start: '',
  end: '',
  location: null,
  summary: '',
  highlights: [],
  tags: [],
  highlight: null,
});

const cardTitle = (entry: ExperienceEntry) =>
  [entry.company, entry.title].filter((part) => part.trim() !== '').join(' — ');

export function ExperienceEditor({ content, onChange }: SectionEditorProps) {
  const entries = content.experience;

  const setEntries = (next: ExperienceEntry[]) => {
    onChange({ ...content, experience: next });
  };

  /* Both fields empty means "no highlight", stored as null rather than a pair
   * of empty strings — otherwise the schema would reject the save and the
   * message would point at a field the owner deliberately left blank. */
  const setHighlight = (index: number, title: string, body: string) => {
    const highlight = title.trim() === '' && body.trim() === '' ? null : { title, body };
    setEntries(entries.map((e, i) => (i === index ? { ...e, highlight } : e)));
  };

  const patch = (index: number, changes: Partial<ExperienceEntry>) => {
    setEntries(entries.map((entry, i) => (i === index ? { ...entry, ...changes } : entry)));
  };

  return (
    <Panel title="Experience">
      <p className="py-4 text-[0.8125rem] leading-[1.45] text-subtle">
        Roles appear on the page in exactly the order listed here, so keep the most recent one
        first. Use the arrows on each card to move a role up or down.
      </p>

      {entries.length === 0 && (
        <p className="py-4 text-[0.9375rem] leading-[1.5] text-muted">
          No roles yet. Add one below.
        </p>
      )}

      {entries.map((entry, index) => (
        <ItemCard
          key={index}
          index={index}
          title={cardTitle(entry) || `Role ${index + 1}`}
          onRemove={() => setEntries(entries.filter((_, i) => i !== index))}
          onMoveUp={() => setEntries(moveItem(entries, index, -1))}
          onMoveDown={() => setEntries(moveItem(entries, index, 1))}
        >
          <Field label="Company">
            {(id) => (
              <TextInput
                id={id}
                value={entry.company}
                onChange={(v) => patch(index, { company: v })}
                placeholder="PVGC"
              />
            )}
          </Field>

          <Field label="Job title">
            {(id) => (
              <TextInput
                id={id}
                value={entry.title}
                onChange={(v) => patch(index, { title: v })}
                placeholder="Director of Operations — E-commerce"
              />
            )}
          </Field>

          <Field label="Start" hint='Written however you want it to read, e.g. "Mar 2023".'>
            {(id) => (
              <TextInput
                id={id}
                value={entry.start}
                onChange={(v) => patch(index, { start: v })}
                placeholder="Mar 2023"
              />
            )}
          </Field>

          <Field
            label="End"
            hint='Type "Present" for the role you are in now — the page marks that one as current.'
          >
            {(id) => (
              <TextInput
                id={id}
                value={entry.end}
                onChange={(v) => patch(index, { end: v })}
                placeholder="Present"
              />
            )}
          </Field>

          <Field label="Location" hint="City and country. Leave blank to show no location.">
            {(id) => (
              <TextInput
                id={id}
                value={orEmpty(entry.location)}
                onChange={(v) => patch(index, { location: orNull(v) })}
                placeholder="Quezon City, Philippines"
              />
            )}
          </Field>

          <Field label="Summary" hint="One or two sentences on what the role covered.">
            {(id) => (
              <TextArea
                id={id}
                value={entry.summary}
                onChange={(v) => patch(index, { summary: v })}
                rows={3}
                placeholder="Own day-to-day operations across teams and functions…"
              />
            )}
          </Field>

          <Field
            label="Highlights"
            hint="One achievement per entry, each starting with a verb. Long lists are fine — the page shows the first few and hides the rest behind a “show all”."
          >
            {() => (
              <StringList
                values={entry.highlights}
                onChange={(v) => patch(index, { highlights: v })}
                placeholder="Built and enforced SOPs to standardise workflows…"
                multiline
              />
            )}
          </Field>

          <Field
            label="Tags"
            hint="Short labels shown as small chips under the role — one or two words each."
          >
            {() => (
              <StringList
                values={entry.tags}
                onChange={(v) => patch(index, { tags: v })}
                placeholder="Operations"
              />
            )}
          </Field>

              <Field
                label="Signature work — heading"
                hint="The one thing from this role worth reading if someone reads nothing else. A short line: what changed, not what you were responsible for. Leave both fields blank for no highlight."
              >
                {(id) => (
                  <TextInput
                    id={id}
                    value={entry.highlight?.title ?? ''}
                    onChange={(v) => setHighlight(index, v, entry.highlight?.body ?? '')}
                    placeholder="Made dead air visible, and it fell"
                  />
                )}
              </Field>

              <Field
                label="Signature work — story"
                hint="Three or four sentences: the problem, what you built or changed, and what happened. Figures carry more than adjectives. **bold** and ==highlight== work here."
              >
                {(id) => (
                  <TextArea
                    id={id}
                    rows={6}
                    value={entry.highlight?.body ?? ''}
                    onChange={(v) => setHighlight(index, entry.highlight?.title ?? '', v)}
                  />
                )}
              </Field>

              {entry.highlight &&
                (entry.highlight.title.trim() === '' || entry.highlight.body.trim() === '') && (
                  <p
                    role="alert"
                    className="border-l-2 border-accent pl-3 text-[0.875rem] leading-[1.45] text-muted"
                  >
                    A highlight needs both a heading and a story. Fill the other
                    one in, or clear both to remove the highlight.
                  </p>
                )}
        </ItemCard>
      ))}

      <SecondaryButton onClick={() => setEntries([...entries, emptyEntry()])}>
        Add role
      </SecondaryButton>
    </Panel>
  );
}
