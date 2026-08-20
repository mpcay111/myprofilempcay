'use client';

import type { SectionEditorProps } from '@/components/admin/editor';
import type { LogoItem } from '@/lib/content/schema';
import { ImageField } from '@/components/admin/image-field';
import {
  Field,
  ItemCard,
  Panel,
  SecondaryButton,
  TextInput,
  moveItem,
} from '@/components/admin/ui';

/**
 * The logo bar under the header.
 *
 * Not a page section — it is a fixed band below the header rather than
 * something in the running order, so it does not appear under Sections. It
 * shows itself when there is at least one logo with an image and hides itself
 * when there is not.
 */

const orEmpty = (v: string | null) => v ?? '';
const orNull = (v: string) => (v.trim() === '' ? null : v);

const emptyLogo = (): LogoItem => ({ name: 'New company', image: null, url: null });

export function LogosEditor({ content, onChange }: SectionEditorProps) {
  const logos = content.logos;

  const setLogos = (next: LogoItem[]) => onChange({ ...content, logos: next });

  const patch = (index: number, changes: Partial<LogoItem>) =>
    setLogos(logos.map((l, i) => (i === index ? { ...l, ...changes } : l)));

  const withoutImage = logos.filter((l) => !l.image).length;

  return (
    <div>
      <Panel title="Logo bar">
        <p className="py-4 text-[0.8125rem] leading-[1.45] text-subtle">
          A slow-scrolling band under the menu at the top of the page. It appears
          only when there is at least one logo here, and pauses when a visitor
          hovers it — or permanently, for anyone whose device asks for reduced
          motion.
        </p>

        <p className="pb-4 text-[0.8125rem] leading-[1.45] text-subtle">
          <span className="text-foreground">Upload PNGs with a transparent
          background.</span>{' '}
          Logos are drawn as a single flat colour so they stay readable on both
          the light and dark versions of the site — which means a logo sitting on
          a white rectangle would become a solid black rectangle. The real
          colours come back when a visitor hovers it.
        </p>

        {logos.length === 0 && (
          <p className="py-4 text-[0.9375rem] leading-[1.5] text-muted">
            No logos yet, so the bar is hidden.
          </p>
        )}

        {logos.map((logo, index) => (
          <ItemCard
            key={index}
            index={index}
            title={logo.name.trim() || `Logo ${index + 1}`}
            onRemove={() => setLogos(logos.filter((_, i) => i !== index))}
            onMoveUp={() => setLogos(moveItem(logos, index, -1))}
            onMoveDown={() => setLogos(moveItem(logos, index, 1))}
          >
            <Field
              label="Company or brand"
              hint="Used as the image's description for screen readers and search engines, so write the real name."
            >
              {(id) => (
                <TextInput
                  id={id}
                  value={logo.name}
                  onChange={(v) => patch(index, { name: v })}
                  placeholder="Concentrix"
                />
              )}
            </Field>

            <ImageField
              label="Logo"
              hint="A PNG with a transparent background works best. It is shown at a small fixed height, so a wide horizontal logo reads better than a tall one."
              value={logo.image}
              onChange={(v) => patch(index, { image: v })}
            />

            {!logo.image && (
              <p
                role="alert"
                className="border-l-2 border-accent pl-3 text-[0.875rem] leading-[1.45] text-muted"
              >
                Without an image this entry is skipped — the bar has nothing to
                show for it.
              </p>
            )}

            <Field
              label="Link"
              hint="Optional. Where the logo goes when clicked, e.g. the company's website. Leave blank to show it unlinked."
            >
              {(id) => (
                <TextInput
                  id={id}
                  mono
                  value={orEmpty(logo.url)}
                  onChange={(v) => patch(index, { url: orNull(v) })}
                  placeholder="https://example.com"
                />
              )}
            </Field>
          </ItemCard>
        ))}

        {withoutImage > 0 && (
          <p
            role="alert"
            className="mt-5 border-l-2 border-accent pl-3 text-[0.875rem] leading-[1.45] text-muted"
          >
            {withoutImage} of {logos.length}{' '}
            {withoutImage === 1 ? 'entry has' : 'entries have'} no image and will
            not appear.
          </p>
        )}

        <SecondaryButton onClick={() => setLogos([...logos, emptyLogo()])}>
          Add logo
        </SecondaryButton>
      </Panel>
    </div>
  );
}
