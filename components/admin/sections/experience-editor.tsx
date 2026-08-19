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
});

const cardTitle = (entry: ExperienceEntry) =>
  [entry.company, entry.title].filter((part) => part.trim() !== '').join(' — ');

export function ExperienceEditor({ content, onChange }: SectionEditorProps) {
  const entries = content.experience;

  const setEntries = (next: ExperienceEntry[]) => {
    onChange({ ...content, experience: next });
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
        </ItemCard>
      ))}

      <SecondaryButton onClick={() => setEntries([...entries, emptyEntry()])}>
        Add role
      </SecondaryButton>
    </Panel>
  );
}
