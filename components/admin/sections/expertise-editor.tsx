'use client';

import type { SectionEditorProps } from '@/components/admin/editor';
import type { EducationEntry, ExpertiseGroup } from '@/lib/content/schema';
import {
  Field,
  ItemCard,
  Panel,
  SecondaryButton,
  StringList,
  TextInput,
  moveItem,
} from '@/components/admin/ui';

/**
 * Expertise, education, certifications and languages.
 *
 * Four unrelated top-level fields share a tab because they read as one column
 * of credentials on the public page. Each gets its own Panel so the owner can
 * see at a glance which block they are editing.
 *
 * Nothing in this section is nullable — every field is a plain string or a
 * string array — so there is no null/empty-string handling here. Editors that
 * do have nullable fields should write back null on clear.
 */

const emptyGroup = (): ExpertiseGroup => ({ label: 'New group', items: [] });

const emptyEducation = (): EducationEntry => ({
  institution: 'New institution',
  qualification: '',
  period: '',
});

export function ExpertiseEditor({ content, onChange }: SectionEditorProps) {
  const setExpertise = (expertise: ExpertiseGroup[]) => onChange({ ...content, expertise });
  const setEducation = (education: EducationEntry[]) => onChange({ ...content, education });

  const updateGroup = (index: number, patch: Partial<ExpertiseGroup>) =>
    setExpertise(content.expertise.map((g, i) => (i === index ? { ...g, ...patch } : g)));

  const updateEducation = (index: number, patch: Partial<EducationEntry>) =>
    setEducation(content.education.map((e, i) => (i === index ? { ...e, ...patch } : e)));

  return (
    <div>
      <Panel title="Expertise groups">
        {content.expertise.map((group, index) => (
          <ItemCard
            key={index}
            index={index}
            title={group.label || 'Untitled group'}
            onRemove={() => setExpertise(content.expertise.filter((_, i) => i !== index))}
            onMoveUp={() => setExpertise(moveItem(content.expertise, index, -1))}
            onMoveDown={() => setExpertise(moveItem(content.expertise, index, 1))}
          >
            <Field
              label="Group heading"
              hint="Groups sit side by side on a wide screen. Three or four fit comfortably; more than that and each column gets too narrow to read."
            >
              {(id) => (
                <TextInput
                  id={id}
                  value={group.label}
                  onChange={(v) => updateGroup(index, { label: v })}
                  placeholder="Core expertise"
                />
              )}
            </Field>

            <Field
              label="Skills in this group"
              hint="One skill per line, in the order they should appear."
            >
              {() => (
                <StringList
                  values={group.items}
                  onChange={(items) => updateGroup(index, { items })}
                  placeholder="Operations Management"
                />
              )}
            </Field>
          </ItemCard>
        ))}

        <SecondaryButton onClick={() => setExpertise([...content.expertise, emptyGroup()])}>
          Add group
        </SecondaryButton>
      </Panel>

      <Panel title="Education">
        {content.education.map((entry, index) => (
          <ItemCard
            key={index}
            index={index}
            title={entry.institution || 'Untitled entry'}
            onRemove={() => setEducation(content.education.filter((_, i) => i !== index))}
            onMoveUp={() => setEducation(moveItem(content.education, index, -1))}
            onMoveDown={() => setEducation(moveItem(content.education, index, 1))}
          >
            <Field label="Institution">
              {(id) => (
                <TextInput
                  id={id}
                  value={entry.institution}
                  onChange={(v) => updateEducation(index, { institution: v })}
                  placeholder="STI College"
                />
              )}
            </Field>

            <Field label="Qualification" hint="The degree or award, written as you want it shown.">
              {(id) => (
                <TextInput
                  id={id}
                  value={entry.qualification}
                  onChange={(v) => updateEducation(index, { qualification: v })}
                  placeholder="BS in Computer Science"
                />
              )}
            </Field>

            <Field label="Period" hint="Shown exactly as typed, e.g. 2008 — 2013.">
              {(id) => (
                <TextInput
                  id={id}
                  value={entry.period}
                  onChange={(v) => updateEducation(index, { period: v })}
                  placeholder="2008 — 2013"
                />
              )}
            </Field>
          </ItemCard>
        ))}

        <SecondaryButton onClick={() => setEducation([...content.education, emptyEducation()])}>
          Add education entry
        </SecondaryButton>
      </Panel>

      <Panel title="Certifications">
        <Field
          label="Certifications"
          hint="Include the awarding body and any short form, e.g. Certified Lean Six Sigma Green Belt (CLSSGB). Leave the list empty to hide the block."
        >
          {() => (
            <StringList
              values={content.certifications}
              onChange={(certifications) => onChange({ ...content, certifications })}
              placeholder="Certified Lean Six Sigma Green Belt (CLSSGB)"
            />
          )}
        </Field>
      </Panel>

      <Panel title="Languages">
        <Field
          label="Languages"
          hint="Languages you work in, most fluent first. Leave the list empty to hide the block."
        >
          {() => (
            <StringList
              values={content.languages}
              onChange={(languages) => onChange({ ...content, languages })}
              placeholder="English"
            />
          )}
        </Field>
      </Panel>
    </div>
  );
}
