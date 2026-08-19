'use client';

import type { SectionEditorProps } from '@/components/admin/editor';
import { Field, Panel, StringList } from '@/components/admin/ui';
import { ImageField } from '@/components/admin/image-field';

/** Words in one paragraph, ignoring stray whitespace. */
function countWords(value: string): number {
  const trimmed = value.trim();
  return trimmed === '' ? 0 : trimmed.split(/\s+/).length;
}

export function AboutEditor({ content, onChange }: SectionEditorProps) {
  const { about } = content;

  const setParagraphs = (paragraphs: string[]) =>
    onChange({ ...content, about: { ...about, paragraphs } });

  const setPortrait = (portrait: string | null) =>
    onChange({ ...content, about: { ...about, portrait } });

  return (
    <div>
      <Panel title="About">
        <Field
          label="Paragraphs"
          hint="Each entry is one paragraph. Three is a good length — where you started, what you build, and one human note at the end."
        >
          {() => (
          <div>
              <StringList
                values={about.paragraphs}
                onChange={setParagraphs}
                placeholder="One paragraph of the about section…"
                multiline
              />

              {about.paragraphs.length > 0 && (
                <ul role="list" className="mt-5 space-y-1 border-t border-border pt-4">
                  {about.paragraphs.map((paragraph, index) => (
                    <li key={index} className="label tabular-nums">
                      {String(index + 1).padStart(2, '0')} · {countWords(paragraph)} words ·{' '}
                      {paragraph.trim().length} characters
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </Field>

        <ImageField
          label="Portrait"
          hint="An optional photo of you. It is cropped to a tall 4:5 portrait, so pick one that survives losing the sides. Leave it empty and the section falls back to type alone."
          value={about.portrait}
          onChange={setPortrait}
        />
      </Panel>
    </div>
  );
}
