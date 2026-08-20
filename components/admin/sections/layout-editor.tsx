'use client';

import type { SectionEditorProps } from '@/components/admin/editor';
import { resolveSections, type SectionConfig } from '@/lib/content/schema';
import { Field, IconButton, Panel, TextInput, Toggle, moveItem } from '@/components/admin/ui';

/**
 * Section order and menu labels.
 *
 * One list drives both the order of the page and the header menu, so the two
 * can never disagree. Sections cannot be added or removed here — each one maps
 * to a component — but any of them can be renamed, reordered, or hidden.
 *
 * Hiding keeps the content. It stops rendering and leaves the menu, and turning
 * it back on restores it exactly, so this is a safe way to park a thin section
 * rather than delete work.
 */

const DESCRIPTIONS: Record<string, string> = {
  work: 'The systems you designed and built.',
  experience: 'Your roles, most recent first.',
  video: 'Walkthroughs and demos, embedded from YouTube or Vimeo. Hidden automatically while it has no videos.',
  scope: 'The functional areas you own.',
  expertise: 'Skills, tools, education and credentials.',
  about: 'The long-form prose about you.',
  contact: 'Email and links. The footer stays at the bottom regardless.',
};

export function LayoutEditor({ content, onChange }: SectionEditorProps) {
  // Resolve before editing, so a stored document that predates a section still
  // shows the full set rather than silently offering fewer rows than the page
  // actually renders.
  const sections = resolveSections(content.sections);

  const setSections = (next: SectionConfig[]) => onChange({ ...content, sections: next });

  const update = (index: number, patch: Partial<SectionConfig>) =>
    setSections(sections.map((s, i) => (i === index ? { ...s, ...patch } : s)));

  const visibleCount = sections.filter((s) => s.visible).length;

  /* The page numbers only what it renders, so a hidden section does not consume
   * a number and everything after it shifts up. Numbering these rows by their
   * raw position instead would show the owner a sequence the page never
   * produces — the preview has to count the way the page counts. */
  const spineNumbers = new Map<string, string>();
  let counter = 0;
  for (const section of sections) {
    if (!section.visible) continue;
    counter += 1;
    spineNumbers.set(section.id, String(counter).padStart(2, '0'));
  }

  return (
    <div>
      <Panel title="Page sections">
        <p className="py-4 text-[0.8125rem] leading-[1.45] text-subtle">
          The order here is the order on the page, and the same order in the menu
          at the top. The numbering down the left margin of the site follows it
          automatically. Your intro always comes first and the footer always
          last, so neither appears in this list.
        </p>

        {sections.map((section, index) => (
          <div key={section.id} className="border-t border-border py-5 first:border-t-0">
            <div className="flex items-baseline justify-between gap-4">
              <div className="min-w-0">
                <p className="label text-accent">
                  {spineNumbers.get(section.id) ?? '——'} · {section.id}
                </p>
                <p className="mt-2 text-[0.8125rem] leading-[1.45] text-subtle">
                  {DESCRIPTIONS[section.id]}
                </p>
              </div>

              <div className="flex shrink-0 gap-1">
                <IconButton
                  label={`Move ${section.label} up`}
                  onClick={() => setSections(moveItem(sections, index, -1))}
                  disabled={index === 0}
                >
                  ↑
                </IconButton>
                <IconButton
                  label={`Move ${section.label} down`}
                  onClick={() => setSections(moveItem(sections, index, 1))}
                  disabled={index === sections.length - 1}
                >
                  ↓
                </IconButton>
              </div>
            </div>

            <div className="mt-1 divide-y divide-border">
              <Field
                label="Menu label"
                hint="What this section is called in the menu at the top of the page."
              >
                {(id) => (
                  <TextInput
                    id={id}
                    value={section.label}
                    onChange={(v) => update(index, { label: v })}
                    placeholder={section.id}
                  />
                )}
              </Field>

              <Field label="Visible">
                {(id) => (
                  <Toggle
                    id={id}
                    checked={section.visible}
                    onChange={(v) => update(index, { visible: v })}
                    label="Show this section on the page"
                  />
                )}
              </Field>
            </div>
          </div>
        ))}

        {visibleCount === 0 && (
          <p
            role="alert"
            className="border-l-2 border-accent pl-3 text-[0.875rem] leading-[1.45] text-muted"
          >
            Every section is hidden, so the page would show only your intro and
            the footer. That will save, but it is almost certainly not what you
            want.
          </p>
        )}
      </Panel>
    </div>
  );
}
