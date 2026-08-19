'use client';

import type { ScopeArea } from '@/lib/content/schema';
import type { SectionEditorProps } from '@/components/admin/editor';
import {
  Field,
  ItemCard,
  Panel,
  SecondaryButton,
  TextArea,
  TextInput,
  moveItem,
} from '@/components/admin/ui';

// A blank label fails the schema's min(1), so seed something valid — the
// owner overwrites it immediately, and Save never fails on a fresh row.
const emptyArea = (): ScopeArea => ({ label: 'New area', description: '' });

export function ScopeEditor({ content, onChange }: SectionEditorProps) {
  const areas = content.scope;

  const write = (next: ScopeArea[]) => onChange({ ...content, scope: next });

  const update = (index: number, patch: Partial<ScopeArea>) =>
    write(areas.map((area, i) => (i === index ? { ...area, ...patch } : area)));

  return (
    <Panel title="Operations scope">
      <p className="py-4 text-[0.875rem] leading-[1.6] text-muted">
        These areas appear on the site as a single list, one after another, in exactly
        the order shown here. There are no icons or images — just the area name and its
        one-line description. Use the arrows to change what a reader sees first.
      </p>

      {areas.map((area, index) => (
        <ItemCard
          key={index}
          index={index}
          title={area.label || `Area ${index + 1}`}
          onRemove={() => write(areas.filter((_, i) => i !== index))}
          onMoveUp={() => write(moveItem(areas, index, -1))}
          onMoveDown={() => write(moveItem(areas, index, 1))}
        >
          <Field label="Area" hint="The name of the area, e.g. “KPI Management”. Keep it to a few words.">
            {(id) => (
              <TextInput
                id={id}
                value={area.label}
                onChange={(v) => update(index, { label: v })}
                placeholder="SOP & Process"
              />
            )}
          </Field>

          <Field
            label="Description"
            hint="One sentence saying what this covers. It sits beside the area name, so keep it short."
          >
            {(id) => (
              <TextArea
                id={id}
                value={area.description}
                onChange={(v) => update(index, { description: v })}
                rows={2}
                placeholder="Workflow standardisation, bottleneck removal, and continuous improvement."
              />
            )}
          </Field>
        </ItemCard>
      ))}

      <div className="py-4">
        <SecondaryButton onClick={() => write([...areas, emptyArea()])}>
          Add area
        </SecondaryButton>
      </div>
    </Panel>
  );
}
